"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import {
  adminHotelService,
  type BookingAccommodationDetailItem,
  type PaginatedHotelList,
} from "@/api/services/adminHotelService";
import {
  AdminPageHeaderIcon,
  AdminKpiStripIcon,
  AdminFilterTabsIcon,
  AdminEmptyStateIcon,
  AdminErrorCardIcon,
} from "@/features/dashboard/components";
import TextInput from "@/components/ui/TextInput";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { Bed, CalendarIcon, UsersIcon, TicketIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { formatDate } from "@/utils/format";

type StatusFilter = "all" | "Confirmed" | "Pending" | "Cancelled" | "Completed";

const STATUS_TABS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Đã xác nhận", value: "Confirmed" },
  { label: "Chờ xử lý", value: "Pending" },
  { label: "Đã hủy", value: "Cancelled" },
  { label: "Hoàn thành", value: "Completed" },
];

export default function BookingAccommodationListPage() {
  const [bookings, setBookings] = useState<BookingAccommodationDetailItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = {
      page: currentPage,
      limit: 20,
      search: debouncedSearch || undefined,
      ...(statusFilter !== "all" && { status: statusFilter }),
    };

    try {
      const result = await adminHotelService.getBookingAccommodationDetails(params);
      if (result) {
        setBookings(result.items);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } else {
        setBookings([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking accommodation details");
      setBookings([]);
    }
    setIsLoading(false);
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const handleRefresh = () => setReloadToken((t) => t + 1);

  const confirmedCount = bookings.filter((b) => b.status === "Confirmed").length;
  const pendingCount = bookings.filter((b) => b.status === "Pending").length;

  const kpis = [
    {
      label: "Tổng đặt phòng",
      value: total.toString(),
      icon: "TicketIcon",
      accent: "#EA580C",
    },
    {
      label: "Đã xác nhận",
      value: confirmedCount.toString(),
      icon: "CheckCircle",
      accent: "#22C55E",
    },
    {
      label: "Chờ xử lý",
      value: pendingCount.toString(),
      icon: "Hourbar",
      accent: "#C9873A",
    },
  ];

  return (
    <div className="p-6">
      <AdminPageHeaderIcon
        title="Đặt phòng Lưu trú"
        subtitle="Danh sách đặt phòng khách sạn"
        onRefresh={handleRefresh}
      />

      {/* KPI Strip */}
      <AdminKpiStripIcon kpis={kpis} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <AdminFilterTabsIcon
          tabs={STATUS_TABS}
          activeValue={statusFilter}
          onChange={(v) => { setStatusFilter(v as StatusFilter); setCurrentPage(1); }}
        />
        <div className="w-full md:w-72">
          <TextInput
            type="text"
            placeholder="Tìm khách sạn, mã đơn..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            icon="MagnifyingGlass"
            hasicon={false}
          />
        </div>
      </div>

      {/* Content */}
      {error && <AdminErrorCardIcon message={error} onRetry={handleRefresh} />}

      {!error && !isLoading && bookings.length === 0 && (
        <AdminEmptyStateIcon
          icon="TicketIcon"
          heading="Không có đặt phòng"
          description="Không tìm thấy dữ liệu đặt phòng lưu trú."
        />
      )}

      {!error && !isLoading && bookings.length > 0 && (
        <>
          <div className="rounded-xl border bg-white overflow-hidden" style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Khách sạn</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Loại phòng</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Check-in</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Check-out</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Phòng/Khách</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Trạng thái</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, idx) => {
                  const statusColors: Record<string, { bg: string; text: string }> = {
                    Confirmed: { bg: "#DCFCE7", text: "#16A34A" },
                    Pending: { bg: "#FEF3C7", text: "#D97706" },
                    Cancelled: { bg: "#FEE2E2", text: "#DC2626" },
                    Completed: { bg: "#EDE9FE", text: "#7C3AED" },
                  };
                  const statusStyle = statusColors[booking.status] ?? { bg: "#F3F4F6", text: "#6B7280" };
                  return (
                    <tr
                      key={booking.id}
                      className="transition-colors duration-150 hover:bg-stone-50"
                      style={{ borderBottom: idx < bookings.length - 1 ? "1px solid #F3F4F6" : undefined }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: "#FFEDD5" }}
                          >
                            <Bed size={18} weight="fill" style={{ color: "#EA580C" }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "#111827" }}>
                              {booking.supplierName ?? booking.accommodationName ?? "—"}
                            </p>
                            {booking.orderNumber && (
                              <p className="text-xs" style={{ color: "#9CA3AF" }}>{booking.orderNumber}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "#374151" }}>{booking.roomType}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CalendarIcon size={14} style={{ color: "#9CA3AF" }} />
                          <span className="text-sm" style={{ color: "#374151" }}>
                            {booking.checkInDate ? formatDate(booking.checkInDate) : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CalendarIcon size={14} style={{ color: "#9CA3AF" }} />
                          <span className="text-sm" style={{ color: "#374151" }}>
                            {booking.checkOutDate ? formatDate(booking.checkOutDate) : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <UsersIcon size={14} style={{ color: "#9CA3AF" }} />
                          <span className="text-sm" style={{ color: "#374151" }}>
                            {booking.roomCount}/{booking.guestCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className="inline-flex min-w-[5rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link href={`/admin/bookings/accommodation/${booking.id}`}>
                          <span
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200"
                            style={{ backgroundColor: "#F9FAFB", color: "#6B7280", border: "1px solid #E5E7EB" }}
                          >
                            Chi tiết <ArrowRightIcon size={12} weight="bold" />
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                handlePageChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </>
      )}

      {isLoading && (
        <div className="rounded-xl border bg-white p-5" style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}>
          <SkeletonTable rows={8} columns={7} />
        </div>
      )}
    </div>
  );
}