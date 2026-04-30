"use client";

/**
 * PublicTourBookingAssignmentPanel
 *
 * Dành riêng cho tour PUBLIC — nơi có nhiều bookings độc lập.
 *
 * Logic phân bổ:
 * ─ Xe (Bus/Car): đi chung → KHÔNG hiện ở đây (gán ở mức instance, đã có)
 * ─ ✈️ Vé ngoài (Flight/Train/Boat): mỗi booking cần vé riêng → per-order (ExternalTicketAssignmentPanel)
 * ─ 🏨 Phòng khách sạn: mỗi booking có phòng riêng → TourOperator ghi số phòng cụ thể per-order
 *
 * NOTE: "Ghi số phòng" là operation phía TourOperator (tracking nội bộ, frontend-only lưu local
 * hoặc gọi note API nếu có). Backend không có endpoint riêng để gán số phòng theo booking —
 * room blocking (số lượng phòng) đã được hotel provider làm ở HotelTourAssignmentPage.
 */

import React, { useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { Icon } from "@/components/ui";
import type { AdminBookingListResponse } from "@/api/services/bookingService";
import ExternalTicketAssignmentPanel from "./ExternalTicketAssignmentPanel";
import type { BookingTicketEntry } from "./ExternalTicketAssignmentPanel";
import type { TourInstanceDayActivityDto } from "@/types/tour";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomBookingEntry {
  bookingId: string;
  customerName: string;
  /** Số người lớn + trẻ em (không tính infant) */
  guestCount: number;
  infantCount: number;
  /** Số phòng yêu cầu (tính theo guestCount) */
  roomsNeeded: number;
  /** Số phòng cụ thể / tên phòng TourOperator ghi */
  roomNumbers: string;
  /** Loại phòng được giao */
  roomType: string;
  /** Ghi chú */
  note: string;
}

interface AccommodationActivityInfo {
  activityId: string;
  title: string;
  date: string;
  dayNumber: number;
  /** Tổng phòng đã block (hotel đã duyệt) */
  roomBlocksTotal: number;
  /** Số phòng yêu cầu của activity */
  quantity: number;
  roomType: string | null;
  supplierName: string | null;
  supplierApprovalStatus: string | null;
}

interface ExternalTransportActivityInfo {
  activityId: string;
  title: string;
  date: string;
  dayNumber: number;
  transportType: "Flight" | "Train" | "Boat";
  confirmed: boolean;
}

interface Props {
  instanceId: string;
  instanceType: string; // "public" | "private"
  bookings: AdminBookingListResponse[];
  bookingsLoading: boolean;
  /** Accommodation activities */
  accommodationActivities: AccommodationActivityInfo[];
  /** External transport activities (Flight/Train/Boat) */
  externalTransportActivities: ExternalTransportActivityInfo[];
  onSaveTicket?: (activityId: string, entry: BookingTicketEntry) => Promise<void>;
  onConfirmExternalTransport?: (activityId: string) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROOMS_PER_COUPLE = 1; // 2 adults share 1 room (default)

function calcRoomsNeeded(adults: number, children: number): number {
  // Default: every 2 adults share 1 room; each child adds 0.5 room
  // Operators can override via the roomNumbers field
  const raw = Math.ceil(adults / 2) + Math.ceil(children / 2);
  return Math.max(1, raw);
}

// ─── Sub-component: Accommodation per-booking ─────────────────────────────────

function AccommodationBookingCard({
  activity,
  bookings,
}: {
  activity: AccommodationActivityInfo;
  bookings: AdminBookingListResponse[];
}) {
  const [entries, setEntries] = useState<Record<string, RoomBookingEntry>>(() => {
    const init: Record<string, RoomBookingEntry> = {};
    for (const b of bookings) {
      const adults = b.numberAdult ?? 0;
      const children = b.numberChild ?? 0;
      init[b.id] = {
        bookingId: b.id,
        customerName: b.customerName,
        guestCount: adults + children,
        infantCount: b.numberInfant ?? 0,
        roomsNeeded: calcRoomsNeeded(adults, children),
        roomNumbers: "",
        roomType: activity.roomType ?? "",
        note: "",
      };
    }
    return init;
  });

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(bookings[0]?.id ?? null);

  const updateEntry = useCallback(
    (bookingId: string, field: keyof RoomBookingEntry, value: string | number) => {
      setEntries((prev) => ({ ...prev, [bookingId]: { ...prev[bookingId], [field]: value } }));
    },
    []
  );

  const handleSave = (bookingId: string) => {
    const entry = entries[bookingId];
    if (!entry) return;
    if (!entry.roomNumbers.trim()) {
      toast.warning("Vui lòng nhập số phòng hoặc tên phòng được giao");
      return;
    }
    setSavedIds((prev) => new Set([...prev, bookingId]));
    toast.success(`Đã ghi nhận phòng cho ${entry.customerName}`);
    // Move to next unsaved (not needed if no accordion, but keeping logic for completeness)
    const next = bookings.find((b) => b.id !== bookingId && !savedIds.has(b.id));
  };

  const allSaved = bookings.every((b) => savedIds.has(b.id));
  const isApproved = activity.supplierApprovalStatus?.toLowerCase() === "approved";

  return (
    <div className="rounded-[1.5rem] border border-stone-200/50 bg-white overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-6 py-5 bg-[#F8F8F6] border-b border-stone-100">
        <div className="flex items-start gap-2">
          <Icon icon="heroicons:building-office-2" className="size-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-base font-semibold tracking-tight text-stone-900">{activity.title}</p>
            <p className="text-sm text-stone-500 mt-1">
              Ngày {activity.dayNumber} ·{" "}
              {activity.supplierName ? (
                <span className="text-amber-700 font-medium">{activity.supplierName}</span>
              ) : (
                <span className="text-stone-400 italic">Chưa giao khách sạn</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {/* Hotel approval status */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isApproved
                ? "bg-emerald-100 text-emerald-700"
                : activity.supplierApprovalStatus?.toLowerCase() === "rejected"
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            <Icon
              icon={
                isApproved
                  ? "heroicons:check-circle"
                  : activity.supplierApprovalStatus?.toLowerCase() === "rejected"
                  ? "heroicons:x-circle"
                  : "heroicons:clock"
              }
              className="size-3"
            />
            {isApproved
              ? "Khách sạn đã duyệt"
              : activity.supplierApprovalStatus?.toLowerCase() === "rejected"
              ? "Khách sạn từ chối"
              : "Chờ khách sạn duyệt"}
          </span>
          {/* Room block info */}
          <span className="text-[10px] text-stone-400">
            {activity.roomBlocksTotal > 0
              ? `Đã giữ ${activity.roomBlocksTotal}/${activity.quantity} phòng`
              : `Cần ${activity.quantity} phòng`}
          </span>
          {/* Room assignment progress */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              allSaved
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            {savedIds.size}/{bookings.length} đã ghi số phòng
          </span>
        </div>
      </div>

      {/* Warning if hotel not approved yet */}
      {!isApproved && (
        <div className="flex items-start gap-3 px-6 py-4 bg-orange-50/50 border-b border-orange-100 text-sm text-orange-800">
          <Icon icon="heroicons:exclamation-triangle" className="size-5 shrink-0 mt-0.5 text-orange-500" />
          <span className="leading-relaxed">
            Khách sạn chưa xác nhận phòng. Bạn vẫn có thể ghi trước số phòng dự kiến, nhưng cần khách sạn duyệt trước khi xác nhận với khách.
          </span>
        </div>
      )}

      {/* Per-booking Flat List */}
      <div className="divide-y divide-stone-100">
        {bookings.map((booking, index) => {
          const entry = entries[booking.id];
          const isSaved = savedIds.has(booking.id);

          return (
            <div key={booking.id} className={`p-6 transition-colors ${isSaved ? "bg-emerald-50/20" : "bg-white hover:bg-stone-50/30"}`}>
              {/* Row Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`size-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      isSaved ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {isSaved ? <Icon icon="heroicons:check" className="size-4" /> : index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-stone-900 truncate">{booking.customerName}</p>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {entry.guestCount} khách · cần ~{entry.roomsNeeded} phòng
                      {entry.infantCount > 0 && (
                        <span className="ml-1 text-orange-600">· {entry.infantCount} em bé</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Room numbers input */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Số phòng / Tên phòng *
                  </label>
                  <input
                    type="text"
                    value={entry.roomNumbers}
                    onChange={(e) => updateEntry(booking.id, "roomNumbers", e.target.value)}
                    placeholder={`VD: 201 202`}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  {entry.roomNumbers && (
                    <p className="mt-1.5 text-xs text-stone-500">
                      {entry.roomNumbers.trim().split(/\s+/).filter(Boolean).length} phòng đã nhập
                      {entry.roomsNeeded > 0 &&
                        entry.roomNumbers.trim().split(/\s+/).filter(Boolean).length !== entry.roomsNeeded && (
                          <span className="ml-1 text-orange-600">
                            (dự kiến cần {entry.roomsNeeded} phòng)
                          </span>
                        )}
                    </p>
                  )}
                </div>

                {/* Room type */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Loại phòng
                  </label>
                  <input
                    type="text"
                    value={entry.roomType}
                    onChange={(e) => updateEntry(booking.id, "roomType", e.target.value)}
                    placeholder="Standard / Deluxe..."
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Note */}
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Ghi chú
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={entry.note}
                      onChange={(e) => updateEntry(booking.id, "note", e.target.value)}
                      placeholder="Yêu cầu đặc biệt..."
                      className="flex-1 rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    <button
                      onClick={() => handleSave(booking.id)}
                      className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                        isSaved
                          ? "bg-stone-100 text-stone-600 hover:bg-stone-200 focus-visible:outline-stone-500"
                          : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm focus-visible:outline-orange-500"
                      }`}
                    >
                      <Icon
                        icon={isSaved ? "heroicons:check-circle" : "heroicons:check"}
                        className="size-4"
                      />
                      {isSaved ? "Đã lưu" : "Lưu"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      {allSaved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-t border-emerald-100">
          <Icon icon="heroicons:check-badge" className="size-4 text-emerald-600" />
          <p className="text-xs font-semibold text-emerald-700">
            Đã ghi số phòng cho tất cả {bookings.length} booking trong activity này
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type TabType = "accommodation" | "external-transport";

export default function PublicTourBookingAssignmentPanel({
  instanceType,
  bookings,
  bookingsLoading,
  accommodationActivities,
  externalTransportActivities,
  onSaveTicket,
  onConfirmExternalTransport,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>(
    accommodationActivities.length > 0 ? "accommodation" : "external-transport"
  );

  const isPublic = instanceType?.toLowerCase() === "public";

  // Public tour only
  if (!isPublic) return null;

  // Nothing to show
  if (accommodationActivities.length === 0 && externalTransportActivities.length === 0) {
    return null;
  }

  const hasAccom = accommodationActivities.length > 0;
  const hasExternal = externalTransportActivities.length > 0;

  return (
    <section className="rounded-[1.5rem] border border-stone-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden mt-8">
      {/* Section header */}
      <div className="px-6 py-5 border-b border-stone-100 bg-[#F8F8F6]">
        <div className="flex items-center gap-3">
          <Icon icon="heroicons:clipboard-document-list" className="size-6 text-stone-600" />
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">
            Phân bổ Per-booking
          </h2>
        </div>
        <p className="mt-2 text-sm text-stone-500 max-w-[65ch]">
          Tour public có nhiều order độc lập — phòng khách sạn và vé phương tiện phải gán riêng cho từng booking.
          (Xe đi chung không hiển thị ở đây vì đã gán chung ở trên).
        </p>
      </div>

      {/* Tabs */}
      {hasAccom && hasExternal && (
        <div className="flex border-b border-stone-100 px-2">
          <button
            onClick={() => setActiveTab("accommodation")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "accommodation"
                ? "border-orange-500 text-orange-600 bg-orange-50/50"
                : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            }`}
          >
            <Icon icon="heroicons:building-office-2" className="size-4.5" />
            Phòng khách sạn
            <span className={`rounded-full text-[11px] font-bold px-2 py-0.5 ml-1 ${activeTab === 'accommodation' ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-600'}`}>
              {accommodationActivities.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("external-transport")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "external-transport"
                ? "border-blue-500 text-blue-700 bg-blue-50/50"
                : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            }`}
          >
            <Icon icon="heroicons:ticket" className="size-4.5" />
            Vé phương tiện
            <span className={`rounded-full text-[11px] font-bold px-2 py-0.5 ml-1 ${activeTab === 'external-transport' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'}`}>
              {externalTransportActivities.length}
            </span>
          </button>
        </div>
      )}

      <div className="p-6 md:p-8 bg-stone-50/30">
        {bookingsLoading ? (
          <div className="flex items-center gap-3 py-8 justify-center text-stone-400 text-sm">
            <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
            Đang tải danh sách booking...
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-sm">
            <Icon icon="heroicons:users" className="mx-auto mb-2 size-8 opacity-40" />
            <p>Chưa có booking nào cho tour instance này.</p>
          </div>
        ) : (
          <>
            {/* ── Accommodation tab ── */}
            {(!hasExternal || activeTab === "accommodation") && hasAccom && (
              <div className="space-y-5">
                {/* Context note */}
                <div className="flex items-start gap-3 rounded-[1.5rem] bg-orange-50/80 border border-orange-200/60 p-5 shadow-sm text-sm text-orange-800">
                  <Icon icon="heroicons:information-circle" className="size-5 shrink-0 mt-0.5 text-orange-500" />
                  <div className="leading-relaxed">
                    <p className="font-semibold mb-1 text-base tracking-tight">Ghi số phòng cho từng khách</p>
                    <p className="max-w-[65ch] text-orange-700">
                      Tại đây, bạn ghi cụ thể
                      <strong> số phòng / tên phòng</strong> được phân cho từng booking để hiển thị trên app/vé của khách hàng. Việc này độc lập với việc nhà cung cấp giữ chỗ tổng.
                    </p>
                  </div>
                </div>

                {accommodationActivities.map((activity) => (
                  <AccommodationBookingCard
                    key={activity.activityId}
                    activity={activity}
                    bookings={bookings}
                  />
                ))}
              </div>
            )}

            {/* ── External Transport tab ── */}
            {(!hasAccom || activeTab === "external-transport") && hasExternal && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-[1.5rem] bg-blue-50/80 border border-blue-200/60 p-5 shadow-sm text-sm text-blue-800">
                  <Icon icon="heroicons:information-circle" className="size-5 shrink-0 mt-0.5 text-blue-500" />
                  <div className="leading-relaxed">
                    <p className="font-semibold mb-1 text-base tracking-tight">Gán vé phương tiện per-booking</p>
                    <p className="max-w-[65ch] text-blue-700">
                      Mỗi booking cần vé riêng. Nhập đủ thông tin chuyến bay / tàu / thuyền cho từng khách.
                      (Xe di chuyển đi chung không xuất hiện ở đây).
                    </p>
                  </div>
                </div>

                {externalTransportActivities.map((activity) => (
                  <div key={activity.activityId} className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                    {/* Activity header */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon={
                            activity.transportType === "Flight"
                              ? "heroicons:paper-airplane"
                              : activity.transportType === "Train"
                              ? "heroicons:arrow-right"
                              : "heroicons:globe-alt"
                          }
                          className="size-4 text-blue-600 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-stone-800">{activity.title}</p>
                          <p className="text-xs text-stone-500">Ngày {activity.dayNumber}</p>
                        </div>
                      </div>
                      {activity.confirmed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5">
                          <Icon icon="heroicons:check-circle" className="size-3" />
                          Đã xác nhận
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <ExternalTicketAssignmentPanel
                        activityTitle={activity.title}
                        transportType={activity.transportType}
                        bookings={bookings}
                        onSave={(entry) => onSaveTicket?.(activity.activityId, entry)}
                        onConfirmAll={() => onConfirmExternalTransport?.(activity.activityId)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
