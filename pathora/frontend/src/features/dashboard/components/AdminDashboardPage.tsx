"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { AdminSidebar, TopBar } from "./AdminSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardStats } from "./DashboardStats";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardSidebarPanel } from "./DashboardSidebarPanel";
import { DashboardVisaPanel } from "./DashboardVisaPanel";
import { DashboardAlerts } from "./DashboardAlerts";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { useDashboardData } from "../hooks/useDashboardData";

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { data: dashboard, isLoading, error, refetch } = useDashboardData();

  return (
    <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <main id="main-content" className="p-6 lg:py-8 lg:pr-8 lg:pl-6" style={{ backgroundColor: "#F1F5F9", minHeight: "100vh" }}>

        <DashboardHeader
          isLoading={isLoading}
          onRefresh={refetch}
        />

        {isLoading && <DashboardSkeleton />}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{t("adminDashboard.noData")}</p>
            <button
              onClick={refetch}
              className="px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: "#111827", color: "#FFFFFF" }}
            >
              {t("adminDashboard.refresh")}
            </button>
          </div>
        )}

        {!isLoading && !error && !dashboard && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{t("adminDashboard.noData")}</p>
          </div>
        )}

        {!isLoading && !error && dashboard && (
          <>
            <DashboardStats dashboard={dashboard} t={t} />
            <DashboardCharts dashboard={dashboard} t={t} />
            <DashboardSidebarPanel dashboard={dashboard} t={t} />
            <DashboardVisaPanel dashboard={dashboard} t={t} />
            <DashboardAlerts dashboard={dashboard} t={t} />
          </>
        )}
      </main>
    </AdminSidebar>
  );
}

export default AdminDashboardPage;
