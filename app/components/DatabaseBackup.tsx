"use client";

import { Button, message, Upload } from "antd";
import { ImportOutlined, ExportOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";

const DatabaseBackup = () => {
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
              onSuccess?.(result);
            } else {
              throw new Error(result.error || "导入失败");
            }
          } catch (err) {
            console.error("导入失败:", err);
            message.error({
              content: err instanceof Error ? err.message : "导入失败",
              duration: 10,
            });
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
    <div className="flex items-center gap-2">
      <Button
        icon={<ExportOutlined />}
        onClick={handleExport}
        className="flex items-center gap-1 px-3 py-2 
                  text-gray-600 hover:text-gray-800 
                  rounded-full transition-all duration-300 
                  hover:bg-white"
      >
        <span className="text-sm">导出</span>
      </Button>
      <Upload {...uploadProps}>
        <Button
          icon={<ImportOutlined />}
          className="flex items-center gap-1 px-3 py-2 
                    text-gray-600 hover:text-gray-800 
                    rounded-full transition-all duration-300 
                    hover:bg-white"
        >
          <span className="text-sm">导入</span>
        </Button>
      </Upload>
    </div>
  );
};

export default DatabaseBackup;
