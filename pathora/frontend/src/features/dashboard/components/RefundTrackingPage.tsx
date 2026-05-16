"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { bookingService } from "@/api/services/bookingService";
import type { AdminBookingListResponse } from "@/api/services/bookingService";
import type { RefundStatusString } from "@/types/booking";
import { handleApiError } from "@/utils/apiResponse";

type Tab = "Pending" | "Contacted" | "Refunded" | "All";

const TABS: Tab[] = ["Pending", "Contacted", "Refunded", "All"];

const formatVND = (value: number | null | undefined): string => {
  if (value == null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const daysSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const REFUND_BADGE_CLASS: Record<RefundStatusString, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-300",
  Contacted: "bg-blue-100 text-blue-800 border-blue-300",
  Refunded: "bg-emerald-100 text-emerald-800 border-emerald-300",
  NotApplicable: "bg-gray-100 text-gray-700 border-gray-300",
};

export function RefundTrackingPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("Pending");
  const [bookings, setBookings] = useState<AdminBookingListResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const refundStatus =
        activeTab === "All" ? undefined : (activeTab as RefundStatusString);
      const response = await bookingService.getAllBookings({
        page,
        pageSize,
        refundStatus,
      });
      const items =
        (response as { result?: { items?: AdminBookingListResponse[] } } | undefined)?.result?.items ??
        (response as { items?: AdminBookingListResponse[] } | undefined)?.items ??
        [];
      setBookings(items);
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message, apiError.message));
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize, t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleMarkContacted = async (bookingId: string) => {
    setUpdatingId(bookingId);
    try {
      await bookingService.updateRefundStatus(bookingId, "Contacted");
      toast.success(
        t("refundTracking.action.markedContacted", "Đã đánh dấu đã liên hệ")
      );
      await fetchBookings();
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message, apiError.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkRefunded = async (bookingId: string) => {
    setUpdatingId(bookingId);
    try {
      await bookingService.updateRefundStatus(bookingId, "Refunded");
      toast.success(
        t("refundTracking.action.markedRefunded", "Đã đánh dấu hoàn tiền")
      );
      await fetchBookings();
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message, apiError.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    if (activeTab === "All") return bookings;
    return bookings.filter((b) => b.refundStatus === activeTab);
  }, [bookings, activeTab]);

  const renderRow = (b: AdminBookingListResponse) => {
    const status: RefundStatusString = b.refundStatus ?? "NotApplicable";
    const age = daysSince(b.cancelledAt ?? null);
    const isStale = status === "Pending" && age != null && age > 7;
    return (
      <tr
        key={b.id}
        className={`border-b transition hover:bg-gray-50 ${
          isStale ? "bg-red-50" : ""
        }`}
      >
        <td className="px-4 py-3 text-sm">{b.tourName}</td>
        <td className="px-4 py-3 text-sm font-medium">{b.customerName}</td>
        <td className="px-4 py-3 text-sm">
          {b.customerPhone ? (
            <a
              href={`tel:${b.customerPhone}`}
              className="text-blue-600 hover:underline"
            >
              {b.customerPhone}
            </a>
          ) : (
            "—"
          )}
        </td>
        <td className="px-4 py-3 text-sm">
          {b.customerEmail ? (
            <a
              href={`mailto:${b.customerEmail}`}
              className="text-blue-600 hover:underline"
            >
              {b.customerEmail}
            </a>
          ) : (
            "—"
          )}
        </td>
        <td className="px-4 py-3 text-right text-sm font-semibold">
          {formatVND(b.refundOutstandingAmount ?? null)}
        </td>
        <td className="px-4 py-3 text-sm">
          {formatDate(b.cancelledAt ?? null)}
          {isStale && (
            <span className="ml-2 inline-block rounded bg-red-200 px-2 py-0.5 text-xs font-medium text-red-900">
              {t("refundTracking.stale", "> 7 ngày")}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-sm">
          <span
            className={`inline-block rounded border px-2 py-1 text-xs font-medium ${REFUND_BADGE_CLASS[status]}`}
          >
            {t(`booking.refundStatus.${status.toLowerCase()}`, status)}
          </span>
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex gap-2">
            {status === "Pending" && (
              <button
                type="button"
                onClick={() => handleMarkContacted(b.id)}
                disabled={updatingId === b.id}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {t("refundTracking.action.markContacted", "Đã liên hệ")}
              </button>
            )}
            {status === "Contacted" && (
              <button
                type="button"
                onClick={() => handleMarkRefunded(b.id)}
                disabled={updatingId === b.id}
                className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {t("refundTracking.action.markRefunded", "Đã hoàn tiền")}
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">
        {t("refundTracking.title", "Theo dõi hoàn tiền")}
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        {t(
          "refundTracking.subtitle",
          "Danh sách booking bị huỷ cần liên hệ khách hoàn tiền. Click số điện thoại để gọi trực tiếp."
        )}
      </p>

      <div className="mb-4 flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t(`refundTracking.tabs.${tab.toLowerCase()}`, tab)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("refundTracking.col.tour", "Tour")}</th>
              <th className="px-4 py-3">{t("refundTracking.col.customer", "Khách hàng")}</th>
              <th className="px-4 py-3">{t("refundTracking.col.phone", "Điện thoại")}</th>
              <th className="px-4 py-3">{t("refundTracking.col.email", "Email")}</th>
              <th className="px-4 py-3 text-right">
                {t("refundTracking.col.amount", "Số tiền cần hoàn")}
              </th>
              <th className="px-4 py-3">{t("refundTracking.col.cancelledAt", "Ngày huỷ")}</th>
              <th className="px-4 py-3">{t("refundTracking.col.status", "Trạng thái")}</th>
              <th className="px-4 py-3">{t("refundTracking.col.action", "Hành động")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                  {t("common.loading", "Đang tải...")}
                </td>
              </tr>
            )}
            {!loading && filteredBookings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                  {t("refundTracking.empty", "Không có booking nào trong trạng thái này.")}
                </td>
              </tr>
            )}
            {!loading && filteredBookings.map(renderRow)}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          {t("common.previous", "Trước")}
        </button>
        <span className="text-sm text-gray-600">
          {t("common.page", "Trang")} {page}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={filteredBookings.length < pageSize || loading}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          {t("common.next", "Sau")}
        </button>
      </div>
    </div>
  );
}
