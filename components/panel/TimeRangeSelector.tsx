"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Sun,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  CalendarCheck,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

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
  startTime: dayjs.Dayjs,
  endTime: dayjs.Dayjs,
  availableTimeRange: { minTime: Date; maxTime: Date }
): TimeRangeType => {
  if (
    dayjs(startTime).isSame(availableTimeRange.minTime, "hour") &&
    dayjs(endTime).isSame(availableTimeRange.maxTime, "hour")
  ) {
    return "all";
  }

  const now = dayjs();
  const isToday = startTime.isSame(now.startOf("day")) && endTime.isSame(now);
  const isWeek = startTime.isSame(now.startOf("week")) && endTime.isSame(now);
  const isMonth = startTime.isSame(now.startOf("month")) && endTime.isSame(now);
  const is30Days =
    startTime.isSame(now.subtract(30, "day"), "hour") && endTime.isSame(now);

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
  const { t, i18n } = useTranslation("common");
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const totalHours = dayjs(availableTimeRange.maxTime).diff(
    availableTimeRange.minTime,
    "hour"
  );

  const [startDate, setStartDate] = useState<Date | undefined>(
    dayjs(availableTimeRange.minTime)
      .add((timeRange[0] * totalHours) / 100, "hour")
      .startOf("day")
      .toDate()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    dayjs(availableTimeRange.minTime)
      .add((timeRange[1] * totalHours) / 100, "hour")
      .endOf("day")
      .toDate()
  );

  const timeOptions = [
    {
      id: "today",
      type: "today" as TimeRangeType,
      label: t("panel.timeRange.timeOptions.day"),
      icon: Sun,
    },
    {
      id: "week",
      type: "week" as TimeRangeType,
      label: t("panel.timeRange.timeOptions.week"),
      icon: CalendarDays,
    },
    {
      id: "month",
      type: "month" as TimeRangeType,
      label: t("panel.timeRange.timeOptions.month"),
      icon: CalendarRange,
    },
    {
      id: "30days",
      type: "30days" as TimeRangeType,
      label: t("panel.timeRange.timeOptions.30Days"),
      icon: CalendarClock,
    },
    {
      id: "all",
      type: "all" as TimeRangeType,
      label: t("panel.timeRange.timeOptions.all"),
      icon: CalendarCheck,
    },
  ];

  const handleDateChange = (start?: Date, end?: Date) => {
    if (!start || !end) return;

    const startPercentage = Math.max(
      0,
      (dayjs(start).startOf("day").diff(availableTimeRange.minTime, "hour") /
        totalHours) *
        100
    );
    const endPercentage = Math.min(
      100,
      (dayjs(end).endOf("day").diff(availableTimeRange.minTime, "hour") /
        totalHours) *
        100
    );

    onTimeRangeChange([startPercentage, endPercentage], "custom");
  };

  const formatDate = (date?: Date) => {
    if (!date) return t("panel.timeRange.selectDate");
    return format(date, "yyyy-MM-dd", {
      locale: i18n.language === "zh" ? zhCN : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium">
        <Clock className="w-5 h-5 text-primary" />
        <h3>{t("panel.timeRange.title")}</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {timeOptions.map(({ id, type, label, icon: Icon }) => (
            <motion.div
              key={id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={timeRangeType === type ? "default" : "outline"}
                className="w-full h-full min-h-[52px] flex flex-col gap-1.5 items-center justify-center"
                onClick={() => {
                  const newRange = calculateTimeRange(type, availableTimeRange);
                  onTimeRangeChange(newRange, type);
                  setIsCustomOpen(false);
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{label}</span>
              </Button>
            </motion.div>
          ))}

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant={timeRangeType === "custom" ? "default" : "outline"}
              className="w-full h-full min-h-[52px] flex flex-col gap-1.5 items-center justify-center"
              onClick={() => setIsCustomOpen(!isCustomOpen)}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm">
                {t("panel.timeRange.timeOptions.custom")}
              </span>
            </Button>
          </motion.div>
        </div>

        <AnimatePresence>
          {isCustomOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="text-sm text-muted-foreground">
                {t("panel.timeRange.customRange")}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Popover open={startOpen} onOpenChange={setStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      className={cn(
                        "justify-start text-left font-normal w-full sm:w-[240px]",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDate(startDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = dayjs(date).startOf("day").toDate();
                          setStartDate(newDate);
                          if (endDate) {
                            handleDateChange(newDate, endDate);
                          }
                          setStartOpen(false);
                        }
                      }}
                      disabled={(date) =>
                        date <
                          dayjs(availableTimeRange.minTime)
                            .startOf("day")
                            .toDate() ||
                        date >
                          (endDate ||
                            dayjs(availableTimeRange.maxTime)
                              .endOf("day")
                              .toDate())
                      }
                      initialFocus
                      locale={i18n.language === "zh" ? zhCN : undefined}
                    />
                  </PopoverContent>
                </Popover>

                <Popover open={endOpen} onOpenChange={setEndOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      className={cn(
                        "justify-start text-left font-normal w-full sm:w-[240px]",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDate(endDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = dayjs(date).endOf("day").toDate();
                          setEndDate(newDate);
                          if (startDate) {
                            handleDateChange(startDate, newDate);
                          }
                          setEndOpen(false);
                        }
                      }}
                      disabled={(date) =>
                        date <
                          (startDate ||
                            dayjs(availableTimeRange.minTime)
                              .startOf("day")
                              .toDate()) ||
                        date >
                          dayjs(availableTimeRange.maxTime)
                            .endOf("day")
                            .toDate()
                      }
                      initialFocus
                      locale={i18n.language === "zh" ? zhCN : undefined}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
