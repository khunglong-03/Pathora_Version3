"use client";

import React from "react";
import { useTranslation } from "react-i18next";

interface CapacityBarProps {
  current: number;
  max: number;
}

export function CapacityBar({ current, max }: CapacityBarProps) {
  const { t } = useTranslation();
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const spotsLeft = max - current;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "var(--tour-heading)" }}>
          {t("tourInstance.capacity", "Capacity")}
        </span>
        <span className="text-xs tabular-nums" style={{ color: "var(--tour-caption)" }}>
          {current}/{max} {t("tourInstance.occupied", "occupied")}
        </span>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "var(--tour-divider)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: pct >= 90
              ? "linear-gradient(90deg, #ef4444, #f97316)"
              : pct >= 70
              ? "linear-gradient(90deg, #f97316, var(--landing-accent))"
              : "linear-gradient(90deg, var(--landing-accent), var(--accent))",
          }}
        />
      </div>
      <span
        className="text-[11px] font-semibold"
        style={{ color: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f97316" : "var(--landing-accent)" }}>
        {spotsLeft > 0
          ? `${spotsLeft} ${t("tourInstance.spotsLeft", "spots left")}`
          : t("tourInstance.soldOut", "Sold out")}
      </span>
    </div>
  );
}
