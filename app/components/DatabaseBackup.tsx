"use client";

import { message, Upload, Modal } from "antd";
import { ImportOutlined, ExportOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";

interface DatabaseBackupProps {
  open: boolean;
  onClose: () => void;
}

interface MigrationCardProps {
  type: "export" | "import";
  onClick?: () => void;
  uploadProps?: UploadProps;
}

const MigrationCard: React.FC<MigrationCardProps> = ({
  type,
  onClick,
  uploadProps,
}) => {
  const config = {
    export: {
      icon: <ExportOutlined className="text-base text-blue-600" />,
      title: "导出",
      color: "border-blue-100 hover:border-blue-200 bg-blue-50/40",
      iconBg: "bg-blue-50",
    },
    import: {
      icon: <ImportOutlined className="text-base text-purple-600" />,
      title: "导入",
      color: "border-purple-100 hover:border-purple-200 bg-purple-50/40",
      iconBg: "bg-purple-50",
    },
  }[type];

  const card = (
    <div
      className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all duration-300 ${config.color}`}
    >
      <div className={`p-2 rounded ${config.iconBg}`}>{config.icon}</div>
      <span className="text-sm font-medium text-gray-900">{config.title}</span>
    </div>
  );

  if (type === "import" && uploadProps) {
    return (
      <Upload {...uploadProps} className="w-full">
        <div className="w-full cursor-pointer">{card}</div>
      </Upload>
    );
  }

  return (
    <div className="w-full cursor-pointer" onClick={onClick}>
      {card}
    </div>
  );
};

const DatabaseBackup: React.FC<DatabaseBackupProps> = ({ open, onClose }) => {
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
            message.error(err instanceof Error ? err.message : "导入失败");
            onError?.(err as Error);
          }
        };

        reader.readAsText(file as Blob);
        onSuccess && onSuccess("ok");
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
      width={360}
      centered
      className="rounded-xl"
    >
      <div className="py-4">
        <p className="text-xs text-gray-500 text-center mb-4">
          导出或导入系统数据
        </p>
        <div className="flex flex-col gap-2">
          <MigrationCard type="export" onClick={handleExport} />
          <MigrationCard type="import" uploadProps={uploadProps} />
        </div>
      </div>
    </Modal>
  );
};

export default DatabaseBackup;
