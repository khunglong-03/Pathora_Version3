"use client";

import { StatCard } from "./StatCard";
import type { AdminDashboard } from "@/types/admin";

interface DashboardStatsProps {
  dashboard: AdminDashboard;
  t: (key: string) => string;
}

export function DashboardStats({ dashboard, t }: DashboardStatsProps) {
  const { stats } = dashboard;

  return (
    <>
      {/* Row 1: 4 equal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <StatCard
          labelKey={t("adminDashboard.statTotalRevenue")}
          value={`$${Math.round(stats.totalRevenue).toLocaleString()}`}
          icon="heroicons:currency-dollar"
          accent="#F97316"
          eyebrow="Revenue"
          subtext={t("adminDashboard.statRevenueSubtext")}
          delay={0}
        />
        <StatCard
          labelKey={t("adminDashboard.statTotalBookings")}
          value={stats.totalBookings.toLocaleString()}
          icon="heroicons:clipboard-document-list"
          accent="#10B981"
          eyebrow="Bookings"
          delay={1}
        />
        <StatCard
          labelKey={t("adminDashboard.statActiveTours")}
          value={stats.activeTours.toLocaleString()}
          icon="heroicons:globe-alt"
          accent="#3B82F6"
          eyebrow="Tours"
          delay={2}
        />
        <StatCard
          labelKey={t("adminDashboard.statTotalCustomers")}
          value={stats.totalCustomers.toLocaleString()}
          icon="heroicons:user-group"
          accent="#9CA3AF"
          eyebrow="Customers"
          delay={3}
        />
      </div>

      {/* Row 2: 2 KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <StatCard
          labelKey={t("adminDashboard.statCancellationRate")}
          value={`${stats.cancellationRate.toFixed(1)}%`}
          icon="heroicons:x-circle"
          accent="#EF4444"
          eyebrow="Cancellation"
          delay={4}
        />
        <StatCard
          labelKey={t("adminDashboard.statVisaApproval")}
          value={`${stats.visaApprovalRate.toFixed(1)}%`}
          icon="heroicons:shield-check"
          accent="#F97316"
          eyebrow="Visa"
          delay={5}
        />
      </div>
    </>
  );
}
