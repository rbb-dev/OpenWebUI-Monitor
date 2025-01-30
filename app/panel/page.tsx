"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import dayjs from "dayjs";
import type { TablePaginationConfig } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import type { FilterValue } from "antd/es/table/interface";
import { message } from "antd";
import TimeRangeSelector, {
  TimeRangeType,
} from "@/components/panel/TimeRangeSelector";
import ModelDistributionChart from "@/components/panel/ModelDistributionChart";
import UserRankingChart from "@/components/panel/UserRankingChart";
import UsageRecordsTable from "@/components/panel/UsageRecordsTable";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";
import { Card } from "@/components/ui/card";
import {
  BarChartOutlined,
  PieChartOutlined,
  TableOutlined,
} from "@ant-design/icons";

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

interface UsageData {
  models: ModelUsage[];
  users: UserUsage[];
  timeRange: {
    minTime: string;
    maxTime: string;
  };
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

export default function PanelPage() {
  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData>({
    models: [],
    users: [],
    timeRange: {
      minTime: "",
      maxTime: "",
    },
  });
  const [pieMetric, setPieMetric] = useState<"cost" | "count">("cost");
  const [barMetric, setBarMetric] = useState<"cost" | "count">("cost");
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 100]);
  const [availableTimeRange, setAvailableTimeRange] = useState<{
    minTime: Date;
    maxTime: Date;
  }>({
    minTime: new Date(),
    maxTime: new Date(),
  });
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {
      nickname: null,
      model_name: null,
    },
  });
  const [timeRangeType, setTimeRangeType] = useState<TimeRangeType>("all");

  const fetchUsageData = async (newTimeRange?: [number, number]) => {
    setLoading(true);
    try {
      const currentRange = newTimeRange || timeRange;
      const isFullRange = currentRange[0] === 0 && currentRange[1] === 100;

      let url = `/api/v1/panel/usage?t=${Date.now()}`;

      if (!isFullRange) {
        const totalHours = dayjs(availableTimeRange.maxTime).diff(
          availableTimeRange.minTime,
          "hour"
        );

        const startTime = dayjs(availableTimeRange.minTime)
          .add((currentRange[0] * totalHours) / 100, "hour")
          .startOf("hour")
          .toISOString();

        const endTime = dayjs(availableTimeRange.minTime)
          .add((currentRange[1] * totalHours) / 100, "hour")
          .endOf("hour")
          .toISOString();

        url += `&startTime=${startTime}&endTime=${endTime}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setUsageData(data);

      if (isFullRange) {
        setAvailableTimeRange({
          minTime: new Date(data.timeRange.minTime),
          maxTime: new Date(data.timeRange.maxTime),
        });
      }
    } catch (error) {
      console.error(t("error.panel.fetchUsageDataFail"), error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (params: TableParams) => {
    setTableLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.append("page", params.pagination.current?.toString() || "1");
      searchParams.append(
        "pageSize",
        params.pagination.pageSize?.toString() || "10"
      );

      if (params.sortField) {
        searchParams.append("sortField", params.sortField);
        searchParams.append("sortOrder", params.sortOrder || "ascend");
      }

      if (params.filters?.nickname && params.filters.nickname.length > 0) {
        searchParams.append("users", params.filters.nickname.join(","));
      }
      if (params.filters?.model_name && params.filters.model_name.length > 0) {
        searchParams.append("models", params.filters.model_name.join(","));
      }

      const response = await fetch(
        `/api/v1/panel/records?${searchParams.toString()}`
      );
      const data = await response.json();

      setRecords(data.records);
      setTableParams({
        ...params,
        pagination: {
          ...params.pagination,
          total: data.total,
        },
      });
    } catch (error) {
      message.error(t("error.panel.fetchUsageDataFail"));
    } finally {
      setTableLoading(false);
    }
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<UsageRecord> | SorterResult<UsageRecord>[]
  ) => {
    const processedFilters = Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [
        key,
        Array.isArray(value) && value.length === 0 ? null : value,
      ])
    );

    const newParams: TableParams = {
      pagination,
      filters: processedFilters,
      sortField: Array.isArray(sorter) ? undefined : sorter.field?.toString(),
      sortOrder: Array.isArray(sorter)
        ? undefined
        : (sorter.order as "ascend" | "descend" | undefined),
    };
    setTableParams(newParams);
    fetchRecords(newParams);
  };

  useEffect(() => {
    fetchUsageData();
    fetchRecords(tableParams);
  }, []);

  const handleTimeRangeChange = (
    range: [number, number],
    type: TimeRangeType
  ) => {
    setTimeRange(range);
    setTimeRangeType(type);
    fetchUsageData(range);
  };

  return (
    <>
      <Head>
        <title>{t("panel.header")}</title>
      </Head>

      <Toaster
        richColors
        position="top-center"
        theme="light"
        expand
        duration={1500}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("panel.title")}
          </h1>
          <p className="text-muted-foreground">{t("panel.description")}</p>
        </div>

        <Card className="p-6">
          <TimeRangeSelector
            timeRange={timeRange}
            timeRangeType={timeRangeType}
            availableTimeRange={availableTimeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PieChartOutlined className="text-xl text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t("panel.modelUsage.title")}
                  </h3>
                  <p className="text-2xl font-semibold">
                    {loading ? "-" : usageData.models.length}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <PieChartOutlined className="text-primary" />
                  {t("panel.modelUsage.title")}
                </h2>
              </div>
              <ModelDistributionChart
                loading={loading}
                models={usageData.models}
                metric={pieMetric}
                onMetricChange={setPieMetric}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <BarChartOutlined className="text-primary" />
                  {t("panel.userUsageChart.title")}
                </h2>
              </div>
              <UserRankingChart
                loading={loading}
                users={usageData.users}
                metric={barMetric}
                onMetricChange={setBarMetric}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <TableOutlined className="text-primary" />
                  {t("panel.usageDetails.title")}
                </h2>
              </div>
              <UsageRecordsTable
                loading={tableLoading}
                records={records}
                tableParams={tableParams}
                models={usageData.models}
                users={usageData.users}
                onTableChange={handleTableChange}
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
