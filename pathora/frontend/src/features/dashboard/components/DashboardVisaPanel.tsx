"use client";

import { Icon } from "@/components/ui";
import type { AdminDashboard } from "@/types/admin";
import { MetricLegend } from "./ui/MetricLegend";
import { VisaStatusBadge } from "./ui/VisaStatusBadge";

interface DashboardVisaPanelProps {
  dashboard: AdminDashboard;
  t: (key: string) => string;
}

const ACCENT = "#F97316";
const SUCCESS = "#10B981";
const PALETTE = [ACCENT, SUCCESS, "#EF4444", "#3B82F6", "#9CA3AF", "#F59E0B"] as const;

export default function DashboardVisaPanel({ dashboard, t }: DashboardVisaPanelProps) {
  const { visaStatuses, upcomingVisaDeadlines, visaSummary, customerNationalities } = dashboard;

  const nationalities = customerNationalities.length > 0
    ? customerNationalities
    : [{ label: t("adminDashboard.noDataChart"), value: 0 }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
      {/* Left panel: Visa Processing (col-span-8) */}
      <div
        className="bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[300px] flex flex-col transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] lg:col-span-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ color: ACCENT, backgroundColor: "rgba(249,115,22,0.12)" }}
          >
            Visa Processing
          </span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: SUCCESS }} />
              <span className="relative inline-flex rounded-full size-2" style={{ backgroundColor: SUCCESS }} />
            </span>
            <span className="text-xs font-medium" style={{ color: "#6B7280" }}>
              Live
            </span>
          </div>
        </div>
        <h3 className="text-lg font-semibold" style={{ color: "#111827" }}>
          {t("adminDashboard.chartVisaProcessing")}
        </h3>

        {/* Status badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {visaStatuses.map((status) => (
            <VisaStatusBadge key={status.label} status={status} />
          ))}
        </div>

        {/* Upcoming deadlines */}
        <h4 className="text-[10px] font-semibold uppercase tracking-widest mt-7 mb-3" style={{ color: "#9CA3AF" }}>
          {t("adminDashboard.upcomingDeadlines")}
        </h4>

        {upcomingVisaDeadlines.length === 0 ? (
          <div
            className="py-5 px-4 rounded-xl text-xs text-center border"
            style={{ color: "#9CA3AF", borderColor: "#E5E7EB", backgroundColor: "#F3F4F6" }}
          >
            {t("adminDashboard.noUpcomingDeadlines")}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingVisaDeadlines.map((deadline) => (
              <div
                key={`${deadline.tour}-${deadline.date}`}
                className="flex items-center justify-between py-3.5 px-4 rounded-xl transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                style={{ backgroundColor: "#F9FAFB" }}
              >
                <span className="text-sm truncate mr-4" style={{ color: "#6B7280" }}>
                  {deadline.tour}
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0"
                  style={{ color: "#F59E0B", backgroundColor: "#FEF3C7" }}
                >
                  {deadline.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel: stacked cards (col-span-4) */}
      <div className="flex flex-col gap-5 lg:col-span-4">
        {/* Visa Summary */}
        <div
          className="bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[160px]"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(16,185,129,0.12)" }}
            >
              <Icon icon="heroicons:shield-check" className="size-6" style={{ color: SUCCESS }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#6B7280" }}>
                {t("adminDashboard.visaSuccessRate")}
              </p>
              <p className="text-2xl font-bold" style={{ color: "#111827" }}>
                {visaSummary.approvalRate.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-[#E5E7EB] pt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "#9CA3AF" }}>{t("adminDashboard.visaTotal")}</span>
              <span className="font-medium tabular-nums" style={{ color: "#111827" }}>
                {visaSummary.totalApplications.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "#9CA3AF" }}>{t("adminDashboard.visaApproved")}</span>
              <span className="font-medium tabular-nums" style={{ color: "#10B981" }}>
                {visaSummary.approved.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "#9CA3AF" }}>{t("adminDashboard.visaRejected")}</span>
              <span className="font-medium tabular-nums" style={{ color: "#EF4444" }}>
                {visaSummary.rejected.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Nationalities */}
        <div
          className="bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[130px]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-5" style={{ color: "#9CA3AF" }}>
            {t("adminDashboard.customerNationality")}
          </p>
          <MetricLegend items={nationalities} colors={PALETTE} />
        </div>
      </div>
    </div>
  );
}

export { DashboardVisaPanel };
