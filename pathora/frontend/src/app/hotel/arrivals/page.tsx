"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import type {
  GuestArrivalItem,
  GuestStayStatus,
} from "@/api/services/hotelProviderService";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import Modal from "@/components/ui/Modal";

const STATUS_CONFIG: Record<
  GuestStayStatus,
  { label: string; color: string; bg: string }
> = {
  Pending: { label: "Chờ", color: "#C9873A", bg: "#FEF3C7" },
  CheckedIn: { label: "Đã check-in", color: "#22C55E", bg: "#DCFCE7" },
  CheckedOut: { label: "Đã check-out", color: "#3B82F6", bg: "#DBEAFE" },
  NoShow: { label: "Không đến", color: "#EF4444", bg: "#FEE2E2" },
};

type FilterTab = "all" | "today" | "week" | "checkedin" | "checkedout";

const TABS: Array<{ label: string; value: FilterTab }> = [
  { label: "Tất cả", value: "all" },
  { label: "Hôm nay", value: "today" },
  { label: "Tuần này", value: "week" },
  { label: "Đã check-in", value: "checkedin" },
  { label: "Đã check-out", value: "checkedout" },
];

export default function ArrivalsPage() {
  const [arrivals, setArrivals] = useState<GuestArrivalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("today");

  const [showSubmit, setShowSubmit] = useState(false);
  const [submitBookingId, setSubmitBookingId] = useState("");
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadArrivals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await hotelProviderService.getGuestArrivals({});
      setArrivals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load arrivals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArrivals();
  }, [loadArrivals]);

  const filtered = arrivals.filter((a) => {
    const today = new Date().toISOString().split("T")[0];
    const checkIn = a.checkInDate?.split("T")[0];
    if (activeTab === "today") return checkIn === today;
    if (activeTab === "week") {
      if (!checkIn) return false;
      const d = new Date(checkIn);
      const now = new Date(today);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return d >= now && d <= weekEnd;
    }
    if (activeTab === "checkedin") return a.status === "CheckedIn";
    if (activeTab === "checkedout") return a.status === "CheckedOut";
    return true;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const handleSubmit = async () => {
    if (!submitBookingId.trim()) return;
    setSubmitting(true);
    try {
      await hotelProviderService.submitGuestArrival({
        bookingAccommodationDetailId: submitBookingId.trim(),
        participantIds: [],
        note: submitNotes || undefined,
      });
      setShowSubmit(false);
      setSubmitBookingId("");
      setSubmitNotes("");
      await loadArrivals();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Check-in khách"
        subtitle="Danh sách check-in"
        onRefresh={() => void loadArrivals()}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 mt-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              activeTab === tab.value
                ? { backgroundColor: "#6366F1", color: "white" }
                : {
                    backgroundColor: "transparent",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#6366F1" }}
          >
            <Plus size={16} />
            Gửi thông tin check-in
          </button>
        </div>
      </div>

      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadArrivals()} />
      )}

      {!error && !isLoading && filtered.length === 0 && (
        <AdminEmptyState
          icon="CalendarCheck"
          heading="Không có check-in nào"
          description="Không tìm thấy check-in nào cho bộ lọc đã chọn."
        />
      )}

      {!error && !isLoading && filtered.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wider"
                style={{ color: "#9CA3AF", backgroundColor: "#F8FAFC" }}
              >
                <th className="px-4 py-3 font-medium">Booking ID</th>
                <th className="px-4 py-3 font-medium">Số khách</th>
                <th className="px-4 py-3 font-medium">Check-in</th>
                <th className="px-4 py-3 font-medium">Check-out</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ngày gửi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((arrival) => {
                const cfg = STATUS_CONFIG[arrival.status];
                return (
                  <tr
                    key={arrival.id}
                    className="border-t cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {arrival.bookingAccommodationDetailId.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3">{arrival.participantCount}</td>
                    <td className="px-4 py-3">{formatDate(arrival.checkInDate)}</td>
                    <td className="px-4 py-3">{formatDate(arrival.checkOutDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(arrival.submittedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit Modal */}
      <Modal
        activeModal={showSubmit}
        onClose={() => setShowSubmit(false)}
        title="Gửi thông tin check-in"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Booking Accommodation Detail ID
            </label>
            <input
              type="text"
              value={submitBookingId}
              onChange={(e) => setSubmitBookingId(e.target.value)}
              placeholder="Nhập ID booking"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={submitNotes}
              onChange={(e) => setSubmitNotes(e.target.value)}
              placeholder="Nhập ghi chú..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowSubmit(false)}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: "var(--border)" }}
            >
              Hủy
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting || !submitBookingId.trim()}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ backgroundColor: "#6366F1" }}
            >
              {submitting ? "Đang gửi..." : "Gửi"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
