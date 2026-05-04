"use client";

import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import type { AdminBookingListResponse } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { handleApiError } from "@/utils/apiResponse";
import { logTourOperatorEvent } from "@/utils/telemetry";

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
  /** Computed: space-separated seat numbers (populated at save time) */
  seatNumbers?: string;
  /** Computed: space-separated e-ticket numbers (populated at save time) */
  eTicketNumbers?: string;
}

interface Props {
  /** Activity title (e.g. "Chuyến bay HAN → SGN") */
  activityTitle: string;
  /** Loại phương tiện: "Flight" | "Train" | "Boat" */
  transportType: "Flight" | "Train" | "Boat" | "Bus" | "Car";
  /** Danh sách bookings của instance */
  bookings: AdminBookingListResponse[];
  /** Callback khi TourOperator lưu vé cho 1 booking */
  onSave?: (entry: BookingTicketEntry) => Promise<void>;
  /** Callback khi tất cả booking đã được gán vé */
  onConfirmAll?: (departureTime?: string, arrivalTime?: string) => Promise<void>;
  /** Đang loading */
  loading?: boolean;
  /** Ngày diễn ra hoạt động (YYYY-MM-DD) */
  activityDate?: string;
  /** ID của activity */
  activityId?: string;
  /** ID của tour instance để gọi API */
  instanceId?: string;
  /** Trạng thái confirm đã có từ activity */
  initialConfirmed?: boolean;
  /** Giờ khởi hành của activity trên lịch trình */
  activityStartTime?: string | null;
  /** Giờ đến của activity trên lịch trình */
  activityEndTime?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  initialConfirmed = false,
  activityStartTime,
  activityEndTime,
}: Props) {
  const { t } = useTranslation();
  const [dataLoading, setDataLoading] = useState(false);
  const [commonDetails, setCommonDetails] = useState(() => {
    let defaultDep = "";
    let defaultArr = "";
    
    if (activityDate) {
      const datePart = activityDate.slice(0, 10);
      if (activityStartTime) {
        defaultDep = `${datePart}T${activityStartTime.slice(0, 5)}`;
      }
      if (activityEndTime) {
        defaultArr = `${datePart}T${activityEndTime.slice(0, 5)}`;
      }
    }

    return {
      flightNumber: "",
      seatClass: "Economy",
      departureAt: defaultDep,
      arrivalAt: defaultArr,
    };
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
  const [confirmedAll, setConfirmedAll] = useState(initialConfirmed);
  const transportLabel: Record<string, string> = {
    Flight: t("tourInstance.transport.flight", "Chuyến bay"),
    Train: t("tourInstance.transport.train", "Chuyến tàu"),
    Boat: t("tourInstance.transport.boat", "Chuyến tàu/phà"),
    Bus: t("tourInstance.transport.bus", "Chuyến xe bus"),
    Car: t("tourInstance.transport.car", "Xe ô tô"),
  };

  React.useEffect(() => {
    setConfirmedAll(initialConfirmed);
  }, [initialConfirmed]);

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

          let firstTicket = null;
          for (const t of fetched) {
            if (!firstTicket) firstTicket = t;
            // Try different possible property names for the booking ID
            const tAny = t as any;
            const rawId = tAny.bookingId || tAny.BookingId || tAny.id || tAny.Id;
            if (!rawId) {
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
            
            const formatLocal = (dateStr: string) => {
              if (!dateStr) return "";
              const d = new Date(dateStr);
              if (isNaN(d.getTime())) return "";
              const pad = (n: number) => n.toString().padStart(2, '0');
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };

            setCommonDetails({
              flightNumber: ft.flightNumber || ft.FlightNumber || "",
              seatClass: ft.seatClass || ft.SeatClass || "Economy",
              departureAt: formatLocal(ft.departureAt || ft.DepartureAt),
              arrivalAt: formatLocal(ft.arrivalAt || ft.ArrivalAt),
            });
          }

          setEntries((prev) => {
            const next = { ...prev };
            for (const bId of Object.keys(loadedEntries)) {
              if (next[bId]) {
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
              }
            }
            return next;
          });
          setSavedIds((prev) => new Set([...prev, ...loadedIds]));
        }
      } catch (error) {
        const apiError = handleApiError(error);
        toast.error(
          t(
            apiError.message,
            t(
              "tourInstance.bookingFlight.loadTicketsError",
              "Không thể tải vé đã lưu.",
            ),
          ),
        );
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
    if (savingId) return;
    const entry = entries[bookingId.toLowerCase()];
    if (!entry) return;

    // Validate: flight number required
    if (!commonDetails.flightNumber.trim()) {
      toast.error(
        t(
          "tourInstance.bookingFlight.validation.flightNumberRequired",
          "Vui lòng nhập số hiệu chuyến bay/tàu ở Thông tin chung",
        ),
      );
      return;
    }

    if (!commonDetails.departureAt || !commonDetails.arrivalAt) {
      toast.error(
        t(
          "tourInstance.bookingFlight.validation.timesRequired",
          "Vui lòng nhập đầy đủ giờ đi và giờ đến ở Thông tin chung",
        ),
      );
      return;
    }

    const depDate = new Date(commonDetails.departureAt);
    const arrDate = new Date(commonDetails.arrivalAt);

    if (arrDate <= depDate) {
      toast.error(
        t(
          "tourInstance.bookingFlight.validation.arrivalAfterDeparture",
          "Giờ đến phải lớn hơn giờ đi",
        ),
      );
      return;
    }

    if (activityDate) {
      const [year, month, day] = activityDate.slice(0, 10).split("-");
      const actDate = new Date(Number(year), Number(month) - 1, Number(day));
      
      if (depDate < actDate) {
        toast.error(
          t("tourInstance.bookingFlight.validation.departureBeforeActivity", {
            defaultValue:
              "Giờ khởi hành không được trước ngày hoạt động diễn ra ({{date}})",
            date: `${day}/${month}/${year}`,
          }),
        );
        return;
      }
    }

    const emptyTickets = entry.tickets.filter(t => !t.seatNumber.trim());
    if (emptyTickets.length > 0) {
      toast.error(
        t("tourInstance.bookingFlight.validation.seatsRequired", {
          defaultValue:
            "Vui lòng nhập vị trí/mã ghế cho tất cả {{count}} hành khách",
          count: entry.requiredSeats,
        }),
      );
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
      if (instanceId && activityId) {
        logTourOperatorEvent("booking_flight_confirmed", {
          instanceId,
          bookingId: entry.bookingId,
          activityId,
        });
      }
      toast.success(
        t("tourInstance.bookingFlight.saveSuccess", {
          defaultValue: "Đã lưu vé cho {{customerName}}",
          customerName: entry.customerName,
        }),
      );
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(
        t(
          apiError.code === "409"
            ? "tourInstance.bookingFlight.confirmConflict"
            : apiError.message,
          t(
            "tourInstance.bookingFlight.saveError",
            "Lưu vé thất bại. Vui lòng thử lại.",
          ),
        ),
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleConfirmAll = async () => {
    if (confirmingAll || confirmedAll) return;
    const allSaved = bookings.every((b) => savedIds.has(b.id.toLowerCase()));
    if (!allSaved) {
      toast.warning(
        t(
          "tourInstance.bookingFlight.validation.allBookingsRequired",
          "Vui lòng lưu vé cho tất cả booking trước khi xác nhận",
        ),
      );
      return;
    }
    try {
      setConfirmingAll(true);
      await onConfirmAll?.(
        commonDetails.departureAt ? new Date(commonDetails.departureAt).toISOString() : undefined,
        commonDetails.arrivalAt ? new Date(commonDetails.arrivalAt).toISOString() : undefined
      );
      setConfirmedAll(true);
      toast.success(
        t(
          "tourInstance.flight.confirmSuccess",
          "Đã xác nhận tất cả vé cho hoạt động này!",
        ),
      );
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(
        t(
          apiError.code === "409"
            ? "tourInstance.flight.confirmConflict"
            : apiError.message,
          t(
            "tourInstance.bookingFlight.confirmError",
            "Xác nhận thất bại. Vui lòng thử lại.",
          ),
        ),
      );
    } finally {
      setConfirmingAll(false);
    }
  };

  const allSaved = bookings.every((b) => savedIds.has(b.id.toLowerCase()));

  if (loading || dataLoading) {
    return (
      <div className="flex items-center gap-3 p-4 text-stone-500 text-sm">
        <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
        {t("tourInstance.bookingFlight.loadingTickets", "Đang tải danh sách vé...")}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-400">
        <Icon icon="heroicons:ticket" className="mx-auto mb-2 size-6" />
        {t("tourInstance.flight.emptyBookings", "Chưa có khách đặt tour")}
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
          {(activityDate || activityStartTime || activityEndTime) && (
            <p className="text-sm font-medium text-blue-600 mt-1 flex items-center gap-1.5">
              <Icon icon="heroicons:clock" className="size-4" />
              {t("tourInstance.bookingFlight.expectedSchedule", "Lịch trình dự kiến")}: {activityDate ? (() => {
                const [y, m, d] = activityDate.slice(0, 10).split("-");
                return `${d}/${m}/${y}`;
              })() : ""} {activityStartTime ? activityStartTime.slice(0, 5) : "--:--"} - {activityEndTime ? activityEndTime.slice(0, 5) : "--:--"}
            </p>
          )}
          <p className="text-sm text-stone-500 mt-1">
            {t(
              "tourInstance.bookingFlight.instructions",
              "Gán vé cho từng booking — nhập đủ số ghế cho tất cả hành khách",
            )}
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
          {savedIds.size}/{bookings.length}{" "}
          {t("tourInstance.bookingTable.booking", "booking")}
        </span>
      </div>


      {/* Thông tin chuyến đi (Common) */}
      <div className="p-6 bg-stone-50 border-t border-stone-100">
        <h4 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Icon icon="heroicons:paper-airplane" className="size-4 text-stone-500" />
          {t("tourInstance.bookingFlight.commonDetails", "Thông tin chung cho cả đoàn")}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              {transportType === "Flight"
                ? t("tourInstance.flightNumber", "Mã chuyến bay")
                : transportType === "Train"
                ? t("tourInstance.trainNumber", "Mã chuyến tàu")
                : transportType === "Boat"
                ? t("tourInstance.boatNumber", "Mã tàu/phà")
                : t("tourInstance.busNumber", "Biển số / Mã xe")}
            </label>
            <input
              type="text"
              value={commonDetails.flightNumber}
              onChange={(e) => setCommonDetails(prev => ({ ...prev, flightNumber: e.target.value }))}
              placeholder={transportType === "Flight" ? "VN 123" : transportType === "Train" ? "SE1" : "29A-123.45"}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              {t("tourInstance.bookingFlight.seatClass", "Hạng ghế")}
            </label>
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              {t("tourInstance.bookingFlight.departureAt", "Giờ đi *")}
            </label>
            <input
              type="datetime-local"
              value={commonDetails.departureAt}
              onChange={(e) => setCommonDetails(prev => ({ ...prev, departureAt: e.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              {t("tourInstance.bookingFlight.arrivalAt", "Giờ đến *")}
            </label>
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
                      {entry.requiredSeats}{" "}
                      {t("tourInstance.bookingFlight.passengers", "hành khách")}
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
                    {filledCount === entry.requiredSeats
                      ? t("tourInstance.bookingFlight.filled", "Đã điền đủ")
                      : t("tourInstance.bookingFlight.fillingProgress", {
                          defaultValue: "Đang nhập {{filled}}/{{total}}",
                          filled: filledCount,
                          total: entry.requiredSeats,
                        })}
                  </span>
                )}
                {isSaved && (
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {t("tourInstance.bookingFlight.saved", "Đã lưu vé")}
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
                        {t("tourInstance.bookingFlight.seatNumber", "Vị trí / Mã ghế *")}{" "}
                        <span className="normal-case font-normal">
                          ({t("tourInstance.bookingFlight.passengerIndex", {
                            defaultValue: "Hành khách {{index}}",
                            index: ticket.paxIndex,
                          })})
                        </span>
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
                        {t("tourInstance.bookingFlight.eTicketNumber", "Mã vé điện tử (E-ticket)")}{" "}
                        <span className="normal-case font-normal">
                          ({t("tourInstance.bookingFlight.passengerIndex", {
                            defaultValue: "Hành khách {{index}}",
                            index: ticket.paxIndex,
                          })})
                        </span>
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
                      {t("tourInstance.bookingFlight.note", "Ghi chú chung")}
                    </label>
                    <input
                      type="text"
                      value={entry.note}
                      onChange={(e) => updateEntryNote(booking.id, e.target.value)}
                      placeholder={t(
                        "tourInstance.bookingFlight.notePlaceholder",
                        "Ghi chú đặc biệt (bữa ăn, hành lý...)",
                      )}
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
                      ? t("common.saving", "Đang lưu...")
                      : isSaved
                        ? t("tourInstance.bookingFlight.saved", "Đã lưu")
                        : t("tourInstance.bookingFlight.save", "Lưu vé")}
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
          disabled={!allSaved || confirmingAll || confirmedAll}
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
            ? t("tourInstance.bookingFlight.confirming", "Đang xác nhận...")
            : confirmedAll
              ? t("tourInstance.bookingFlight.confirmed", "Đã xác nhận vé")
              : allSaved
                ? t("tourInstance.bookingFlight.confirmAll", "Xác nhận đã đặt tất cả vé")
                : t("tourInstance.bookingFlight.remainingBookings", {
                    defaultValue: "Cần hoàn thành {{count}} booking nữa",
                    count: bookings.length - savedIds.size,
                  })}
        </button>
      </div>
    </div>
  );
}
