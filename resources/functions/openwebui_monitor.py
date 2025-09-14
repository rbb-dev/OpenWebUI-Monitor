"""
title: Usage Monitor
author: VariantConst & OVINC CN
git_url: https://github.com/VariantConst/OpenWebUI-Monitor.git
version: 0.3.12
requirements: httpx
license: MIT
"""
import logging
import time
from typing import Dict, Optional
from httpx import AsyncClient
from pydantic import BaseModel, Field
import json

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

TRANSLATIONS = {
    "en": {
        "request_failed": "Request failed: {error_msg}",
        "insufficient_balance": "Insufficient balance: Current balance `{balance:.4f}`",
        "cost": "Cost: ${cost:.4f}",
        "balance": "Balance: ${balance:.4f}",
        "tokens": "Tokens: {input}+{output}",
        "time_spent": "Time: {time:.2f}s",
        "tokens_per_sec": "{tokens_per_sec:.2f} T/s",
    },
    "zh": {
        "request_failed": "è¯·æ±‚å¤±è´¥: {error_msg}",
        "insufficient_balance": "ä½™é¢ä¸è¶³: å½“å‰ä½™é¢ `{balance:.4f}`",
        "cost": "è´¹ç”¨: Â¥{cost:.4f}",
        "balance": "ä½™é¢: Â¥{balance:.4f}",
        "tokens": "Token: {input}+{output}",
        "time_spent": "è€—æ—¶: {time:.2f}s",
        "tokens_per_sec": "{tokens_per_sec:.2f} T/s",
    },
}


class CustomException(Exception):
    pass


