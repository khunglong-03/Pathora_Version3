"use client";

/**
 * FlightTicketAssignmentPage
 *
 * Page-level component dành riêng cho Tour Operator gán vé phương tiện
 * ngoại cỡ (Flight / Train / Boat) per-booking cho một tour instance.
 *
 * Sử dụng `ExternalTicketAssignmentPanel` cho từng activity ngoại cỡ.
 * Được mount tại route: /tour-operator/tour-instances/public/[id]/assign-flight-tickets
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { bookingService, type AdminBookingListResponse } from "@/api/services/bookingService";
import { isExternalOnlyTransportation } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import {
  focusPageHeading,
  storePublicTourReturnFocus,
} from "@/utils/publicTourRouteFocus";
import ExternalTicketAssignmentPanel, {
  type BookingTicketEntry,
} from "./ExternalTicketAssignmentPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExternalActivity {
  activityId: string;
  title: string;
  date: string;
  dayNumber: number;
  transportType: "Flight" | "Train" | "Boat" | "Bus" | "Car";
  startTime: string | null;
  endTime: string | null;
  confirmed: boolean;
}

interface Props {
  /** Tour instance ID — được truyền từ route page */
  instanceId: string;
  /** URL để back về trang detail */
  backUrl?: string;
  /** Chỉ hiện 1 booking (per-booking assignment mode) */
  bookingId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isTransportationActivity = (activityType?: string | number | null): boolean => {
  if (activityType == null) return false;
  const t = String(activityType).trim().toLowerCase();
  return t === "transportation" || t === "2";
};

