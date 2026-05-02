"use client";

/**
 * PublicTourBookingAssignmentPanel
 *
 * Dành riêng cho tour PUBLIC — nơi có nhiều bookings độc lập.
 *
 * Phân bổ phòng khách sạn (per-booking):
 * 1. Manager đã assign hotel supplier cho activity
 * 2. Hotel provider duyệt + block tổng số phòng
 * 3. TourOperator phân bổ số phòng đã block xuống từng booking dựa trên số khách
 *    (tổng các phân bổ ≤ số phòng đã block)
 *
 * Vé phương tiện (Flight/Train/Boat) gán per-booking qua ExternalTicketAssignmentPanel.
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { Icon } from "@/components/ui";
import type { AdminBookingListResponse } from "@/api/services/bookingService";
import ExternalTicketAssignmentPanel from "./ExternalTicketAssignmentPanel";
import type { BookingTicketEntry } from "./ExternalTicketAssignmentPanel";
import type { BookingRoomAssignmentDto } from "@/api/services/tourInstanceService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomAssignmentEntry {
  bookingId: string;
  customerName: string;
  /** Số người lớn + trẻ em + em bé */
  guestCount: number;
  /** Số phòng đề xuất theo guest count */
  roomsSuggested: number;
  /** Số phòng TourOperator phân bổ */
  roomCount: number;
  /** Loại phòng được giao */
  roomType: string;
  /** Số phòng / tên phòng cụ thể (optional, ghi sau khi check-in) */
  roomNumbers: string;
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
  instanceType: string;
  bookings: AdminBookingListResponse[];
  bookingsLoading: boolean;
  accommodationActivities: AccommodationActivityInfo[];
  externalTransportActivities: ExternalTransportActivityInfo[];
  onSaveTicket?: (activityId: string, entry: BookingTicketEntry) => Promise<void>;
  onConfirmExternalTransport?: (activityId: string) => Promise<void>;
  /** Save 1 booking room assignment to backend */
  onSaveRoomAssignment?: (
    activityId: string,
    payload: {
      bookingId: string;
      roomType: string;
      roomCount: number;
      roomNumbers?: string | null;
      note?: string | null;
    },
  ) => Promise<void>;
  /** Load existing assignments for an activity */
  onLoadRoomAssignments?: (activityId: string) => Promise<BookingRoomAssignmentDto[]>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Ước lượng số phòng theo loại phòng và số khách */
function suggestRoomCount(adults: number, children: number, roomType: string): number {
  const total = adults + Math.ceil(children / 2);
  const capacityByType: Record<string, number> = {
    single: 1,
    double: 2,
    twin: 2,
    triple: 3,
    quad: 4,
    family: 4,
    suite: 2,
    dormitory: 8,
    villa: 6,
    standard: 2,
    deluxe: 2,
    vip: 2,
    other: 2,
  };
  const cap = capacityByType[roomType?.toLowerCase()] ?? 2;
  return Math.max(1, Math.ceil(total / cap));
}

// ─── Sub-component: Accommodation per-booking ─────────────────────────────────

