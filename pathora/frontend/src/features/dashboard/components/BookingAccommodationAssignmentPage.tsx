"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { bookingService, type AdminBookingListResponse } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import type { NormalizedTourInstanceDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import {
  focusPageHeading,
  storePublicTourReturnFocus,
} from "@/utils/publicTourRouteFocus";
import PublicTourBookingAssignmentPanel from "./PublicTourBookingAssignmentPanel";

interface Props {
  instanceId: string;
  bookingId?: string;
  backUrl?: string;
}

interface AccommodationActivityInfo {
  activityId: string;
  title: string;
  date: string;
  dayNumber: number;
  roomBlocksTotal: number;
  quantity: number;
  roomType: string | null;
  supplierName: string | null;
  supplierApprovalStatus: string | null;
}

const isAccommodationActivity = (activityType?: string | number | null): boolean => {
  if (activityType == null) return false;
  const normalized = String(activityType).trim().toLowerCase();
  return normalized === "accommodation" || normalized === "8";
};

const toAccommodationActivities = (
  instance: NormalizedTourInstanceDto | null,
): AccommodationActivityInfo[] => {
  if (!instance?.days) return [];

  return instance.days.flatMap((day) =>
    (day.activities ?? [])
      .filter((activity) => isAccommodationActivity(activity.activityType))
      .map((activity) => ({
        activityId: activity.id,
        title: activity.title,
        date: day.actualDate,
        dayNumber: day.instanceDayNumber,
        roomBlocksTotal: activity.accommodation?.roomBlocksTotal ?? 0,
        quantity: activity.accommodation?.quantity ?? 0,
        roomType: activity.accommodation?.roomType ?? null,
        supplierId: activity.accommodation?.supplierId ?? null,
        supplierName: activity.accommodation?.supplierName ?? null,
        supplierApprovalStatus: activity.accommodation?.supplierApprovalStatus ?? null,
      })),
  );
};

export default function BookingAccommodationAssignmentPage({
  instanceId,
  bookingId,
  backUrl,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<NormalizedTourInstanceDto | null>(null);
  const [bookings, setBookings] = useState<AdminBookingListResponse[]>([]);
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);

  const resolvedBackUrl =
    backUrl || `/tour-operator/tour-instances/public/${instanceId}`;

  const fetchData = useCallback(async () => {
    if (!instanceId) return;

    setLoading(true);
    setError(null);
    try {
      const [instanceDetail, bookingList] = await Promise.all([
        tourInstanceService.getInstanceDetail(instanceId),
        bookingService.getBookingsByTourInstance(instanceId),
      ]);

      const activeBookings = (bookingList ?? []).filter(
        (booking) => booking.status !== "Cancelled",
      );
      const scopedBookings = bookingId
        ? activeBookings.filter((booking) => booking.id === bookingId)
        : activeBookings;

      if (bookingId && scopedBookings.length === 0) {
        setInstance(instanceDetail);
        setBookings([]);
        setError(
          t(
            "tourInstance.bookingHotel.bookingNotFound",
            "Booking does not belong to this tour instance.",
          ),
        );
        return;
      }

      setInstance(instanceDetail);
      setBookings(scopedBookings);
    } catch (err) {
      const apiError = handleApiError(err);
      setInstance(null);
      setBookings([]);
      setError(
        t(
          apiError.message,
          t(
            "tourInstance.bookingHotel.loadError",
            "Could not load accommodation assignment data.",
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

  useEffect(() => {
    focusPageHeading(headingRef.current);
  }, []);

  const accommodationActivities = useMemo(
    () => toAccommodationActivities(instance),
    [instance],
  );

  const handleRoomAssignmentSaved = useCallback(() => {
    if (!bookingId) return;
    storePublicTourReturnFocus("accommodation", bookingId);
    router.push(resolvedBackUrl);
  }, [bookingId, resolvedBackUrl, router]);

  const handleBack = useCallback(() => {
    if (bookingId) {
      storePublicTourReturnFocus("accommodation", bookingId);
    }
    router.push(resolvedBackUrl);
  }, [bookingId, resolvedBackUrl, router]);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-stone-200/70 bg-white px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("common.back", "Back")}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <Icon icon="heroicons:arrow-left" className="size-4 text-stone-600" />
          </button>
          <div className="min-w-0">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="truncate text-lg font-bold leading-tight text-stone-900 focus:outline-none"
            >
              {bookingId
                ? t(
                    "tourInstance.bookingHotel.titleSingle",
                    "Assign accommodation for booking",
                  )
                : t(
                    "tourInstance.bookingHotel.titleOverview",
                    "Assign accommodation by booking",
                  )}
            </h1>
            {instance?.tourName && (
              <p className="truncate text-sm text-stone-500">{instance.tourName}</p>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8">
        <nav
          aria-label={t("tourInstance.breadcrumb.label", "Breadcrumb")}
          className="text-xs font-semibold text-stone-500"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <button
                type="button"
                onClick={handleBack}
                className="text-orange-600 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
              >
                {t("tourInstance.breadcrumb.publicTourDetail", "Chi tiết tour public")}
              </button>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-stone-700" aria-current="page">
              {t("tourInstance.breadcrumb.assignAccommodation", "Gán khách sạn")}
            </li>
          </ol>
        </nav>

        {loading && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="h-5 w-56 animate-pulse rounded bg-stone-200" />
            <div className="mt-5 space-y-3">
              <div className="h-12 animate-pulse rounded-xl bg-stone-100" />
              <div className="h-12 animate-pulse rounded-xl bg-stone-100" />
              <div className="h-12 animate-pulse rounded-xl bg-stone-100" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <Icon
              icon="heroicons:exclamation-circle"
              className="mx-auto size-8 text-red-400"
            />
            <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void fetchData()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <Icon icon="heroicons:arrow-path" className="size-4" />
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {!loading && !error && accommodationActivities.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <Icon
              icon="heroicons:building-office-2"
              className="mx-auto size-10 text-stone-300"
            />
            <p className="mt-3 text-base font-semibold text-stone-600">
              {t(
                "tourInstance.bookingHotel.emptyAccommodation",
                "No accommodation activity needs assignment.",
              )}
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
            >
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {t("common.back", "Back")}
            </button>
          </div>
        )}

        {!loading && !error && accommodationActivities.length > 0 && (
          <PublicTourBookingAssignmentPanel
            instanceId={instanceId}
            instanceType="public"
            bookings={bookings}
            bookingsLoading={false}
            accommodationActivities={accommodationActivities}
            externalTransportActivities={[]}
            continent={instance?.continent ?? null}
            onSaveRoomAssignment={async (activityId, payload) => {
              await tourInstanceService.saveBookingRoomAssignment(
                instanceId,
                activityId,
                payload,
              );
            }}
            onLoadRoomAssignments={(activityId) =>
              tourInstanceService.getBookingRoomAssignments(instanceId, activityId)
            }
            onRoomAssignmentSaved={handleRoomAssignmentSaved}
            onSetAccommodationRequirements={
              !bookingId
                ? async (activityId, payload) => {
                    await tourInstanceService.setAccommodationRequirements(
                      instanceId,
                      activityId,
                      payload,
                    );
                  }
                : undefined
            }
            onRequirementsSaved={() => {
              void fetchData();
            }}
          />
        )}
      </main>
    </div>
  );
}
