"use client";

import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Icon } from "@/components/ui";
import type { AdminBookingListResponse } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TicketDetail {
  paxIndex: number;
  seatNumber: string;
  eTicketNumber: string;
}

export interface BookingTicketEntry {
  bookingId: string;
  customerName: string;
  /** Số ghế cần thiết = adult + child + infant */
  requiredSeats: number;
  /** Dữ liệu form người dùng nhập */
  flightNumber: string;    // VD: VN 123
  departureAt: string;     // datetime-local input
  arrivalAt: string;       // datetime-local input
  tickets: TicketDetail[];
  seatClass: string;       // Economy / Business / First
  note: string;
}

interface Props {
  /** Activity title (e.g. "Chuyến bay HAN → SGN") */
  activityTitle: string;
  /** Loại phương tiện: "Flight" | "Train" | "Boat" */
  transportType: "Flight" | "Train" | "Boat";
  /** Danh sách bookings của instance */
  bookings: AdminBookingListResponse[];
  /** Callback khi TourOperator lưu vé cho 1 booking */
  onSave?: (entry: BookingTicketEntry) => Promise<void>;
  /** Callback khi tất cả booking đã được gán vé */
  onConfirmAll?: () => Promise<void>;
  /** Đang loading */
  loading?: boolean;
  /** Ngày diễn ra hoạt động (YYYY-MM-DD) */
  activityDate?: string;
  /** ID của activity */
  activityId?: string;
  /** ID của tour instance để gọi API */
  instanceId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const transportLabel: Record<string, string> = {
  Flight: "✈️ Máy bay",
  Train: "🚄 Tàu hỏa",
  Boat: "🚢 Tàu thuyền",
};

const seatClassOptions = ["Economy", "Business", "First Class", "Sleeper", "Seat"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExternalTicketAssignmentPanel({
  activityTitle,
  transportType,
  bookings,
  onSave,
  onConfirmAll,
  loading = false,
  activityDate,
  activityId,
  instanceId,
}: Props) {
  const [dataLoading, setDataLoading] = useState(false);
  const [commonDetails, setCommonDetails] = useState({
    flightNumber: "",
    seatClass: "Economy",
    departureAt: "",
    arrivalAt: "",
  });
  // Local state: form entries per booking
  const [entries, setEntries] = useState<Record<string, BookingTicketEntry>>(() => {
    const init: Record<string, BookingTicketEntry> = {};
    for (const b of bookings) {
      const requiredSeats = (b.numberAdult ?? 0) + (b.numberChild ?? 0) + (b.numberInfant ?? 0);
      init[b.id.toLowerCase()] = {
        bookingId: b.id.toLowerCase(),
        customerName: b.customerName,
        requiredSeats,
        flightNumber: "",
        departureAt: "",
        arrivalAt: "",
        tickets: Array.from({ length: Math.max(requiredSeats, 1) }).map((_, i) => ({
          paxIndex: i + 1,
          seatNumber: "",
          eTicketNumber: "",
        })),
        seatClass: "Economy",
        note: "",
      };
    }
    return init;
  });

  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [confirmingAll, setConfirmingAll] = useState(false);

  // Khôi phục từ DB khi mount
  React.useEffect(() => {
    if (!activityId || !instanceId) return;
    let isMounted = true;
    const fetchTickets = async () => {
      try {
        setDataLoading(true);
        const fetched = await tourInstanceService.getBookingTickets(instanceId, activityId);
        if (isMounted && fetched && fetched.length > 0) {
          const loadedEntries: Record<string, any> = {};
          const loadedIds = new Set<string>();

          console.log("Fetched tickets:", fetched);
          let firstTicket = null;
          for (const t of fetched) {
            console.log("Processing ticket:", t);
            if (!firstTicket) firstTicket = t;
            // Try different possible property names for the booking ID
            const tAny = t as any;
            const rawId = tAny.bookingId || tAny.BookingId || tAny.id || tAny.Id;
            if (!rawId) {
              console.warn("Ticket does not have a recognizable booking ID!", t);
              continue;
            }
            const lowerBookingId = String(rawId).toLowerCase();
            loadedEntries[lowerBookingId] = {
              seatNumbers: tAny.seatNumbers || tAny.SeatNumbers || "",
              eTicketNumbers: tAny.eTicketNumbers || tAny.ETicketNumbers || "",
              note: tAny.note || tAny.Note || "",
            };
            loadedIds.add(lowerBookingId);
          }

          if (firstTicket) {
            const ft = firstTicket as any;
            setCommonDetails({
              flightNumber: ft.flightNumber || ft.FlightNumber || "",
              seatClass: ft.seatClass || ft.SeatClass || "Economy",
              departureAt: (ft.departureAt || ft.DepartureAt) ? new Date(ft.departureAt || ft.DepartureAt).toISOString().slice(0, 16) : "",
              arrivalAt: (ft.arrivalAt || ft.ArrivalAt) ? new Date(ft.arrivalAt || ft.ArrivalAt).toISOString().slice(0, 16) : "",
            });
          }

          console.log("Loaded entries map:", loadedEntries);

          setEntries((prev) => {
            const next = { ...prev };
            console.log("Current entries:", next);
            for (const bId of Object.keys(loadedEntries)) {
              if (next[bId]) {
                console.log(`Applying data for booking ${bId}`);
                const loadedData = loadedEntries[bId];
                
                const seatNums = loadedData.seatNumbers.split(" ").filter(Boolean);
                const eTickets = loadedData.eTicketNumbers.split(" ").filter(Boolean);
                
                const currentTickets = [...next[bId].tickets];
                for (let i = 0; i < currentTickets.length; i++) {
                   currentTickets[i] = {
                     ...currentTickets[i],
                     seatNumber: seatNums[i] || currentTickets[i].seatNumber,
                     eTicketNumber: eTickets[i] || currentTickets[i].eTicketNumber,
                   };
                }
                
                next[bId] = { 
                  ...next[bId], 
                  note: loadedData.note || next[bId].note, 
                  tickets: currentTickets 
                };
              } else {
                console.warn(`Booking ID ${bId} not found in existing entries!`);
              }
            }
            return next;
          });
          setSavedIds((prev) => new Set([...prev, ...loadedIds]));
        }
      } catch (error) {
        console.error("Failed to load tickets", error);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    };
    void fetchTickets();
    return () => {
      isMounted = false;
    };
  }, [activityId, instanceId]);

  const updateTicketEntry = useCallback(
    (bookingId: string, paxIndex: number, field: keyof TicketDetail, value: string) => {
      setEntries((prev) => {
        const id = bookingId.toLowerCase();
        const entry = prev[id];
        if (!entry) return prev;
        
        const newTickets = entry.tickets.map(t => 
          t.paxIndex === paxIndex ? { ...t, [field]: value } : t
        );
        
        return {
          ...prev,
          [id]: { ...entry, tickets: newTickets },
        };
      });
    },
    []
  );

  const updateEntryNote = useCallback(
    (bookingId: string, value: string) => {
      setEntries((prev) => ({
        ...prev,
        [bookingId.toLowerCase()]: { ...prev[bookingId.toLowerCase()], note: value },
      }));
    },
    []
  );

  const handleSave = async (bookingId: string) => {
    const entry = entries[bookingId.toLowerCase()];
    if (!entry) return;

    // Validate: flight number required
    if (!commonDetails.flightNumber.trim()) {
      toast.error("Vui lòng nhập số hiệu chuyến bay/tàu ở Thông tin chung");
      return;
    }

    if (!commonDetails.departureAt || !commonDetails.arrivalAt) {
      toast.error("Vui lòng nhập đầy đủ giờ đi và giờ đến ở Thông tin chung");
      return;
    }

    const depDate = new Date(commonDetails.departureAt);
    const arrDate = new Date(commonDetails.arrivalAt);

    if (arrDate <= depDate) {
      toast.error("Giờ đến phải lớn hơn giờ đi");
      return;
    }

    if (activityDate) {
      const actDate = new Date(activityDate);
      actDate.setHours(0, 0, 0, 0);
      if (depDate < actDate) {
        toast.error(`Giờ khởi hành không được trước ngày hoạt động diễn ra (${new Date(activityDate).toLocaleDateString("vi-VN")})`);
        return;
      }
    }

    const emptyTickets = entry.tickets.filter(t => !t.seatNumber.trim());
    if (emptyTickets.length > 0) {
      toast.error(`Vui lòng nhập vị trí/mã ghế cho tất cả ${entry.requiredSeats} hành khách`);
      return;
    }

    try {
      setSavingId(bookingId);
      const fullEntry = {
        ...entry,
        flightNumber: commonDetails.flightNumber,
        seatClass: commonDetails.seatClass,
        departureAt: commonDetails.departureAt,
        arrivalAt: commonDetails.arrivalAt,
        // For backwards compatibility we stringify the inputs, the backend might still accept strings
        seatNumbers: entry.tickets.map(t => t.seatNumber).join(" "),
        eTicketNumbers: entry.tickets.map(t => t.eTicketNumber).join(" "),
      };
      await onSave?.(fullEntry);
      setSavedIds((prev) => new Set([...prev, bookingId.toLowerCase()]));
      toast.success(`Đã lưu vé cho ${entry.customerName}`);
    } catch {
      toast.error("Lưu vé thất bại. Vui lòng thử lại.");
    } finally {
      setSavingId(null);
    }
  };

  const handleConfirmAll = async () => {
    const allSaved = bookings.every((b) => savedIds.has(b.id.toLowerCase()));
    if (!allSaved) {
      toast.warning("Vui lòng lưu vé cho tất cả booking trước khi xác nhận");
      return;
    }
    try {
      setConfirmingAll(true);
      await onConfirmAll?.();
      toast.success("Đã xác nhận tất cả vé cho activity này!");
    } catch {
      toast.error("Xác nhận thất bại. Vui lòng thử lại.");
    } finally {
      setConfirmingAll(false);
    }
  };

  const allSaved = bookings.every((b) => savedIds.has(b.id.toLowerCase()));

  if (loading || dataLoading) {
    return (
      <div className="flex items-center gap-3 p-4 text-stone-500 text-sm">
        <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
        Đang tải danh sách vé...
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-400">
        <Icon icon="heroicons:ticket" className="mx-auto mb-2 size-6" />
        Chưa có booking nào cho tour instance này
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-2">
        <div>
          <p className="text-base font-semibold tracking-tight text-stone-900">
            {transportLabel[transportType] ?? transportType} · {activityTitle}
          </p>
          <p className="text-sm text-stone-500 mt-1">
            Gán vé cho từng booking — nhập đủ số ghế cho tất cả hành khách (bao gồm em bé)
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${allSaved
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-orange-50 text-orange-700 border border-orange-200"
            }`}
        >
          <Icon
            icon={allSaved ? "heroicons:check-circle" : "heroicons:clock"}
            className="size-4"
          />
          {savedIds.size}/{bookings.length} booking
        </span>
      </div>


      {/* Thông tin chuyến đi (Common) */}
      <div className="p-6 bg-stone-50 border-t border-stone-100">
        <h4 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Icon icon="heroicons:paper-airplane" className="size-4 text-stone-500" />
          Thông tin chung cho cả đoàn
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              {transportType === "Flight" ? "Chuyến bay *" : transportType === "Train" ? "Chuyến tàu *" : "Tàu thuyền *"}
            </label>
            <input
              type="text"
              value={commonDetails.flightNumber}
              onChange={(e) => setCommonDetails(prev => ({ ...prev, flightNumber: e.target.value }))}
              placeholder={transportType === "Flight" ? "VN 123" : "SE1"}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Hạng ghế</label>
            <select
              value={commonDetails.seatClass}
              onChange={(e) => setCommonDetails(prev => ({ ...prev, seatClass: e.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              {seatClassOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Giờ đi *</label>
            <input
              type="datetime-local"
              value={commonDetails.departureAt}
              onChange={(e) => setCommonDetails(prev => ({ ...prev, departureAt: e.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Giờ đến *</label>
            <input
              type="datetime-local"
              value={commonDetails.arrivalAt}
              onChange={(e) => setCommonDetails(prev => ({ ...prev, arrivalAt: e.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Booking list */}
      <div className="divide-y divide-stone-100/50 border-t border-stone-100">
        {bookings.map((booking, index) => {
          const entry = entries[booking.id.toLowerCase()];
          const isSaved = savedIds.has(booking.id.toLowerCase());
          const isSaving = savingId === booking.id;

          if (!entry) return null;

          const filledCount = entry.tickets.filter(t => t.seatNumber.trim() !== "").length;

          return (
            <div
              key={booking.id}
              className={`p-6 transition-colors ${isSaved ? "bg-emerald-50/20" : "bg-white hover:bg-stone-50/30"
                }`}
            >
              {/* Row Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`size-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${isSaved
                      ? "bg-emerald-500 text-white"
                      : "bg-stone-100 text-stone-600"
                      }`}
                  >
                    {isSaved ? <Icon icon="heroicons:check" className="size-4" /> : index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-stone-900 truncate">
                      {booking.customerName}
                    </p>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {entry.requiredSeats} hành khách
                    </p>
                  </div>
                </div>
                {/* Progress Badge */}
                {!isSaved && (
                  <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md ${
                    filledCount === entry.requiredSeats 
                      ? "bg-blue-50 text-blue-600 border border-blue-100" 
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}>
                    {filledCount === entry.requiredSeats ? "Đã điền đủ" : `Đang nhập ${filledCount}/${entry.requiredSeats}`}
                  </span>
                )}
                {isSaved && (
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                    Đã lưu vé
                  </span>
                )}
              </div>

              {/* Form Grid for Individual Tickets */}
              <div className="space-y-4">
                {entry.tickets.map((ticket, tIdx) => (
                  <div key={ticket.paxIndex} className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4 border-b border-stone-100/50 last:border-0 last:pb-0">
                    {/* Seat numbers */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        Vị trí / Mã ghế * <span className="normal-case font-normal">(Hành khách {ticket.paxIndex})</span>
                      </label>
                      <input
                        type="text"
                        value={ticket.seatNumber}
                        onChange={(e) => updateTicketEntry(booking.id, ticket.paxIndex, "seatNumber", e.target.value)}
                        placeholder="VD: 12A"
                        className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                      />
                    </div>

                    {/* E-ticket numbers */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        Mã vé điện tử (E-ticket) <span className="normal-case font-normal">(Hành khách {ticket.paxIndex})</span>
                      </label>
                      <input
                        type="text"
                        value={ticket.eTicketNumber}
                        onChange={(e) => updateTicketEntry(booking.id, ticket.paxIndex, "eTicketNumber", e.target.value)}
                        placeholder="VD: 001-1234567890"
                        className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                      />
                    </div>
                  </div>
                ))}

                {/* Note and Save */}
                <div className="flex flex-col md:flex-row gap-5 items-start md:items-end pt-2">
                  <div className="flex-1 w-full">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                      Ghi chú chung
                    </label>
                    <input
                      type="text"
                      value={entry.note}
                      onChange={(e) => updateEntryNote(booking.id, e.target.value)}
                      placeholder="Ghi chú đặc biệt (bữa ăn, hành lý...)"
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    />
                  </div>

                  <button
                    onClick={() => handleSave(booking.id)}
                    disabled={isSaving || filledCount < entry.requiredSeats}
                    className={`shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      isSaved
                      ? "bg-stone-100 text-stone-600 hover:bg-stone-200 focus-visible:outline-stone-500"
                      : filledCount < entry.requiredSeats
                      ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus-visible:outline-blue-500 active:scale-[0.98]"
                      }`}
                  >
                    {isSaving ? (
                      <Icon
                        icon="heroicons:arrow-path"
                        className="size-4 animate-spin"
                      />
                    ) : isSaved ? (
                      <Icon icon="heroicons:check-circle" className="size-4" />
                    ) : (
                      <Icon icon="heroicons:check" className="size-4" />
                    )}
                    {isSaving
                      ? "Đang lưu..."
                      : isSaved
                        ? "Đã lưu"
                        : "Lưu vé"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm all button */}
      <div className="flex justify-end pt-4 pr-2">
        <button
          onClick={handleConfirmAll}
          disabled={!allSaved || confirmingAll}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${allSaved
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_10px_20px_-10px_rgba(5,150,105,0.5)] focus-visible:outline-emerald-500 active:scale-[0.98]"
            : "bg-stone-100 text-stone-400 cursor-not-allowed"
            }`}
        >
          {confirmingAll ? (
            <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
          ) : (
            <Icon icon="heroicons:check-badge" className="size-5" />
          )}
          {confirmingAll
            ? "Đang xác nhận..."
            : allSaved
              ? "Xác nhận đã đặt tất cả vé"
              : `Cần hoàn thành ${bookings.length - savedIds.size} booking nữa`}
        </button>
      </div>
    </div>
  );
}
