"use client";

import { Table, Button } from "antd";
import { useTranslation } from "react-i18next";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "@/lib/dayjs";
import { formatNumber } from "@/lib/utils";

interface UserSummary {
  nickname: string;
  total_calls: number;
  total_tokens: number;
  total_cost: number;
}

interface UserSummaryTableProps {
  loading: boolean;
  users: UserSummary[];
  dateRange: [Date, Date];
}

const escapeCSV = (val: string | number) => {
  const s = String(val);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const MobileCard = ({
  record,
  t,
}: {
  record: UserSummary;
  t: (key: string) => string;
}) => {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100/80 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200/80">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1 min-w-0 pr-3">
          <div className="font-medium text-gray-900 break-all">
            {record.nickname}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            {t("panel.userSummary.columns.calls")}:{" "}
            {record.total_calls.toLocaleString()}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-medium text-primary">
            {t("common.currency")}
            {Number(record.total_cost).toFixed(4)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-gray-50/70 rounded-lg p-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1.5">
            {t("panel.userSummary.columns.tokens")}
          </div>
          <div className="text-sm text-gray-700 font-medium tabular-nums">
            {formatNumber(record.total_tokens)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UserSummaryTable({
  loading,
  users,
  dateRange,
}: UserSummaryTableProps) {
  const { t } = useTranslation("common");

  const handleExportCSV = () => {
    const headers = [
      t("panel.userSummary.columns.user"),
      t("panel.userSummary.columns.calls"),
      t("panel.userSummary.columns.tokens"),
      t("panel.userSummary.columns.cost"),
    ];

    const lines: string[] = [headers.map(escapeCSV).join(",")];

    for (const u of users) {
      lines.push(
        [
          escapeCSV(u.nickname),
          escapeCSV(u.total_calls),
          escapeCSV(u.total_tokens),
          escapeCSV(Number(u.total_cost).toFixed(4)),
        ].join(",")
      );
    }

    const csv = lines.join("\r\n");

    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const start = dayjs(dateRange[0]).format("YYYY-MM-DD");
    const end = dayjs(dateRange[1]).format("YYYY-MM-DD");
    const filename =
      start === end
        ? `user-usage-${start}.csv`
        : `user-usage-${start}_to_${end}.csv`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: t("panel.userSummary.columns.user"),
      dataIndex: "nickname",
      key: "nickname",
      width: 200,
      sorter: (a: UserSummary, b: UserSummary) =>
        a.nickname.localeCompare(b.nickname),
      render: (nickname: string) => (
        <span className="font-medium break-all">{nickname}</span>
      ),
    },
    {
      title: t("panel.userSummary.columns.calls"),
      dataIndex: "total_calls",
      key: "total_calls",
      width: 110,
      sorter: (a: UserSummary, b: UserSummary) => a.total_calls - b.total_calls,
      render: (calls: number) => calls.toLocaleString(),
    },
    {
      title: t("panel.userSummary.columns.tokens"),
      dataIndex: "total_tokens",
      key: "total_tokens",
      width: 130,
      sorter: (a: UserSummary, b: UserSummary) =>
        a.total_tokens - b.total_tokens,
      render: (tokens: number) => formatNumber(tokens),
    },
    {
      title: t("panel.userSummary.columns.cost"),
      dataIndex: "total_cost",
      key: "total_cost",
      width: 130,
      sorter: (a: UserSummary, b: UserSummary) => a.total_cost - b.total_cost,
      defaultSortOrder: "descend" as const,
      render: (cost: number) =>
        `${t("common.currency")}${Number(cost).toFixed(4)}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExportCSV}
          disabled={loading || users.length === 0}
        >
          {t("panel.userSummary.exportCsv")}
        </Button>
      </div>

      <div className="hidden sm:block">
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={false}
          rowKey="nickname"
          scroll={{ x: 600 }}
          className="bg-background rounded-md border [&_.ant-table-thead]:bg-muted [&_.ant-table-thead>tr>th]:bg-transparent [&_.ant-table-thead>tr>th]:text-muted-foreground [&_.ant-table-tbody>tr>td]:border-muted [&_.ant-table-tbody>tr:last-child>td]:border-b-0 [&_.ant-table-tbody>tr:hover>td]:bg-muted/50"
        />
      </div>

      <div className="sm:hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary animate-spin rounded-full" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            {t("panel.userSummary.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <MobileCard key={u.nickname} record={u} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
