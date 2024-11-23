"use client";

import { Button, message, Upload, Modal } from "antd";
import {
  ImportOutlined,
  ExportOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useState } from "react";

const DatabaseBackup = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExport = async () => {
    try {
      const response = await fetch("/api/v1/panel/database/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `openwebui_monitor_backup_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success("导出成功");
    } catch (error) {
      console.error("导出失败:", error);
      message.error("导出失败");
    }
  };

  const uploadProps: UploadProps = {
    accept: ".json",
    showUploadList: false,
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;

      try {
        const formData = new FormData();
        formData.append("file", file);

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = JSON.parse(e.target?.result as string);
            const response = await fetch("/api/v1/panel/database/import", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(content),
            });

            const result = await response.json();

            if (result.success) {
              message.success("导入成功");
              setIsModalOpen(false);
              onSuccess?.(result);
            } else {
              throw new Error(result.error || "导入失败");
            }
          } catch (err) {
            console.error("导入失败:", err);
            message.error(err instanceof Error ? err.message : "导入失败");
            onError?.(err as Error);
          }
        };

        reader.readAsText(file as Blob);
      } catch (err) {
        console.error("读取文件失败:", err);
        message.error("读取文件失败");
        onError?.(err as Error);
      }
    },
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5
                text-gray-600 hover:text-gray-800
                rounded-full
                transition-all duration-300
                hover:bg-gray-100"
      >
        <DatabaseOutlined className="text-base sm:text-lg" />
        <span className="hidden md:inline text-sm">数据迁移</span>
      </button>

      <Modal
        title={
          <div className="text-base sm:text-lg font-medium text-gray-900 text-center pb-1 sm:pb-2">
            数据迁移
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        centered
        className="rounded-2xl overflow-hidden px-4 sm:px-6"
      >
        <p className="text-xs sm:text-sm text-gray-500 text-center mb-4 sm:mb-6">
          您可以导出数据进行备份，或导入之前备份的数据进行恢复
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 py-2 sm:py-4">
          {/* 导出卡片 */}
          <div className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg border border-gray-200">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
            <button
              onClick={handleExport}
              className="relative p-4 sm:p-6 w-full h-full text-left"
            >
              <div className="flex items-center mb-2 sm:mb-4">
                <div
                  className="p-2 sm:p-3 bg-gray-900/5 rounded-lg sm:rounded-xl mr-3 sm:mr-4 
                              group-hover:bg-gray-900/10 transition-all duration-300"
                >
                  <ExportOutlined className="text-lg sm:text-xl text-gray-800" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  导出数据
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                将当前系统数据导出为备份文件
              </p>
            </button>
          </div>

          {/* 导入卡片 */}
          <div className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg border border-gray-200">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
            <Upload {...uploadProps}>
              <div className="relative p-4 sm:p-6 w-full h-full text-left cursor-pointer">
                <div className="flex items-center mb-2 sm:mb-4">
                  <div
                    className="p-2 sm:p-3 bg-gray-900/5 rounded-lg sm:rounded-xl mr-3 sm:mr-4 
                                group-hover:bg-gray-900/10 transition-all duration-300"
                  >
                    <ImportOutlined className="text-lg sm:text-xl text-gray-800" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    导入数据
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">
                  从备份文件中恢复系统数据
                </p>
              </div>
            </Upload>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DatabaseBackup;
