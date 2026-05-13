"use client";

import { Table } from "antd";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/utils";

interface DomainUsage {
  domain: string;
  total_cost: number;
  total_calls: number;
  total_tokens: number;
  user_count: number;
}

interface DomainUsageTableProps {
  loading: boolean;
  domains: DomainUsage[];
}

const MobileCard = ({
  record,
  t,
}: {
  record: DomainUsage;
  t: (key: string) => string;
}) => {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100/80 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200/80">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1 min-w-0 pr-3">
          <div className="font-medium text-gray-900 break-all">
            {record.domain}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            {t("panel.domainUsage.columns.users")}:{" "}
            {record.user_count.toLocaleString()}
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
            {t("panel.domainUsage.columns.calls")}
          </div>
          <div className="text-sm text-gray-700 font-medium tabular-nums">
            {record.total_calls.toLocaleString()}
          </div>
        </div>
        <div className="shrink-0">
          <div className="text-xs text-gray-500 mb-1.5">
            {t("panel.domainUsage.columns.tokens")}
          </div>
          <div className="text-sm text-gray-700 font-medium tabular-nums">
            {formatNumber(record.total_tokens)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DomainUsageTable({
  loading,
  domains,
}: DomainUsageTableProps) {
  const { t } = useTranslation("common");

  const columns = [
    {
      title: t("panel.domainUsage.columns.domain"),
      dataIndex: "domain",
      key: "domain",
      width: 220,
      sorter: (a: DomainUsage, b: DomainUsage) =>
        a.domain.localeCompare(b.domain),
      render: (domain: string) => (
        <span className="font-medium break-all">{domain}</span>
      ),
    },
    {
      title: t("panel.domainUsage.columns.cost"),
      dataIndex: "total_cost",
      key: "total_cost",
      width: 130,
      sorter: (a: DomainUsage, b: DomainUsage) => a.total_cost - b.total_cost,
      defaultSortOrder: "descend" as const,
      render: (cost: number) =>
        `${t("common.currency")}${Number(cost).toFixed(4)}`,
    },
    {
      title: t("panel.domainUsage.columns.calls"),
      dataIndex: "total_calls",
      key: "total_calls",
      width: 110,
      sorter: (a: DomainUsage, b: DomainUsage) => a.total_calls - b.total_calls,
      render: (calls: number) => calls.toLocaleString(),
    },
    {
      title: t("panel.domainUsage.columns.tokens"),
      dataIndex: "total_tokens",
      key: "total_tokens",
      width: 130,
      sorter: (a: DomainUsage, b: DomainUsage) =>
        a.total_tokens - b.total_tokens,
      render: (tokens: number) => formatNumber(tokens),
    },
    {
      title: t("panel.domainUsage.columns.users"),
      dataIndex: "user_count",
      key: "user_count",
      width: 90,
      sorter: (a: DomainUsage, b: DomainUsage) => a.user_count - b.user_count,
      render: (users: number) => users.toLocaleString(),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="hidden sm:block">
        <Table
          columns={columns}
          dataSource={domains}
          loading={loading}
          pagination={false}
          rowKey="domain"
          scroll={{ x: 700 }}
          className="bg-background rounded-md border [&_.ant-table-thead]:bg-muted [&_.ant-table-thead>tr>th]:bg-transparent [&_.ant-table-thead>tr>th]:text-muted-foreground [&_.ant-table-tbody>tr>td]:border-muted [&_.ant-table-tbody>tr:last-child>td]:border-b-0 [&_.ant-table-tbody>tr:hover>td]:bg-muted/50"
        />
      </div>

      <div className="sm:hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary animate-spin rounded-full" />
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            {t("panel.domainUsage.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((d) => (
              <MobileCard key={d.domain} record={d} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
