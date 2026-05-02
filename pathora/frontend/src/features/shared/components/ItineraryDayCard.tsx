"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { TourDayDto } from "@/types/tour";
import { ActivityItem } from "./ActivityItem";

interface ItineraryDayCardProps {
  day: TourDayDto;
  defaultExpanded?: boolean;
}

export function ItineraryDayCard({ day, defaultExpanded = false }: ItineraryDayCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const activityCount = day.activities?.length ?? 0;

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-white ${
        expanded 
          ? "shadow-md border-orange-200" 
          : "shadow-sm border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      {/* 
        Sử dụng thẻ <button> thay vì component <Button> của UI kit để tránh 
        bị áp dụng default variant="primary" (làm cả thanh bị màu cam đậm che chữ).
      */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors duration-200 cursor-pointer outline-none ${
          expanded ? "bg-orange-50/50" : "hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Day number circle */}
          <div
            className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
              expanded 
                ? "bg-orange-500 text-white shadow-sm shadow-orange-200" 
                : "bg-orange-100 text-orange-600"
            }`}
          >
            <span className="text-sm font-bold">
              {day.dayNumber}
            </span>
          </div>

          {/* Title + description */}
          <div className="flex flex-col items-start text-left">
            <span className={`text-base font-bold transition-colors ${expanded ? "text-slate-900" : "text-slate-700"}`}>
              {day.title?.trim() || t("landing.tourDetail.dayLabel", { day: day.dayNumber })}
            </span>
            {day.description && (
              <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {day.description}
              </span>
            )}
          </div>
        </div>

        {/* Right side: activity count + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          {activityCount > 0 && (
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                expanded ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {activityCount} {t("landing.tourDetail.activity", "Hoạt động")}
            </span>
          )}
          <div className={`p-1.5 rounded-full transition-colors ${expanded ? "bg-orange-100/50" : "bg-transparent"}`}>
             <Icon
               icon={expanded ? "heroicons:chevron-up" : "heroicons:chevron-down"}
               className={`size-4 transition-transform duration-300 ${expanded ? "text-orange-500" : "text-slate-400"}`}
             />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-3 flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50">
            {activityCount > 0 ? (
              [...day.activities]
                .sort((a, b) => a.order - b.order)
                .map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <Icon icon="heroicons:calendar" className="size-8 mb-2 opacity-50" />
                <p className="text-xs font-medium">
                  {t("landing.tourDetail.noActivitiesInDay")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
