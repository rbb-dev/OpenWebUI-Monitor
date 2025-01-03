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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Search } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: number;
  deleted: boolean;
}

export default function UsersPage() {
  const { t } = useTranslation("common");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingKey, setEditingKey] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [sortInfo, setSortInfo] = useState<{
    field: string | null;
    order: "ascend" | "descend" | null;
  }>({
    field: null,
    order: null,
  });
  const [searchText, setSearchText] = useState("");

  const fetchUsers = async (page: number) => {
    setLoading(true);
    try {
      let url = `/api/users?page=${page}`;
      if (sortInfo.field && sortInfo.order) {
        url += `&sortField=${sortInfo.field}&sortOrder=${sortInfo.order}`;
      }
      if (searchText) {
        url += `&search=${encodeURIComponent(searchText)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const activeUsers = data.users.filter((user: User) => !user.deleted);
      setUsers(activeUsers);
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
  }, [currentPage, sortInfo, searchText]);

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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      message.success(t("users.message.deleteSuccess"));
      setUserToDelete(null);
      fetchUsers(currentPage);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t("users.message.deleteError")
      );
    }
  };

  const getColumns = (): ColumnsType<User> => {
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
            <div className="flex items-center gap-2">
              <span className="font-medium">{record.name}</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600">
                {record.role}
              </span>
            </div>
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
        sorter: {
          compare: (a, b) => a.balance - b.balance,
          multiple: 1,
        },
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
      {
        title: t("users.actions"),
        key: "actions",
        width: "48px",
        align: "center",
        render: (_, record) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUserToDelete(record);
            }}
            className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        ),
      },
    ];

    return baseColumns;
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="pt-16 flex flex-col gap-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {t("users.title")}
          </h1>
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder={t("users.searchPlaceholder")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="
                w-full
                pl-10
                pr-4
                py-2
                h-10
                bg-white
                dark:bg-gray-900
                border-gray-200
                dark:border-gray-700
                hover:border-gray-300
                dark:hover:border-gray-600
                focus:border-primary
                dark:focus:border-primary
                transition-colors
                rounded-lg
                shadow-sm
                [&:not(:focus)]:hover:shadow-md
                placeholder:text-gray-500
                dark:placeholder:text-gray-400
              "
              allowClear={{
                clearIcon: (
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <svg
                      className="h-3 w-3 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ),
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table
          columns={getColumns()}
          dataSource={users.map((user) => ({
            ...user,
            balance: Number(user.balance),
          }))}
          rowKey="id"
          loading={loading}
          size="middle"
          className="
            [&_.ant-table]:!border-b-0 
            [&_.ant-table-container]:!rounded-lg 
            [&_.ant-table-container]:!border-hidden
            [&_.ant-table-cell]:!border-0
            [&_.ant-table-cell]:px-4
            [&_.ant-table-cell]:py-3
            [&_.ant-table-thead_.ant-table-cell]:!bg-muted/50
            [&_.ant-table-thead_.ant-table-cell]:!text-muted-foreground
            [&_.ant-table-thead_.ant-table-cell]:font-medium
            [&_.ant-table-thead_.ant-table-cell]:text-sm
            [&_.ant-table-row]:border-b 
            [&_.ant-table-row]:border-border/40
            [&_.ant-table-row:last-child]:border-0
            [&_.ant-table-row:hover>*]:!bg-muted/60
            [&_.ant-table-tbody_.ant-table-row]:transition-colors
            [&_.ant-table-tbody_.ant-table-row]:!cursor-pointer
            [&_.ant-table-column-sorter]:opacity-40
            [&_.ant-table-column-sorter-up.active_.anticon]:!text-primary
            [&_.ant-table-column-sorter-down.active_.anticon]:!text-primary
            [&_.ant-table-column-sorter]:hover:opacity-100
            [&_.ant-spin-nested-loading]:min-h-[280px]
            [&_.ant-pagination]:border-t
            [&_.ant-pagination]:border-border/40
            [&_.ant-pagination-item]:rounded-md
            [&_.ant-pagination-item]:border-border/40
            [&_.ant-pagination-item-active]:!bg-primary/10
            [&_.ant-pagination-item-active]:!border-primary/30
            [&_.ant-pagination-item-active>a]:!text-primary
            [&_.ant-pagination-prev_.ant-pagination-item-link]:rounded-md
            [&_.ant-pagination-next_.ant-pagination-item-link]:rounded-md
            [&_.ant-pagination-prev_.ant-pagination-item-link]:border-border/40
            [&_.ant-pagination-next_.ant-pagination-item-link]:border-border/40
            [&_.ant-pagination-disabled_.ant-pagination-item-link]:!bg-muted/50
            [&_.ant-pagination-options]:hidden
          "
          pagination={{
            total,
            pageSize: 20,
            current: currentPage,
            onChange: (page) => {
              setCurrentPage(page);
              setEditingKey("");
            },
            className: "!mt-0 !mb-0 !px-4 !py-3",
            showTotal: (total) => (
              <span className="text-sm text-muted-foreground">
                {t("users.total")} {total} {t("users.totalRecords")}
              </span>
            ),
            size: "small",
          }}
          scroll={{ x: 300 }}
          onChange={(pagination, filters, sorter) => {
            if (Array.isArray(sorter)) return;

            setSortInfo({
              field: sorter.columnKey as string,
              order: sorter.order || null,
            });
          }}
        />
      </div>

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

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] sm:max-w-[360px] p-4 sm:p-6 gap-4 rounded-lg shadow-lg">
          <AlertDialogHeader className="gap-2">
            <AlertDialogTitle className="text-base font-semibold">
              {t("users.deleteConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {t("users.deleteConfirm.description", {
                name: userToDelete?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:gap-3">
            <AlertDialogCancel className="m-0 flex-1 text-sm h-9">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="m-0 flex-1 h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
