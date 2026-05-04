"use client";

/**
 * PublicTourBookingTable
 *
 * Bảng booking cho public tour detail — hiển thị danh sách booking
 * kèm status chip khách sạn + vé bay per-booking, action buttons
 * dẫn tới sub-route gán per-booking.
 *
 * Task 3.2a, 3.2b, 3.2c trong refactor-public-tour-instance-assignment
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import type { AdminBookingListResponse } from "@/api/services/bookingService";
import {
  tourInstanceService,
  type BookingRoomAssignmentDto,
  type BookingTicketDto,
} from "@/api/services/tourInstanceService";
import { handleApiError } from "@/utils/apiResponse";
import {
  getPublicTourActionId,
  storePublicTourReturnFocus,
} from "@/utils/publicTourRouteFocus";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExternalActivityInfo {
  activityId: string;
  title: string;
  confirmed: boolean;
}

interface AccommodationActivityInfo {
  activityId: string;
  title: string;
  supplierName?: string | null;
}

interface Props {
  /** Tour instance ID — used for building action hrefs */
  instanceId: string;
  /** Danh sách booking của tour instance */
  bookings: AdminBookingListResponse[];
  /** Đang tải bookings */
  loading?: boolean;
  /** Danh sách external transport activities — dùng để render cột vé bay */
  externalActivities?: ExternalActivityInfo[];
  /** Danh sách accommodation activities — dùng để đọc trạng thái phân phòng */
  accommodationActivities?: AccommodationActivityInfo[];
  /** Có activity accommodation nào không — dùng cho status chip khách sạn */
  hasAccommodationActivities?: boolean;
}

// ─── Status chip helpers (Task 3.2c) ──────────────────────────────────────────

type ChipVariant = "success" | "warning" | "error" | "neutral";

interface StatusChip {
  label: string;
  variant: ChipVariant;
  icon: string;
}

type Translate = any;

interface AccommodationAssignmentStatus extends BookingRoomAssignmentDto {
  activityId: string;
  activityTitle: string;
  supplierName?: string | null;
}

interface FlightTicketStatus extends BookingTicketDto {
  activityId: string;
  activityTitle: string;
}

interface AssignmentLookup {
  accommodationsByBooking: Record<string, AccommodationAssignmentStatus[]>;
  flightsByBooking: Record<string, FlightTicketStatus[]>;
}

const EMPTY_ASSIGNMENT_LOOKUP: AssignmentLookup = {
  accommodationsByBooking: {},
  flightsByBooking: {},
};

const chipStyles: Record<ChipVariant, string> = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200/80 ring-amber-500/10",
  error: "bg-red-50 text-red-600 border-red-200/80 ring-red-500/10",
  neutral:
    "bg-stone-50 text-stone-500 border-stone-200/80 ring-stone-500/10",
};

/**
 * Placeholder chip — in a real scenario this would check accommodation detail
 * records per booking. For now, returns "not assigned" as a safe default.
 * Future: accept per-booking accommodation data from parent.
 */
const getBookingKey = (bookingId: string) => bookingId.toLowerCase();

const getTicketFlightLabel = (ticket: FlightTicketStatus) =>
  ticket.flightNumber || ticket.seatNumbers || ticket.eTicketNumbers || ticket.activityTitle;

export function getBookingAccommodationStatus(
  booking: AdminBookingListResponse,
  hasActivities: boolean,
  t: Translate,
  assignments: AccommodationAssignmentStatus[] = [],
  activityCount = hasActivities ? 1 : 0,
): StatusChip {
  if (!hasActivities) {
    return {
      label: "—",
      variant: "neutral",
      icon: "heroicons:minus",
    };
  }
  if (assignments.length > 0) {
    const first = assignments[0];
    const roomType = first.roomType ? String(first.roomType) : "—";
    const label =
      assignments.length >= activityCount
        ? t("tourInstance.bookingTable.accommodationAssigned", {
            defaultValue: "{{roomType}} · {{roomCount}} phòng",
            roomType,
            roomCount: first.roomCount,
          })
        : t("tourInstance.bookingTable.partialAssigned", {
            defaultValue: "{{assigned}}/{{total}} đã gán",
            assigned: assignments.length,
            total: activityCount,
          });

    return {
      label,
      variant: assignments.length >= activityCount ? "success" : "warning",
      icon:
        assignments.length >= activityCount
          ? "heroicons:check-circle"
          : "heroicons:exclamation-triangle",
    };
  }

  return {
    label: t("tourInstance.bookingTable.notAssigned", {
      defaultValue: "Chưa gán",
      bookingId: booking.id,
    }),
    variant: "warning",
    icon: "heroicons:clock",
  };
}

