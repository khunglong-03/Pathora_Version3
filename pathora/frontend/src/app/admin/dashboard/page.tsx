"use client";

import React, { useCallback, useEffect, useState } from "react";
import { adminService } from "@/api/services/adminService";
import type { AdminDashboardOverview } from "@/types/admin";
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminRecentActivity,
  AdminErrorCard,
} from "@/features/dashboard/components";
import { SkeletonTable } from "@/components/ui/SkeletonTable";

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const data = await adminService.getDashboardOverview();

    if (!data) {
      setError("Không thể tải dữ liệu tổng quan. Vui lòng thử lại.");
    } else {
      setOverview(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const kpis = overview
    ? [
        {
          label: "Tổng người dùng",
          value: (overview.totalUsers ?? 0).toString(),
          icon: "Users",
          accent: "#C9873A",
        },
        {
          label: "Đang hoạt động",
          value: (overview.activeUsers ?? 0).toString(),
          icon: "CheckCircle",
          accent: "#22C55E",
        },
        {
          label: "Quản lý",
          value: (overview.totalManagers ?? 0).toString(),
          icon: "UserCircle",
          accent: "#2563EB",
        },
        {
          label: "Nhà cung cấp VT",
          value: (overview.totalTransportProviders ?? 0).toString(),
          icon: "Van",
          accent: "#0D9488",
        },
        {
          label: "Nhà cung cấp KS",
          value: (overview.totalHotelProviders ?? 0).toString(),
          icon: "Bed",
          accent: "#EA580C",
        },
      ]
    : [];

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Admin Dashboard"
        subtitle="Tổng quan hệ thống"
        onRefresh={loadOverview}
      />

      {isLoading && <SkeletonTable rows={6} columns={5} />}

      {!isLoading && error && (
        <AdminErrorCard message={error} onRetry={loadOverview} />
      )}

      {!isLoading && !error && overview && (
        <>
          <AdminKpiStrip kpis={kpis} />

          {/* Recent Activities */}
          <div className="mt-8">
            <h2 className="text-base font-semibold mb-4" style={{ color: "#111827" }}>
              Hoạt động gần đây
            </h2>
            <div
              className="rounded-xl border bg-white p-5"
              style={{
                boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
              }}
            >
              <AdminRecentActivity
                activities={overview.recentActivities}
                maxItems={10}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
