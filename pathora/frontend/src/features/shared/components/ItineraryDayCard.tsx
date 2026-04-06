"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";
import { TourDayDto } from "@/types/tour";
import { ActivityItem } from "./ActivityItem";

interface ItineraryDayCardProps {
  day: TourDayDto;
}

export function ItineraryDayCard({ day }: ItineraryDayCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border border-white/80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-warm-md)]"
      style={{ boxShadow: "var(--shadow-warm-sm)", background: "var(--tour-surface)" }}>
      <Button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--tour-surface-muted)] transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="bg-[#fa8b02]/10 rounded-full size-9 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[#fa8b02]">
              {day.dayNumber}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold" style={{ color: "var(--tour-heading)" }}>
              {day.title?.trim() ||
                t("landing.tourDetail.dayLabel", { day: day.dayNumber })}
            </span>
            {day.description && (
              <span className="text-xs" style={{ color: "var(--tour-caption)" }}>{day.description}</span>
            )}
          </div>
        </div>
        <Icon
          icon={expanded ? "heroicons:chevron-up" : "heroicons:chevron-down"}
          className="size-4"
          style={{ color: "var(--tour-caption)", transition: "transform 0.3s ease" }}
        />
      </Button>

      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-3">
          {day.activities.length > 0 ? (
            [...day.activities]
              .sort((a, b) => a.order - b.order)
              .map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
          ) : (
            <p className="text-xs" style={{ color: "var(--tour-body)" }}>
              {t("landing.tourDetail.noActivitiesInDay")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
