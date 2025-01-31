"use client";

import { useRef, useEffect } from "react";
import { Spin, Skeleton } from "antd";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";
import { MetricToggle } from "@/components/ui/metric-toggle";
import { useTranslation } from "react-i18next";
import { BarChartOutlined } from "@ant-design/icons";
import { Card as ShadcnCard } from "@/components/ui/card";

interface UserUsage {
  nickname: string;
  total_cost: number;
  total_count: number;
}

interface UserRankingChartProps {
  loading: boolean;
  users: UserUsage[];
  metric: "cost" | "count";
  onMetricChange: (metric: "cost" | "count") => void;
}

const getBarOption = (
  users: UserUsage[],
  metric: "cost" | "count",
  t: (key: string) => string
) => {
  const columnData = users
    .map((item) => ({
      nickname: item.nickname,
      value: metric === "cost" ? Number(item.total_cost) : item.total_count,
    }))
    .sort((a, b) => b.value - a.value);

  const isSmallScreen = window.innerWidth < 640;

  return {
    tooltip: {
      show: true,
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "rgba(0, 0, 0, 0.05)",
      borderWidth: 1,
      padding: [14, 18],
      textStyle: {
        color: "#333",
        fontSize: 13,
        lineHeight: 20,
      },
      axisPointer: {
        type: "shadow",
        shadowStyle: {
          color: "rgba(0, 0, 0, 0.03)",
        },
      },
      formatter: (params: any) => {
        const data = params[0];
        return `
          <div class="flex flex-col gap-1.5">
            <div class="font-medium text-gray-800">${data.name}</div>
            <div class="flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full" style="background-color: ${
                data.color
              }"></span>
              <span class="text-sm">
                ${metric === "cost" ? t("panel.byAmount") : t("panel.byCount")}
              </span>
              <span class="font-mono text-sm font-medium text-gray-900">
                ${
                  metric === "cost"
                    ? `${t("common.currency")}${data.value.toFixed(2)}`
                    : `${data.value} ${t("common.count")}`
                }
              </span>
            </div>
          </div>
        `;
      },
      extraCssText:
        "box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); border-radius: 8px;",
    },
    grid: {
      top: isSmallScreen ? "8%" : "4%",
      bottom: isSmallScreen ? "2%" : "1%",
      left: "4%",
      right: "4%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: columnData.map((item) =>
        item.nickname.length > 12
          ? item.nickname.slice(0, 10) + "..."
          : item.nickname
      ),
      axisLabel: {
        inside: false,
        color: "#555",
        fontSize: 12,
        rotate: 35,
        interval: 0,
        hideOverlap: true,
        padding: [0, 0, 0, 0],
        verticalAlign: "middle",
        align: "right",
        margin: 8,
      },
      axisTick: {
        show: false,
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#eee",
          width: 2,
        },
      },
      z: 10,
    },
    yAxis: {
      type: "value",
      name: "",
      nameTextStyle: {
        color: "#666",
        fontSize: 13,
        padding: [0, 0, 0, 0],
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#eee",
          width: 2,
        },
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: "#eee",
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "#f5f5f5",
          width: 2,
        },
      },
      axisLabel: {
        color: "#666",
        fontSize: 12,
        formatter: (value: number) => {
          if (metric === "cost") {
            return `¥${value.toFixed(1)}`;
          }
          return `${value}次`;
        },
      },
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: Math.min(100, Math.max(100 * (15 / columnData.length), 40)),
        zoomLock: true,
        moveOnMouseMove: true,
      },
    ],
    series: [
      {
        type: "bar",
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(99, 133, 255, 0.85)",
              },
              {
                offset: 1,
                color: "rgba(99, 133, 255, 0.4)",
              },
            ],
          },
          borderRadius: [8, 8, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(99, 133, 255, 0.95)",
                },
                {
                  offset: 1,
                  color: "rgba(99, 133, 255, 0.5)",
                },
              ],
            },
            shadowBlur: 10,
            shadowColor: "rgba(99, 133, 255, 0.2)",
          },
        },
        barWidth: "35%",
        data: columnData.map((item) => item.value),
        showBackground: true,
        backgroundStyle: {
          color: "rgba(180, 180, 180, 0.08)",
          borderRadius: [8, 8, 0, 0],
        },
        label: {
          show: !isSmallScreen,
          position: "top",
          formatter: (params: any) => {
            return metric === "cost"
              ? `${params.value.toFixed(2)}`
              : `${params.value}`;
          },
          fontSize: 11,
          color: "#666",
          distance: 2,
          fontFamily: "monospace",
        },
      },
    ],
    animation: true,
    animationDuration: 800,
    animationEasing: "cubicOut" as const,
  };
};

export default function UserRankingChart({
  loading,
  users,
  metric,
  onMetricChange,
}: UserRankingChartProps) {
  const { t } = useTranslation("common");
  const chartRef = useRef<ECharts>();

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize();
        chartRef.current.setOption(getBarOption(users, metric, t));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [metric, users, t]);

  const onChartReady = (instance: ECharts) => {
    chartRef.current = instance;
    const zoomSize = 6;
    let isZoomed = false; // 增加一个状态变量

    instance.on("click", (params) => {
      const dataLength = users.length;

      if (!isZoomed) {
        // 第一次点击，放大区域
        instance.dispatchAction({
          type: "dataZoom",
          startValue:
            users[Math.max(params.dataIndex - zoomSize / 2, 0)].nickname,
          endValue:
            users[Math.min(params.dataIndex + zoomSize / 2, dataLength - 1)]
              .nickname,
        });
        isZoomed = true;
      } else {
        // 第二次点击，还原缩放
        instance.dispatchAction({
          type: "dataZoom",
          start: 0,
          end: 100,
        });
        isZoomed = false;
      }
    });
  };

  return (
    <ShadcnCard className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5 text-lg font-medium">
          <BarChartOutlined className="w-5 h-5 text-primary/90" />
          <h2 className="text-gray-800">{t("panel.userUsageChart.title")}</h2>
        </div>
        <MetricToggle value={metric} onChange={onMetricChange} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[350px] sm:h-[450px]">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      ) : (
        <div className="h-[350px] sm:h-[450px] transition-all duration-300">
          <ReactECharts
            option={getBarOption(users, metric, t)}
            style={{ height: "100%", width: "100%" }}
            onChartReady={onChartReady}
            className="bar-chart"
          />
        </div>
      )}
    </ShadcnCard>
  );
}
