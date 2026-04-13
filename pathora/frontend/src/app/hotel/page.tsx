"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BedIcon, CalendarCheckIcon, ClockCountdownIcon, DoorOpenIcon, PlusIcon, ListChecksIcon } from "@phosphor-icons/react";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import type {
  AccommodationItem,
  GuestArrivalItem,
  GuestStayStatus,
} from "@/api/services/hotelProviderService";
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";

const STATUS_COLOR: Record<GuestStayStatus, string> = {
  Pending: "#C9873A",
  CheckedIn: "#22C55E",
  CheckedOut: "#3B82F6",
  NoShow: "#EF4444",
};

export default function HotelDashboardPage() {
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [recentArrivals, setRecentArrivals] = useState<GuestArrivalItem[]>([]);
  const [availableRooms, setAvailableRooms] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [accommodationsData, arrivalsData, availabilityData] = await Promise.all([
        hotelProviderService.getAccommodations(),
        hotelProviderService.getGuestArrivals({}),
        hotelProviderService.getRoomAvailability(today, today),
      ]);
      setAccommodations(accommodationsData);
      setAvailableRooms(
        availabilityData.reduce((sum, a) => sum + a.availableRooms, 0),
      );
      setRecentArrivals(
        arrivalsData
          .sort(
            (a, b) =>
              new Date(b.submittedAt ?? 0).getTime() -
              new Date(a.submittedAt ?? 0).getTime(),
          )
          .slice(0, 5),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalRooms = accommodations.reduce(
    (sum, acc) => sum + acc.totalRooms,
    0,
  );
  const pendingArrivals = recentArrivals.filter(
    (a) => a.status === "Pending",
  ).length;
  const today = new Date().toISOString().split("T")[0];
  const todayCheckins = recentArrivals.filter(
    (a) =>
      a.checkInDate?.startsWith(today) && a.status === "Pending",
  ).length;

  const kpis = [
    {
      label: "Tổng phòng",
      value: totalRooms.toString(),
      icon: "BedIcon",
      accent: "#6366F1",
    },
    {
      label: "Đang trống",
      value: availableRooms < 0 ? "-" : availableRooms.toString(),
      icon: "DoorOpenIcon",
      accent: "#22C55E",
    },
    {
      label: "Check-in hôm nay",
      value: todayCheckins.toString(),
      icon: "CalendarCheckIcon",
      accent: "#F59E0B",
    },
    {
      label: "Chờ check-in",
      value: pendingArrivals.toString(),
      icon: "ClockCountdownIcon",
      accent: "#C9873A",
    },
  ];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="KS của tôi"
        subtitle="Quản lý khách sạn"
        onRefresh={() => void loadData()}
      />

      {/* KPI Strip */}
      <AdminKpiStrip kpis={kpis} />

      {/* Quick Actions */}
      <div className="flex gap-4 mb-6 mt-6">
        <Link
          href="/hotel/rooms"
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-white transition-all duration-200 hover:opacity-90"
          style={{ backgroundColor: "#6366F1" }}
        >
          <BedIcon size={18} />
          Quản lý phòng
        </Link>
        <Link
          href="/hotel/arrivals"
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 border hover:opacity-80"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <ListChecksIcon size={18} />
          Check-in khách
        </Link>
      </div>

      {/* Content */}
      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadData()} />
      )}

      {!error && !isLoading && accommodations.length === 0 && (
        <AdminEmptyState
          icon="BedIcon"
          heading="Chưa có phòng nào"
          description="Hãy thêm loại phòng để bắt đầu quản lý khách sạn."
          action={
            <Link
              href="/hotel/rooms"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm"
              style={{ backgroundColor: "#6366F1" }}
            >
              <PlusIcon size={16} />
              Thêm loại phòng
            </Link>
          }
        />
      )}

      {!error && !isLoading && recentArrivals.length > 0 && (
        <div className="mt-6">
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Check-in gần đây
          </h3>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "white",
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wider"
                  style={{ color: "#9CA3AF", backgroundColor: "#F8FAFC" }}
                >
                  <th className="px-4 py-3 font-medium">Booking ID</th>
                  <th className="px-4 py-3 font-medium">Khách</th>
                  <th className="px-4 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 font-medium">Check-out</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentArrivals.map((arrival) => (
                  <tr
                    key={arrival.id}
                    className="border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {arrival.bookingAccommodationDetailId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      {arrival.accommodationName ?? "-"}
                    </td>
                    <td className="px-4 py-3">{formatDate(arrival.checkInDate)}</td>
                    <td className="px-4 py-3">
                      {formatDate(arrival.checkOutDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${STATUS_COLOR[arrival.status]}20`,
                          color: STATUS_COLOR[arrival.status],
                        }}
                      >
                        {arrival.status === "Pending" && "Chờ"}
                        {arrival.status === "CheckedIn" && "Đã check-in"}
                        {arrival.status === "CheckedOut" && "Đã check-out"}
                        {arrival.status === "NoShow" && "Không đến"}
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
