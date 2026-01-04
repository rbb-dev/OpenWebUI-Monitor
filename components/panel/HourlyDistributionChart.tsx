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

export interface DistributionBucket {
  bucket: number; // hour: 0-23, isodow: 1-7 (Mon-Sun)
  cost: number;
  tokens: number;
  calls: number;
}

interface HourlyDistributionChartProps {
  loading: boolean;
  buckets: DistributionBucket[];
  timeRange: [Date, Date];
  view: "hour" | "weekday";
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

const getIsoWeekdayCounts = (range: [Date, Date]) => {
  const counts: Record<number, number> = {};
  let cur = dayjs(range[0]).startOf("day");
  const end = dayjs(range[1]).startOf("day");

  while (cur.isBefore(end) || cur.isSame(end, "day")) {
    const d = ((cur.day() + 6) % 7) + 1; // 1..7 (Mon..Sun)
    counts[d] = (counts[d] || 0) + 1;
    cur = cur.add(1, "day");
  }

  return counts;
};

export default function HourlyDistributionChart({
  loading,
  buckets,
  timeRange,
  view,
  metric,
  onMetricChange,
  mode,
  onModeChange,
}: HourlyDistributionChartProps) {
  const { t } = useTranslation("common");
  const chartRef = useRef<ECharts>();

  const days = useMemo(() => getDaysInRange(timeRange), [timeRange]);
  const keys = useMemo(
    () => (view === "weekday" ? [1, 2, 3, 4, 5, 6, 7] : Array.from({ length: 24 }, (_, h) => h)),
    [view]
  );
  const weekdayCounts = useMemo(
    () => (view === "weekday" ? getIsoWeekdayCounts(timeRange) : {}),
    [view, timeRange]
  );

  const keyToBucket = useMemo(() => {
    const map = new Map<number, DistributionBucket>();
    for (const b of buckets) map.set(b.bucket, b);
    return map;
  }, [buckets]);

  const totals = useMemo(() => {
    const raw = keys.map((k) => {
      const b = keyToBucket.get(k);
      return {
        bucket: k,
        cost: b?.cost ?? 0,
        tokens: b?.tokens ?? 0,
        calls: b?.calls ?? 0,
      };
    });
    return raw;
  }, [keys, keyToBucket]);

  const values = useMemo(() => {
    if (mode !== "avg") return totals.map((b) => b[metric]);

    if (view === "weekday") {
      return totals.map((b) => {
        const denom = weekdayCounts[b.bucket] || 1;
        return b[metric] / denom;
      });
    }

    const denom = days > 1 ? days : 1;
    return totals.map((b) => b[metric] / denom);
  }, [totals, metric, mode, days, view, weekdayCounts]);

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
          const idx = Number(p.dataIndex);
          const b = totals[idx];
          const display = values[idx];
          const bucket = b.bucket;

          const label =
            view === "weekday"
              ? t(`panel.weekdays.${["mon", "tue", "wed", "thu", "fri", "sat", "sun"][bucket - 1]}`)
              : `${pad2(bucket)}:00–${pad2(bucket)}:59`;

          const displayText =
            metric === "cost"
              ? `${currency}${Number(display).toFixed(4)}`
              : Number.isInteger(display)
              ? display.toLocaleString()
              : display.toFixed(2);

          const lines = [`${label}`, `${yLabel}: ${displayText}`];

          if (mode === "avg" && (view === "weekday" || days > 1)) {
            const totalText =
              metric === "cost"
                ? `${currency}${Number(b.cost).toFixed(4)}`
                : b[metric].toLocaleString();
            lines.push(`${t("panel.hourlyDistribution.total")}: ${totalText}`);

            if (view === "weekday") {
              lines.push(
                `${t("panel.hourlyDistribution.days")}: ${days.toLocaleString()}`
              );
              lines.push(
                `${t("panel.distribution.occurrences")}: ${(weekdayCounts[bucket] || 0).toLocaleString()}`
              );
            } else {
              lines.push(
                `${t("panel.hourlyDistribution.days")}: ${days.toLocaleString()}`
              );
            }
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
        data:
          view === "weekday"
            ? [
                t("panel.weekdays.mon"),
                t("panel.weekdays.tue"),
                t("panel.weekdays.wed"),
                t("panel.weekdays.thu"),
                t("panel.weekdays.fri"),
                t("panel.weekdays.sat"),
                t("panel.weekdays.sun"),
              ]
            : keys.map((h) => h.toString()),
        axisTick: { show: false },
        axisLine: { show: true, lineStyle: { color: "#eee", width: 2 } },
        axisLabel: {
          color: "#666",
          fontSize: 11,
          formatter: (val: string) =>
            view === "weekday" ? val : pad2(Number(val)),
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
  }, [t, metric, totals, values, mode, days, keys, view, weekdayCounts]);

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
                    {view === "weekday"
                      ? t("panel.distribution.dailyTitle")
                      : t("panel.hourlyDistribution.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {view === "weekday"
                      ? t("panel.distribution.dailySubtitle")
                      : t("panel.hourlyDistribution.subtitle")}
                  </p>
                </div>
              </div>

              <div className="sm:ml-auto flex flex-col sm:flex-row gap-2">
                <UsageMetricToggle value={metric} onChange={onMetricChange} />
                {(view === "weekday" || days > 1) && (
                  <AggregationToggle
                    value={mode}
                    onChange={onModeChange}
                    avgLabel={
                      view === "weekday"
                        ? t("panel.distribution.avgPerWeekday")
                        : t("panel.hourlyDistribution.avgPerDay")
                    }
                    totalLabel={t("panel.hourlyDistribution.total")}
                  />
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
