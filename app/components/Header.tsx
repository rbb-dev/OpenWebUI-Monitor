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
  GithubOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import DatabaseBackup from "./DatabaseBackup";
import { APP_VERSION } from "@/lib/version";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  // 如果是token页面，不显示Header
  if (pathname === "/token") {
    return null;
  }

  const [apiKey, setApiKey] = useState("加载中...");
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const getAccessToken = () => {
    if (typeof document === "undefined") return null;
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1] || null
    );
  };

  useEffect(() => {
    const token = getAccessToken();
    setAccessToken(token);

    if (!token) {
      setApiKey("未授权");
      return;
    }

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
    const token = getAccessToken();
    if (!token) {
      message.error("未授权，请重新登录");
      return;
    }
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

  const checkUpdate = async () => {
    const token = getAccessToken();
    if (!token) {
      message.error("未授权，请重新登录");
      return;
    }

    setIsCheckingUpdate(true);
    try {
      const response = await fetch(
        "https://api.github.com/repos/variantconst/openwebui-monitor/releases/latest"
      );
      const data = await response.json();
      const latestVersion = data.tag_name;

      if (!latestVersion) {
        throw new Error("获取版本号失败");
      }

      const currentVer = APP_VERSION.replace(/^v/, "");
      const latestVer = latestVersion.replace(/^v/, "");

      if (currentVer === latestVer) {
        message.success(`当前已是最新版本 v${APP_VERSION}`);
      } else {
        Modal.confirm({
          icon: null,
          title: (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50">
                <GithubOutlined className="text-lg text-blue-500" />
              </div>
              <div className="flex flex-col">
                <div className="text-lg font-medium text-gray-800">
                  发现新版本
                </div>
              </div>
            </div>
          ),
          content: (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">当前版本</span>
                <span className="font-mono text-gray-800">v{APP_VERSION}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">最新版本</span>
                <span className="font-mono text-blue-600">{latestVersion}</span>
              </div>
            </div>
          ),
          centered: true,
          width: 400,
          okText: "前往更新",
          cancelText: "暂不更新",
          className: "update-modal",
          okButtonProps: {
            className: "bg-blue-500 hover:bg-blue-600",
          },
          onOk: () => {
            window.open(
              "https://github.com/VariantConst/OpenWebUI-Monitor/releases/latest",
              "_blank"
            );
          },
        });
      }
    } catch (error) {
      message.error("检查更新失败");
      console.error("检查更新失败:", error);
    } finally {
      setIsCheckingUpdate(false);
    }
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
          <span>复制 API KEY</span>
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
          className="flex items-center gap-2 px-2 py-1.5 text-gray-600 hover:text-gray-900"
          onClick={checkUpdate}
        >
          <GithubOutlined className="text-base" spin={isCheckingUpdate} />
          <span>检查更新</span>
        </div>
      ),
    },
    {
      key: "4",
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

      <DatabaseBackup
        open={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        token={accessToken || undefined}
      />
    </>
  );
}