class Filter:
    class Valves(BaseModel):
        api_endpoint: str = Field(default="", description="openwebui-monitor's base url")
        api_key: str = Field(default="", description="openwebui-monitor's api key")
        priority: int = Field(default=5, description="filter priority")
        language: str = Field(default="zh", description="language (en/zh)")
        show_time_spent: bool = Field(default=True, description="show time spent")
        show_tokens_per_sec: bool = Field(default=True, description="show tokens per second")
        show_cost: bool = Field(default=True, description="show cost")
        show_balance: bool = Field(default=True, description="show balance")
        show_tokens: bool = Field(default=True, description="show tokens")

    def __init__(self):
        self.type = "filter"
        self.name = "OpenWebUI Monitor"
        self.valves = self.Valves()
        self.outage_map: Dict[str, bool] = {}
        # Legacy field kept; switched to monotonic seconds.
        self.start_time: Optional[float] = None
        # Per-turn timing keyed by message_id (fallback to per-user key).
        self._turn_start: Dict[str, float] = {}
        # Prevent duplicate emission per visible assistant message
        self._emitted_ids: Set[str] = set()

    def get_text(self, key: str, **kwargs) -> str:
        lang = self.valves.language if self.valves.language in TRANSLATIONS else "en"
        text = TRANSLATIONS[lang].get(key, TRANSLATIONS["en"][key])
        return text.format(**kwargs) if kwargs else text

    async def request(self, client: AsyncClient, url: str, headers: dict, json_data: dict):
        json_data = json.loads(json.dumps(json_data, default=lambda o: o.dict() if hasattr(o, "dict") else str(o)))

        response = await client.post(url=url, headers=headers, json=json_data)
        response.raise_for_status()
        response_data = response.json()
        if not response_data.get("success"):
            logger.error(self.get_text("request_failed", error_msg=response_data))
            raise CustomException(self.get_text("request_failed", error_msg=response_data))
        return response_data

    async def inlet(self, body: dict, __metadata__: Optional[dict] = None, __user__: Optional[dict] = None) -> dict:
        __user__ = __user__ or {}
        __metadata__ = __metadata__ or {}
        # Start a monotonic timer to avoid wall-clock jumps.
        self.start_time = time.monotonic()
        user_id = __user__.get("id", "default")
        # Correlate timing to this turn by message_id; fallback to per-user key.
        msg_id = (__metadata__ or {}).get("message_id")
        if msg_id is not None:
            key = str(msg_id)
        else:
            key = f"user:{user_id}"
        self._turn_start[key] = self.start_time

        client = AsyncClient()

        try:
            response_data = await self.request(
                client=client,
                url=f"{self.valves.api_endpoint}/api/v1/inlet",
                headers={"Authorization": f"Bearer {self.valves.api_key}"},
                json_data={"user": __user__, "body": body},
            )
            self.outage_map[user_id] = response_data.get("balance", 0) <= 0
            if self.outage_map[user_id]:
                logger.info(self.get_text("insufficient_balance", balance=response_data.get("balance", 0)))
                raise CustomException(self.get_text("insufficient_balance", balance=response_data.get("balance", 0)))
            return body

        except Exception as err:
            logger.exception(self.get_text("request_failed", error_msg=err))
            if isinstance(err, CustomException):
                raise err
            raise Exception(f"error calculating usage, {err}") from err

        finally:
            await client.aclose()

    async def outlet(
        self,
        body: dict,
        __metadata__: Optional[dict] = None,
        __user__: Optional[dict] = None,
        __event_emitter__: Optional[callable] = None,
    ) -> dict:
        __user__ = __user__ or {}
        __metadata__ = __metadata__ or {}
        user_id = __user__.get("id", "default")
        # Open-WebUI specific gating to stop double-fire without suppressing output:
        # 1) Skip internal tasks that also call outlet (these are not visible messages).
        internal_tasks = {"follow_up_generation", "title_generation", "tags_generation"}
        task = (body or {}).get("task") or (__metadata__ or {}).get("task")
        if task in internal_tasks:
            return body
        # 2) Only emit for visible assistant messages (top chip attaches to these).
        last_msg = None
        if isinstance(body, dict):
            msgs = body.get("messages") or []
            last_msg = msgs[-1] if msgs else None
        if not isinstance(last_msg, dict) or last_msg.get("role") != "assistant":
            return body
        # 3) De-duplicate strictly by Open-WebUI message_id (stable per turn).
        msg_key = str((__metadata__ or {}).get("message_id") or time.time_ns())
        if msg_key in self._emitted_ids:
            return body
        # Mark as emitted before any await to avoid races.
        self._emitted_ids.add(msg_key)
        if self.outage_map.get(user_id, False):
            return body

        client = AsyncClient()

        try:
            response_data = await self.request(
                client=client,
                url=f"{self.valves.api_endpoint}/api/v1/outlet",
                headers={"Authorization": f"Bearer {self.valves.api_key}"},
                json_data={"user": __user__, "body": body},
            )
            stats_list = []
            if self.valves.show_tokens:
                stats_list.append(self.get_text("tokens", input=response_data["inputTokens"], output=response_data["outputTokens"]))
            if self.valves.show_cost:
                stats_list.append(self.get_text("cost", cost=response_data["totalCost"]))
            if self.valves.show_balance:
                stats_list.append(self.get_text("balance", balance=response_data["newBalance"]))
            if self.start_time and self.valves.show_time_spent:
                # Prefer per-turn timing keyed by message_id; then per-user; then legacy start_time.
                start = None
                msg_id = (__metadata__ or {}).get("message_id")
                if msg_id is not None:
                    start = self._turn_start.pop(str(msg_id), None)
                if start is None:
                    start = self._turn_start.pop(f"user:{user_id}", None)
                if start is None:
                    start = self.start_time

                if start is not None:
                    elapsed = max(0.0, time.monotonic() - start)
                    stats_list.append(self.get_text("time_spent", time=elapsed))
                    if self.valves.show_tokens_per_sec:
                        out_tokens = response_data.get("outputTokens", 0) or 0
                        tokens_per_sec = (out_tokens / elapsed) if elapsed > 0 else 0
                        stats_list.append(self.get_text("tokens_per_sec", tokens_per_sec=tokens_per_sec))

            stats = " | ".join(stats_list)
            if __event_emitter__:
                await __event_emitter__({"type": "status", "data": {"description": stats, "done": True}})
            logger.info("usage_monitor: %s %s", user_id, stats)
            return body
        except Exception as err:
            logger.exception(self.get_text("request_failed", error_msg=err))
            raise Exception(self.get_text("request_failed", error_msg=err))
        finally:
            await client.aclose()
