"use client";

import { useState, useEffect, useRef } from "react";
import {
  Radio,
  Button,
  Spin,
  Slider,
  Space,
  Card,
  Table,
  message,
  DatePicker,
  Select,
} from "antd";
import { useRouter, usePathname } from "next/navigation";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";
import * as echarts from "echarts";
import dayjs from "dayjs";
import { DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import type { FilterValue } from "antd/es/table/interface";

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

const formatTime = (date: Date) => {
  return dayjs(date).format("MM-DD HH:00");
};

const generateTimeMarks = (minTime: Date, maxTime: Date) => {
  const diff = dayjs(maxTime).diff(minTime, "hour");
  const marks: Record<
    number,
    { label: React.ReactNode; style: React.CSSProperties }
  > = {
    0: {
      label: (
        <div className="flex flex-col items-center text-gray-500">
          <span className="text-xs font-medium">
            {dayjs(minTime).format("MM-DD")}
          </span>
          <span className="text-[10px]">{dayjs(minTime).format("HH:00")}</span>
        </div>
      ),
      style: { transform: "translateX(0%)" },
    },
    100: {
      label: (
        <div className="flex flex-col items-center text-gray-500">
          <span className="text-xs font-medium">
            {dayjs(maxTime).format("MM-DD")}
          </span>
          <span className="text-[10px]">{dayjs(maxTime).format("HH:00")}</span>
        </div>
      ),
      style: { transform: "translateX(-100%)" },
    },
  };

  // 添加4个中间点
  [20, 40, 60, 80].forEach((percent) => {
    const time = dayjs(minTime).add((diff * percent) / 100, "hour");
    marks[percent] = {
      label: (
        <div className="flex flex-col items-center text-gray-500">
          <span className="text-xs font-medium">{time.format("MM-DD")}</span>
          <span className="text-[10px]">{time.format("HH:00")}</span>
        </div>
      ),
      style: { transform: "translateX(-50%)" },
    };
  });

  return marks;
};

export default function PanelPage() {
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
  const chartRef = useRef<ECharts>();
  const router = useRouter();
  const pathname = usePathname();
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 100]);
  const [availableTimeRange, setAvailableTimeRange] = useState<{
    minTime: Date;
    maxTime: Date;
  }>({
    minTime: new Date(),
    maxTime: new Date(),
  });

  // 添加表格相关的状态
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {
      nickname: null, // null 表示全选
      model_name: null, // null 表示全选
    },
  });

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const isFullRange = timeRange[0] === 0 && timeRange[1] === 100;

      let url = `/api/v1/panel/usage?t=${Date.now()}`;

      if (!isFullRange) {
        const startTime = dayjs(availableTimeRange.minTime)
          .add(
            timeRange[0] *
              (dayjs(availableTimeRange.maxTime).diff(
                availableTimeRange.minTime,
                "hour"
              ) /
                100),
            "hour"
          )
          .startOf("hour")
          .toISOString();
        const endTime = dayjs(availableTimeRange.minTime)
          .add(
            timeRange[1] *
              (dayjs(availableTimeRange.maxTime).diff(
                availableTimeRange.minTime,
                "hour"
              ) /
                100),
            "hour"
          )
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
      console.error("获取使用数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 添加表格相关的函数
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
      message.error("获取记录失败");
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
      sortOrder: Array.isArray(sorter) ? undefined : sorter.order,
    };
    setTableParams(newParams);
    fetchRecords(newParams);
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

  const columns: ColumnsType<UsageRecord> = [
    {
      title: "用户",
      dataIndex: "nickname",
      key: "nickname",
      filters: usageData.users.map((user) => ({
        text: user.nickname,
        value: user.nickname,
      })),
      filterMode: "tree",
      filterSearch: true,
      filteredValue: tableParams.filters?.nickname || null,
    },
    {
      title: "使用时间",
      dataIndex: "use_time",
      key: "use_time",
      render: (text) => new Date(text).toLocaleString(),
      sorter: true,
    },
    {
      title: "模型",
      dataIndex: "model_name",
      key: "model_name",
      filters: usageData.models.map((model) => ({
        text: model.model_name,
        value: model.model_name,
      })),
      filterMode: "tree",
      filterSearch: true,
      filteredValue: tableParams.filters?.model_name || null,
    },
    {
      title: "输入tokens",
      dataIndex: "input_tokens",
      key: "input_tokens",
      align: "right",
      sorter: true,
    },
    {
      title: "输出tokens",
      dataIndex: "output_tokens",
      key: "output_tokens",
      align: "right",
      sorter: true,
    },
    {
      title: "消耗金额",
      dataIndex: "cost",
      key: "cost",
      align: "right",
      render: (value) => `¥${Number(value).toFixed(4)}`,
      sorter: true,
    },
    {
      title: "剩余余额",
      dataIndex: "balance_after",
      key: "balance_after",
      align: "right",
      render: (value) => `¥${Number(value).toFixed(4)}`,
      sorter: true,
    },
  ];

  // 在现有的 useEffect 中添加表格数据的初始加载
  useEffect(() => {
    fetchUsageData();
    fetchRecords(tableParams);
  }, []);

  const pieData = usageData.models
    .map((item) => ({
      type: item.model_name,
      value: pieMetric === "cost" ? Number(item.total_cost) : item.total_count,
    }))
    .filter((item) => item.value > 0);

  const columnData = usageData.users
    .map((item) => ({
      nickname: item.nickname,
      value: barMetric === "cost" ? Number(item.total_cost) : item.total_count,
    }))
    .sort((a, b) => b.value - a.value);

  const getPieOption = (metric: "cost" | "count") => {
    const total = pieData.reduce((sum, item) => sum + item.value, 0);

    // 按值排序并处理小比例数据
    const sortedData = [...pieData]
      .sort((a, b) => b.value - a.value)
      .reduce((acc, curr) => {
        const percentage = (curr.value / total) * 100;
        if (percentage < 5) {
          const otherIndex = acc.findIndex((item) => item.name === "其他");
          if (otherIndex >= 0) {
            acc[otherIndex].value += curr.value;
          } else {
            acc.push({
              name: "其他",
              value: curr.value,
            });
          }
        } else {
          acc.push({
            name: curr.type,
            value: curr.value,
          });
        }
        return acc;
      }, [] as { name: string; value: number }[]);

    return {
      tooltip: {
        show: false,
      },
      series: [
        {
          name: metric === "cost" ? "消耗金额" : "使用次数",
          type: "pie",
          radius: ["50%", "85%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "#fff",
          },
          label: {
            show: true,
            position: "outside",
            alignTo: "none",
            margin: 8,
            formatter: (params: any) => {
              const percentage = ((params.value / total) * 100).toFixed(1);
              return [
                `{name|${params.name}}`,
                `{value|${
                  metric === "cost"
                    ? `¥${params.value.toFixed(4)}`
                    : `${params.value}次`
                }}`,
                `{per|${percentage}%}`,
              ].join("\n");
            },
            rich: {
              name: {
                fontSize: 12,
                color: "#666",
                padding: [0, 0, 2, 0],
                fontWeight: 500,
              },
              value: {
                fontSize: 11,
                color: "#333",
                padding: [2, 0],
              },
              per: {
                fontSize: 11,
                color: "#999",
              },
            },
            lineHeight: 14,
          },
          labelLayout: {
            hideOverlap: true,
          },
          labelLine: {
            show: true,
            length: 30,
            length2: 20,
            smooth: true,
          },
          data: sortedData,
          zlevel: 0,
          padAngle: 0.05,
        },
      ],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "middle",
          style: {
            text:
              metric === "cost"
                ? `总计\n¥${total.toFixed(2)}`
                : `总计\n${total}次`,
            textAlign: "center",
            fontSize: 14,
            fontWeight: "bold",
          },
          zlevel: 1,
        },
      ],
      animation: true,
      animationDuration: 500,
      universalTransition: true,
      emphasis: {
        scale: false,
        focus: "none",
      },
    };
  };

  const getBarOption = (metric: "cost" | "count") => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: (params: any) => {
          const value = params[0].value;
          return `${params[0].name}: ${
            metric === "cost" ? `¥${value.toFixed(4)}` : `${value}次`
          }`;
        },
      },
      grid: {
        top: "8%",
        bottom: "12%",
        left: "3%",
        right: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: columnData.map((item) => item.nickname),
        axisLabel: {
          inside: false,
          color: "#666",
          fontSize: 12,
          rotate: 45,
          interval: "auto",
          overflow: "truncate",
          ellipsis: "...",
          hideOverlap: true,
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: "#ddd",
          },
        },
        z: 10,
      },
      yAxis: {
        type: "value",
        name: metric === "cost" ? "消耗金额" : "使用次数",
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: "#999",
        },
      },
      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: Math.min(100, Math.max(100 * (15 / columnData.length), 30)),
        },
      ],
      series: [
        {
          type: "bar",
          itemStyle: {
            color: "#5B9BD5",
            borderRadius: [5, 5, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: "#3A75B0",
            },
          },
          data: columnData.map((item) => item.value),
          showBackground: true,
          backgroundStyle: {
            color: "rgba(180, 180, 180, 0.1)",
          },
          label: {
            show: true,
            position: "top",
            formatter: (params: any) => {
              return metric === "cost"
                ? `¥${params.value.toFixed(2)}`
                : `${params.value}`;
            },
            fontSize: 12,
            color: "#666",
          },
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: "cubicInOut",
    };
  };

  // 处理图表实例
  const onChartReady = (instance: ECharts) => {
    chartRef.current = instance;
  };

  // 在组件中添加点击缩放功能
  const onBarChartReady = (instance: ECharts) => {
    const zoomSize = 6;
    instance.on("click", (params) => {
      const dataLength = columnData.length;
      instance.dispatchAction({
        type: "dataZoom",
        startValue:
          columnData[Math.max(params.dataIndex - zoomSize / 2, 0)].nickname,
        endValue:
          columnData[Math.min(params.dataIndex + zoomSize / 2, dataLength - 1)]
            .nickname,
      });
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">使用统计看板</h1>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">时间范围</span>
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
                {timeRange[0] === 0 && timeRange[1] === 100
                  ? "全部时间"
                  : "自定义"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-gray-900 font-medium">
                {dayjs(availableTimeRange.minTime)
                  .add(
                    timeRange[0] *
                      (dayjs(availableTimeRange.maxTime).diff(
                        availableTimeRange.minTime,
                        "hour"
                      ) /
                        100),
                    "hour"
                  )
                  .format("YYYY-MM-DD HH:00")}
              </span>
              <span className="text-gray-400 mx-1">至</span>
              <span className="text-gray-900 font-medium">
                {dayjs(availableTimeRange.minTime)
                  .add(
                    timeRange[1] *
                      (dayjs(availableTimeRange.maxTime).diff(
                        availableTimeRange.minTime,
                        "hour"
                      ) /
                        100),
                    "hour"
                  )
                  .format("YYYY-MM-DD HH:00")}
              </span>
            </div>
          </div>
          <Slider
            range
            value={timeRange}
            marks={generateTimeMarks(
              availableTimeRange.minTime,
              availableTimeRange.maxTime
            )}
            tooltip={{
              formatter: (value?: number) => {
                if (value === undefined) return "";
                const time = dayjs(availableTimeRange.minTime).add(
                  value *
                    (dayjs(availableTimeRange.maxTime).diff(
                      availableTimeRange.minTime,
                      "hour"
                    ) /
                      100),
                  "hour"
                );
                return (
                  <div className="flex flex-col items-center">
                    <span className="font-medium">{time.format("MM-DD")}</span>
                    <span className="text-xs">{time.format("HH:00")}</span>
                  </div>
                );
              },
            }}
            onChange={(value) => {
              setTimeRange(value as [number, number]);
              fetchUsageData();
            }}
            className="mt-6 mb-2 [&_.ant-slider-mark-text]:!whitespace-nowrap"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-700">模型使用分布</h2>
          <Radio.Group
            value={pieMetric}
            onChange={(e) => setPieMetric(e.target.value)}
            size="small"
            className="ml-2 flex items-center"
          >
            <Radio.Button
              value="cost"
              className="!flex !items-center !px-4 !py-1 text-sm border-blue-200 hover:border-blue-300 
                [&.ant-radio-button-wrapper-checked]:!bg-gradient-to-r 
                [&.ant-radio-button-wrapper-checked]:!from-blue-500 
                [&.ant-radio-button-wrapper-checked]:!to-blue-600
                [&.ant-radio-button-wrapper-checked]:!text-white 
                [&.ant-radio-button-wrapper-checked]:!border-blue-500
                [&.ant-radio-button-wrapper-checked]:!shadow-sm
                !leading-none !h-7"
            >
              按金额
            </Radio.Button>
            <Radio.Button
              value="count"
              className="!flex !items-center !px-4 !py-1 text-sm border-blue-200 hover:border-blue-300
                [&.ant-radio-button-wrapper-checked]:!bg-gradient-to-r 
                [&.ant-radio-button-wrapper-checked]:!from-blue-500 
                [&.ant-radio-button-wrapper-checked]:!to-blue-600
                [&.ant-radio-button-wrapper-checked]:!text-white 
                [&.ant-radio-button-wrapper-checked]:!border-blue-500
                [&.ant-radio-button-wrapper-checked]:!shadow-sm
                !leading-none !h-7"
            >
              按次数
            </Radio.Button>
          </Radio.Group>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-[450px]">
            <Spin size="large" />
          </div>
        ) : (
          <div className="h-[450px]">
            <ReactECharts
              option={getPieOption(pieMetric)}
              style={{ height: "100%", width: "100%" }}
              onChartReady={onChartReady}
            />
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-700">用户使用排行</h2>
          <Radio.Group
            value={barMetric}
            onChange={(e) => setBarMetric(e.target.value)}
            size="small"
            className="ml-2 flex items-center"
          >
            <Radio.Button
              value="cost"
              className="!flex !items-center !px-4 !py-1 text-sm border-blue-200 hover:border-blue-300 
                [&.ant-radio-button-wrapper-checked]:!bg-gradient-to-r 
                [&.ant-radio-button-wrapper-checked]:!from-blue-500 
                [&.ant-radio-button-wrapper-checked]:!to-blue-600
                [&.ant-radio-button-wrapper-checked]:!text-white 
                [&.ant-radio-button-wrapper-checked]:!border-blue-500
                [&.ant-radio-button-wrapper-checked]:!shadow-sm
                !leading-none !h-7"
            >
              按金额
            </Radio.Button>
            <Radio.Button
              value="count"
              className="!flex !items-center !px-4 !py-1 text-sm border-blue-200 hover:border-blue-300
                [&.ant-radio-button-wrapper-checked]:!bg-gradient-to-r 
                [&.ant-radio-button-wrapper-checked]:!from-blue-500 
                [&.ant-radio-button-wrapper-checked]:!to-blue-600
                [&.ant-radio-button-wrapper-checked]:!text-white 
                [&.ant-radio-button-wrapper-checked]:!border-blue-500
                [&.ant-radio-button-wrapper-checked]:!shadow-sm
                !leading-none !h-7"
            >
              按次数
            </Radio.Button>
          </Radio.Group>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-[600px]">
            <Spin size="large" />
          </div>
        ) : (
          <div className="h-[600px]">
            <ReactECharts
              option={getBarOption(barMetric)}
              style={{ height: "100%", width: "100%" }}
              onChartReady={onBarChartReady}
            />
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-700">详细记录</h2>
          <Radio.Group size="small" className="ml-2 flex items-center">
            <Radio.Button
              onClick={handleExport}
              className="!flex !items-center !px-4 !py-1 text-sm border-blue-200 hover:border-blue-300 
                !bg-gradient-to-r !from-blue-500 !to-blue-600
                !text-white !border-blue-500 !shadow-sm
                !leading-none !h-7"
            >
              <Space>
                <DownloadOutlined />
                导出记录
              </Space>
            </Radio.Button>
          </Radio.Group>
        </div>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          pagination={tableParams.pagination}
          onChange={handleTableChange}
          loading={tableLoading}
          size="middle"
          className="bg-white rounded-lg shadow-sm"
        />
      </div>
    </div>
  );
}
