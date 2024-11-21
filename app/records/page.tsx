"use client";

import { useState, useEffect } from "react";
import { Table, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined } from "@ant-design/icons";

interface UsageRecord {
  id: number;
  nickname: string;
  use_time: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  balance_after: number;
}

export default function RecordsPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const columns: ColumnsType<UsageRecord> = [
    {
      title: "用户",
      dataIndex: "nickname",
      key: "nickname",
    },
    {
      title: "使用时间",
      dataIndex: "use_time",
      key: "use_time",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "模型",
      dataIndex: "model_name",
      key: "model_name",
    },
    {
      title: "输入tokens",
      dataIndex: "input_tokens",
      key: "input_tokens",
      align: "right",
    },
    {
      title: "输出tokens",
      dataIndex: "output_tokens",
      key: "output_tokens",
      align: "right",
    },
    {
      title: "消耗金额",
      dataIndex: "cost",
      key: "cost",
      align: "right",
      render: (value) => `¥${Number(value).toFixed(4)}`,
    },
    {
      title: "剩余余额",
      dataIndex: "balance_after",
      key: "balance_after",
      align: "right",
      render: (value) => `¥${Number(value).toFixed(4)}`,
    },
  ];

  const fetchRecords = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/panel/records?page=${page}&pageSize=${pageSize}`
      );
      const data = await response.json();
      setRecords(data.records);
      setPagination({
        current: page,
        pageSize,
        total: data.total,
      });
    } catch (error) {
      message.error("获取记录失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchRecords(pagination.current, pagination.pageSize);
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/v1/panel/records/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `usage_records_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      message.error("导出失败");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">使用记录</h1>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
        >
          导出记录
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        loading={loading}
      />
    </div>
  );
}
