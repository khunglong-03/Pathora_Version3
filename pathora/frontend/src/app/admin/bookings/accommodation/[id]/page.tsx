"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminHotelService, type BookingAccommodationDetailFull, type BookingGuestDetail } from "@/api/services/adminHotelService";
import { AdminPageHeader } from "@/features/dashboard/components";
import { AdminErrorCard } from "@/features/dashboard/components";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { Bed, CalendarIcon, UsersIcon, TicketIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { formatDate } from "@/utils/format";

export default function BookingAccommodationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<BookingAccommodationDetailFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminHotelService.getBookingAccommodationDetail(id);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking accommodation detail");
      setDetail(null);
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetail();
  }, [loadDetail]);

  const handleRefresh = () => setReloadToken((t) => t + 1);

  if (isLoading) {
    return (
      <div className="p-6">
        <AdminPageHeader
          title="Chi tiết Đặt phòng"
          backHref="/admin/bookings"
          onRefresh={handleRefresh}
        />
        <div className="rounded-xl border bg-white p-6" style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}>
          <SkeletonTable rows={6} columns={4} />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6">
        <AdminPageHeader
          title="Chi tiết Đặt phòng"
          backHref="/admin/bookings"
          onRefresh={handleRefresh}
        />
        <AdminErrorCard message={error ?? "Không tìm thấy dữ liệu"} onRetry={handleRefresh} />
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    Confirmed: { bg: "#DCFCE7", text: "#16A34A" },
    Pending: { bg: "#FEF3C7", text: "#D97706" },
    Cancelled: { bg: "#FEE2E2", text: "#DC2626" },
    Completed: { bg: "#EDE9FE", text: "#7C3AED" },
  };
  const statusStyle = statusColors[detail.status] ?? { bg: "#F3F4F6", text: "#6B7280" };

  const guestStatusColors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "#FEF3C7", text: "#D97706" },
    CheckedIn: { bg: "#DCFCE7", text: "#16A34A" },
    CheckedOut: { bg: "#EDE9FE", text: "#7C3AED" },
    NoShow: { bg: "#FEE2E2", text: "#DC2626" },
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Chi tiết Đặt phòng"
        subtitle={detail.accommodationName ?? "—"}
        backHref="/admin/bookings"
        onRefresh={handleRefresh}
      />

      {/* Booking Info Card */}
      <div
        className="rounded-xl border bg-white p-6 mb-6"
        style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#FFEDD5" }}
            >
              <Bed size={24} weight="fill" style={{ color: "#EA580C" }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#111827" }}>
                {detail.accommodationName ?? "—"}
              </h2>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {detail.supplierName ?? "—"}
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: statusStyle.text }}
            />
            {detail.status}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {detail.orderNumber && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TicketIcon size={14} style={{ color: "#9CA3AF" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                  Mã đơn
                </p>
              </div>
              <p className="text-sm font-medium" style={{ color: "#111827" }}>{detail.orderNumber}</p>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon size={14} style={{ color: "#9CA3AF" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                Check-in
              </p>
            </div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>
              {detail.checkInDate ? formatDate(detail.checkInDate) : "—"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon size={14} style={{ color: "#9CA3AF" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                Check-out
              </p>
            </div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>
              {detail.checkOutDate ? formatDate(detail.checkOutDate) : "—"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UsersIcon size={14} style={{ color: "#9CA3AF" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                Số phòng / Khách
              </p>
            </div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>
              {detail.roomCount} phòng / {detail.guestCount} khách
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
              Loại phòng
            </p>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{detail.roomType}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
              Booking ID
            </p>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{detail.bookingId}</p>
          </div>
          {detail.createdAt && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
                Ngày tạo
              </p>
              <p className="text-sm font-medium" style={{ color: "#111827" }}>{formatDate(detail.createdAt)}</p>
            </div>
          )}
          {detail.notes && (
            <div className="col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
                Ghi chú
              </p>
              <p className="text-sm" style={{ color: "#374151" }}>{detail.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Guest Details */}
      <div
        className="rounded-xl border bg-white overflow-hidden"
        style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}
      >
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#374151" }}>
            Danh sách khách ({detail.guestDetails.length})
          </h3>
        </div>
        {detail.guestDetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UsersIcon size={32} style={{ color: "#D1D5DB" }} />
            <p className="text-sm font-medium mt-3" style={{ color: "#9CA3AF" }}>Chưa có thông tin khách</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Họ tên</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Số hộ chiếu</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Quốc tịch</th>
                <th className="text-center px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {detail.guestDetails.map((guest, idx) => {
                const gs = guestStatusColors[guest.status] ?? { bg: "#F3F4F6", text: "#6B7280" };
                return (
                  <tr
                    key={guest.id}
                    className="transition-colors duration-150 hover:bg-stone-50"
                    style={{ borderBottom: idx < detail.guestDetails.length - 1 ? "1px solid #F3F4F6" : undefined }}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium" style={{ color: "#111827" }}>{guest.fullName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: guest.passportNumber ? "#374151" : "#9CA3AF" }}>
                        {guest.passportNumber ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: "#374151" }}>{guest.nationality ?? "—"}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className="inline-flex min-w-[5rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: gs.bg, color: gs.text }}
                      >
                        {guest.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
