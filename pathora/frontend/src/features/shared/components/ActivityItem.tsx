"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import {
  TourDayActivityDto,
  ActivityTypeMap,
  TransportationTypeMap,
  RoomTypeMap,
  MealTypeMap,
} from "@/types/tour";

interface ActivityItemProps {
  activity: TourDayActivityDto;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const { t, i18n } = useTranslation();

  const formatDateTimeLabel = (value: string | null | undefined): string => {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime()) && value.includes("T")) {
      return new Intl.DateTimeFormat(i18n.language, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
    }

    if (value.length >= 5) {
      return value.slice(0, 5);
    }

    return value;
  };

  const timeStr = [
    formatDateTimeLabel(activity.startTime),
    formatDateTimeLabel(activity.endTime),
  ]
    .filter(Boolean)
    .join(" – ");

  const activityTypeLabel =
    ActivityTypeMap[activity.activityType] ?? t("landing.tourDetail.activity");

  return (
    <div className="flex gap-3 pl-3 border-l-2 transition-all duration-200 hover:border-[#fa8b02]"
      style={{ borderColor: "#fde8d4" }}>
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "#fef3e4", color: "#c9873a" }}>
            {activityTypeLabel}
          </span>
          {activity.isOptional && (
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "#E1F3FE", color: "#1F6C9F" }}>
              {t("landing.tourDetail.optional")}
            </span>
          )}
          {timeStr && <span className="text-[10px]" style={{ color: "var(--tour-caption)" }}>{timeStr}</span>}
        </div>

        <span className="text-sm font-semibold" style={{ color: "var(--tour-heading)" }}>
          {activity.title}
        </span>

        {activity.description && (
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--tour-body)" }}>
            {activity.description}
          </p>
        )}

        {activity.routes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {[...activity.routes]
              .sort((a, b) => a.order - b.order)
              .map((route) => {
                const departureTime = formatDateTimeLabel(
                  route.estimatedDepartureTime,
                );
                const arrivalTime = formatDateTimeLabel(route.estimatedArrivalTime);
                const routeTime = [departureTime, arrivalTime]
                  .filter(Boolean)
                  .join(" → ");

                return (
                  <div
                    key={route.id}
                    className="rounded-lg px-3 py-2.5 text-[11px]"
                    style={{ background: "var(--tour-surface-muted)", color: "var(--tour-body)" }}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Icon
                        icon="heroicons:arrow-right"
                        className="size-3 shrink-0"
                        style={{ color: "var(--tour-caption)" }}
                      />
                      <span className="font-semibold">
                        {TransportationTypeMap[route.transportationType] ??
                          t("landing.tourDetail.transport")}
                      </span>
                      {route.fromLocation?.locationName &&
                        route.toLocation?.locationName && (
                          <span>
                            {route.fromLocation.locationName} →{" "}
                            {route.toLocation.locationName}
                          </span>
                        )}
                      {route.durationMinutes != null && (
                        <span style={{ color: "var(--tour-caption)" }}>
                          ({route.durationMinutes} {t("landing.tourDetail.minutes")})
                        </span>
                      )}
                    </div>
                    {routeTime && (
                      <div className="mt-1" style={{ color: "var(--tour-caption)" }}>
                        {t("landing.tourDetail.routeTime")}: {routeTime}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-[10px] mt-0.5" style={{ color: "var(--tour-caption)" }}>
            {t("landing.tourDetail.transportation.empty")}
          </p>
        )}

        {activity.accommodation ? (
          <div
            className="rounded-lg border px-3 py-2.5 text-[11px]"
            style={{ background: "#E1F3FE", borderColor: "#B8D8F0", color: "var(--tour-body)" }}>
            <div className="flex flex-wrap items-center gap-1.5">
              <Icon
                icon="heroicons:building-office"
                className="size-3 shrink-0"
                style={{ color: "var(--tour-caption)" }}
              />
              <span className="font-semibold">
                {activity.accommodation.accommodationName}
              </span>
              <span>
                ({RoomTypeMap[activity.accommodation.roomType] ??
                  t("landing.tourDetail.room")})
              </span>
              {activity.accommodation.mealsIncluded > 0 && (
                <span style={{ color: "#fa8b02" }}>
                  •
                  {` ${MealTypeMap[activity.accommodation.mealsIncluded] ?? t("landing.tourDetail.meal")}`}
                </span>
              )}
            </div>
            {(activity.accommodation.checkInTime ||
              activity.accommodation.checkOutTime) && (
              <div className="mt-1" style={{ color: "var(--tour-caption)" }}>
                {t("landing.tourDetail.checkInOut")}:{" "}
                {[activity.accommodation.checkInTime, activity.accommodation.checkOutTime]
                  .map((timeValue) => formatDateTimeLabel(timeValue))
                  .filter(Boolean)
                  .join(" – ")}
              </div>
            )}
            {activity.accommodation.address && (
              <div className="mt-1 line-clamp-2" style={{ color: "var(--tour-caption)" }}>
                {t("landing.tourDetail.location")}: {activity.accommodation.address}
              </div>
            )}
          </div>
        ) : null}

        {activity.note && (
          <p className="text-[10px] italic mt-0.5" style={{ color: "var(--tour-caption)" }}>
            {activity.note}
          </p>
        )}

      </div>
    </div>
  );
}
