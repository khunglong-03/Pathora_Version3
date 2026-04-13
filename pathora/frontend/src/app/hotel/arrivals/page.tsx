"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PlusIcon } from "@phosphor-icons/react";
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
import ArrivalDetailModal from "@/components/hotel/ArrivalDetailModal";

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

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ArrivalsPage() {
  const [arrivals, setArrivals] = useState<GuestArrivalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("today");

  const [selectedArrival, setSelectedArrival] = useState<GuestArrivalItem | null>(null);

  const [showSubmit, setShowSubmit] = useState(false);
  const [submitBookingId, setSubmitBookingId] = useState("");
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guidInvalid, setGuidInvalid] = useState(false);

  const loadArrivals = useCallback(async (tab: FilterTab) => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      let params: Parameters<typeof hotelProviderService.getGuestArrivals>[0] = {};

      if (tab === "today") {
        params = { dateFrom: today, dateTo: today };
      } else if (tab === "week") {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        params = {
          dateFrom: today,
          dateTo: weekEnd.toISOString().split("T")[0],
        };
      } else if (tab === "checkedin") {
        params = { status: "CheckedIn" };
      } else if (tab === "checkedout") {
        params = { status: "CheckedOut" };
      }

      const data = await hotelProviderService.getGuestArrivals(params);
      setArrivals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load arrivals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArrivals(activeTab);
  }, [activeTab, loadArrivals]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const handleSubmit = async () => {
    const trimmed = submitBookingId.trim();
    setGuidInvalid(!GUID_PATTERN.test(trimmed));
    if (!trimmed || !GUID_PATTERN.test(trimmed)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await hotelProviderService.submitGuestArrival({
        bookingAccommodationDetailId: trimmed,
        participantIds: [],
        note: submitNotes || undefined,
      });
      setShowSubmit(false);
      setSubmitBookingId("");
      setSubmitNotes("");
      setGuidInvalid(false);
      await loadArrivals(activeTab);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Gửi thông tin thất bại",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleArrivalRefresh = () => {
    void loadArrivals(activeTab);
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Check-in khách"
        subtitle="Danh sách check-in"
        onRefresh={() => void loadArrivals(activeTab)}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 mt-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => void handleTabChange(tab.value)}
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
            <PlusIcon size={16} />
            Gửi thông tin check-in
          </button>
        </div>
      </div>

      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadArrivals(activeTab)} />
      )}

      {!error && !isLoading && arrivals.length === 0 && (
        <AdminEmptyState
          icon="CalendarCheck"
          heading="Không có check-in nào"
          description="Không tìm thấy check-in nào cho bộ lọc đã chọn."
        />
      )}

      {!error && !isLoading && arrivals.length > 0 && (
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
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {arrivals.map((arrival) => {
                const cfg = STATUS_CONFIG[arrival.status];
                return (
                  <tr
                    key={arrival.id}
                    className="border-t cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => setSelectedArrival(arrival)}
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedArrival(arrival); }}
                        className="text-xs px-2 py-1 rounded border transition-colors hover:bg-gray-100"
                        style={{ borderColor: "var(--border)" }}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Arrival Detail Modal */}
      {selectedArrival && (
        <ArrivalDetailModal
          arrival={selectedArrival}
          onClose={() => setSelectedArrival(null)}
          onRefresh={handleArrivalRefresh}
        />
      )}

      {/* Submit Modal */}
      <Modal
        isOpen={showSubmit}
        onClose={() => { setShowSubmit(false); setSubmitError(null); setGuidInvalid(false); setSubmitBookingId(""); setSubmitNotes(""); }}
        title="Gửi thông tin check-in"
        className="max-w-md"
      >
        <div className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
              {submitError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">
              Booking Accommodation Detail ID
            </label>
            <input
              type="text"
              value={submitBookingId}
              onChange={(e) => {
                setSubmitBookingId(e.target.value);
                setGuidInvalid(false);
              }}
              placeholder="VD: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
              className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
              style={{ borderColor: guidInvalid ? "#EF4444" : "var(--border)" }}
            />
            {guidInvalid && (
              <p className="text-xs mt-1" style={{ color: "#EF4444" }}>
                Vui lòng nhập đúng định dạng GUID (ví dụ: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
              </p>
            )}
            <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
              Nhận booking ID từ Manager qua email/chat. Booking ID là GUID (36 ký tự).
            </p>
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
              onClick={() => { setShowSubmit(false); setSubmitError(null); setGuidInvalid(false); setSubmitBookingId(""); setSubmitNotes(""); }}
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
