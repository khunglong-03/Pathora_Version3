"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import {
  TourDayActivityDto,
  ActivityTypeMap,
  TransportationTypeMap,
  LegacyRoomTypeMap,
  MealTypeMap,
} from "@/types/tour";

interface ActivityItemProps {
  activity: TourDayActivityDto;
}

// Color + icon config per activity type
const ACTIVITY_TYPE_CONFIG: Record<
  string,
  { bg: string; border: string; text: string; iconBg: string; icon: string }
> = {
  Sightseeing: {
    bg: "#fef9f0",
    border: "#fde8c4",
    text: "#c47c18",
    iconBg: "#fef3e0",
    icon: "heroicons:eye",
  },
  Cultural: {
    bg: "#fdf5ff",
    border: "#e9d5ff",
    text: "#7c3aed",
    iconBg: "#ede9fe",
    icon: "heroicons:academic-cap",
  },
  Adventure: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    text: "#15803d",
    iconBg: "#dcfce7",
    icon: "heroicons:bolt",
  },
  Food: {
    bg: "#fff7ed",
    border: "#fed7aa",
    text: "#ea580c",
    iconBg: "#ffedd5",
    icon: "heroicons:cake",
  },
  Relaxation: {
    bg: "#f0f9ff",
    border: "#bae6fd",
    text: "#0369a1",
    iconBg: "#e0f2fe",
    icon: "heroicons:sun",
  },
  Shopping: {
    bg: "#fdf2f8",
    border: "#f9a8d4",
    text: "#be185d",
    iconBg: "#fce7f3",
    icon: "heroicons:shopping-bag",
  },
  Transport: {
    bg: "#f8fafc",
    border: "#cbd5e1",
    text: "#475569",
    iconBg: "#f1f5f9",
    icon: "heroicons:truck",
  },
  Accommodation: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    iconBg: "#dbeafe",
    icon: "heroicons:building-office-2",
  },
};

const DEFAULT_CONFIG = {
  bg: "#fef9f0",
  border: "#fde8c4",
  text: "#c47c18",
  iconBg: "#fef3e0",
  icon: "heroicons:star",
};

