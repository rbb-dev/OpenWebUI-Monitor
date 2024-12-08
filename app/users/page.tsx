"use client";

import { useState, useEffect } from "react";
import { Table, Input, message, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: number;
}

export default function UsersPage() {
  const { t } = useTranslation("common");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingKey, setEditingKey] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?page=${page}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t("users.message.fetchUsersError")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const handleUpdateBalance = async (userId: string, newBalance: number) => {
    try {
      const res = await fetch(`/api/users/${userId}/balance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      message.success(t("users.message.updateBalance.success"));
      setEditingKey("");
      fetchUsers(currentPage);
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : t("users.message.updateBalance.error")
      );
    }
  };

  const getColumns = (): ColumnsType<User> => {
    // 基础列配置 - 在所有设备上都显示
    const baseColumns: ColumnsType<User> = [
      {
        title: t("users.userInfo"),
        key: "userInfo",
        width: "65%",
        render: (_, record) => (
          <div
            className="flex flex-col cursor-pointer py-1"
            onClick={() => setSelectedUser(record)}
          >
            <div className="font-medium">{record.name}</div>
            <div className="hidden sm:block text-xs text-muted-foreground truncate">
              {record.email}
            </div>
            <div className="hidden sm:block text-xs text-muted-foreground/70 truncate">
              ID: {record.id}
            </div>
          </div>
        ),
      },
      {
        title: t("users.balance"),
        dataIndex: "balance",
        key: "balance",
        width: "35%",
        align: "left",
        render: (balance: number, record) => {
          const isEditing = record.id === editingKey;
          return isEditing ? (
            <Input
              defaultValue={Number(balance).toFixed(2)}
              className="w-full max-w-[120px]"
              onPressEnter={(e: React.KeyboardEvent<HTMLInputElement>) => {
                const value = e.currentTarget.value;
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                  handleUpdateBalance(record.id, numValue);
                } else {
                  message.error(t("users.message.invalidNumber"));
                  setEditingKey("");
                }
              }}
              onBlur={(e) => {
                const value = e.currentTarget.value;
                const numValue = Number(value);
                if (value && !isNaN(numValue) && numValue !== balance) {
                  handleUpdateBalance(record.id, numValue);
                } else {
                  setEditingKey("");
                }
              }}
              autoFocus
            />
          ) : (
            <div
              className="cursor-pointer font-medium text-blue-600"
              onClick={() => setEditingKey(record.id)}
            >
              ￥{Number(balance).toFixed(2)}
            </div>
          );
        },
      },
    ];

    // 仅在桌面设备显示的额外列
    const desktopColumns: ColumnsType<User> = [
      {
        title: t("users.role"),
        dataIndex: "role",
        key: "role",
        width: 100,
        className: "hidden sm:table-cell",
        render: (role) => (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
            {role}
          </span>
        ),
      },
    ];

    return [...baseColumns, ...desktopColumns];
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="pt-16 flex flex-col gap-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {t("users.title")}
          </h1>
        </div>
      </div>

      <Table
        columns={getColumns()}
        dataSource={users.map((user) => ({
          ...user,
          balance: Number(user.balance),
        }))}
        rowKey="id"
        loading={loading}
        size="middle"
        className="bg-card text-card-foreground rounded-lg shadow-sm 
          [&_.ant-table]:!border-b-0 
          [&_.ant-table-container]:!rounded-lg 
          [&_.ant-table-container]:!border-hidden
          [&_.ant-table-cell]:!border-gray-100 
          [&_.ant-table-thead_.ant-table-cell]:!bg-gray-50/80
          [&_.ant-table-thead_.ant-table-cell]:!text-gray-600
          [&_.ant-table-row:hover>*]:!bg-blue-50/50
          [&_.ant-table-tbody_.ant-table-row]:!cursor-pointer
          [&_.ant-table-column-sorter-up.active_.anticon]:!text-blue-500
          [&_.ant-table-column-sorter-down.active_.anticon]:!text-blue-500
          [&_.ant-table-filter-trigger.active]:!text-blue-500
          [&_.ant-table-filter-dropdown]:!rounded-lg
          [&_.ant-table-filter-dropdown]:!shadow-lg
          [&_.ant-table-filter-dropdown]:!border-gray-100
          [&_.ant-pagination]:!mt-4
          [&_.ant-pagination]:!mb-0
          [&_.ant-pagination]:!px-4
          [&_.ant-pagination]:!pb-4"
        pagination={{
          total,
          pageSize: 20,
          current: currentPage,
          onChange: (page) => {
            setCurrentPage(page);
            setEditingKey("");
          },
          className: "!mb-0",
          showTotal: (total) => (
            <span className="text-muted-foreground">
              {t("users.total")} {total} {t("users.totalRecords")}
            </span>
          ),
          size: "small",
        }}
        scroll={{ x: 300 }}
      />

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] sm:w-full sm:max-w-[425px] rounded-lg">
          <DialogHeader>
            <DialogTitle>{t("users.userDetails")}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {t("users.nickname")}
                </div>
                <div className="font-medium">{selectedUser.name}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {t("users.email")}
                </div>
                <div className="break-all">{selectedUser.email}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {t("users.id")}
                </div>
                <div className="font-mono text-sm break-all">
                  {selectedUser.id}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {t("users.role")}
                </div>
                <div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                    {selectedUser.role}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