function AccommodationBookingCard({
  activity,
  bookings,
  onSaveRoomAssignment,
  onLoadRoomAssignments,
}: {
  activity: AccommodationActivityInfo;
  bookings: AdminBookingListResponse[];
  onSaveRoomAssignment?: Props["onSaveRoomAssignment"];
  onLoadRoomAssignments?: Props["onLoadRoomAssignments"];
}) {
  const defaultRoomType = activity.roomType ?? "Standard";

  const [entries, setEntries] = useState<Record<string, RoomAssignmentEntry>>(() => {
    const init: Record<string, RoomAssignmentEntry> = {};
    for (const b of bookings) {
      const adults = b.numberAdult ?? 0;
      const children = b.numberChild ?? 0;
      const suggested = suggestRoomCount(adults, children, defaultRoomType);
      init[b.id] = {
        bookingId: b.id,
        customerName: b.customerName,
        guestCount: adults + children + (b.numberInfant ?? 0),
        roomsSuggested: suggested,
        roomCount: suggested,
        roomType: defaultRoomType,
        roomNumbers: "",
        note: "",
      };
    }
    return init;
  });

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load existing assignments
  useEffect(() => {
    if (!onLoadRoomAssignments) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await onLoadRoomAssignments(activity.activityId);
        if (cancelled) return;
        if (existing.length === 0) return;
        setEntries((prev) => {
          const next = { ...prev };
          for (const dto of existing) {
            if (next[dto.bookingId]) {
              next[dto.bookingId] = {
                ...next[dto.bookingId],
                roomCount: dto.roomCount,
                roomType: typeof dto.roomType === "string" ? dto.roomType : String(dto.roomType),
                roomNumbers: dto.roomNumbers ?? "",
                note: dto.note ?? "",
              };
            }
          }
          return next;
        });
        setSavedIds(new Set(existing.map((d) => d.bookingId)));
      } catch {
        if (cancelled) return;
        setLoadError("Không thể tải phân bổ đã lưu trước đó");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activity.activityId, onLoadRoomAssignments]);

  // Tổng số phòng đã phân bổ (ngoại trừ booking đang edit) — dùng validate
  const totalAssigned = useMemo(
    () => Object.values(entries).filter((e) => savedIds.has(e.bookingId)).reduce((sum, e) => sum + e.roomCount, 0),
    [entries, savedIds],
  );

  const updateEntry = useCallback(
    (bookingId: string, field: keyof RoomAssignmentEntry, value: string | number) => {
      setEntries((prev) => ({ ...prev, [bookingId]: { ...prev[bookingId], [field]: value } }));
    },
    [],
  );

  const handleSave = async (bookingId: string) => {
    const entry = entries[bookingId];
    if (!entry) return;
    if (entry.roomCount <= 0) {
      toast.warning("Số phòng phải lớn hơn 0");
      return;
    }

    // Validate: tổng phòng phân bổ không vượt block total
    const otherAssigned = Object.values(entries)
      .filter((e) => e.bookingId !== bookingId && savedIds.has(e.bookingId))
      .reduce((sum, e) => sum + e.roomCount, 0);
    if (activity.roomBlocksTotal > 0 && otherAssigned + entry.roomCount > activity.roomBlocksTotal) {
      toast.error(
        `Tổng số phòng phân bổ (${otherAssigned + entry.roomCount}) vượt quá số phòng đã giữ (${activity.roomBlocksTotal}).`,
      );
      return;
    }

    if (!onSaveRoomAssignment) {
      toast.warning("Chức năng lưu chưa được kết nối");
      return;
    }

    try {
      setSavingId(bookingId);
      await onSaveRoomAssignment(activity.activityId, {
        bookingId: entry.bookingId,
        roomType: entry.roomType,
        roomCount: entry.roomCount,
        roomNumbers: entry.roomNumbers.trim() || null,
        note: entry.note.trim() || null,
      });
      setSavedIds((prev) => new Set([...prev, bookingId]));
      toast.success(`Đã lưu phân bổ phòng cho ${entry.customerName}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Không thể lưu phân bổ phòng");
    } finally {
      setSavingId(null);
    }
  };

  const allSaved = bookings.every((b) => savedIds.has(b.id));
  const isApproved = activity.supplierApprovalStatus?.toLowerCase() === "approved";
  const remaining = Math.max(0, activity.roomBlocksTotal - totalAssigned);

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
              {activity.roomType && (
                <span className="text-stone-500"> · {activity.roomType}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
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
          <span className="text-[10px] text-stone-400">
            {activity.roomBlocksTotal > 0
              ? `Đã giữ ${activity.roomBlocksTotal} phòng · Còn ${remaining}`
              : `Cần ${activity.quantity} phòng`}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              allSaved
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            {savedIds.size}/{bookings.length} đã phân bổ
          </span>
        </div>
      </div>

      {/* Warning */}
      {!isApproved && (
        <div className="flex items-start gap-3 px-6 py-4 bg-orange-50/50 border-b border-orange-100 text-sm text-orange-800">
          <Icon icon="heroicons:exclamation-triangle" className="size-5 shrink-0 mt-0.5 text-orange-500" />
          <span className="leading-relaxed">
            Khách sạn chưa duyệt activity này. Cần chờ duyệt trước khi phân bổ phòng.
          </span>
        </div>
      )}
      {loadError && (
        <div className="flex items-start gap-3 px-6 py-3 bg-rose-50 border-b border-rose-100 text-sm text-rose-700">
          <Icon icon="heroicons:x-circle" className="size-5 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Per-booking list */}
      <div className="divide-y divide-stone-100">
        {bookings.map((booking, index) => {
          const entry = entries[booking.id];
          const isSaved = savedIds.has(booking.id);
          const isSaving = savingId === booking.id;

          return (
            <div
              key={booking.id}
              className={`p-6 transition-colors ${isSaved ? "bg-emerald-50/20" : "bg-white hover:bg-stone-50/30"}`}
            >
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
                      {entry.guestCount} khách · đề xuất {entry.roomsSuggested} phòng
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Room count */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Số phòng *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={entry.roomCount}
                    onChange={(e) =>
                      updateEntry(booking.id, "roomCount", Math.max(1, Number(e.target.value) || 1))
                    }
                    disabled={!isApproved}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-stone-50 disabled:text-stone-400"
                  />
                  {entry.roomCount !== entry.roomsSuggested && (
                    <p className="mt-1.5 text-xs text-orange-600">
                      Đề xuất: {entry.roomsSuggested}
                    </p>
                  )}
                </div>

                {/* Room type */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Loại phòng
                  </label>
                  <select
                    value={entry.roomType}
                    onChange={(e) => updateEntry(booking.id, "roomType", e.target.value)}
                    disabled={!isApproved}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-white disabled:bg-stone-50 disabled:text-stone-400"
                  >
                    {[
                      "Single",
                      "Double",
                      "Twin",
                      "Triple",
                      "Quad",
                      "Family",
                      "Suite",
                      "Dormitory",
                      "Villa",
                      "Standard",
                      "Deluxe",
                      "VIP",
                      "Other",
                    ].map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room numbers */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Số phòng cụ thể
                  </label>
                  <input
                    type="text"
                    value={entry.roomNumbers}
                    onChange={(e) => updateEntry(booking.id, "roomNumbers", e.target.value)}
                    disabled={!isApproved}
                    placeholder="VD: 201, 202"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-stone-50"
                  />
                </div>

                {/* Note + Save */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Ghi chú
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={entry.note}
                      onChange={(e) => updateEntry(booking.id, "note", e.target.value)}
                      disabled={!isApproved}
                      placeholder="Yêu cầu đặc biệt..."
                      className="flex-1 rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-stone-50"
                    />
                    <button
                      onClick={() => handleSave(booking.id)}
                      disabled={!isApproved || isSaving}
                      className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSaved
                          ? "bg-stone-100 text-stone-600 hover:bg-stone-200 focus-visible:outline-stone-500"
                          : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm focus-visible:outline-orange-500"
                      }`}
                    >
                      <Icon
                        icon={
                          isSaving
                            ? "heroicons:arrow-path"
                            : isSaved
                            ? "heroicons:check-circle"
                            : "heroicons:check"
                        }
                        className={`size-4 ${isSaving ? "animate-spin" : ""}`}
                      />
                      {isSaving ? "Đang lưu..." : isSaved ? "Cập nhật" : "Lưu"}
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
            Đã phân bổ phòng cho tất cả {bookings.length} booking · Tổng {totalAssigned}/{activity.roomBlocksTotal} phòng
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
  onSaveRoomAssignment,
  onLoadRoomAssignments,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>(
    accommodationActivities.length > 0 ? "accommodation" : "external-transport",
  );

  const isPublic = instanceType?.toLowerCase() === "public";
  if (!isPublic) return null;
  if (accommodationActivities.length === 0 && externalTransportActivities.length === 0) return null;

  const hasAccom = accommodationActivities.length > 0;
  const hasExternal = externalTransportActivities.length > 0;

  return (
    <section className="rounded-[1.5rem] border border-stone-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden mt-8">
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
            <span
              className={`rounded-full text-[11px] font-bold px-2 py-0.5 ml-1 ${
                activeTab === "accommodation" ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-600"
              }`}
            >
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
            <span
              className={`rounded-full text-[11px] font-bold px-2 py-0.5 ml-1 ${
                activeTab === "external-transport" ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-600"
              }`}
            >
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
            {(!hasExternal || activeTab === "accommodation") && hasAccom && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-[1.5rem] bg-orange-50/80 border border-orange-200/60 p-5 shadow-sm text-sm text-orange-800">
                  <Icon icon="heroicons:information-circle" className="size-5 shrink-0 mt-0.5 text-orange-500" />
                  <div className="leading-relaxed">
                    <p className="font-semibold mb-1 text-base tracking-tight">Phân bổ phòng cho từng booking</p>
                    <p className="max-w-[65ch] text-orange-700">
                      Hotel supplier đã được chọn và đã duyệt block tổng số phòng. Tại đây, bạn phân bổ
                      <strong> số phòng cụ thể</strong> cho từng booking dựa trên số khách. Tổng các phân bổ phải nằm trong số phòng đã giữ.
                    </p>
                  </div>
                </div>

                {accommodationActivities.map((activity) => (
                  <AccommodationBookingCard
                    key={activity.activityId}
                    activity={activity}
                    bookings={bookings}
                    onSaveRoomAssignment={onSaveRoomAssignment}
                    onLoadRoomAssignments={onLoadRoomAssignments}
                  />
                ))}
              </div>
            )}

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
                        activityId={activity.activityId}
                        activityTitle={activity.title}
                        transportType={activity.transportType}
                        bookings={bookings}
                        activityDate={activity.date}
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
