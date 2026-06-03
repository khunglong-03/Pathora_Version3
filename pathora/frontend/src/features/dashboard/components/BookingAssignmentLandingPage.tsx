"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { bookingService, type AdminBookingListResponse } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { handleApiError } from "@/utils/apiResponse";
import { getApprovalAppearance } from "@/utils/approvalStatusHelper";
import { useAuth } from "@/contexts/AuthContext";
import ParticipantReviewModal from "./bookings/ui/ParticipantReviewModal";
import { ClipboardText } from "@phosphor-icons/react";

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

  // 1.3: Read role and loading state from useAuth()
  const { user, isLoading: isAuthLoading } = useAuth();
  const isTourOperator = user?.roles?.some((r) => r.name === "TourOperator");

  // Cache strategy (Task 8.2): Chosen raw useState + callback updates instead of registering in RTK Query apiSlice
  // because the participant list is only reviewed and handled locally within this landing page context
  // and doesn't require cross-route persistence once the operator leaves this deep detail page.
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showOpacity, setShowOpacity] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1.1: Gate fetch by role
  const fetchParticipantsData = useCallback(async (showIndicator = false) => {
    if (!bookingId || !isTourOperator) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setParticipantsError(null);
    let timeoutId: any = null;

    if (showIndicator) {
      timeoutId = setTimeout(() => {
        setShowOpacity(true);
      }, 200);
    } else {
      setIsLoadingParticipants(true);
    }

    try {
      const data = await bookingService.getOperatorParticipants(bookingId);
      if (controller.signal.aborted) return;
      setParticipants(data || []);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setParticipantsError(err?.response?.status === 403 ? "Forbidden" : "Error");
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (!controller.signal.aborted) {
        setIsLoadingParticipants(false);
        setShowOpacity(false);
      }
    }
  }, [bookingId, isTourOperator]);

  useEffect(() => {
    if (isTourOperator && !isAuthLoading) {
      void fetchParticipantsData(false);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isTourOperator, isAuthLoading, fetchParticipantsData]);

  // 2.1: Compute badge counts from participants list
  const badgeCounts = useMemo(() => {
    const active = participants.filter((p) => p.status !== "Cancelled");
    const approved = active.filter((p) => p.infoReviewStatus === "Approved").length;
    const rejected = active.filter((p) => p.infoReviewStatus === "Rejected").length;
    return {
      approvedCount: approved,
      rejectedCount: rejected,
      totalActiveCount: active.length,
    };
  }, [participants]);

  // 4.2: Callback split (handleClose no refetch vs handleReviewed payload update)
  const handleClose = useCallback(() => {
    setIsReviewModalOpen(false);
  }, []);

  const handleReviewed = useCallback((updatedList?: any[]) => {
    setIsReviewModalOpen(false);
    if (Array.isArray(updatedList)) {
      setParticipants(updatedList);
    } else {
      void fetchParticipantsData(true);
    }
  }, [fetchParticipantsData]);

  // 2.2: Render badge inline (pill) next to button
  const renderReviewBadgeAndButton = () => {
    if (isAuthLoading) {
      return (
        <div className="h-8 w-32 bg-stone-100 animate-pulse rounded-xl" />
      );
    }

    if (!isTourOperator) return null;

    if (participantsError === "Forbidden") {
      return (
        <span 
          className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-stone-50 text-stone-400 ring-1 ring-stone-200"
          title={t("participantReview.publicBookingLanding.noPermissionTooltip", "Bạn không có quyền duyệt booking này")}
        >
          —
        </span>
      );
    }

    if (isLoadingParticipants && participants.length === 0) {
      return (
        <div className="h-8 w-24 bg-stone-100 animate-pulse rounded-xl" />
      );
    }

    const { approvedCount, rejectedCount, totalActiveCount } = badgeCounts;

    let badgeText = "";
    let badgeCls = "";
    let ariaLabel = "";

    if (participantsError === "Error") {
      badgeText = t("participantReview.publicBookingLanding.badge.loadError", "Tải lỗi");
      badgeCls = "bg-stone-100 text-stone-700 ring-1 ring-stone-200";
      ariaLabel = t("participantReview.publicBookingLanding.retryTooltip", "Tải lại trạng thái");
    } else if (totalActiveCount === 0) {
      badgeText = t("participantReview.publicBookingLanding.badge.empty", "Chưa có hành khách");
      badgeCls = "bg-stone-100 text-stone-700 ring-1 ring-stone-200";
      ariaLabel = t("participantReview.publicBookingLanding.badge.empty", "Chưa có hành khách");
    } else if (approvedCount === totalActiveCount) {
      badgeText = t("participantReview.publicBookingLanding.badge.allApproved", { approved: approvedCount, total: totalActiveCount, defaultValue: "{{approved}}/{{total}} đã duyệt" });
      badgeCls = "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
      ariaLabel = t("participantReview.publicBookingLanding.badgeAriaLabel", { approved: approvedCount, total: totalActiveCount, defaultValue: "Trạng thái duyệt: {{approved}} trên {{total}} hành khách đã duyệt" });
    } else if (rejectedCount > 0) {
      badgeText = t("participantReview.publicBookingLanding.badge.partial", { approved: approvedCount, total: totalActiveCount, defaultValue: "{{approved}}/{{total}} đã duyệt" }) + 
                  t("participantReview.publicBookingLanding.badge.withRejected", { rejected: rejectedCount, defaultValue: " • {{rejected}} từ chối" });
      badgeCls = "bg-red-50 text-red-700 ring-1 ring-red-200";
      ariaLabel = t("participantReview.publicBookingLanding.badgeAriaLabel_withRejected", { approved: approvedCount, total: totalActiveCount, rejected: rejectedCount, defaultValue: "Trạng thái duyệt: {{approved}} trên {{total}} hành khách đã duyệt, {{rejected}} bị từ chối" });
    } else {
      badgeText = t("participantReview.publicBookingLanding.badge.partial", { approved: approvedCount, total: totalActiveCount, defaultValue: "{{approved}}/{{total}} đã duyệt" });
      badgeCls = "bg-white text-stone-700 ring-1 ring-stone-200";
      ariaLabel = t("participantReview.publicBookingLanding.badgeAriaLabel", { approved: approvedCount, total: totalActiveCount, defaultValue: "Trạng thái duyệt: {{approved}} trên {{total}} hành khách đã duyệt" });
    }

    const isButtonDisabled = participantsError !== "Error" && totalActiveCount === 0;

    return (
      <div 
        className={`flex flex-col md:flex-row items-stretch md:items-center gap-3 transition-opacity duration-200 w-full md:w-auto ${showOpacity ? "opacity-60" : ""}`}
      >
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span 
            className={`inline-flex items-center justify-center px-2.5 py-2 md:py-1 rounded-xl text-xs font-semibold w-full md:w-auto text-center ${badgeCls}`}
            aria-label={ariaLabel}
            title={isButtonDisabled ? t("participantReview.publicBookingLanding.noActiveTooltip", "Không có hành khách để duyệt") : undefined}
          >
            {badgeText}
          </span>
          {participantsError === "Error" && (
            <button
              type="button"
              onClick={() => fetchParticipantsData(false)}
              className="p-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 text-xs font-bold"
            >
              {t("participantReview.publicBookingLanding.retryTooltip", "Tải lại")}
            </button>
          )}
        </div>
        <button
          ref={triggerButtonRef}
          type="button"
          disabled={isButtonDisabled || (isLoadingParticipants && showOpacity)}
          onClick={(e) => {
            triggerButtonRef.current = e.currentTarget;
            setIsReviewModalOpen(true);
          }}
          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all w-full md:w-auto min-h-[40px] md:min-h-0 ${
            isButtonDisabled
              ? "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-amber-500 border-transparent text-white hover:bg-amber-600 cursor-pointer"
          }`}
          title={isButtonDisabled ? t("participantReview.publicBookingLanding.noActiveTooltip", "Không có hành khách để duyệt") : undefined}
        >
          <ClipboardText size={16} weight="bold" />
          <span>{t("participantReview.publicBookingLanding.button", "Duyệt hành khách")}</span>
        </button>
      </div>
    );
  };

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Thông tin Booking
            </h2>
            {renderReviewBadgeAndButton()}
          </div>
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

      <ParticipantReviewModal
        bookingId={bookingId}
        isOpen={isReviewModalOpen}
        onClose={handleClose}
        onReviewed={handleReviewed}
      />
    </div>
  );
}
