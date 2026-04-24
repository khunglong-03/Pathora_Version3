"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { PencilSimple, EyeIcon } from "@phosphor-icons/react";

import { Icon } from "@/components/ui";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { tourService } from "@/api/services/tourService";
import type { TourDto } from "@/types/tour";
import { TourStatusMap } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { canTourDesignerEditTour } from "./editableTourStatus";

type DetailState = "loading" | "ready" | "error";

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  "1": { bg: "bg-green-100", text: "text-green-700", label: "Đã duyệt" },
  "3": { bg: "bg-amber-100", text: "text-amber-700", label: "Chờ duyệt" },
  "4": { bg: "bg-red-100", text: "text-red-700", label: "Từ chối" },
};

const ACTIVITY_ICONS: Record<string, string> = {
  "0": "heroicons:eye",
  "1": "heroicons:cake",
  "2": "heroicons:shopping-bag",
  "3": "heroicons:sparkles",
  "4": "heroicons:ticket",
  "5": "heroicons:building-library",
  "6": "heroicons:musical-note",
  "7": "heroicons:truck",
  "8": "heroicons:home-modern",
  "9": "heroicons:clock",
  "99": "heroicons:ellipsis-horizontal-circle",
};

const TRANSPORT_ICONS: Record<string, string> = {
  "0": "heroicons:paper-airplane",
  "1": "mdi:train",
  "2": "mdi:bus",
  "3": "mdi:car",
  "4": "mdi:taxi",
  "5": "mdi:sail-boat",
  "6": "mdi:ferry",
  "7": "mdi:motorbike",
  "8": "mdi:bicycle",
  "9": "mdi:walk",
  "99": "heroicons:truck",
};

