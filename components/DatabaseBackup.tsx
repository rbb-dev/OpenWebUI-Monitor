"use client";

import { useRef } from "react";
import { message } from "antd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DatabaseIcon, DownloadIcon, UploadIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DatabaseBackupProps {
  open: boolean;
  onClose: () => void;
  token?: string;
}

export default function DatabaseBackup({
  open,
  onClose,
  token,
}: DatabaseBackupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token) {
      message.error("未授权，请重新登录");
      return;
    }

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      const response = await fetch("/api/v1/panel/database/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("导入失败");
      }

      const result = await response.json();

      if (result.success) {
        message.success("导入成功");
        // 清空文件选择
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error(result.error || "导入失败");
      }
    } catch (err) {
      console.error("导入失败:", err);
      message.error(err instanceof Error ? err.message : "导入失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] !max-w-[70vw] sm:max-w-[425px] rounded-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
              <DatabaseIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <DialogTitle className="text-base sm:text-lg">数据迁移</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm">
            导出或导入数据库备份，方便迁移和恢复数据
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 py-3 sm:py-4">
          <Card
            className={cn(
              "cursor-pointer transition-colors hover:bg-accent",
              "group relative overflow-hidden"
            )}
            onClick={handleExport}
          >
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20">
                <DownloadIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="font-medium leading-none text-sm sm:text-base">
                  导出数据
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  将当前数据导出为备份文件
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-colors hover:bg-accent",
              "group relative overflow-hidden"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20">
                <UploadIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="font-medium leading-none text-sm sm:text-base">
                  导入数据
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  从备份文件中恢复数据
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
