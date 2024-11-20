"use client";

import { useState, useEffect } from "react";
import { Button, Table, Input, Modal, message } from "antd";
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState("");

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

  const handleUpdateBalance = async () => {
    if (!selectedUser || !newBalance) return;

    try {
      const res = await fetch(`/api/users/${selectedUser.id}/balance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: parseFloat(newBalance) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      message.success("余额更新成功");
      setIsModalVisible(false);
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
      render: (balance: number | string) => `￥${Number(balance).toFixed(6)}`,
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button
          onClick={() => {
            setSelectedUser({
              ...record,
              balance: Number(record.balance),
            });
            setNewBalance(Number(record.balance).toString());
            setIsModalVisible(true);
          }}
        >
          编辑余额
        </Button>
      ),
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
          onChange: setCurrentPage,
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="编辑用户余额"
        open={isModalVisible}
        onOk={handleUpdateBalance}
        onCancel={() => setIsModalVisible(false)}
      >
        <div className="mb-4">
          <p>
            用户: {selectedUser?.name} ({selectedUser?.email})
          </p>
          <p>当前余额: ￥{selectedUser?.balance.toFixed(6)}</p>
        </div>
        <Input
          type="number"
          step="0.000001"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
          placeholder="输入新余额"
        />
      </Modal>
    </div>
  );
}