/**
 * Check flight assignment status for a booking across all external activities.
 * Returns aggregated chip: all confirmed → success, some → warning, none → error.
 */
export function getBookingTransportStatus(
  booking: AdminBookingListResponse,
  externalActivities: ExternalActivityInfo[],
  t: Translate,
  tickets: FlightTicketStatus[] = [],
): StatusChip {
  if (externalActivities.length === 0) {
    return {
      label: "—",
      variant: "neutral",
      icon: "heroicons:minus",
    };
  }

  const confirmedCount = tickets.length;
  const total = externalActivities.length;

  if (confirmedCount >= total) {
    const firstLabel = tickets.map(getTicketFlightLabel).filter(Boolean)[0];
    return {
      label: firstLabel
        ? t("tourInstance.bookingTable.flightAssignedNamed", {
            defaultValue: "{{label}}",
            label: firstLabel,
          })
        : t("tourInstance.bookingTable.flightAssigned", {
            defaultValue: "{{count}}/{{total}} đã gán",
            count: confirmedCount,
            total,
          }),
      variant: "success",
      icon: "heroicons:check-circle",
    };
  }

  if (confirmedCount > 0) {
    return {
      label: t("tourInstance.bookingTable.partialAssigned", {
        defaultValue: "{{assigned}}/{{total}} đã gán",
        assigned: confirmedCount,
        total,
      }),
      variant: "warning",
      icon: "heroicons:exclamation-triangle",
    };
  }

  return {
    label: t("tourInstance.bookingTable.notAssigned", {
      defaultValue: "Chưa gán",
      bookingId: booking.id,
    }),
    variant: "error",
    icon: "heroicons:x-circle",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublicTourBookingTable({
  instanceId,
  bookings,
  loading = false,
  externalActivities = [],
  accommodationActivities = [],
  hasAccommodationActivities = false,
}: Props) {
  const { t } = useTranslation();
  const baseUrl = `/tour-operator/tour-instances/public/${instanceId}`;
  const [assignmentLookup, setAssignmentLookup] = useState<AssignmentLookup>(
    EMPTY_ASSIGNMENT_LOOKUP,
  );
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const accommodationActivityKey = useMemo(
    () =>
      accommodationActivities
        .map((activity) => `${activity.activityId}:${activity.title}`)
        .join("|"),
    [accommodationActivities],
  );
  const externalActivityKey = useMemo(
    () =>
      externalActivities
        .map((activity) => `${activity.activityId}:${activity.title}`)
        .join("|"),
    [externalActivities],
  );
  const shouldLoadAssignments =
    bookings.length > 0 &&
    (accommodationActivities.length > 0 || externalActivities.length > 0);

  useEffect(() => {
    if (!shouldLoadAssignments) {
      setAssignmentLookup(EMPTY_ASSIGNMENT_LOOKUP);
      setAssignmentError(null);
      return;
    }

    let active = true;
    setAssignmentLoading(true);
    setAssignmentError(null);

    const loadAssignments = async () => {
      const [roomResults, ticketResults] = await Promise.all([
        Promise.allSettled(
          accommodationActivities.map((activity) =>
            tourInstanceService.getBookingRoomAssignments(
              instanceId,
              activity.activityId,
            ),
          ),
        ),
        Promise.allSettled(
          externalActivities.map((activity) =>
            tourInstanceService.getBookingTickets(instanceId, activity.activityId),
          ),
        ),
      ]);

      if (!active) return;

      const nextLookup: AssignmentLookup = {
        accommodationsByBooking: {},
        flightsByBooking: {},
      };
      let failed = false;

      roomResults.forEach((result, index) => {
        if (result.status === "rejected") {
          failed = true;
          return;
        }

        const activity = accommodationActivities[index];
        result.value.forEach((assignment) => {
          const bookingKey = getBookingKey(assignment.bookingId);
          const current = nextLookup.accommodationsByBooking[bookingKey] ?? [];
          current.push({
            ...assignment,
            activityId: activity.activityId,
            activityTitle: activity.title,
            supplierName: activity.supplierName,
          });
          nextLookup.accommodationsByBooking[bookingKey] = current;
        });
      });

      ticketResults.forEach((result, index) => {
        if (result.status === "rejected") {
          failed = true;
          return;
        }

        const activity = externalActivities[index];
        result.value.forEach((ticket) => {
          const bookingKey = getBookingKey(ticket.bookingId);
          const current = nextLookup.flightsByBooking[bookingKey] ?? [];
          current.push({
            ...ticket,
            activityId: activity.activityId,
            activityTitle: activity.title,
          });
          nextLookup.flightsByBooking[bookingKey] = current;
        });
      });

      setAssignmentLookup(nextLookup);
      setAssignmentError(
        failed
          ? t(
              "tourInstance.bookingTable.statusLoadPartial",
              "Một số trạng thái gán dịch vụ chưa tải được.",
            )
          : null,
      );
      setAssignmentLoading(false);
    };

    loadAssignments().catch((error) => {
      if (!active) return;
      const apiError = handleApiError(error);
      setAssignmentLookup(EMPTY_ASSIGNMENT_LOOKUP);
      setAssignmentError(
        t(
          apiError.message,
          t(
            "tourInstance.bookingTable.statusLoadError",
            "Không thể tải trạng thái gán dịch vụ.",
          ),
        ),
      );
      setAssignmentLoading(false);
    });

    return () => {
      active = false;
    };
  }, [
    accommodationActivities,
    accommodationActivityKey,
    bookings.length,
    externalActivities,
    externalActivityKey,
    instanceId,
    shouldLoadAssignments,
    t,
  ]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="rounded-2xl border border-stone-200/70 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <div className="h-5 w-48 bg-stone-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-stone-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="h-4 w-20 bg-stone-100 rounded animate-pulse" />
              <div className="h-4 w-32 bg-stone-100 rounded animate-pulse" />
              <div className="h-4 w-12 bg-stone-100 rounded animate-pulse" />
              <div className="flex-1" />
              <div className="h-6 w-20 bg-stone-100 rounded-full animate-pulse" />
              <div className="h-6 w-20 bg-stone-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center space-y-3">
        <Icon
          icon="heroicons:users"
          className="mx-auto size-10 text-stone-300"
        />
        <p className="text-base font-semibold text-stone-600">
          {t("tourInstance.bookingTable.empty", "Chưa có booking")}
        </p>
        <p className="text-sm text-stone-400">
          {t(
            "tourInstance.bookingTable.emptyDescription",
            "Khi có khách đặt tour, danh sách booking sẽ hiển thị ở đây.",
          )}
        </p>
      </div>
    );
  }

  // ── Table ──
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Icon icon="heroicons:clipboard-document-list" className="size-4 text-stone-500" />
          {t("tourInstance.bookingTable.title", "Danh sách booking")}
          <span className="ml-1 text-xs font-medium text-stone-400 bg-stone-100 rounded-full px-2 py-0.5">
            {bookings.length}
          </span>
          {assignmentLoading && (
            <Icon
              icon="heroicons:arrow-path"
              className="size-3.5 animate-spin text-stone-400"
            />
          )}
        </h3>
        {assignmentError && (
          <span className="text-xs font-medium text-amber-600">
            {assignmentError}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50">
              <th className="px-6 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider whitespace-nowrap">
                {t("tourInstance.bookingTable.column.customer", "Khách hàng")}
              </th>
              <th className="px-4 py-3 text-center font-semibold text-stone-500 text-xs uppercase tracking-wider whitespace-nowrap">
                {t("tourInstance.bookingTable.column.guests", "Số khách")}
              </th>
              {hasAccommodationActivities && (
                <th className="px-4 py-3 text-center font-semibold text-stone-500 text-xs uppercase tracking-wider whitespace-nowrap">
                  {t("tourInstance.bookingTable.column.accommodation", "Khách sạn")}
                </th>
              )}
              {externalActivities.length > 0 && (
                <th className="px-4 py-3 text-center font-semibold text-stone-500 text-xs uppercase tracking-wider whitespace-nowrap">
                  {t("tourInstance.bookingTable.column.flight", "Phương tiện")}
                </th>
              )}
              <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider whitespace-nowrap">
                {t("tourInstance.bookingTable.column.action", "Thao tác")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {bookings.map((booking) => {
              const totalGuests =
                (booking.numberAdult ?? 0) +
                (booking.numberChild ?? 0) +
                (booking.numberInfant ?? 0);

              const accomChip = getBookingAccommodationStatus(
                booking,
                hasAccommodationActivities,
                t,
                assignmentLookup.accommodationsByBooking[getBookingKey(booking.id)] ?? [],
                accommodationActivities.length,
              );
              const flightChip = getBookingTransportStatus(
                booking,
                externalActivities,
                t,
                assignmentLookup.flightsByBooking[getBookingKey(booking.id)] ?? [],
              );

              return (
                <tr
                  key={booking.id}
                  className="group hover:bg-stone-50/50 transition-colors"
                >
                  {/* Customer */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-orange-600">
                          {(booking.customerName ?? "?")[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate">
                          {booking.customerName}
                        </p>
                        <p className="text-xs text-stone-400 truncate">
                          {booking.id?.slice(0, 8)?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Guests */}
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-stone-700">
                      <Icon icon="heroicons:users" className="size-3.5 text-stone-400" />
                      {totalGuests}
                    </span>
                    {booking.numberInfant > 0 && (
                      <span className="ml-1 text-xs text-stone-400">
                        (+{booking.numberInfant} 👶)
                      </span>
                    )}
                  </td>

                  {/* Accommodation chip */}
                  {hasAccommodationActivities && (
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ring-1 ${chipStyles[accomChip.variant]}`}
                      >
                        <Icon icon={accomChip.icon} className="size-3.5" />
                        {accomChip.label}
                      </span>
                    </td>
                  )}

                  {/* Flight chip */}
                  {externalActivities.length > 0 && (
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ring-1 ${chipStyles[flightChip.variant]}`}
                      >
                        <Icon icon={flightChip.icon} className="size-3.5" />
                        {flightChip.label}
                      </span>
                    </td>
                  )}

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {hasAccommodationActivities && (
                        <Link
                          id={getPublicTourActionId("accommodation", booking.id)}
                          href={`${baseUrl}/bookings/${booking.id}/assign-accommodation`}
                          prefetch={false}
                          onClick={() =>
                            storePublicTourReturnFocus("accommodation", booking.id)
                          }
                          aria-label={t(
                            "tourInstance.bookingTable.assignAccommodationAria",
                            {
                              defaultValue: "Gán khách sạn cho {{customerName}}",
                              customerName: booking.customerName,
                            },
                          )}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-all duration-150 hover:border-stone-300 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                        >
                          <Icon icon="heroicons:building-office-2" className="size-3.5" />
                          {accomChip.variant === "success"
                            ? t("tourInstance.bookingTable.editAccommodation", "Sửa KS")
                            : t("tourInstance.bookingTable.assignAccommodation", "Gán KS")}
                        </Link>
                      )}
                      {externalActivities.length > 0 && (
                        <Link
                          id={getPublicTourActionId("flight", booking.id)}
                          href={`${baseUrl}/bookings/${booking.id}/assign-flight-tickets`}
                          prefetch={false}
                          onClick={() =>
                            storePublicTourReturnFocus("flight", booking.id)
                          }
                          aria-label={t(
                            "tourInstance.bookingTable.assignFlightAria",
                            {
                              defaultValue: "Gán vé phương tiện cho {{customerName}}",
                              customerName: booking.customerName,
                            },
                          )}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-all duration-150 hover:border-blue-300 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        >
                          <Icon icon="heroicons:paper-airplane" className="size-3.5" />
                          {flightChip.variant === "success"
                            ? t("tourInstance.bookingTable.editFlight", "Sửa phương tiện")
                            : t("tourInstance.bookingTable.assignFlight", "Gán phương tiện")}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
