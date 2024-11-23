"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Dropdown, Modal } from "antd";
import type { MenuProps } from "antd";
import {
  CopyOutlined,
  LogoutOutlined,
  SettingOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import DatabaseBackup from "./DatabaseBackup";

export default function Header() {
  const [apiKey, setApiKey] = useState("加载中...");
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1];

    fetch("/api/config", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setApiKey(data.apiKey))
      .catch(() => setApiKey("加载失败"));
  }, []);

  const handleCopyApiKey = () => {
    if (apiKey === "未设置" || apiKey === "加载失败") {
      message.error("API密钥未设置或加载失败");
      return;
    }
    navigator.clipboard.writeText(apiKey);
    message.success("API密钥已复制到剪贴板");
  };

  const handleLogout = () => {
    document.cookie =
      "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("access_token");
    window.location.href = "/token";
  };

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div
          className="flex items-center gap-2 px-2 py-1.5 text-gray-600 hover:text-gray-900"
          onClick={handleCopyApiKey}
        >
          <CopyOutlined className="text-base" />
          <span>复制API KEY</span>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div
          className="flex items-center gap-2 px-2 py-1.5 text-gray-600 hover:text-gray-900"
          onClick={() => setIsBackupModalOpen(true)}
        >
          <DatabaseOutlined className="text-base" />
          <span>数据迁移</span>
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <div
          className="flex items-center gap-2 px-2 py-1.5 text-gray-600 hover:text-red-500"
          onClick={handleLogout}
        >
          <LogoutOutlined className="text-base" />
          <span>退出登录</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16">
          <div className="h-full flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-semibold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent"
            >
              OpenWebUI Monitor
            </Link>

            <Dropdown
              menu={{
                items,
                className: "mt-2 !p-2 min-w-[200px]",
              }}
              trigger={["click"]}
              placement="bottomRight"
              dropdownRender={(menu) => (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 backdrop-blur-xl">
                  {menu}
                </div>
              )}
            >
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-all">
                <SettingOutlined className="text-lg text-gray-600" />
              </button>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* 数据迁移模态框 */}
      <DatabaseBackup
        open={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </>
  );
}
