"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Dropdown, Modal, message } from "antd";
import type { MenuProps } from "antd";
import {
  Copy,
  LogOut,
  Database,
  Github,
  Menu,
  Globe,
  X,
  Settings,
  ChevronDown,
} from "lucide-react";
import DatabaseBackup from "./DatabaseBackup";
import { APP_VERSION } from "@/lib/version";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiDatabase, FiUsers, FiBarChart2 } from "react-icons/fi";

export default function Header() {
  const { t, i18n } = useTranslation("common");
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  // 将函数声明移到前面
  const handleLanguageChange = async (newLang: string) => {
    await i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  // 如果是token页面，只显示语言切换按钮
  const isTokenPage = pathname === "/token";

  if (isTokenPage) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16">
          <div className="h-full flex items-center justify-between">
            <div className="text-xl font-semibold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent">
              {t("common.appName")}
            </div>
            <button
              className="p-2 rounded-lg hover:bg-gray-50/80 transition-colors relative group"
              onClick={() =>
                handleLanguageChange(i18n.language === "zh" ? "en" : "zh")
              }
            >
              <Globe className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full border border-gray-200 shadow-sm px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {i18n.language === "zh"
                  ? t("header.language.zh")
                  : t("header.language.en")}
              </span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  const [apiKey, setApiKey] = useState(t("common.loading"));

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setAccessToken(token);

    if (!token) {
      router.push("/token");
      return;
    }

    // 验证token的有效性
    fetch("/api/config", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          // 如果token无效，清除token并重定向
          localStorage.removeItem("access_token");
          router.push("/token");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setApiKey(data.apiKey);
        }
      })
      .catch(() => {
        setApiKey(t("common.error"));
        // 发生错误时也清除token并重定向
        localStorage.removeItem("access_token");
        router.push("/token");
      });
  }, [router, t]);

  const handleCopyApiKey = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      message.error(t("header.messages.unauthorized"));
      return;
    }
    navigator.clipboard.writeText(apiKey);
    message.success(t("header.messages.apiKeyCopied"));
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/token";
  };

  const checkUpdate = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      message.error(t("header.messages.unauthorized"));
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
        throw new Error(t("header.messages.getVersionFailed"));
      }

      const currentVer = APP_VERSION.replace(/^v/, "");
      const latestVer = latestVersion.replace(/^v/, "");

      if (currentVer === latestVer) {
        message.success(
          `${t("header.messages.latestVersion")} v${APP_VERSION}`
        );
      } else {
        return new Promise((resolve) => {
          const dialog = document.createElement("div");
          document.body.appendChild(dialog);

          const DialogComponent = () => {
            const [open, setOpen] = useState(true);

            const handleClose = () => {
              setOpen(false);
              document.body.removeChild(dialog);
              resolve(null);
            };

            const handleUpdate = () => {
              window.open(
                "https://github.com/VariantConst/OpenWebUI-Monitor/releases/latest",
                "_blank"
              );
              handleClose();
            };

            return (
              <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="w-[calc(100%-2rem)] !max-w-[70vw] sm:max-w-[425px] rounded-lg">
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
                        <Github className="w-4 h-4 text-gray-500" />
                      </div>
                      <DialogTitle className="text-base sm:text-lg">
                        {t("header.update.newVersion")}
                      </DialogTitle>
                    </div>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 sm:gap-4 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-muted-foreground">
                        {t("header.update.currentVersion")}
                      </span>
                      <span className="font-mono text-sm sm:text-base">
                        v{APP_VERSION}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-muted-foreground">
                        {t("header.update.latestVersion")}
                      </span>
                      <span className="font-mono text-sm sm:text-base text-primary">
                        {latestVersion}
                      </span>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="h-8 sm:h-10 text-sm sm:text-base"
                    >
                      {t("header.update.skipUpdate")}
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      className="h-8 sm:h-10 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {t("header.update.goToUpdate")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            );
          };

          createRoot(dialog).render(<DialogComponent />);
        });
      }
    } catch (error) {
      message.error(t("header.messages.updateCheckFailed"));
      console.error(t("header.messages.updateCheckFailed"), error);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const navigationItems = [
    {
      path: "/models",
      icon: <FiDatabase className="w-5 h-5" />,
      label: t("home.features.models.title"),
      color: "from-blue-500/10 to-indigo-500/10",
      hoverColor: "group-hover:text-blue-600",
    },
    {
      path: "/users",
      icon: <FiUsers className="w-5 h-5" />,
      label: t("home.features.users.title"),
      color: "from-rose-500/10 to-pink-500/10",
      hoverColor: "group-hover:text-rose-600",
    },
    {
      path: "/panel",
      icon: <FiBarChart2 className="w-5 h-5" />,
      label: t("home.features.stats.title"),
      color: "from-emerald-500/10 to-teal-500/10",
      hoverColor: "group-hover:text-emerald-600",
    },
  ];

  const settingsItems = [
    {
      icon: <Copy className="w-5 h-5" />,
      label: t("header.menu.copyApiKey"),
      onClick: handleCopyApiKey,
      color: "from-blue-500/20 to-indigo-500/20",
    },
    {
      icon: <Database className="w-5 h-5" />,
      label: t("header.menu.dataBackup"),
      onClick: () => setIsBackupModalOpen(true),
      color: "from-rose-500/20 to-pink-500/20",
    },
    {
      icon: <Github className="w-5 h-5" />,
      label: t("header.menu.checkUpdate"),
      onClick: checkUpdate,
      color: "from-emerald-500/20 to-teal-500/20",
    },
    {
      icon: <LogOut className="w-5 h-5" />,
      label: t("header.menu.logout"),
      onClick: handleLogout,
      color: "from-orange-500/20 to-red-500/20",
    },
  ];

  const menuItems = [
    // 在小屏幕上将导航项添加到菜单中，但需要特殊处理
    ...(!isTokenPage
      ? navigationItems.map((item) => ({
          ...item,
          onClick: () => router.push(item.path), // 为导航项添加 onClick 处理
        }))
      : []),
    {
      icon: <Copy className="w-5 h-5" />,
      label: t("header.menu.copyApiKey"),
      onClick: handleCopyApiKey,
      color: "from-blue-500/20 to-indigo-500/20",
    },
    {
      icon: <Database className="w-5 h-5" />,
      label: t("header.menu.dataBackup"),
      onClick: () => setIsBackupModalOpen(true),
      color: "from-rose-500/20 to-pink-500/20",
    },
    {
      icon: <Github className="w-5 h-5" />,
      label: t("header.menu.checkUpdate"),
      onClick: checkUpdate,
      color: "from-emerald-500/20 to-teal-500/20",
    },
    {
      icon: <LogOut className="w-5 h-5" />,
      label: t("header.menu.logout"),
      onClick: handleLogout,
      color: "from-orange-500/20 to-red-500/20",
    },
  ];

  // 在navigationItems数组后添加
  const actionItems = [
    {
      icon: <Globe className="w-5 h-5" />,
      label: i18n.language === "zh" ? "简体中文" : "English",
      onClick: () => handleLanguageChange(i18n.language === "zh" ? "en" : "zh"),
      color: "from-gray-100 to-gray-50",
      hoverColor: "group-hover:text-gray-900",
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: t("header.menu.settings"),
      onClick: () => setIsMenuOpen(true),
      color: "from-gray-100 to-gray-50",
      hoverColor: "group-hover:text-gray-900",
    },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16">
          <div className="h-full flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link
                href="/"
                className="text-xl font-semibold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent"
              >
                {t("common.appName")}
              </Link>
            </motion.div>

            {/* 右侧内容 */}
            <div className="flex items-center gap-4">
              {/* 导航项 - 仅在大屏幕显示 */}
              {!isTokenPage && (
                <div className="hidden md:flex items-center gap-3">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="group relative"
                    >
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r hover:bg-gradient-to-br transition-all duration-300 relative">
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300`}
                        />
                        <span
                          className={`relative z-10 ${item.hoverColor} transition-colors duration-300`}
                        >
                          {item.icon}
                        </span>
                        <span className="relative z-10 text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors duration-300">
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* 语言切换和菜单按钮 */}
              <div className="flex items-center gap-3">
                {actionItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="group relative"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r hover:bg-gradient-to-br transition-all duration-300 relative">
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300`}
                      />
                      <span
                        className={`relative z-10 ${item.hoverColor} transition-colors duration-300`}
                      >
                        {item.icon}
                      </span>
                      <span className="relative z-10 hidden md:block text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors duration-300">
                        {item.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:bg-black/10"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* 菜单面板 - 响应式布局 */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full bg-white z-50 w-full max-w-[640px] overflow-hidden shadow-2xl"
            >
              {/* 渐变背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />

              {/* 模糊圆形装饰 */}
              <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-gradient-to-br from-rose-100/20 to-orange-100/20 rounded-full blur-3xl" />

              {/* 内容容器 */}
              <div className="relative h-full flex flex-col">
                {/* 顶部栏 */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-semibold text-gray-800"
                  >
                    {t("header.menu.title")}
                  </motion.h2>
                  <motion.button
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-gray-100/80 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>

                {/* 菜单项列表 */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  <div className="grid gap-3 max-w-3xl mx-auto">
                    {/* 在小屏幕上显示导航项 */}
                    <div className="md:hidden space-y-3">
                      {navigationItems.map((item, index) => (
                        <motion.button
                          key={item.path}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.1 }}
                          onClick={() => {
                            setIsMenuOpen(false);
                            router.push(item.path);
                          }}
                          className="w-full group relative"
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                          />
                          <div className="relative flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-transparent transition-colors duration-300 backdrop-blur-sm">
                            <span className="p-3 rounded-xl bg-white shadow-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                              {item.icon}
                            </span>
                            <span className="text-base font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                              {item.label}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* 设置组 */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      {/* 设置标题按钮 */}
                      <motion.button
                        onClick={() =>
                          setIsSettingsExpanded(!isSettingsExpanded)
                        }
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="p-2 rounded-lg bg-white shadow-sm">
                            <Settings className="w-5 h-5 text-gray-600" />
                          </span>
                          <span className="text-base font-medium text-gray-800">
                            {t("header.menu.settings")}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                            isSettingsExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </motion.button>

                      {/* 设置项列表 */}
                      <AnimatePresence>
                        {isSettingsExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 overflow-hidden pl-4"
                          >
                            {settingsItems.map((item, index) => (
                              <motion.button
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + index * 0.1 }}
                                onClick={() => {
                                  setIsMenuOpen(false);
                                  item.onClick();
                                }}
                                className="w-full group relative"
                              >
                                <div
                                  className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                />
                                <div className="relative flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-transparent transition-colors duration-300 backdrop-blur-sm">
                                  <span className="p-3 rounded-xl bg-white shadow-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                                    {item.icon}
                                  </span>
                                  <span className="text-base font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                                    {item.label}
                                  </span>
                                </div>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DatabaseBackup
        open={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        token={accessToken || undefined}
      />
    </>
  );
}