export function TourDesignerTourDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const tourId = params?.id as string;

  const [tour, setTour] = useState<TourDto | null>(null);
  const [dataState, setDataState] = useState<DetailState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTour = useCallback(async () => {
    if (!tourId) return;
    try {
      setDataState("loading");
      setErrorMessage(null);
      const result = await tourService.getTourDetail(tourId);
      if (result) {
        setTour(result);
        setDataState("ready");
      } else {
        setTour(null);
        setDataState("error");
        setErrorMessage("Tour not found");
      }
    } catch (error: unknown) {
      setDataState("error");
      setErrorMessage(handleApiError(error).message);
    }
  }, [tourId]);

  useEffect(() => {
    void fetchTour();
  }, [fetchTour]);

  if (dataState === "loading") {
    return (
      <div className="max-w-6xl w-full mx-auto p-6">
        <div className="max-w-5xl">
          <SkeletonTable rows={3} columns={3} />
        </div>
      </div>
    );
  }
  if (dataState === "error" || !tour) {
    return (
      <div className="max-w-6xl w-full mx-auto p-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-700 font-medium mb-3">
            {errorMessage ?? t("tourDesigner.messages.errorLoading", "Failed to load tour")}
          </p>
          <button
            onClick={() => void fetchTour()}
            className="px-4 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
          >
            {t("tourDesigner.actions.retry", "Retry")}
          </button>
        </div>
      </div>
    );
  }
  const statusKey = String(tour.status ?? "");
  const badge = STATUS_BADGE[statusKey] ?? { bg: "bg-gray-100", text: "text-gray-700", label: statusKey };
  const canEdit = canTourDesignerEditTour(statusKey);

  return (
    <div className="max-w-6xl w-full mx-auto p-6 lg:p-8">
      {/* Premium Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-400 mb-4 uppercase tracking-wider">
          <Link href="/tour-designer/tours" className="hover:text-slate-800 transition-colors">
            {t("tourDesigner.breadcrumb.myTours", "My Tours")}
          </Link>
          <Icon icon="heroicons:chevron-right" className="size-3.5" />
          <span className="text-slate-800">{tour.tourCode}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">{tour.tourName}</h1>
            <p className="text-[15px] text-slate-500 mt-3 max-w-3xl leading-relaxed">
              {tour.shortDescription}
            </p>
            <div className="flex items-center gap-3 mt-5 text-sm">
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${badge.bg} ${badge.text} border border-white shadow-sm ring-1 ring-black/5`}>
                {TourStatusMap[Number(tour.status)] ?? badge.label}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">
                {tour.tourScope === 1 ? "Domestic" : "International"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 sm:mt-1">
            <Link
              href="/tour-designer/tours"
              className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              {t("common.back", "Back")}
            </Link>
            {canEdit && (
              <Link
                href={`/tour-designer/tours/${tourId}/edit`}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-slate-900 border border-slate-900 rounded-xl hover:bg-slate-800 hover:shadow-md transition-all"
              >
                <PencilSimple size={16} weight="bold" />
                {t("tourDesigner.actions.edit", "Edit")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tour Detail Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Main info */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Overview Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <Icon icon="heroicons:information-circle" className="size-5" />
              </div>
              {t("tourDesigner.tourDetail", "Tour Details")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tour Code</span>
                <span className="font-bold text-slate-900 text-[15px]">{tour.tourCode}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Scope</span>
                <span className="font-bold text-slate-900 text-[15px]">
                  {tour.tourScope === 1 ? "Domestic" : "International"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Segment</span>
                <span className="font-bold text-slate-900 text-[15px]">
                  {tour.customerSegment === 2 ? "Group" : "Individual"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Created</span>
                <span className="font-bold text-slate-900 text-[15px]">
                  {tour.createdOnUtc ? new Date(tour.createdOnUtc).toLocaleDateString("vi-VN") : "-"}
                </span>
              </div>
            </div>

            {tour.longDescription && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Description</span>
                <p className="text-[14.5px] text-slate-600 leading-relaxed whitespace-pre-wrap">{tour.longDescription}</p>
              </div>
            )}
          </div>

          {/* Packages/Classifications */}
          {tour.classifications && tour.classifications.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 px-2 flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                  <Icon icon="heroicons:map" className="size-6" />
                </div>
                {t("tourDesigner.packages", "Tour Packages")}
              </h2>
              <div className="space-y-8">
                {tour.classifications.map((cls, idx) => (
                  <div key={idx} className="bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200/80 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{cls.name}</h3>
                        {cls.description && (
                          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{cls.description}</p>
                        )}
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Price</span>
                        <span className="text-2xl font-black text-indigo-600">
                          {cls.price?.toLocaleString("vi-VN") ?? "-"} VND
                        </span>
                      </div>
                    </div>
                    
                    {cls.durationDays && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[13px] font-bold uppercase tracking-wider text-slate-600 mb-8 shadow-sm">
                        <Icon icon="heroicons:calendar" className="size-4 text-slate-400" />
                        {cls.durationDays} {t("tourDesigner.durationDays", "day(s)")}
                      </div>
                    )}

                    {cls.plans && cls.plans.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4 ml-2">{t("tourDesigner.itinerary", "Itinerary")}</h4>
                        <div className="space-y-4">
                          {cls.plans.map((day) => (
                            <DayPlanAccordion key={day.id} day={day} t={t} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Thumbnail & Images */}
        <div className="space-y-8">
          {/* Thumbnail */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 p-2 shadow-sm">
            {tour.thumbnail?.publicURL ? (
               <img
                  src={tour.thumbnail.publicURL}
                  alt={tour.tourName}
                  className="w-full aspect-video object-cover rounded-[1.5rem]"
                />
            ) : (
               <div className="w-full aspect-video bg-slate-100 rounded-[1.5rem] border border-slate-200/60 flex items-center justify-center text-slate-400">
                  <Icon icon="heroicons:photo" className="size-8 opacity-50" />
               </div>
            )}
          </div>
          
          {/* Quick Info */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 sm:p-8 shadow-sm">
            <h3 className="text-[15px] font-black text-slate-900 mb-5 flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                <Icon icon="heroicons:sparkles" className="size-4" />
              </div>
              {t("tourDesigner.quickInfo", "Quick Info")}
            </h3>
            <div className="space-y-4 text-[14.5px]">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Status</span>
                <span className={`font-bold uppercase text-[11px] tracking-wider ${badge.text}`}>
                  {TourStatusMap[Number(tour.status)] ?? badge.label}
                </span>
              </div>
              {tour.translations?.en && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">English Name</span>
                  <span className="font-bold text-slate-900 truncate max-w-[150px]">
                    {tour.translations.en.tourName ?? "-"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          {tour.images && tour.images.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 sm:p-8 shadow-sm">
              <h3 className="text-[15px] font-black text-slate-900 mb-5 flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                  <Icon icon="heroicons:photo" className="size-4" />
                </div>
                {t("tourDesigner.images", "Gallery")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {tour.images.map((img, idx) => (
                  <div key={idx} className="aspect-square sm:aspect-video xl:aspect-square rounded-[1.25rem] overflow-hidden bg-slate-100 border border-slate-200/60 relative group">
                    {img.publicURL ? (
                      <img
                        src={img.publicURL}
                        alt={`Tour image ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <EyeIcon size={24} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DayPlanAccordion({ day, t }: { day: any; t: any }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const sortedActivities = day.activities ? [...day.activities].sort((a: any, b: any) => a.order - b.order) : [];

  return (
    <div className="bg-white border border-slate-200/80 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors duration-200 focus:outline-none"
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-[15px] font-black shrink-0 border border-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
          {day.dayNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-[15px] font-bold text-slate-900 truncate tracking-tight">
            {t("tourDesigner.day", "Day")} {day.dayNumber}: {day.title}
          </h5>
          {day.description && (
            <p className="text-[13px] text-slate-500 truncate mt-0.5">{day.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isExpanded && sortedActivities.length > 0 && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              {sortedActivities.length} {t("tourDesigner.activities", "activities")}
            </span>
          )}
          <div className={`p-1.5 rounded-full bg-slate-50 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
            <Icon icon="heroicons:chevron-down" className="size-4" />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5">
          <div className="border-t border-slate-100/80 pt-4">
            {sortedActivities.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-100">
                {sortedActivities.map((act: any, actIdx: number) => (
                  <div key={act.id} className="relative flex gap-4 text-sm">
                    {/* Timeline Node */}
                    <div className="w-6 flex flex-col items-center shrink-0 py-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white z-10" />
                    </div>
                    
                    {/* Activity Content */}
                    <div className="flex-1 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <p className="font-bold text-slate-900 text-[15px] leading-snug">{act.title}</p>
                        {(act.startTime || act.endTime) && (
                          <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                            <Icon icon="heroicons:clock" className="size-3.5 text-slate-400" />
                            {act.startTime || "--:--"} {act.endTime ? `- ${act.endTime}` : ""}
                          </span>
                        )}
                      </div>
                      
                      {/* Meta Tags */}
                      <div className="flex flex-wrap gap-2 mt-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                          <Icon icon={ACTIVITY_ICONS[String(act.activityType)] || ACTIVITY_ICONS["99"]} className="size-3 text-indigo-500" />
                          Activity
                        </span>
                        
                        {(act.activityType === "7" || act.activityType === "Transportation") && act.transportationName ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/50 shadow-sm">
                            <Icon icon={TRANSPORT_ICONS[String(act.transportationType)] || TRANSPORT_ICONS["99"]} className="size-3 text-amber-600" />
                            {act.transportationName}
                          </span>
                        ) : null}
                        
                        {(act.activityType === "8" || act.activityType === "Accommodation") && (act.accommodation?.accommodationName || act.locationName) ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200/50 shadow-sm">
                            <Icon icon="heroicons:building-office-2" className="size-3 text-indigo-600" />
                            {act.accommodation?.accommodationName || act.locationName}
                          </span>
                        ) : null}
                      </div>

                      {act.description && (
                        <p className="text-[13.5px] text-slate-500 mt-3 leading-relaxed">{act.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Icon icon="heroicons:inbox" className="size-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">{t("tourDesigner.noActivities", "No activities yet")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
