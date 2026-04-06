"use client";

import { AdminDashboardCategoryMetric } from "@/types/admin";

interface MetricLegendProps {
  items: AdminDashboardCategoryMetric[];
  colors: readonly string[];
}

export function MetricLegend({ items, colors }: MetricLegendProps) {
  return (
    <div className="space-y-2.5">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span>{item.label}</span>
          </div>
          <span className="font-medium tabular-nums" style={{ color: "#111827" }}>
            {Math.round(item.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
