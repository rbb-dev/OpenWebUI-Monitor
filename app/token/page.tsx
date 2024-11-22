"use client";

import { useState } from "react";
import { Input, Button, message } from "antd";
import { useRouter } from "next/navigation";

export default function TokenPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!token.trim()) {
      message.error("请输入访问令牌");
      return;
    }

    setLoading(true);
    try {
      // 将令牌存储在 cookie 中
      document.cookie = `access_token=${token}; path=/`;

      // 尝试访问首页来验证令牌
      const res = await fetch("/");
      if (res.ok) {
        message.success("令牌验证成功");
        router.push("/");
      } else {
        message.error("无效的访问令牌");
        document.cookie =
          "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    } catch (error) {
      console.error("验证失败:", error);
      message.error("验证失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-2xl font-bold text-gray-900">
            访问验证
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请输入访问令牌以继续
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Input.Password
            size="large"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="请输入访问令牌"
            onPressEnter={handleSubmit}
          />
          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            onClick={handleSubmit}
          >
            验证
          </Button>
        </div>
      </div>
    </div>
  );
}
