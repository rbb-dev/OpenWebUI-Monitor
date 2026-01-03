"use client";

import { useEffect, useMemo, useRef } from "react";
import { Skeleton } from "antd";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";
import dayjs from "@/lib/dayjs";
import { useTranslation } from "react-i18next";
import { FieldTimeOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import {
  UsageMetric,
  UsageMetricToggle,
} from "@/components/ui/usage-metric-toggle";
import {
  AggregationMode,
  AggregationToggle,
} from "@/components/ui/aggregation-toggle";

export interface HourlyBucket {
  hour: number; // 0-23
  cost: number;
  tokens: number;
  calls: number;
}

interface HourlyDistributionChartProps {
  loading: boolean;
  buckets: HourlyBucket[];
  timeRange: [Date, Date];
  metric: UsageMetric;
  onMetricChange: (metric: UsageMetric) => void;
  mode: AggregationMode;
  onModeChange: (mode: AggregationMode) => void;
}

const formatCompact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

const getDaysInRange = (range: [Date, Date]) => {
  const start = dayjs(range[0]).startOf("day");
  const end = dayjs(range[1]).startOf("day");
  return end.diff(start, "day") + 1;
};

const pad2 = (n: number) => n.toString().padStart(2, "0");

export default function HourlyDistributionChart({
  loading,
  buckets,
  timeRange,
  metric,
  onMetricChange,
  mode,
  onModeChange,
}: HourlyDistributionChartProps) {
  const { t } = useTranslation("common");
  const chartRef = useRef<ECharts>();

  const days = useMemo(() => getDaysInRange(timeRange), [timeRange]);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, h) => h), []);

  const hourToBucket = useMemo(() => {
    const map = new Map<number, HourlyBucket>();
    for (const b of buckets) map.set(b.hour, b);
    return map;
  }, [buckets]);

  const totals = useMemo(() => {
    const raw = hours.map((h) => {
      const b = hourToBucket.get(h);
      return {
        hour: h,
        cost: b?.cost ?? 0,
        tokens: b?.tokens ?? 0,
        calls: b?.calls ?? 0,
      };
    });
    return raw;
  }, [hours, hourToBucket]);

  const values = useMemo(() => {
    const denom = mode === "avg" && days > 1 ? days : 1;
    return totals.map((b) => b[metric] / denom);
  }, [totals, metric, mode, days]);

  const option = useMemo(() => {
    const currency = t("common.currency");
    const yLabel =
      metric === "cost"
        ? t("panel.byAmount")
        : metric === "tokens"
        ? t("panel.byTokens")
        : t("panel.byCalls");

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const hour = Number(p.axisValue);
          const b = totals[hour];
          const display = values[hour];

          const hourLabel = `${pad2(hour)}:00–${pad2(hour)}:59`;
          const displayText =
            metric === "cost"
              ? `${currency}${Number(display).toFixed(4)}`
              : Number.isInteger(display)
              ? display.toLocaleString()
              : display.toFixed(2);

          const lines = [`${hourLabel}`, `${yLabel}: ${displayText}`];

          if (mode === "avg" && days > 1) {
            const totalText =
              metric === "cost"
                ? `${currency}${Number(b.cost).toFixed(4)}`
                : b[metric].toLocaleString();
            lines.push(`${t("panel.hourlyDistribution.total")}: ${totalText}`);
            lines.push(
              `${t("panel.hourlyDistribution.days")}: ${days.toLocaleString()}`
            );
          }

          return lines.join("<br/>");
        },
      },
      grid: {
        top: "10%",
        bottom: "10%",
        left: "4%",
        right: "4%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: hours.map((h) => h.toString()),
        axisTick: { show: false },
        axisLine: { show: true, lineStyle: { color: "#eee", width: 2 } },
        axisLabel: {
          color: "#666",
          fontSize: 11,
          formatter: (val: string) => pad2(Number(val)),
        },
      },
      yAxis: {
        type: "value",
        axisLine: { show: true, lineStyle: { color: "#eee", width: 2 } },
        axisTick: { show: true, lineStyle: { color: "#eee" } },
        splitLine: { show: true, lineStyle: { color: "#f5f5f5", width: 2 } },
        axisLabel: {
          color: "#666",
          fontSize: 12,
          formatter: (v: number) => {
            if (metric === "cost") return `${currency}${formatCompact(v)}`;
            return formatCompact(v);
          },
        },
      },
      series: [
        {
          type: "bar",
          barWidth: "70%",
          data: values,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(99, 133, 255, 0.85)" },
                { offset: 1, color: "rgba(99, 133, 255, 0.4)" },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
          showBackground: true,
          backgroundStyle: {
            color: "rgba(180, 180, 180, 0.08)",
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
      animation: true,
      animationDuration: 600,
      animationEasing: "cubicOut" as const,
    };
  }, [t, metric, totals, values, mode, days, hours]);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) chartRef.current.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onChartReady = (instance: ECharts) => {
    chartRef.current = instance;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="col-span-full bg-gradient-to-br from-card to-card/95 text-card-foreground rounded-xl border shadow-sm overflow-hidden"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />

        <div className="relative p-6 space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center rounded-xl shrink-0">
                  <FieldTimeOutlined className="text-xl text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {t("panel.hourlyDistribution.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("panel.hourlyDistribution.subtitle")}
                  </p>
                </div>
              </div>

              <div className="sm:ml-auto flex flex-col sm:flex-row gap-2">
                <UsageMetricToggle value={metric} onChange={onMetricChange} />
                {days > 1 && (
                  <AggregationToggle value={mode} onChange={onModeChange} />
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-[280px] sm:h-[340px] flex items-center justify-center">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          ) : (
            <div className="h-[280px] sm:h-[340px] transition-all duration-300">
              <ReactECharts
                option={option}
                style={{ height: "100%", width: "100%" }}
                onChartReady={onChartReady}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
