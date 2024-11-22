from typing import Optional
from pydantic import Field, BaseModel
import requests
import json
from open_webui.utils.misc import get_last_assistant_message


class Filter:
    class Valves(BaseModel):
        API_ENDPOINT: str = Field(
            default="", description="The base URL for the API endpoint."
        )
        INLET_PATH: str = Field(
            default="/api/v1/inlet",
            description="Single-level endpoint for posting user info.",
        )
        OUTLET_PATH: str = Field(
            default="/api/v1/outlet",
            description="Single-level endpoint for posting LLM result.",
        )

    def __init__(self):
        self.type = "filter"
        self.name = "OpenWebUI Monitor"
        self.valves = self.Valves()
        self.outage = False

    def inlet(
        self, body: dict, user: Optional[dict] = None, __user__: dict = {}
    ) -> dict:
        def clean_content(content: str) -> str:
            """
            从末尾开始找到最后一个“输入”及其后内容并截掉。
            """
            last_index = content.rfind("输入")
            if last_index != -1:
                # 从最后一个“输入”之前截断
                return content[:last_index].strip()
            return content

        if "messages" in body and isinstance(body["messages"], list):
            for message in body["messages"]:
                if "content" in message and isinstance(message["content"], str):
                    message["content"] = clean_content(message["content"])

        # 发送 POST 请求
        post_url = f"{self.valves.API_ENDPOINT}{self.valves.INLET_PATH}"
        response = requests.post(post_url, json={"user": __user__, "body": body})
        response.raise_for_status()

        # 将 response 转换为 JSON 数据
        response_data = response.json()
        self.outage = response_data.get("balance", 0) <= 0
        if self.outage:
            raise Exception(f"您的余额 `{response_data['balance']:.4f}` 已用尽。")

        return body

    def outlet(
        self, body: dict, user: Optional[dict] = None, __user__: dict = {}
    ) -> dict:
        def clean_content(content: str) -> str:
            """
            从末尾开始找到最后一个“输入”及其后内容并截掉。
            """
            last_index = content.rfind("输入")
            if last_index != -1:
                # 从最后一个“输入”之前截断
                return content[:last_index].strip()
            return content

        if self.outage:
            return body

        if "messages" in body and isinstance(body["messages"], list):
            for message in body["messages"]:
                if "content" in message and isinstance(message["content"], str):
                    message["content"] = clean_content(message["content"])

        post_url = f"{self.valves.API_ENDPOINT}{self.valves.OUTLET_PATH}"
        request_data = {"user": __user__, "body": body}
        response = requests.post(post_url, json=request_data)
        response.raise_for_status()
        result = response.json()

        input_tokens = result["inputTokens"]
        output_tokens = result["outputTokens"]
        total_cost = result["totalCost"]
        new_balance = result["newBalance"]

        message_content = (
            f"输入`{input_tokens} tokens`, 输出`{output_tokens} tokens`, "
            f"消耗`¥{total_cost}`, 余额`¥{new_balance}`"
        )

        for message in reversed(body["messages"]):
            if message["role"] == "assistant":
                message["content"] += f"\n\n{message_content}"
                break

        return body
