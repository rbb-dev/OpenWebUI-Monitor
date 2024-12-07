"use client";

import { useState } from "react";
import { Table, TablePaginationConfig, Select } from "antd";
import type { FilterValue } from "antd/es/table/interface";
import type { SorterResult } from "antd/es/table/interface";
import dayjs from "dayjs";

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
  sortOrder?: string;
  filters?: Record<string, FilterValue | null>;
}

interface Props {
  loading: boolean;
  records: UsageRecord[];
  tableParams: TableParams;
  models: { model_name: string }[];
  users: { nickname: string }[];
  onTableChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<UsageRecord> | SorterResult<UsageRecord>[]
  ) => void;
}

const MobileCard = ({ record }: { record: UsageRecord }) => {
  return (
    <div className="p-4 bg-card text-card-foreground rounded-lg border shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-medium">{record.nickname}</div>
          <div className="text-xs text-muted-foreground">
            {dayjs(record.use_time).format("YYYY-MM-DD HH:mm:ss")}
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium text-blue-600">
            ¥{Number(record.cost).toFixed(4)}
          </div>
          <div className="text-xs text-muted-foreground">
            余额: ¥{Number(record.balance_after).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">模型</div>
          <div className="text-sm truncate">{record.model_name}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Token</div>
          <div className="text-sm text-left">
            {(record.input_tokens + record.output_tokens).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UsageRecordsTable({
  loading,
  records,
  tableParams,
  models,
  users,
  onTableChange,
}: Props) {
  const [filters, setFilters] = useState<Record<string, FilterValue | null>>(
    tableParams.filters || {}
  );

  const handleFilterChange = (field: string, value: string[] | null) => {
    const newFilters = {
      ...filters,
      [field]: value,
    };
    setFilters(newFilters);
    onTableChange(tableParams.pagination, newFilters, {});
  };

  const columns = [
    {
      title: "用户",
      dataIndex: "nickname",
      key: "nickname",
      width: 120,
      filters: users.map((user) => ({
        text: user.nickname,
        value: user.nickname,
      })),
      filterMode: "menu" as const,
      filtered: filters.nickname ? filters.nickname.length > 0 : false,
      filteredValue: filters.nickname || null,
    },
    {
      title: "时间",
      dataIndex: "use_time",
      key: "use_time",
      width: 180,
      sorter: true,
      render: (time: string) => dayjs(time).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "模型",
      dataIndex: "model_name",
      key: "model_name",
      width: 150,
      filters: models.map((model) => ({
        text: model.model_name,
        value: model.model_name,
      })),
      filterMode: "menu" as const,
      filtered: filters.model_name ? filters.model_name.length > 0 : false,
      filteredValue: filters.model_name || null,
    },
    {
      title: "Token 用量",
      key: "tokens",
      width: 120,
      sorter: true,
      render: (_: unknown, record: UsageRecord) =>
        (record.input_tokens + record.output_tokens).toLocaleString(),
    },
    {
      title: "费用",
      dataIndex: "cost",
      key: "cost",
      width: 100,
      sorter: true,
      render: (_: unknown, record: UsageRecord) =>
        `¥${Number(record.cost).toFixed(4)}`,
    },
    {
      title: "余额",
      dataIndex: "balance_after",
      key: "balance_after",
      width: 100,
      sorter: true,
      render: (_: unknown, record: UsageRecord) =>
        `¥${Number(record.balance_after).toFixed(2)}`,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">使用详情</h2>

      {/* 移动设备筛选器 */}
      <div className="sm:hidden space-y-3">
        <Select
          mode="multiple"
          placeholder="选择用户"
          className="w-full"
          value={filters.nickname as string[]}
          onChange={(value) => handleFilterChange("nickname", value)}
          options={users.map((user) => ({
            label: user.nickname,
            value: user.nickname,
          }))}
          maxTagCount="responsive"
        />
        <Select
          mode="multiple"
          placeholder="选择模型"
          className="w-full"
          value={filters.model_name as string[]}
          onChange={(value) => handleFilterChange("model_name", value)}
          options={models.map((model) => ({
            label: model.model_name,
            value: model.model_name,
          }))}
          maxTagCount="responsive"
        />
      </div>

      {/* 桌面设备表格 */}
      <div className="hidden sm:block">
        <Table
          columns={columns}
          dataSource={records}
          loading={loading}
          onChange={onTableChange}
          pagination={tableParams.pagination}
          rowKey="id"
          scroll={{ x: 800 }}
          className="bg-card text-card-foreground rounded-lg shadow-sm"
        />
      </div>

      {/* 移动设备卡片列表 */}
      <div className="sm:hidden space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary animate-spin rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {records.map((record) => (
                <MobileCard key={record.id} record={record} />
              ))}
            </div>
            <Table
              dataSource={[]}
              loading={loading}
              onChange={onTableChange}
              pagination={tableParams.pagination}
              className="[&_.ant-pagination]:!mt-0 [&_.ant-table]:hidden"
            />
          </>
        )}
      </div>
    </div>
  );
}
