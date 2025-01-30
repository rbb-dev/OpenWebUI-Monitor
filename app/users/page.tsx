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

const TABLE_STYLES = `
  [&_.ant-table]:!border-b-0 
  [&_.ant-table-container]:!rounded-xl 
  [&_.ant-table-container]:!border-hidden
  [&_.ant-table-cell]:!border-border/40
  [&_.ant-table-thead_.ant-table-cell]:!bg-muted/30
  [&_.ant-table-thead_.ant-table-cell]:!text-muted-foreground
  [&_.ant-table-thead_.ant-table-cell]:!font-medium
  [&_.ant-table-thead_.ant-table-cell]:!text-sm
  [&_.ant-table-thead]:!border-b
  [&_.ant-table-thead]:border-border/40
  [&_.ant-table-row]:!transition-colors
  [&_.ant-table-row:hover>*]:!bg-muted/60
  [&_.ant-table-tbody_.ant-table-row]:!cursor-pointer
  [&_.ant-table-tbody_.ant-table-cell]:!py-4
  [&_.ant-table-row:last-child>td]:!border-b-0
  [&_.ant-table-cell:first-child]:!pl-6
  [&_.ant-table-cell:last-child]:!pr-6
  [&_.ant-pagination]:!px-6
  [&_.ant-pagination]:!py-4
  [&_.ant-pagination]:!border-t
  [&_.ant-pagination]:border-border/40
  [&_.ant-pagination-item]:!rounded-lg
  [&_.ant-pagination-item]:!border-border/40
  [&_.ant-pagination-item-active]:!bg-primary/10
  [&_.ant-pagination-item-active]:!border-primary/30
  [&_.ant-pagination-item-active>a]:!text-primary
  [&_.ant-pagination-prev_.ant-pagination-item-link]:!rounded-lg
  [&_.ant-pagination-next_.ant-pagination-item-link]:!rounded-lg
  [&_.ant-pagination-prev_.ant-pagination-item-link]:!border-border/40
  [&_.ant-pagination-next_.ant-pagination-item-link]:!border-border/40
`;

