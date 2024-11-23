"use client";

import { message, Upload, Modal } from "antd";
import type { UploadProps } from "antd";

interface DatabaseBackupProps {
  open: boolean;
  onClose: () => void;
  token?: string;
}

const DatabaseBackup: React.FC<DatabaseBackupProps> = ({
  open,
  onClose,
  token,
}) => {
  const handleExport = async () => {
    if (!token) {
      message.error("未授权，请重新登录");
      return;
    }

    try {
      const response = await fetch("/api/v1/panel/database/export", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("导出失败");
      }

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

      if (!token) {
        message.error("未授权，请重新登录");
        onError?.(new Error("未授权"));
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = JSON.parse(e.target?.result as string);
            const response = await fetch("/api/v1/panel/database/import", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(content),
            });

            if (!response.ok) {
              throw new Error("导入失败");
            }

            const result = await response.json();

            if (result.success) {
              message.success("导入成功");
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
    <Modal
      title="数据迁移"
      open={open}
      onCancel={onClose}
      footer={null}
      width={280}
      centered
    >
      <div className="flex flex-col items-center gap-3 py-4">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 w-[180px] px-4 py-3 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          导出数据
        </button>

        <Upload {...uploadProps}>
          <button className="flex items-center justify-center gap-2 w-[180px] px-4 py-3 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            导入数据
          </button>
        </Upload>
      </div>
    </Modal>
  );
};

export default DatabaseBackup;
