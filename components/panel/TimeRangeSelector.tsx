"use client";

import { useState, useEffect } from "react";
import { Slider } from "antd";
import dayjs from "dayjs";
import { Button as ShadcnButton } from "@/components/ui/button";

export type TimeRangeType =
  | "today"
  | "week"
  | "month"
  | "30days"
  | "all"
  | "custom";

interface TimeRangeSelectorProps {
  timeRange: [number, number];
  timeRangeType: TimeRangeType;
  availableTimeRange: {
    minTime: Date;
    maxTime: Date;
  };
  onTimeRangeChange: (range: [number, number], type: TimeRangeType) => void;
}

const generateTimeMarks = (minTime: Date, maxTime: Date) => {
  const diff = dayjs(maxTime).diff(minTime, "hour");
  const marks: Record<
    number,
    { label: React.ReactNode; style: React.CSSProperties }
  > = {
    0: {
      label: (
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium text-gray-600">
            {dayjs(minTime).format("MM-DD")}
          </span>
          <span className="text-[10px] text-gray-500">
            {dayjs(minTime).format("HH:00")}
          </span>
        </div>
      ),
      style: { transform: "translateX(0%)" },
    },
    100: {
      label: (
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium text-gray-600">
            {dayjs(maxTime).format("MM-DD")}
          </span>
          <span className="text-[10px] text-gray-500">
            {dayjs(maxTime).format("HH:00")}
          </span>
        </div>
      ),
      style: { transform: "translateX(-100%)" },
    },
  };

  [20, 40, 60, 80].forEach((percent) => {
    const time = dayjs(minTime).add((diff * percent) / 100, "hour");
    marks[percent] = {
      label: (
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium text-gray-600">
            {time.format("MM-DD")}
          </span>
          <span className="text-[10px] text-gray-500">
            {time.format("HH:00")}
          </span>
        </div>
      ),
      style: { transform: "translateX(-50%)" },
    };
  });

  return marks;
};

const calculateTimeRange = (
  type: TimeRangeType,
  availableTimeRange: { minTime: Date; maxTime: Date }
): [number, number] => {
  if (type === "all") return [0, 100];

  const now = dayjs();
  let startTime: dayjs.Dayjs;
  let endTime = now;

  switch (type) {
    case "today":
      startTime = now.startOf("day");
      break;
    case "week":
      startTime = now.startOf("week");
      break;
    case "month":
      startTime = now.startOf("month");
      break;
    case "30days":
      startTime = now.subtract(30, "day");
      break;
    default:
      return [0, 100];
  }

  const totalHours = dayjs(availableTimeRange.maxTime).diff(
    availableTimeRange.minTime,
    "hour"
  );
  const startPercentage = Math.max(
    0,
    (startTime.diff(availableTimeRange.minTime, "hour") / totalHours) * 100
  );
  const endPercentage = Math.min(
    100,
    (endTime.diff(availableTimeRange.minTime, "hour") / totalHours) * 100
  );

  return [startPercentage, endPercentage];
};

const checkTimeRangeType = (
  range: [number, number],
  availableTimeRange: { minTime: Date; maxTime: Date }
): TimeRangeType => {
  const [start, end] = range;
  if (start === 0 && end === 100) return "all";
  if (end !== 100) return "custom";

  const now = dayjs();
  const totalHours = now.diff(availableTimeRange.minTime, "hour");
  const startTime = dayjs(availableTimeRange.minTime).add(
    (start * totalHours) / 100,
    "hour"
  );

  const isToday = startTime.isSame(now.startOf("day"));
  const isWeek = startTime.isSame(now.startOf("week"));
  const isMonth = startTime.isSame(now.startOf("month"));
  const is30Days = startTime.isSame(now.subtract(30, "day"), "hour");

  if (isToday) return "today";
  if (isWeek) return "week";
  if (isMonth) return "month";
  if (is30Days) return "30days";

  return "custom";
};