const resolveTransportType = (raw?: string | null): "Flight" | "Train" | "Boat" | "Bus" | "Car" => {
  if (!raw) return "Bus";
  const s = raw.toLowerCase();
  if (s.includes("flight") || s === "3") return "Flight";
  if (s.includes("boat") || s === "4") return "Boat";
  if (s.includes("train") || s === "2") return "Train";
  if (s.includes("car") || s === "1") return "Car";
  return "Bus";
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FlightTicketAssignmentPage({ instanceId, backUrl, bookingId }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const resolvedId = instanceId || params?.id || "";
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tourName, setTourName] = useState("");
  const [activities, setActivities] = useState<ExternalActivity[]>([]);
  const [bookings, setBookings] = useState<AdminBookingListResponse[]>([]);

  const resolvedBackUrl =
    backUrl || `/tour-operator/tour-instances/public/${resolvedId}`;

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!resolvedId) return;
    setLoading(true);
    setError(null);
    try {
      const [instance, bookingList] = await Promise.all([
        tourInstanceService.getInstanceDetail(resolvedId),
        bookingService.getBookingsByTourInstance(resolvedId),
      ]);

      setTourName(instance?.tourName ?? instance?.title ?? "Tour");

      // Extract external transport activities
      const externalActivities: ExternalActivity[] = [];
      for (const day of instance?.days ?? []) {
        for (const activity of day.activities ?? []) {
          if (isTransportationActivity(activity.activityType) && !activity.transportSupplierId) {
            externalActivities.push({
              activityId: activity.id,
              title: activity.title ?? t("tourInstance.bookingFlight.transport.fallback", "Phương tiện"),
              date: day.actualDate ?? "",
              dayNumber: day.instanceDayNumber ?? 1,
              transportType: resolveTransportType(
                activity.transportationType ?? activity.transportationName,
              ),
              startTime: activity.startTime ?? null,
              endTime: activity.endTime ?? null,
              confirmed: activity.externalTransportConfirmed ?? false,
            });
          }
        }
      }

      setActivities(externalActivities);
      const allBookings = (bookingList ?? []).filter(
        (booking) => booking.status !== "Cancelled",
      );
      const scopedBookings = allBookings.filter((b) => b.id === bookingId);

      if (scopedBookings.length === 0) {
        setBookings([]);
        setError(
          t(
            "tourInstance.bookingFlight.bookingNotFound",
            "Booking does not belong to this tour instance.",
          ),
        );
        return;
      }

      setBookings(scopedBookings);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(
        t(
          apiError.message,
          t("tourInstance.flight.loadError", "Không thể tải dữ liệu. Vui lòng thử lại."),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId, resolvedId, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    focusPageHeading(headingRef.current);
  }, []);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleSaveTicket = useCallback(
    async (activityId: string, entry: BookingTicketEntry) => {
      await tourInstanceService.saveBookingTicket(resolvedId, activityId, {
        bookingId: entry.bookingId,
        flightNumber: entry.flightNumber,
        seatClass: entry.seatClass,
        departureAt: entry.departureAt,
        arrivalAt: entry.arrivalAt,
        seatNumbers: entry.tickets.map((t) => t.seatNumber).join(" "),
        eTicketNumbers: entry.tickets.map((t) => t.eTicketNumber).join(" "),
        note: entry.note,
      });
    },
    [resolvedId],
  );

  const handleConfirmAll = useCallback(
    async (activityId: string, departure?: string, arrival?: string) => {
      await tourInstanceService.confirmExternalTransport(
        resolvedId,
        activityId,
        true,
        departure,
        arrival,
      );
    },
    [resolvedId],
  );

  const handleBack = () => {
    storePublicTourReturnFocus("flight", bookingId);
    router.push(resolvedBackUrl);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200/70 px-4 md:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("common.back", "Back")}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <Icon icon="heroicons:arrow-left" className="size-4 text-stone-600" />
          </button>
          <div className="min-w-0">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="truncate text-lg font-bold leading-tight text-stone-900 focus:outline-none"
            >
              {t("tourInstance.bookingFlight.title", "Gán phương tiện")}
            </h1>
            {tourName && (
              <p className="text-sm text-stone-500 truncate">{tourName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <nav
          aria-label={t("tourInstance.breadcrumb.label", "Breadcrumb")}
          className="text-xs font-semibold text-stone-500"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <button
                type="button"
                onClick={handleBack}
                className="text-blue-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {t("tourInstance.breadcrumb.publicTourDetail", "Chi tiết tour public")}
              </button>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-stone-700" aria-current="page">
              {t("tourInstance.breadcrumb.assignFlightTickets", "Gán vé phương tiện")}
            </li>
          </ol>
        </nav>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20 text-stone-400">
            <Icon icon="heroicons:arrow-path" className="size-8 animate-spin" />
            <p className="text-sm">
              {t("tourInstance.flight.loadingData", "Đang tải dữ liệu...")}
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
            <Icon
              icon="heroicons:exclamation-circle"
              className="mx-auto size-8 text-red-400"
            />
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              onClick={() => void fetchData()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <Icon icon="heroicons:arrow-path" className="size-4" />
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {/* Empty — no external activities */}
        {!loading && !error && activities.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center space-y-3">
            <Icon
              icon="heroicons:paper-airplane"
              className="mx-auto size-10 text-stone-300"
            />
            <p className="text-base font-semibold text-stone-600">
              {t(
                "tourInstance.flight.emptyActivity",
                "Tour này không có phương tiện cần gán",
              )}
            </p>
            <p className="text-sm text-stone-400">
              {t(
                "tourInstance.bookingFlight.emptyActivityDescription",
                "Tour này không có hoạt động phương tiện.",
              )}
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {t("common.back", "Back")}
            </button>
          </div>
        )}

        {/* Empty — has activities but no bookings */}
        {!loading && !error && activities.length > 0 && bookings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-10 text-center space-y-3">
            <Icon
              icon="heroicons:users"
              className="mx-auto size-10 text-amber-300"
            />
            <p className="text-base font-semibold text-amber-700">
              {t("tourInstance.flight.emptyBookings", "Chưa có khách đặt tour")}
            </p>
            <p className="text-sm text-amber-600">
              {t(
                "tourInstance.bookingFlight.emptyBookingsDescription",
                "Khi có booking, danh sách vé cần gán sẽ hiển thị ở đây.",
              )}
            </p>
          </div>
        )}

        {/* Panels per external activity */}
        {!loading &&
          !error &&
          activities.length > 0 &&
          bookings.length > 0 &&
          activities.map((activity) => (
            <section
              key={activity.activityId}
              className="rounded-2xl border border-stone-200/80 bg-white shadow-sm overflow-hidden"
            >
              {/* Activity header */}
              <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
                <span className="text-xl">
                  {activity.transportType === "Flight"
                    ? "✈️"
                    : activity.transportType === "Boat"
                    ? "🚢"
                    : activity.transportType === "Train"
                    ? "🚄"
                    : activity.transportType === "Car"
                    ? "🚗"
                    : "🚌"}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 text-sm truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-stone-400">
                    {t("tourInstance.dayLabel", "Ngày")} {activity.dayNumber} ·{" "}
                    {activity.date
                      ? (() => {
                          const [y, m, d] = activity.date.slice(0, 10).split("-");
                          return `${d}/${m}/${y}`;
                        })()
                      : "—"}
                    {activity.startTime
                      ? ` · ${activity.startTime.slice(0, 5)}`
                      : ""}
                    {activity.endTime ? ` → ${activity.endTime.slice(0, 5)}` : ""}
                  </p>
                </div>
              </div>

              {/* Panel */}
              <ExternalTicketAssignmentPanel
                activityTitle={activity.title}
                transportType={activity.transportType}
                bookings={bookings}
                activityDate={activity.date}
                activityId={activity.activityId}
                instanceId={resolvedId}
                activityStartTime={activity.startTime}
                activityEndTime={activity.endTime}
                initialConfirmed={activity.confirmed}
                onSave={(entry) => handleSaveTicket(activity.activityId, entry)}
                onConfirmAll={(dep, arr) =>
                  handleConfirmAll(activity.activityId, dep, arr)
                }
              />
            </section>
          ))}
      </div>
    </div>
  );
}
