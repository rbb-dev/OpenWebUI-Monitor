"use client";

import { useState } from "react";
import { Input, Button, message } from "antd";
import { useRouter } from "next/navigation";
import { Button as CustomButton } from "../components/ui/Button";

export default function TokenPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    // 阻止表单默认提交行为
    e.preventDefault();

    if (!token.trim()) {
      message.error("请输入访问令牌");
      return;
    }

    setLoading(true);
    try {
      // 将令牌存储在 cookie 中
      document.cookie = `access_token=${token}; path=/`;

      // 尝试访问 API 验证令牌
      const res = await fetch("/api/config", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        message.success("令牌验证成功");
        // 等待消息显示完成后再跳转
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        message.error("无效的访问令牌");
        document.cookie =
          "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    } catch (error) {
      console.error("验证失败:", error);
      message.error("验证失败");
      document.cookie =
        "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-4 sm:px-6 bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-[45rem] max-h-[45rem] bg-blue-50/40 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[75vw] h-[75vw] max-w-[50rem] max-h-[50rem] bg-rose-50/40 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md space-y-8 px-6 py-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
            OpenWebUI Monitor
          </h2>
          <p className="text-sm sm:text-base text-gray-500">
            请输入访问令牌以继续
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              访问令牌
            </label>
            <input
              id="token"
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-2.5 bg-white rounded-lg 
                       border border-gray-200 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all duration-300
                       text-gray-900 placeholder-gray-400"
              placeholder="请输入访问令牌"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showToken}
                onChange={(e) => setShowToken(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 
                         focus:ring-blue-500 transition-colors duration-200"
              />
              <span className="ml-2 text-sm text-gray-600">显示令牌</span>
            </label>
          </div>

          <CustomButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? "验证中..." : "确认"}
          </CustomButton>
        </form>
      </div>
    </div>
  );
}