export default function TimeRangeSelector({
  timeRange,
  timeRangeType,
  availableTimeRange,
  onTimeRangeChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="p-6 pb-16">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">时间范围</span>
            <div className="flex items-center gap-2 font-mono text-sm transition-all duration-300 hover:text-gray-900">
              <span className="text-gray-600">
                {dayjs(availableTimeRange.minTime)
                  .add(
                    (timeRange[0] *
                      dayjs(availableTimeRange.maxTime).diff(
                        availableTimeRange.minTime,
                        "hour"
                      )) /
                      100,
                    "hour"
                  )
                  .format("YYYY-MM-DD HH:00")}
              </span>
              <span className="text-gray-400">至</span>
              <span className="text-gray-600">
                {dayjs(availableTimeRange.minTime)
                  .add(
                    (timeRange[1] *
                      dayjs(availableTimeRange.maxTime).diff(
                        availableTimeRange.minTime,
                        "hour"
                      )) /
                      100,
                    "hour"
                  )
                  .format("YYYY-MM-DD HH:00")}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { type: "today", label: "本日" },
              { type: "week", label: "本周" },
              { type: "month", label: "本月" },
              { type: "30days", label: "近30天" },
              { type: "all", label: "全部" },
            ].map(({ type, label }) => (
              <ShadcnButton
                key={type}
                variant={timeRangeType === type ? "default" : "outline"}
                size="sm"
                className="transition-all duration-300 hover:scale-105"
                onClick={() => {
                  const newRange = calculateTimeRange(
                    type as TimeRangeType,
                    availableTimeRange
                  );
                  onTimeRangeChange(newRange, type as TimeRangeType);
                }}
              >
                {label}
              </ShadcnButton>
            ))}
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
                (value *
                  dayjs(availableTimeRange.maxTime).diff(
                    availableTimeRange.minTime,
                    "hour"
                  )) /
                  100,
                "hour"
              );
              return (
                <div className="flex flex-col items-center bg-gray-800 text-white rounded-lg shadow-md p-2">
                  <span className="font-medium">{time.format("MM-DD")}</span>
                  <span className="text-xs">{time.format("HH:00")}</span>
                </div>
              );
            },
          }}
          onChange={(value) => {
            const newRange = value as [number, number];
            const newType = checkTimeRangeType(newRange, availableTimeRange);
            onTimeRangeChange(newRange, newType);
          }}
          className="mt-8 mb-4 [&_.ant-slider-mark-text]:!whitespace-nowrap
            [&_.ant-slider-rail]:!bg-gray-100/80 
            [&_.ant-slider-track]:!bg-gray-300/80
            [&_.ant-slider-handle]:!border-gray-400 
            [&_.ant-slider-handle]:!bg-white
            [&_.ant-slider-handle]:!transition-all
            [&_.ant-slider-handle]:!duration-300
            [&_.ant-slider-handle]:hover:!scale-110
            [&_.ant-slider-handle]:!shadow-sm
            [&_.ant-slider-handle:hover]:!border-gray-500
            [&_.ant-slider-handle:active]:!border-gray-600
            [&_.ant-slider-handle:focus]:!border-gray-600
            [&_.ant-slider-handle:focus]:!box-shadow-[0_0_0_4px_rgba(0,0,0,0.05)]
            hover:[&_.ant-slider-track]:!bg-gray-400/90
            [&_.ant-slider-dot]:!border-gray-200
            [&_.ant-slider-dot]:!bg-gray-50
            [&_.ant-slider-dot-active]:!border-gray-300
            [&_.ant-slider-dot-active]:!bg-gray-100
            [&_.ant-slider-dot]:hover:!border-gray-400
            [&_.ant-slider-mark-text]:!text-gray-500
            [&_.ant-slider-mark-text]:!transition-all
            [&_.ant-slider-mark-text]:!duration-300
            [&_.ant-slider-mark-text-active]:!text-gray-700
            [&_.ant-slider-mark-text]:hover:!text-gray-900
            [&_.ant-slider-handle-1]:after:!bg-gray-400
            [&_.ant-slider-handle-2]:after:!bg-gray-400"
        />
      </div>
    </div>
  );
}
