"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  DollarOutlined,
  ThunderboltOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export type UsageMetric = "cost" | "tokens" | "calls";

interface UsageMetricToggleProps {
  value: UsageMetric;
  onChange: (value: UsageMetric) => void;
  className?: string;
}

export function UsageMetricToggle({
  value,
  onChange,
  className,
}: UsageMetricToggleProps) {
  const { t } = useTranslation("common");

  const options: Array<{
    key: UsageMetric;
    label: string;
    icon: ReactNode;
  }> = [
    { key: "cost", label: t("panel.byAmount"), icon: <DollarOutlined /> },
    { key: "tokens", label: t("panel.byTokens"), icon: <ThunderboltOutlined /> },
    { key: "calls", label: t("panel.byCalls"), icon: <PhoneOutlined /> },
  ];

  return (
    <div
      className={cn(
        "flex gap-1 w-full sm:w-[420px] p-1.5 bg-white rounded-lg border border-gray-100",
        "shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {options.map((opt) => (
        <motion.button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            "relative flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md",
            "transition-colors duration-200",
            value === opt.key
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {value === opt.key && (
            <motion.div
              layoutId="usageMetricActiveBg"
              className="absolute inset-0 bg-gray-100 border border-gray-200 rounded-md shadow-sm"
              initial={false}
              transition={{ duration: 0.15, ease: "easeOut" }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <span className="text-[14px]">{opt.icon}</span>
            <span className="whitespace-nowrap">{opt.label}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}