export function ActivityItem({ activity }: ActivityItemProps) {
  const { t, i18n } = useTranslation();

  const formatTimeLabel = (value: string | null | undefined): string => {
    if (!value) return "";
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime()) && value.includes("T")) {
      return new Intl.DateTimeFormat(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
    }
    return value.length >= 5 ? value.slice(0, 5) : value;
  };

  const startTime = formatTimeLabel(activity.startTime);
  const endTime = formatTimeLabel(activity.endTime);
  const timeStr = [startTime, endTime].filter(Boolean).join(" – ");

  const activityTypeKey = activity.activityType ?? "";
  const activityTypeLabel =
    ActivityTypeMap[activityTypeKey] ?? t("landing.tourDetail.activity");
  const config = ACTIVITY_TYPE_CONFIG[activityTypeKey] ?? DEFAULT_CONFIG;

  return (
    <div
      className="rounded-xl border overflow-hidden transition-shadow duration-200 hover:shadow-md"
      style={{
        background: config.bg,
        borderColor: config.border,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon circle */}
        <div
          className="size-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: config.iconBg }}
        >
          <Icon icon={config.icon} className="size-4" style={{ color: config.text }} />
        </div>

        {/* Title + time */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: config.iconBg, color: config.text }}
            >
              {activityTypeLabel}
            </span>
            {activity.isOptional && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#E1F3FE", color: "#1F6C9F" }}
              >
                {t("landing.tourDetail.optional")}
              </span>
            )}
          </div>
          <span
            className="text-sm font-semibold mt-0.5 truncate"
            style={{ color: "var(--tour-heading)" }}
          >
            {activity.title}
          </span>
        </div>

        {/* Time badge */}
        {timeStr && (
          <div
            className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg shrink-0"
            style={{ background: config.iconBg, color: config.text }}
          >
            {timeStr}
          </div>
        )}
      </div>

      {/* Body */}
      {(activity.description ||
        activity.transportationType ||
        activity.accommodation ||
        activity.note) && (
        <div
          className="px-4 pb-3 flex flex-col gap-2.5 border-t"
          style={{ borderColor: config.border }}
        >
          {/* Description */}
          {activity.description && (
            <p
              className="text-[12px] leading-relaxed pt-2.5"
              style={{ color: "var(--tour-body)" }}
            >
              {activity.description}
            </p>
          )}

          {/* Transportation card */}
          {activity.transportationType && (
            <div
              className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${config.border}` }}
            >
              <div className="flex items-center gap-2">
                <Icon
                  icon="heroicons:truck"
                  className="size-3.5 shrink-0"
                  style={{ color: "#475569" }}
                />
                <span className="text-[11px] font-bold" style={{ color: "#334155" }}>
                  {TransportationTypeMap[activity.transportationType] ??
                    t("landing.tourDetail.transport")}
                </span>
                {activity.durationMinutes != null && (
                  <span
                    className="ml-auto text-[11px] px-1.5 py-0.5 rounded"
                    style={{ background: "#f1f5f9", color: "#64748b" }}
                  >
                    {activity.durationMinutes} {t("landing.tourDetail.minutes")}
                  </span>
                )}
              </div>
              {activity.fromLocationName && activity.toLocationName && (
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#475569" }}>
                  <span className="font-medium truncate max-w-[40%]">
                    {activity.fromLocationName}
                  </span>
                  <Icon icon="heroicons:arrow-right" className="size-3 shrink-0 text-[#94a3b8]" />
                  <span className="font-medium truncate max-w-[40%]">
                    {activity.toLocationName}
                  </span>
                </div>
              )}
              {activity.transportationName && (
                <p className="text-[11px]" style={{ color: "#64748b" }}>
                  {activity.transportationName}
                </p>
              )}
            </div>
          )}

          {/* Accommodation card */}
          {activity.accommodation && (
            <div
              className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
              style={{
                background: "rgba(219,234,254,0.4)",
                border: "1px solid #bfdbfe",
              }}
            >
              <div className="flex items-center gap-2">
                <Icon
                  icon="heroicons:building-office-2"
                  className="size-3.5 shrink-0"
                  style={{ color: "#1d4ed8" }}
                />
                <span className="text-[11px] font-bold" style={{ color: "#1e3a8a" }}>
                  {activity.accommodation.accommodationName}
                </span>
                <span className="text-[11px] ml-0.5" style={{ color: "#3b82f6" }}>
                  ({LegacyRoomTypeMap[activity.accommodation.roomType] ??
                    t("landing.tourDetail.room")})
                </span>
                {activity.accommodation.mealsIncluded > 0 && (
                  <span
                    className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: "#fef3e0", color: "#c47c18" }}
                  >
                    🍽 {MealTypeMap[activity.accommodation.mealsIncluded] ?? t("landing.tourDetail.meal")}
                  </span>
                )}
              </div>
              {(activity.accommodation.checkInTime || activity.accommodation.checkOutTime) && (
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#2563eb" }}>
                  <Icon icon="heroicons:clock" className="size-3 shrink-0" />
                  <span>
                    {t("landing.tourDetail.checkInOut")}:{" "}
                    {[
                      activity.accommodation.checkInTime,
                      activity.accommodation.checkOutTime,
                    ]
                      .map(formatTimeLabel)
                      .filter(Boolean)
                      .join(" – ")}
                  </span>
                </div>
              )}
              {activity.accommodation.address && (
                <div className="flex items-start gap-1.5 text-[11px]" style={{ color: "#3b82f6" }}>
                  <Icon icon="heroicons:map-pin" className="size-3 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{activity.accommodation.address}</span>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          {activity.note && (
            <div className="flex items-start gap-1.5">
              <Icon
                icon="heroicons:information-circle"
                className="size-3.5 shrink-0 mt-0.5"
                style={{ color: "var(--tour-caption)" }}
              />
              <p className="text-[11px] italic" style={{ color: "var(--tour-caption)" }}>
                {activity.note}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
