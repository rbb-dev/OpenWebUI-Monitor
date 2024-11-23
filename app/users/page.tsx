"use client";

import { useState, useEffect } from "react";
import { Table, Input, message, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";

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
      title: "用户信息",
      key: "userInfo",
      width: 100,
      render: (_, record) => (
        <div
          className="flex flex-col cursor-pointer"
          onClick={() => setSelectedUser(record)}
        >
          <div className="font-medium">{record.name}</div>
          <div className="hidden sm:block text-xs text-gray-500 truncate">
            {record.email}
          </div>
          <div className="hidden sm:block text-xs text-gray-400 truncate">
            ID: {record.id}
          </div>
        </div>
      ),
    },
    {
      title: "余额",
      dataIndex: "balance",
      key: "balance",
      width: 100,
      sorter: (a, b) => a.balance - b.balance,
      sortDirections: ["descend", "ascend", "descend"],
      render: (balance: number, record) => {
        const isEditing = record.id === editingKey;
        return isEditing ? (
          <Input
            defaultValue={Number(balance).toFixed(2)}
            className="w-28 sm:w-36"
            onPressEnter={(e: React.KeyboardEvent<HTMLInputElement>) => {
              const value = e.currentTarget.value;
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                handleUpdateBalance(record.id, numValue);
              } else {
                message.error("请输入有效的数字");
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
      title: "角色",
      dataIndex: "role",
      key: "role",
      width: 100,
      render: (role) => (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
          {role}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="pt-16 flex flex-col gap-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            用户管理
          </h1>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={users.map((user) => ({
          ...user,
          balance: Number(user.balance),
        }))}
        rowKey="id"
        loading={loading}
        size="middle"
        className="bg-white rounded-lg shadow-sm [&_.ant-table]:!border-b-0 
          [&_.ant-table-container]:!rounded-lg [&_.ant-table-container]:!border-hidden
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
            <span className="text-gray-500">共 {total} 条记录</span>
          ),
          size: "small",
        }}
        scroll={{ x: 520 }}
      />

      <Modal
        title="用户详细信息"
        open={!!selectedUser}
        onCancel={() => setSelectedUser(null)}
        footer={null}
      >
        {selectedUser && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-gray-500 text-sm">昵称</div>
              <div className="font-medium">{selectedUser.name}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">邮箱</div>
              <div className="break-all">{selectedUser.email}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">用户 ID</div>
              <div className="font-mono text-sm break-all">
                {selectedUser.id}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">角色</div>
              <div>
                <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
                  {selectedUser.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
