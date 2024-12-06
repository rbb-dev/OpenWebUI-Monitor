"use client";

import { Table, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import type { FilterValue } from "antd/es/table/interface";
import { DownloadOutlined } from "@ant-design/icons";
import { Button as ShadcnButton } from "@/components/ui/button";

interface ModelUsage {
  model_name: string;
  total_cost: number;
  total_count: number;
}

interface UserUsage {
  nickname: string;
  total_cost: number;
  total_count: number;
}

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

interface TableParams {
  pagination: TablePaginationConfig;
  sortField?: string;
  sortOrder?: "ascend" | "descend" | undefined;
  filters?: Record<string, FilterValue | null>;
}

interface UsageRecordsTableProps {
  loading: boolean;
  records: UsageRecord[];
  tableParams: TableParams;
  models: ModelUsage[];
  users: UserUsage[];
  onTableChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<UsageRecord> | SorterResult<UsageRecord>[]
  ) => void;
}

export default function UsageRecordsTable({
  loading,
  records,
  tableParams,
  models,
  users,
  onTableChange,
}: UsageRecordsTableProps) {
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

  const columns: ColumnsType<UsageRecord> = [
    {
      title: "用户",
      dataIndex: "nickname",
      key: "nickname",
      filters: users.map((user) => ({
        text: user.nickname,
        value: user.nickname,
      })),
      filterMode: "tree",
      filterSearch: true,
      filteredValue: tableParams.filters?.nickname || null,
      className: "font-medium",
    },
    {
      title: "使用时间",
      dataIndex: "use_time",
      key: "use_time",
      render: (text) => (
        <span className="font-mono text-gray-600">
          {new Date(text).toLocaleString()}
        </span>
      ),
      sorter: true,
    },
    {
      title: "模型",
      dataIndex: "model_name",
      key: "model_name",
      filters: models.map((model) => ({
        text: model.model_name,
        value: model.model_name,
      })),
      filterMode: "tree",
      filterSearch: true,
      filteredValue: tableParams.filters?.model_name || null,
      className: "font-medium",
    },
    {
      title: "输入tokens",
      dataIndex: "input_tokens",
      key: "input_tokens",
      align: "right",
      sorter: true,
      render: (value) => (
        <span className="font-mono text-gray-600">
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "输出tokens",
      dataIndex: "output_tokens",
      key: "output_tokens",
      align: "right",
      sorter: true,
      render: (value) => (
        <span className="font-mono text-gray-600">
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "消耗",
      dataIndex: "cost",
      key: "cost",
      align: "right",
      render: (value) => (
        <span className="font-mono font-medium text-blue-600">
          ¥{Number(value).toFixed(4)}
        </span>
      ),
      sorter: true,
    },
    {
      title: "余额",
      dataIndex: "balance_after",
      key: "balance_after",
      align: "right",
      render: (value) => (
        <span className="font-mono font-medium text-emerald-600">
          ¥{Number(value).toFixed(4)}
        </span>
      ),
      sorter: true,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">详细记录</h2>

        <ShadcnButton
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="flex items-center gap-2"
        >
          <DownloadOutlined />
          导出记录
        </ShadcnButton>
      </div>

      <div className="rounded-lg border">
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          pagination={{
            ...tableParams.pagination,
            className: "!mb-0 px-4 py-4",
          }}
          onChange={onTableChange}
          loading={loading}
          size="middle"
          className="[&_.ant-table]:!border-b-0 
            [&_.ant-table-container]:!rounded-lg 
            [&_.ant-table-cell]:!border-border
            [&_.ant-table-thead_.ant-table-cell]:!bg-muted/50
            [&_.ant-table-thead_.ant-table-cell]:!text-muted-foreground
            [&_.ant-table-row:hover>*]:!bg-muted/50
            [&_.ant-table-tbody_.ant-table-row]:!cursor-pointer"
          scroll={{ x: true }}
        />
      </div>
    </div>
  );
}
