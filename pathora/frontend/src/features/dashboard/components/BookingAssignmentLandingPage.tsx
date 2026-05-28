"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { bookingService, type AdminBookingListResponse } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { handleApiError } from "@/utils/apiResponse";
import { getApprovalAppearance } from "@/utils/approvalStatusHelper";

interface Props {
  instanceId: string;
  bookingId: string;
  backUrl: string;
}

const isAccommodationActivity = (activityType?: string | number | null): boolean => {
  if (activityType == null) return false;
  const normalized = String(activityType).trim().toLowerCase();
  return normalized === "accommodation" || normalized === "8";
};

const isTransportationActivity = (activityType?: string | number | null): boolean => {
  if (activityType == null) return false;
  const t = String(activityType).trim().toLowerCase();
  return t === "transportation" || t === "2";
};

export default function BookingAssignmentLandingPage({
  instanceId,
  bookingId,
  backUrl,
}: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<AdminBookingListResponse | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!instanceId || !bookingId) return;

    setLoading(true);
    setError(null);
    try {
      const [instanceDetail, bookingList] = await Promise.all([
        tourInstanceService.getInstanceDetail(instanceId),
        bookingService.getBookingsByTourInstance(instanceId),
      ]);

      const activeBookings = (bookingList ?? []).filter(
        (b) => b.status !== "Cancelled",
      );
      const currentBooking = activeBookings.find((b) => b.id === bookingId);

      if (!currentBooking) {
        setError(
          t(
            "tourInstance.bookingHotel.bookingNotFound",
            "Không tìm thấy booking hoặc booking đã bị hủy.",
          ),
        );
        setLoading(false);
        return;
      }

      setBooking(currentBooking);

      // Extract accommodation activities
      const accommodationActivities = (instanceDetail?.days ?? []).flatMap((day) =>
        (day.activities ?? [])
          .filter((activity) => isAccommodationActivity(activity.activityType))
          .map((activity) => ({
            id: activity.id,
            title: activity.title ?? t("tourInstance.bookingLanding.activityRowAccom", "Khách sạn"),
            date: day.actualDate ?? "",
            dayNumber: day.instanceDayNumber ?? 1,
            type: "accommodation" as const,
            supplierName: activity.accommodation?.supplierName ?? null,
            supplierApprovalStatus: activity.accommodation?.supplierApprovalStatus ?? null,
          })),
      );

      // Extract external transport activities
      const transportActivities = (instanceDetail?.days ?? []).flatMap((day) =>
        (day.activities ?? [])
          .filter((activity) => isTransportationActivity(activity.activityType) && !activity.transportSupplierId)
          .map((activity) => ({
            id: activity.id,
            title: activity.title ?? t("tourInstance.bookingLanding.activityRowTransport", "Phương tiện"),
            date: day.actualDate ?? "",
            dayNumber: day.instanceDayNumber ?? 1,
            type: "transportation" as const,
            supplierName: null,
            supplierApprovalStatus: activity.externalTransportConfirmed ? "Approved" : "Pending",
          })),
      );

      const allActivities = [...accommodationActivities, ...transportActivities].sort(
        (a, b) => a.dayNumber - b.dayNumber || a.type.localeCompare(b.type),
      );

      const resolvedActivities = await Promise.all(
        allActivities.map(async (activity) => {
          try {
            if (activity.type === "accommodation") {
              const assignments = await tourInstanceService.getBookingRoomAssignments(
                instanceId,
                activity.id,
              );
              const myAssignments = assignments.filter(
                (a) => a.bookingId.toLowerCase() === bookingId.toLowerCase(),
              );
              return {
                ...activity,
                assignments: myAssignments,
                isAssigned: myAssignments.length > 0,
              };
            } else {
              const tickets = await tourInstanceService.getBookingTickets(
                instanceId,
                activity.id,
              );
              const myTickets = tickets.filter(
                (t) => t.bookingId.toLowerCase() === bookingId.toLowerCase(),
              );
              return {
                ...activity,
                tickets: myTickets,
                isAssigned: myTickets.length > 0,
              };
            }
          } catch (err) {
            console.error(`Error loading assignments for activity ${activity.id}:`, err);
            return {
              ...activity,
              assignments: [],
              tickets: [],
              isAssigned: false,
            };
          }
        }),
      );

      setActivities(resolvedActivities);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(
        t(
          apiError.message,
          t(
            "tourInstance.bookingHotel.loadError",
            "Không thể tải dữ liệu phân bổ cho booking.",
          ),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId, instanceId, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalGuests = useMemo(() => {
    if (!booking) return 0;
    return (
      (booking.numberAdult ?? 0) +
      (booking.numberChild ?? 0) +
      (booking.numberInfant ?? 0)
    );
  }, [booking]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 py-8 px-4 md:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="size-9 bg-stone-200 rounded-xl" />
            <div className="h-6 w-48 bg-stone-200 rounded" />
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4 animate-pulse">
            <div className="h-4 w-1/3 bg-stone-100 rounded" />
            <div className="h-10 bg-stone-100 rounded-xl" />
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4 animate-pulse">
            <div className="h-4 w-1/4 bg-stone-100 rounded" />
            <div className="h-14 bg-stone-100 rounded-xl" />
            <div className="h-14 bg-stone-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-stone-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <Icon
            icon="heroicons:exclamation-circle"
            className="mx-auto size-12 text-red-500"
          />
          <h2 className="text-lg font-bold text-stone-900">
            {t("common.error", "Đã xảy ra lỗi")}
          </h2>
          <p className="text-sm text-stone-600">{error || t("tourInstance.bookingHotel.bookingNotFound", "Không tìm thấy booking.")}</p>
          <div className="pt-2">
            <Link
              href={backUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {t("common.back", "Quay lại")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200/70 bg-white px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href={backUrl}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            aria-label={t("common.back", "Back")}
          >
            <Icon icon="heroicons:arrow-left" className="size-4 text-stone-600" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight text-stone-900">
              {t("tourInstance.bookingLanding.title", "Phân bổ Booking")}
            </h1>
            <p className="truncate text-sm text-stone-500">
              ID: {booking.id.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8 space-y-6">
        {/* Booking Details Card */}
        <div className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">
            Thông tin Booking
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-stone-400">
                {t("tourInstance.bookingLanding.headerCustomer", "Khách hàng")}
              </p>
              <p className="text-sm font-semibold text-stone-800 mt-1">
                {booking.customerName}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">
                {t("tourInstance.bookingLanding.headerParticipants", "Số khách")}
              </p>
              <p className="text-sm font-semibold text-stone-800 mt-1">
                {totalGuests} {t("tourInstance.bookingTable.booking", "khách")}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">
                {t("tourInstance.bookingLanding.headerStatus", "Trạng thái")}
              </p>
              <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-green-600/10">
                {booking.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-stone-400">
                {t("tourInstance.bookingLanding.headerTotal", "Tổng tiền")}
              </p>
              <p className="text-sm font-bold text-orange-600 mt-1">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(booking.totalAmount ?? booking.totalPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Activities list */}
        <div className="rounded-2xl border border-stone-200/70 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
            <h3 className="text-sm font-bold text-stone-900">
              {t("tourInstance.bookingLanding.activitiesTitle", "Danh sách dịch vụ cần phân bổ")}
            </h3>
          </div>

          {activities.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Icon
                icon="heroicons:calendar"
                className="mx-auto size-10 text-stone-300"
              />
              <p className="text-sm text-stone-500">
                {t("tourInstance.bookingLanding.empty", "Booking này không có hoạt động nào cần gán.")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {activities.map((activity) => {
                const dateStr = activity.date
                  ? (() => {
                      const [y, m, d] = activity.date.slice(0, 10).split("-");
                      return `${d}/${m}/${y}`;
                    })()
                  : "—";

                const isAccom = activity.type === "accommodation";
                const isAssigned = activity.isAssigned;

                const detailHref = isAccom
                  ? `/tour-operator/tour-instances/public/${instanceId}/bookings/${bookingId}/assign-accommodation?activityId=${activity.id}`
                  : `/tour-operator/tour-instances/public/${instanceId}/bookings/${bookingId}/assign-flight-tickets?activityId=${activity.id}`;

                let summaryText = "";
                if (isAccom && isAssigned) {
                  summaryText = activity.assignments
                    .map((a: any) => `${a.roomType ? String(a.roomType) : "—"} × ${a.roomCount}`)
                    .join(", ");
                } else if (!isAccom && isAssigned) {
                  summaryText = activity.tickets
                    .map((t: any) => t.flightNumber || t.seatNumbers || t.eTicketNumbers)
                    .filter(Boolean)
                    .join(", ");
                }

                const approvalAppearance = getApprovalAppearance(activity.supplierApprovalStatus);

                return (
                  <div
                    key={activity.id}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-400">
                          {t("tourInstance.bookingLanding.activityRowDay", {
                            defaultValue: "Ngày {{day}}",
                            day: activity.dayNumber,
                          })}{" "}
                          · {dateStr}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isAccom
                              ? "bg-orange-50 text-orange-700 border-orange-200/50"
                              : "bg-blue-50 text-blue-700 border-blue-200/50"
                          }`}
                        >
                          <Icon
                            icon={isAccom ? "heroicons:building-office-2" : "heroicons:paper-airplane"}
                            className="size-2.5"
                          />
                          {isAccom
                            ? t("tourInstance.bookingLanding.activityRowAccom", "Khách sạn")
                            : t("tourInstance.bookingLanding.activityRowTransport", "Phương tiện")}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-800">{activity.title}</h4>
                      {isAssigned ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5">
                            {summaryText || t("tourInstance.bookingTable.confirmed", "Đã gán")}
                          </span>
                          {activity.supplierName && (
                            <span className="text-xs text-stone-500">
                              NCC: {activity.supplierName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400 pt-1">
                          {t("tourInstance.bookingTable.notAssigned", "Chưa gán")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                      {isAccom && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${approvalAppearance.ringClassName}`}
                        >
                          <Icon icon={approvalAppearance.icon} className="size-3.5" />
                          {approvalAppearance.label}
                        </span>
                      )}
                      <Link
                        href={detailHref}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                          isAssigned
                            ? "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                            : "bg-orange-600 border-transparent text-white hover:bg-orange-700"
                        }`}
                      >
                        <Icon icon={isAssigned ? "heroicons:pencil-square" : "heroicons:plus-circle"} className="size-3.5" />
                        {isAssigned
                          ? t("tourInstance.bookingLanding.editButton", "Sửa")
                          : t("tourInstance.bookingLanding.assignButton", "Gán")}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
