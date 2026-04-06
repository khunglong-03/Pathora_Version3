"use client";

import { AlertItem } from "./ui/AlertItem";
import type { AdminDashboard } from "@/types/admin";

interface DashboardAlertsProps {
  dashboard: AdminDashboard;
  t: (key: string) => string;
}

const ACCENT = "#F97316";

export function DashboardAlerts({ dashboard, t }: DashboardAlertsProps) {
  const { alerts } = dashboard;

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-5 transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2 mb-5">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
          style={{
            color: ACCENT,
            backgroundColor: `${ACCENT}10`,
            border: `1px solid ${ACCENT}18`,
          }}
        >
          Live Feed
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#22c55e]" />
          <span className="text-[10px] font-semibold uppercase text-[#22c55e]">Active</span>
        </span>
      </div>

      <p className="text-sm font-semibold tracking-tight mb-5" style={{ color: "#111827" }}>
        Operational Alerts
      </p>

      {alerts.length === 0 ? (
        <div className="py-5 text-center text-sm md:col-span-3 rounded-xl border" style={{ color: "#9CA3AF", borderColor: "#E5E7EB", backgroundColor: "#F3F4F6" }}>
          {t("adminDashboard.noAlerts")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {alerts.map((alert, index) => (
            <AlertItem key={index} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
