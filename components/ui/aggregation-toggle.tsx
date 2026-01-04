"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type AggregationMode = "avg" | "total";

interface AggregationToggleProps {
  value: AggregationMode;
  onChange: (value: AggregationMode) => void;
  className?: string;
  avgLabel?: string;
  totalLabel?: string;
}

export function AggregationToggle({
  value,
  onChange,
  className,
  avgLabel,
  totalLabel,
}: AggregationToggleProps) {
  const { t } = useTranslation("common");

  const options: Array<{ key: AggregationMode; label: string }> = [
    { key: "avg", label: avgLabel ?? t("panel.hourlyDistribution.avgPerDay") },
    {
      key: "total",
      label: totalLabel ?? t("panel.hourlyDistribution.total"),
    },
  ];

  return (
    <div
      className={cn(
        "flex gap-1 w-full sm:w-[220px] p-1.5 bg-white rounded-lg border border-gray-100",
        "shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {options.map((opt) => (
        <motion.button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            "relative flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md",
            "transition-colors duration-200",
            value === opt.key
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {value === opt.key && (
            <motion.div
              layoutId="aggregationActiveBg"
              className="absolute inset-0 bg-gray-100 border border-gray-200 rounded-md shadow-sm"
              initial={false}
              transition={{ duration: 0.15, ease: "easeOut" }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
