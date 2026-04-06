"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import Chart from "@/components/ui/Chart";
import ChartCard from "./ChartCard";
import { MetricLegend } from "./ui/MetricLegend";
import { createDonutOptions } from "../utils/chartOptions";
import type { AdminDashboard } from "@/types/admin";

interface DashboardSidebarPanelProps {
  dashboard: AdminDashboard;
  t: (key: string) => string;
}

const ACCENT = "#F97316";

const PALETTE = [
  ACCENT,
  "#10B981",
  "#EF4444",
  "#3B82F6",
  "#9CA3AF",
  "#F59E0B",
] as const;

const QUICK_ACTIONS = [
  { labelKey: "adminDashboard.quickActionCreateTour",     icon: "heroicons:plus",           href: "/tour-management?create=true" },
  { labelKey: "adminDashboard.quickActionScheduleTour",   icon: "heroicons:calendar",        href: "/tour-instances/create" },
  { labelKey: "adminDashboard.quickActionViewBookings",   icon: "heroicons:eye",             href: "/dashboard/bookings" },
  { labelKey: "adminDashboard.quickActionEditSiteContent", icon: "heroicons:document-text",  href: "/dashboard/site-content" },
  { labelKey: "adminDashboard.quickActionManageVisa",     icon: "heroicons:shield-check",    href: "/dashboard/visa" },
];

export default function DashboardSidebarPanel({ dashboard, t }: DashboardSidebarPanelProps) {
  const { revenueByRegion, bookingStatusDistribution } = dashboard;

  const regionOptions = useMemo(
    () => createDonutOptions(revenueByRegion.map((i) => i.label), [...PALETTE]),
    [revenueByRegion]
  );
  const regionSeries = useMemo(
    () => revenueByRegion.map((i) => Number(i.value)),
    [revenueByRegion]
  );

  const bookingOptions = useMemo(
    () => createDonutOptions(bookingStatusDistribution.map((i) => i.label), [...PALETTE]),
    [bookingStatusDistribution]
  );
  const bookingSeries = useMemo(
    () => bookingStatusDistribution.map((i) => Number(i.value)),
    [bookingStatusDistribution]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
      {/* Region donut lg:col-span-5 */}
      <ChartCard
        title={t("adminDashboard.chartByRegion")}
        delay={2}
        className="lg:col-span-5"
      >
        <div className="flex items-center gap-8 mt-2">
          <Chart options={regionOptions} series={regionSeries} type="donut" height={160} width={160} />
          <div className="flex-1">
            <MetricLegend items={revenueByRegion} colors={PALETTE} />
          </div>
        </div>
      </ChartCard>

      {/* Booking donut lg:col-span-3 */}
      <ChartCard
        title={t("adminDashboard.chartBookingStatus")}
        delay={3}
        className="lg:col-span-3"
      >
        <div className="flex items-center gap-8 mt-2">
          <Chart options={bookingOptions} series={bookingSeries} type="donut" height={140} width={140} />
          <div className="flex-1">
            <MetricLegend items={bookingStatusDistribution} colors={PALETTE} />
          </div>
        </div>
      </ChartCard>

      {/* Quick Actions lg:col-span-4 */}
      <div
        className="bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[300px] flex flex-col transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        style={{ animationDelay: "200ms" }}
      >
        <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-5" style={{ color: "#9CA3AF" }}>
          Quick Actions
        </h3>
        <div className="flex flex-col gap-2 flex-1">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.labelKey}
              href={action.href}
              className="flex items-center gap-3 py-3.5 px-4 rounded-xl border transition-all duration-150 group"
              style={{
                backgroundColor: "white",
                borderColor: "#E5E7EB",
                color: "#6B7280",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "rgba(249,115,22,0.2)";
                el.style.backgroundColor = "rgba(249,115,22,0.03)";
                el.style.transform = "translateX(3px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "#E5E7EB";
                el.style.backgroundColor = "white";
                el.style.transform = "translateX(0)";
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <Icon icon={action.icon} className="size-4" style={{ color: "#9CA3AF" }} />
              </div>
              <span className="text-sm font-medium">{t(action.labelKey)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export { DashboardSidebarPanel };
