"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  UsersThree,
  ListChecks,
  Plus,
  Truck,
  TrafficCone,
} from "@phosphor-icons/react";
import { transportProviderService, type TripAssignment } from "@/api/services/transportProviderService";
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";

const TRIP_STATUS_COLOR: Record<string, string> = {
  Pending: "#C9873A",
  InProgress: "#3B82F6",
  Completed: "#22C55E",
  Rejected: "#EF4444",
  Cancelled: "#9CA3AF",
};

const TRIP_STATUS_LABEL: Record<string, string> = {
  Pending: "Chờ xác nhận",
  InProgress: "Đang thực hiện",
  Completed: "Hoàn thành",
  Rejected: "Từ chối",
  Cancelled: "Đã hủy",
};

export default function TransportDashboardPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<import("@/api/services/transportProviderService").Vehicle[]>([]);
  const [drivers, setDrivers] = useState<import("@/api/services/transportProviderService").Driver[]>([]);
  const [tripAssignments, setTripAssignments] = useState<TripAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [vehiclesData, driversData, tripsData] = await Promise.all([
        transportProviderService.getVehicles(),
        transportProviderService.getDrivers(),
        transportProviderService.getTripAssignments(),
      ]);
      setVehicles(vehiclesData);
      setDrivers(driversData);
      setTripAssignments(tripsData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void loadData();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const totalVehicles = vehicles.length;
  const activeDrivers = drivers.filter((d) => d.isActive).length;
  const today = new Date().toISOString().split("T")[0];
  const tripsToday = tripAssignments.filter((t) => t.tripDate?.startsWith(today)).length;
  const pendingAssignments = tripAssignments.filter((t) => t.status === "Pending").length;

  const kpis = [
    {
      label: "Tổng xe",
      value: totalVehicles.toString(),
      icon: "Car",
      accent: "#6366F1",
    },
    {
      label: "Tài xế hoạt động",
      value: activeDrivers.toString(),
      icon: "UsersThree",
      accent: "#22C55E",
    },
    {
      label: "Chuyến hôm nay",
      value: tripsToday.toString(),
      icon: "Truck",
      accent: "#F59E0B",
    },
    {
      label: "Chờ xác nhận",
      value: pendingAssignments.toString(),
      icon: "ListChecks",
      accent: "#C9873A",
    },
  ];

  const recentTrips = [...tripAssignments]
    .sort((a, b) => new Date(b.tripDate ?? 0).getTime() - new Date(a.tripDate ?? 0).getTime())
    .slice(0, 5);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="VT của tôi"
        subtitle="Quản lý đội xe"
        onRefresh={() => void loadData()}
      />

      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadData()} />
      )}

      {/* KPI Strip */}
      <AdminKpiStrip kpis={kpis} />

      {/* Quick Actions */}
      <div className="flex gap-4 mb-6 mt-6">
        <Link
          href="/transport/vehicles"
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-white transition-all duration-200 hover:opacity-90"
          style={{ backgroundColor: "#6366F1" }}
        >
          <Car size={18} />
          Quản lý xe
        </Link>
        <Link
          href="/transport/drivers"
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 border hover:opacity-80"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <UsersThree size={18} />
          Quản lý tài xế
        </Link>
        <Link
          href="/transport/trips"
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 border hover:opacity-80"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <ListChecks size={18} />
          Phân công chuyến
        </Link>
      </div>

      {/* Empty State */}
      {!error && !isLoading && vehicles.length === 0 && drivers.length === 0 && (
        <AdminEmptyState
          icon="Truck"
          heading="Chưa có phương tiện nào"
          description="Hãy thêm phương tiện và tài xế để bắt đầu quản lý đội xe."
          action={
            <Link
              href="/transport/vehicles"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm"
              style={{ backgroundColor: "#6366F1" }}
            >
              <Plus size={16} />
              Thêm xe
            </Link>
          }
        />
      )}

      {/* Recent Trip Assignments */}
      {!error && !isLoading && recentTrips.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Phân công gần đây
            </h3>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>
              Cập nhật: {lastRefresh.toLocaleTimeString("vi-VN")}
            </span>
          </div>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "white",
            }}
          >
            <table className="w-full text-sm" role="table" aria-label="Phân công gần đây">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wider"
                  style={{ color: "#9CA3AF", backgroundColor: "#F8FAFC" }}
                >
                  <th className="px-4 py-3 font-medium">Mã chuyến</th>
                  <th className="px-4 py-3 font-medium">Tuyến đường</th>
                  <th className="px-4 py-3 font-medium">Ngày</th>
                  <th className="px-4 py-3 font-medium">Xe</th>
                  <th className="px-4 py-3 font-medium">Tài xế</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip) => (
                  <tr
                    key={trip.id}
                    className="border-t cursor-pointer transition-colors duration-150 hover:bg-gray-50"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => {
                      router.push(`/transport/trips`);
                    }}
                    role="row"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        router.push(`/transport/trips`);
                      }
                    }}
                    aria-label={`Chuyến ${trip.id} đến ${trip.route}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{trip.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium">{trip.route ?? "-"}</td>
                    <td className="px-4 py-3">{formatDate(trip.tripDate)}</td>
                    <td className="px-4 py-3">{trip.vehiclePlate ?? "-"}</td>
                    <td className="px-4 py-3">{trip.driverName ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${TRIP_STATUS_COLOR[trip.status] ?? "#9CA3AF"}20`,
                          color: TRIP_STATUS_COLOR[trip.status] ?? "#9CA3AF",
                        }}
                        role="status"
                        aria-label={`Trạng thái: ${TRIP_STATUS_LABEL[trip.status] ?? trip.status}`}
                      >
                        {TRIP_STATUS_LABEL[trip.status] ?? trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
