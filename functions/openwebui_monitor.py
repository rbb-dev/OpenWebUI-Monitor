from typing import Optional
from pydantic import Field, BaseModel  # type: ignore
import requests  # type: ignore
import json
from open_webui.utils.misc import get_last_assistant_message  # type: ignore


class Filter:
    class Valves(BaseModel):
        API_ENDPOINT: str = Field(
            default="", description="The base URL for the API endpoint."
        )
        API_KEY: str = Field(default="", description="API key for authentication.")

    def __init__(self):
        self.type = "filter"
        self.name = "OpenWebUI Monitor"
        self.valves = self.Valves()
        self.outage = False

    def clean_content(self, content: str) -> str:
        """
        从末尾开始找到最后一个“输入”及其后内容并截掉。
        """
        last_index = content.rfind("输入")
        if last_index != -1:
            # 从最后一个“输入”之前截断
            return content[:last_index].strip()
        return content

    def inlet(
        self, body: dict, user: Optional[dict] = None, __user__: dict = {}
    ) -> dict:
        if "messages" in body and isinstance(body["messages"], list):
            for message in body["messages"]:
                if "content" in message and isinstance(message["content"], str):
                    message["content"] = self.clean_content(message["content"])

        try:
            # 使用写死的路径
            post_url = f"{self.valves.API_ENDPOINT}/api/v1/inlet"
            headers = {"Authorization": f"Bearer {self.valves.API_KEY}"}
            response = requests.post(
                post_url, headers=headers, json={"user": __user__, "body": body}
            )

            # 如果是 401 错误(API_KEY 验证失败)，直接返回 body
            if response.status_code == 401:
                return body

            response.raise_for_status()
            response_data = response.json()

            if not response_data.get("success"):
                error_msg = response_data.get("error", "未知错误")
                error_type = response_data.get("error_type", "UNKNOWN_ERROR")
                raise Exception(f"请求失败: [{error_type}] {error_msg}")

            self.outage = response_data.get("balance", 0) <= 0
            if self.outage:
                raise Exception(f"余额不足: 当前余额 `{response_data['balance']:.4f}`")

            return body

        except requests.exceptions.RequestException as e:
            if (
                isinstance(e, requests.exceptions.HTTPError)
                and e.response.status_code == 401
            ):
                return body
            raise Exception(f"网络请求失败: {str(e)}")
        except Exception as e:
            raise Exception(f"处理请求时发生错误: {str(e)}")

    def outlet(
        self, body: dict, user: Optional[dict] = None, __user__: dict = {}
    ) -> dict:
        if self.outage:
            return body

        if "messages" in body and isinstance(body["messages"], list):
            for message in body["messages"]:
                if "content" in message and isinstance(message["content"], str):
                    message["content"] = self.clean_content(message["content"])

        try:
            # 使用写死的路径
            post_url = f"{self.valves.API_ENDPOINT}/api/v1/outlet"
            headers = {"Authorization": f"Bearer {self.valves.API_KEY}"}
            request_data = {"user": __user__, "body": body}

            response = requests.post(post_url, headers=headers, json=request_data)

            # 如果是 401 错误(API_KEY 验证失败)
            if response.status_code == 401:
                # 在消息中附加提示信息
                for message in reversed(body["messages"]):
                    if message["role"] == "assistant":
                        message[
                            "content"
                        ] += "\n\n`注意: 用量统计请求的API密钥验证失败`"
                        break
                return body

            response.raise_for_status()
            result = response.json()

            if not result.get("success"):
                error_msg = result.get("error", "未知错误")
                error_type = result.get("error_type", "UNKNOWN_ERROR")
                raise Exception(f"请求失败: [{error_type}] {error_msg}")

            input_tokens = result["inputTokens"]
            output_tokens = result["outputTokens"]
            total_cost = result["totalCost"]
            new_balance = result["newBalance"]

            message_content = (
                f"输入`{input_tokens} tokens`, 输出`{output_tokens} tokens`, "
                f"消耗`¥{total_cost:.4f}`, 余额`¥{new_balance:.4f}`"
            )

            for message in reversed(body["messages"]):
                if message["role"] == "assistant":
                    message["content"] += f"\n\n{message_content}"
                    break

            return body

        except requests.exceptions.RequestException as e:
            if (
                isinstance(e, requests.exceptions.HTTPError)
                and e.response.status_code == 401
            ):
                # 在消息中附加提示信息
                for message in reversed(body["messages"]):
                    if message["role"] == "assistant":
                        message[
                            "content"
                        ] += "\n\n`注意: 用量统计请求的API密钥验证失败`"
                        break
                return body
            raise Exception(f"网络请求失败: {str(e)}")
        except Exception as e:
            raise Exception(f"处理请求时发生错误: {str(e)}")