export default function UsersPage() {
  const { t } = useTranslation("common");
  const [users, setUsers] = useState<User[]>([]);
  const [blacklistUsers, setBlacklistUsers] = useState<User[]>([]);
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
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [blacklistCurrentPage, setBlacklistCurrentPage] = useState(1);
  const [blacklistTotal, setBlacklistTotal] = useState(0);

  const fetchUsers = async (page: number, isBlacklist: boolean = false) => {
    setLoading(true);
    try {
      let url = `/api/users?page=${page}&deleted=${isBlacklist}`;
      if (sortInfo.field && sortInfo.order) {
        url += `&sortField=${sortInfo.field}&sortOrder=${sortInfo.order}`;
      }
      if (searchText) {
        url += `&search=${encodeURIComponent(searchText)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (isBlacklist) {
        setBlacklistUsers(data.users);
        setBlacklistTotal(data.total);
      } else {
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
      message.error(t("users.message.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchBlacklistTotal = async () => {
    try {
      const res = await fetch(`/api/users?page=1&deleted=true&pageSize=1`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBlacklistTotal(data.total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, false);
    fetchBlacklistTotal();
  }, [currentPage, sortInfo, searchText]);

  useEffect(() => {
    if (showBlacklist) {
      fetchUsers(blacklistCurrentPage, true);
    }
  }, [blacklistCurrentPage, showBlacklist, sortInfo, searchText]);

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
      fetchUsers(currentPage, false);
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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deleted: !userToDelete.deleted,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      if (!userToDelete.deleted) {
        const newTotal = total - 1;
        const maxPage = Math.ceil(newTotal / 20);
        if (currentPage > maxPage && maxPage > 0) {
          setCurrentPage(maxPage);
        } else {
          fetchUsers(currentPage, false);
        }
        setBlacklistTotal((prev) => prev + 1);
      } else {
        const newBlacklistTotal = blacklistTotal - 1;
        const maxBlacklistPage = Math.ceil(newBlacklistTotal / 20);
        if (blacklistCurrentPage > maxBlacklistPage && maxBlacklistPage > 0) {
          setBlacklistCurrentPage(maxBlacklistPage);
        } else {
          fetchUsers(blacklistCurrentPage, true);
        }
        setBlacklistTotal((prev) => prev - 1);
      }

      if (userToDelete.deleted) {
        fetchUsers(currentPage, false);
      } else if (showBlacklist) {
        fetchUsers(blacklistCurrentPage, true);
      }

      message.success(
        userToDelete.deleted
          ? t("users.message.unblockSuccess")
          : t("users.message.blockSuccess")
      );
    } catch (err) {
      console.error(err);
      message.error(
        userToDelete.deleted
          ? t("users.message.unblockError")
          : t("users.message.blockError")
      );
    } finally {
      setUserToDelete(null);
    }
  };

  const getColumns = (isBlacklist: boolean = false): ColumnsType<User> => {
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
            {isBlacklist ? (
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            )}
          </button>
        ),
      },
    ];

    return baseColumns;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("users.title")}
        </h1>
        <p className="text-muted-foreground">{t("users.description")}</p>
      </div>

      <div className="relative w-full sm:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground/70" />
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
            bg-card
            border-border/40
            hover:border-border/60
            focus:border-primary/30
            focus:ring-2
            focus:ring-primary/20
            transition-all
            duration-200
            rounded-lg
            shadow-sm
            hover:shadow
            focus:shadow-md
            placeholder:text-muted-foreground/60
          "
          allowClear={{
            clearIcon: (
              <button className="p-1 hover:bg-muted/60 rounded-full transition-colors">
                <svg
                  className="h-3 w-3 text-muted-foreground/70"
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

      <div className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
        <Table
          columns={getColumns()}
          dataSource={users
            .filter((user) => !user.deleted)
            .map((user) => ({
              key: user.id,
              ...user,
              balance: Number(user.balance),
            }))}
          rowKey="id"
          loading={loading}
          className={TABLE_STYLES}
          pagination={{
            total,
            pageSize: 20,
            current: currentPage,
            onChange: (page) => {
              setCurrentPage(page);
              setEditingKey("");
            },
            showTotal: (total) => (
              <span className="text-sm text-muted-foreground">
                {t("users.total")} {total} {t("users.totalRecords")}
              </span>
            ),
          }}
          scroll={{ x: 500 }}
          onChange={(pagination, filters, sorter) => {
            if (Array.isArray(sorter)) return;
            setSortInfo({
              field: sorter.columnKey as string,
              order: sorter.order || null,
            });
          }}
        />
      </div>

      <div className="space-y-4">
        <button
          onClick={() => setShowBlacklist(!showBlacklist)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${
              showBlacklist ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          {t("users.blacklist.title")} ({blacklistTotal})
        </button>

        {showBlacklist && (
          <div className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
            <Table
              columns={getColumns(true)}
              dataSource={blacklistUsers.map((user) => ({
                key: user.id,
                ...user,
                balance: Number(user.balance),
              }))}
              rowKey="id"
              className={TABLE_STYLES}
              pagination={{
                total: blacklistTotal,
                pageSize: 20,
                current: blacklistCurrentPage,
                onChange: (page) => {
                  setBlacklistCurrentPage(page);
                  setEditingKey("");
                },
                showTotal: (total) => (
                  <span className="text-sm text-muted-foreground">
                    {t("users.total")} {total} {t("users.totalRecords")}
                  </span>
                ),
              }}
            />
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent
          className="
          sm:max-w-[425px]
          rounded-xl
          border-border/40
          shadow-lg
          p-6
          gap-6
        "
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {t("users.userDetails")}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-6">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground/80">
                  {t("users.nickname")}
                </div>
                <div className="font-medium">{selectedUser.name}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground/80">
                  {t("users.email")}
                </div>
                <div className="break-all">{selectedUser.email}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground/80">
                  {t("users.id")}
                </div>
                <div className="font-mono text-sm break-all">
                  {selectedUser.id}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground/80">
                  {t("users.role")}
                </div>
                <div>
                  <span
                    className="
                    inline-flex
                    items-center
                    rounded-full
                    px-2.5
                    py-0.5
                    text-xs
                    font-medium
                    bg-primary/10
                    text-primary
                  "
                  >
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
        <AlertDialogContent className="sm:max-w-[360px] rounded-xl border-border/40 shadow-lg p-6 gap-6">
          <AlertDialogHeader className="gap-2">
            <AlertDialogTitle className="text-lg font-semibold tracking-tight">
              {userToDelete?.deleted
                ? t("users.blacklist.unblockConfirm.title")
                : t("users.blacklist.blockConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {userToDelete?.deleted
                ? t("users.blacklist.unblockConfirm.description", {
                    name: userToDelete?.name,
                  })
                : t("users.blacklist.blockConfirm.description", {
                    name: userToDelete?.name,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 h-10 rounded-lg border-border/40 hover:bg-muted/60 transition-colors">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className={`
                flex-1
                h-10
                rounded-lg
                transition-colors
                ${
                  userToDelete?.deleted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                }
              `}
            >
              {userToDelete?.deleted
                ? t("users.blacklist.unblock")
                : t("users.blacklist.block")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
