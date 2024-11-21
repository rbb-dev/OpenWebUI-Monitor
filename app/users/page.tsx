"use client";

import { useState, useEffect } from "react";
import { Table, Input, message } from "antd";
import type { ColumnsType } from "antd/es/table";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingKey, setEditingKey] = useState<string>("");

  const fetchUsers = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?page=${page}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "获取用户列表失败");
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

      message.success("余额更新成功");
      setEditingKey("");
      fetchUsers(currentPage);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "更新余额失败");
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: "用户ID",
      dataIndex: "id",
      key: "id",
      width: 220,
      ellipsis: true,
    },
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "余额",
      dataIndex: "balance",
      key: "balance",
      width: 200,
      render: (balance: number, record) => {
        const isEditing = record.id === editingKey;
        return isEditing ? (
          <Input
            defaultValue={Number(balance).toFixed(2)}
            style={{ width: "150px" }}
            onPressEnter={(e: React.KeyboardEvent<HTMLInputElement>) => {
              const value = e.currentTarget.value;
              const numValue = Number(value);
              if (!isNaN(numValue) && numValue >= 0) {
                handleUpdateBalance(record.id, numValue);
              } else {
                message.error("请输入有效的正数");
                setEditingKey("");
              }
            }}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              const value = e.currentTarget.value;
              const numValue = Number(value);
              if (
                value &&
                !isNaN(numValue) &&
                numValue >= 0 &&
                numValue !== balance
              ) {
                handleUpdateBalance(record.id, numValue);
              } else {
                setEditingKey("");
              }
            }}
            autoFocus
          />
        ) : (
          <div
            style={{ cursor: "pointer" }}
            onClick={() => setEditingKey(record.id)}
          >
            ￥{Number(balance).toFixed(2)}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">用户管理</h1>
      <Table
        columns={columns}
        dataSource={users.map((user) => ({
          ...user,
          balance: Number(user.balance),
        }))}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          pageSize: 20,
          current: currentPage,
          onChange: (page) => {
            setCurrentPage(page);
            setEditingKey("");
          },
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
}
