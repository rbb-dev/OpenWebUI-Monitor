"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiDatabase, FiUsers, FiBarChart2, FiGithub } from "react-icons/fi";
import { GithubOutlined, CloseOutlined } from "@ant-design/icons";
import { APP_VERSION } from "@/lib/version";
import { message } from "antd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { t } = useTranslation("common");
  const [isUpdateVisible, setIsUpdateVisible] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/variantconst/openwebui-monitor/releases/latest"
        );
        const data = await response.json();
        const latestVer = data.tag_name;
        if (!latestVer) {
          return;
        }

        const currentVer = APP_VERSION.replace(/^v/, "");
        const newVer = latestVer.replace(/^v/, "");

        // 检查是否有更新且用户未禁用该版本的提示
        const ignoredVersion = localStorage.getItem("ignoredVersion");
        if (currentVer !== newVer && ignoredVersion !== latestVer) {
          setLatestVersion(latestVer);
          setIsUpdateVisible(true);
        }
      } catch (error) {
        console.error(t("header.messages.updateCheckFailed"), error);
      }
    };

    checkUpdate();
  }, [t]);

  const handleUpdate = () => {
    window.open(
      "https://github.com/VariantConst/OpenWebUI-Monitor/releases/latest",
      "_blank"
    );
    setIsUpdateVisible(false);
  };

  const handleIgnore = () => {
    localStorage.setItem("ignoredVersion", latestVersion);
    setIsUpdateVisible(false);
    message.success(t("update.ignore"));
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-rose-50 via-slate-50 to-teal-50 pt-16">
      {/* 新增动态网格背景 */}
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.03}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]",
          "absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-12 z-0"
        )}
      />

      {/* 装饰性背景模糊圆 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-rose-100/20 via-slate-100/20 to-teal-100/20 rounded-full blur-3xl opacity-40" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-pink-100/10 to-indigo-100/10 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-teal-100/10 to-slate-100/10 rounded-full blur-3xl opacity-30" />

      {/* 修改主要内容容器，使用flex布局固定GitHub在底部 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[calc(100vh-4rem)] flex flex-col relative z-10"
      >
        {/* 标题区域保持不变 */}
        <motion.div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full space-y-6 sm:space-y-8 mb-12 sm:mb-16 px-4"
          >
            <div className="text-center space-y-2">
              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-2 sm:mb-3 tracking-tight"
              >
                {t("common.appName")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm sm:text-base md:text-lg text-slate-600/90 max-w-2xl mx-auto font-light"
              >
                {t("common.description")}
              </motion.p>
            </div>
          </motion.div>

          {/* 重新设计的导航区域 */}
          <div className="w-full max-w-2xl px-4 sm:px-6">
            <div className="relative">
              {/* 装饰性背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-rose-100/20 via-slate-100/20 to-teal-100/20 blur-3xl -z-10" />

              {/* 新的垂直导航设计 */}
              <div className="space-y-4">
                {[
                  {
                    path: "/models",
                    icon: <FiDatabase className="w-6 h-6" />,
                    title: t("home.features.models.title"),
                    desc: t("home.features.models.description"),
                    gradient: "from-blue-500/80 to-indigo-500/80",
                    lightColor: "bg-blue-50/50",
                    borderColor: "border-blue-200/20",
                    iconColor: "text-blue-500/70",
                  },
                  {
                    path: "/users",
                    icon: <FiUsers className="w-6 h-6" />,
                    title: t("home.features.users.title"),
                    desc: t("home.features.users.description"),
                    gradient: "from-rose-500/80 to-pink-500/80",
                    lightColor: "bg-rose-50/50",
                    borderColor: "border-rose-200/20",
                    iconColor: "text-rose-500/70",
                  },
                  {
                    path: "/panel",
                    icon: <FiBarChart2 className="w-6 h-6" />,
                    title: t("home.features.stats.title"),
                    desc: t("home.features.stats.description"),
                    gradient: "from-emerald-500/80 to-teal-500/80",
                    lightColor: "bg-emerald-50/50",
                    borderColor: "border-emerald-200/20",
                    iconColor: "text-emerald-500/70",
                  },
                ].map((item, index) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="group block"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative bg-white rounded-2xl overflow-hidden transition-all duration-500 
                        shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] 
                        hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)]"
                    >
                      {/* 移除边框设计，只保留渐变背景 */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      />

                      {/* 内容区域 */}
                      <div className="relative p-6">
                        <div className="flex items-center gap-4">
                          {/* 图标容器 - 使用投影替代边框 */}
                          <div
                            className={cn(
                              "p-3 rounded-xl transition-all duration-500",
                              item.lightColor,
                              item.iconColor,
                              "shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]",
                              "group-hover:bg-white/10 group-hover:text-white group-hover:shadow-none"
                            )}
                          >
                            {item.icon}
                          </div>

                          {/* 文字内容 */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-slate-800 group-hover:text-white transition-colors mb-1">
                              {item.title}
                            </h3>
                            <p className="text-sm text-slate-600 group-hover:text-white/90 transition-colors">
                              {item.desc}
                            </p>
                          </div>

                          {/* 箭头 */}
                          <div
                            className={cn(
                              "transform transition-all duration-300",
                              item.iconColor,
                              "group-hover:text-white group-hover:translate-x-1"
                            )}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* GitHub 图标固定在底部 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="py-8 text-center"
        >
          <a
            href="https://github.com/VariantConst/OpenWebUI-Monitor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiGithub className="w-6 h-6" />
          </a>
        </motion.div>
      </motion.div>

      {/* 更新提示框样式修改 */}
      {isUpdateVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4"
        >
          <div className="backdrop-blur-[15px] bg-white/20 border border-white/30 rounded-xl shadow-2xl p-4">
            <div className="flex items-center gap-3 text-gray-600">
              <span>
                {t("update.newVersion")} {latestVersion}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleIgnore}
                  className="hover:text-gray-900 transition-colors"
                >
                  {t("update.ignore")}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleUpdate}
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  {t("update.update")}
                </button>
              </div>
              <button
                onClick={() => setIsUpdateVisible(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <CloseOutlined className="text-xs" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
