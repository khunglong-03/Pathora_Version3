"use client";

import React from "react";
import { useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/Icon";
import type { TourFormValues } from "@/schemas/tour-form";

/* ── Types ──────────────────────────────────────────────────── */
interface ClassificationForm {
  id?: string;
  name: string;
  enName: string;
  description: string;
  enDescription: string;
  basePrice: string;
  durationDays: string;
}

interface ActivityForm {
  id?: string;
  activityType: string;
  title: string;
  enTitle: string;
  description: string;
  enDescription: string;
  note: string;
  enNote: string;
  estimatedCost: string;
  isOptional: boolean;
  startTime: string;
  endTime: string;
  linkToResources: string[];
  routes: ActivityRouteForm[];
  locationName: string;
  enLocationName: string;
  locationCity: string;
  enLocationCity: string;
  locationCountry: string;
  enLocationCountry: string;
  locationAddress: string;
  enLocationAddress: string;
  locationEntranceFee: string;
  fromLocation: string;
  enFromLocation: string;
  toLocation: string;
  enToLocation: string;
  transportationType: string;
  enTransportationType: string;
  transportationName: string;
  enTransportationName: string;
  durationMinutes: string;
  price: string;
  accommodationName: string;
  enAccommodationName: string;
  accommodationAddress: string;
  enAccommodationAddress: string;
  accommodationPhone: string;
  checkInTime: string;
  checkOutTime: string;
  roomType: string;
  roomCapacity: string;
  mealsIncluded: string;
  roomPrice: string;
  numberOfRooms: string;
  numberOfNights: string;
  specialRequest: string;
  latitude: string;
  longitude: string;
}

interface ActivityRouteForm {
  id: string;
  fromLocationIndex: string;
  fromLocationCustom: string;
  enFromLocationCustom: string;
  toLocationIndex: string;
  toLocationCustom: string;
  enToLocationCustom: string;
  transportationType: string;
  enTransportationType: string;
  transportationName: string;
  enTransportationName: string;
  durationMinutes: string;
  price: string;
  note: string;
  enNote: string;
}

interface DayPlanForm {
  id?: string;
  dayNumber: string;
  title: string;
  enTitle: string;
  description: string;
  enDescription: string;
  activities: ActivityForm[];
}

/* ── Constants ──────────────────────────────────────────────── */
const TRANSPORTATION_TYPE_OPTIONS = [
  { value: "0", label: "Flight" },
  { value: "1", label: "Train" },
  { value: "2", label: "Bus" },
  { value: "3", label: "Car" },
  { value: "4", label: "Taxi" },
  { value: "5", label: "Boat" },
  { value: "6", label: "Ferry" },
  { value: "7", label: "Motorbike" },
  { value: "8", label: "Bicycle" },
  { value: "9", label: "Walking" },
  { value: "99", label: "Other" },
];

const ACTIVITY_TYPE_OPTIONS = [
  { value: "0" },
  { value: "1" },
  { value: "2" },
  { value: "3" },
  { value: "4" },
  { value: "5" },
  { value: "6" },
  { value: "7" },
  { value: "8" },
  { value: "9" },
  { value: "99" },
];

/* ── Props ──────────────────────────────────────────────────── */
interface TourItineraryBuilderProps {
  classifications: ClassificationForm[];
  dayPlans: DayPlanForm[][];
  selectedPackageIndex: number;
  expandedRoutes: Record<string, boolean>;
  isEditMode: boolean;
  activeLang: "vi" | "en";
  activityTypes: string[];
  transportationTypes: string[];
  onSetSelectedPackageIndex: (v: number) => void;
  onAddDayPlan: (clsIndex: number) => void;
  onRemoveDayPlan: (clsIndex: number, dayIndex: number) => void;
  onUpdateDayPlan: (clsIndex: number, dayIndex: number, field: keyof DayPlanForm, value: string) => void;
  onAddActivity: (clsIndex: number, dayIndex: number) => void;
  onRemoveActivity: (clsIndex: number, dayIndex: number, actIndex: number) => void;
  onUpdateActivity: (clsIndex: number, dayIndex: number, actIndex: number, field: keyof ActivityForm, value: string | boolean) => void;
  onAddRoute: (pi: number, di: number, ai: number) => void;
  onRemoveRoute: (pi: number, di: number, ai: number, ri: number) => void;
  onUpdateRoute: (pi: number, di: number, ai: number, ri: number, field: keyof ActivityRouteForm, value: string) => void;
  onAddLinkToResource: (clsIndex: number, dayIndex: number, actIndex: number) => void;
  onRemoveLinkToResource: (clsIndex: number, dayIndex: number, actIndex: number, linkIndex: number) => void;
  onUpdateLinkToResource: (clsIndex: number, dayIndex: number, actIndex: number, linkIndex: number, value: string) => void;
  onToggleActivityRoute: (pi: number, di: number, ai: number, ri?: number) => void;
  onConfirmDelete: () => void;
  setConfirmDelete: React.Dispatch<React.SetStateAction<{
    type: "classification" | "dayPlan" | "activity";
    index1: number;
    index2?: number;
    index3?: number;
  } | null>>;
}

export function TourItineraryBuilder({
  classifications,
  dayPlans,
  selectedPackageIndex,
  expandedRoutes,
  isEditMode,
  activeLang,
  activityTypes,
  transportationTypes,
  onSetSelectedPackageIndex,
  onAddDayPlan,
  onRemoveDayPlan,
  onUpdateDayPlan,
  onAddActivity,
  onRemoveActivity,
  onUpdateActivity,
  onAddRoute,
  onRemoveRoute,
  onUpdateRoute,
  onAddLinkToResource,
  onRemoveLinkToResource,
  onUpdateLinkToResource,
  onToggleActivityRoute,
  setConfirmDelete,
}: TourItineraryBuilderProps) {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { errors } = useFormState<TourFormValues>({ name: "dayPlans" } as any);

  const ci = selectedPackageIndex;

  return (
    <div className="space-y-5">
      {/* Package Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          {t("tourAdmin.itineraries.selectPackageTitle")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {t("tourAdmin.itineraries.selectPackageSubtitle")}
        </p>
        <div className="flex flex-wrap gap-3">
          {classifications.map((cls, i) => {
            const daysProcessed = (dayPlans[i] ?? []).length;
            const totalDays = Number(cls.durationDays) || 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSetSelectedPackageIndex(i)}
                className={`flex-1 min-w-45 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPackageIndex === i
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      selectedPackageIndex === i
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}>
                    {t("tourAdmin.packages.packageNumber", { number: i + 1 })}
                  </span>
                  {selectedPackageIndex === i && (
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <Icon
                        icon="heroicons:check"
                        className="size-3 text-white"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-900 dark:text-white">
                  {activeLang === "vi" ? (cls.name || t("tourAdmin.packages.packageNumber", { number: i + 1 })) : (cls.enName || cls.name || t("tourAdmin.packages.packageNumber", { number: i + 1 }))}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("tourAdmin.itineraries.daysProcessed", { processed: daysProcessed, total: totalDays })}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Itinerary Editor */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("tourAdmin.itineraries.itineraryForPackage", { number: ci + 1 })}
          </h2>
          <button
            type="button"
            onClick={() => onAddDayPlan(ci)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <Icon icon="heroicons:plus" className="size-4" />
            {t("tourAdmin.buttons.addDay")}
          </button>
        </div>

        {(dayPlans[ci] ?? []).length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Icon
              icon="heroicons:calendar-days"
              className="size-10 mx-auto mb-3 opacity-40"
            />
            <p className="text-sm">
              {t("tourAdmin.itineraries.noDaysYet")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(dayPlans[ci] ?? []).map((day, di) => (
              <div
                key={di}
                className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                {/* Day Header — Orange */}
                <div className="bg-orange-500 px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {day.dayNumber}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => onUpdateDayPlan(ci, di, "title", e.target.value)}
                      placeholder={t("tourAdmin.itineraries.placeholderDayTitle", { number: day.dayNumber })}
                      className="flex-1 px-2 py-1 text-sm bg-white/10 text-white rounded border border-white/20 placeholder:text-white/60 focus:ring-2 focus:ring-white/30 outline-none"
                    />
                    <input
                      type="text"
                      value={day.enTitle}
                      onChange={(e) => onUpdateDayPlan(ci, di, "enTitle", e.target.value)}
                      placeholder="Day title EN..."
                      className="flex-1 px-2 py-1 text-sm bg-white/5 text-white/70 rounded border border-white/10 placeholder:text-white/30 focus:ring-2 focus:ring-white/20 outline-none"
                    />
                  </div>
                  {(errors.dayPlans?.[ci]?.[di]?.title?.message || errors.dayPlans?.[ci]?.[di]?.enTitle?.message) && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.dayPlans[ci][di].title?.message || errors.dayPlans[ci][di].enTitle?.message}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                    isEditMode
                      ? setConfirmDelete({ type: "dayPlan", index1: ci, index2: di })
                      : onRemoveDayPlan(ci, di)
                    }
                    aria-label={t("tourAdmin.itineraries.removeDay")}
                    className="text-white/70 hover:text-white transition-colors">
                    <Icon icon="heroicons:x-mark" className="size-5" />
                  </button>
                </div>

                {/* Day Body */}
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
                        🇻🇳 {t("tourAdmin.itineraries.dayDescription")} (VI)
                      </span>
                      <textarea
                        value={day.description}
                        onChange={(e) => onUpdateDayPlan(ci, di, "description", e.target.value)}
                        rows={2}
                        placeholder={t("tourAdmin.itineraries.placeholderOverview")}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
                        🇬🇧 Description (EN)
                      </span>
                      <textarea
                        value={day.enDescription}
                        onChange={(e) => onUpdateDayPlan(ci, di, "enDescription", e.target.value)}
                        rows={2}
                        placeholder="Day description in English..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                      />
                      {(errors.dayPlans?.[ci]?.[di]?.description?.message || errors.dayPlans?.[ci]?.[di]?.enDescription?.message) && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.dayPlans[ci][di].description?.message || errors.dayPlans[ci][di].enDescription?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Activities Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("tourAdmin.itineraries.activities")}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddActivity(ci, di)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                        <Icon
                          icon="heroicons:plus"
                          className="size-3"
                        />
                        {t("tourAdmin.buttons.addActivity")}
                      </button>
                    </div>

                    {day.activities.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">
                        {t("tourAdmin.itineraries.noActivitiesYet")}
                      </p>
                    )}

                    {day.activities.map((act, ai) => (
                      <div
                        key={ai}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-3 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {t("tourAdmin.itineraries.activityNumber", { number: ai + 1 })}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              isEditMode
                                ? setConfirmDelete({ type: "activity", index1: ci, index2: di, index3: ai })
                                : onRemoveActivity(ci, di, ai)
                            }
                            aria-label={t("tourAdmin.itineraries.removeActivity")}
                            className="text-red-400 hover:text-red-600 transition-colors">
                            <Icon
                              icon="heroicons:trash"
                              className="size-3.5"
                            />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                          {/* Activity Type */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              {t("tourAdmin.itineraries.activityType")}{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={act.activityType}
                              onChange={(e) =>
                                onUpdateActivity(
                                  ci,
                                  di,
                                  ai,
                                  "activityType",
                                  e.target.value,
                                )
                              }
                              aria-label={t("tourAdmin.itineraries.activityType")}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition">
                              {ACTIVITY_TYPE_OPTIONS.map((opt, idx) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}>
                                  {activityTypes[idx]}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Start Time */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              {t("tourAdmin.itineraries.startTime")}
                            </label>
                            <input
                              type="time"
                              step={300}
                              value={act.startTime}
                              onChange={(e) =>
                                onUpdateActivity(
                                  ci,
                                  di,
                                  ai,
                                  "startTime",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>

                          {/* End Time */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              {t("tourAdmin.itineraries.endTime")}
                            </label>
                            <input
                              type="time"
                              step={300}
                              value={act.endTime}
                              onChange={(e) =>
                                onUpdateActivity(
                                  ci,
                                  di,
                                  ai,
                                  "endTime",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>

                          {/* Estimated Cost */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              {t("tourAdmin.itineraries.estimatedCost")}
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={act.estimatedCost}
                              onChange={(e) =>
                                onUpdateActivity(
                                  ci,
                                  di,
                                  ai,
                                  "estimatedCost",
                                  e.target.value,
                                )
                              }
                              placeholder="0"
                              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.estimatedCost?.message
                                  ? "border-red-400 dark:border-red-500"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            />
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.estimatedCost?.message && (
                              <p className="text-red-500 text-xs mt-0.5">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any).estimatedCost.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Title — VI / EN */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs font-medium text-stone-500 dark:text-stone-400">
                              <span>🇻🇳</span>
                              <span>{t("tourAdmin.itineraries.title")} (VI)</span>
                              <span className="text-red-500">*</span>
                            </div>
                            <input
                              type="text"
                              value={act.title}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "title", e.target.value)}
                              placeholder={t("tourAdmin.itineraries.placeholderActivityTitle")}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
                              🇬🇧 Title (EN)
                            </span>
                            <input
                              type="text"
                              value={act.enTitle}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "enTitle", e.target.value)}
                              placeholder="Activity title in English..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                        </div>

                        {/* Description — VI / EN */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                              🇻🇳 {t("tourAdmin.itineraries.description")} (VI)
                            </span>
                            <textarea
                              value={act.description}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "description", e.target.value)}
                              rows={2}
                              placeholder={t("tourAdmin.itineraries.placeholderDescribeActivity")}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                              🇬🇧 Description (EN)
                            </span>
                            <textarea
                              value={act.enDescription}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "enDescription", e.target.value)}
                              rows={2}
                              placeholder="Activity description in English..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                            />
                          </div>
                        </div>

                        {/* Note — VI / EN */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                              🇻🇳 {t("tourAdmin.itineraries.note")} (VI)
                            </span>
                            <input
                              type="text"
                              value={act.note}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "note", e.target.value)}
                              placeholder={t("tourAdmin.itineraries.placeholderAdditionalNotes")}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                              🇬🇧 Note (EN)
                            </span>
                            <input
                              type="text"
                              value={act.enNote}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "enNote", e.target.value)}
                              placeholder="Additional notes in English..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                        </div>

                        {/* Link to Resources */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            {t("tourAdmin.itineraries.linkToResources")}
                          </label>
                          <div className="space-y-2">
                            {act.linkToResources.map((link, li) => (
                              <div
                                key={li}
                                className="flex items-start gap-2">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={link}
                                    onChange={(e) =>
                                      onUpdateLinkToResource(
                                        ci,
                                        di,
                                        ai,
                                        li,
                                        e.target.value,
                                      )
                                    }
                                    placeholder={t("tourAdmin.itineraries.placeholderHttps")}
                                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.linkToResources?.[li] as any)?.message
                                        ? "border-red-400 dark:border-red-500"
                                        : "border-slate-300 dark:border-slate-600"
                                    }`}
                                  />
                                  {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.linkToResources?.[li] as any)?.message && (
                                    <p className="text-red-500 text-xs mt-0.5">
                                      {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.linkToResources?.[li] as any)?.message}
                                    </p>
                                  )}
                                </div>
                                {act.linkToResources.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onRemoveLinkToResource(
                                        ci,
                                        di,
                                        ai,
                                        li,
                                      )
                                    }
                                    aria-label="Remove link"
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded p-1 mt-0.5">
                                    <Icon
                                      icon="heroicons:x-mark"
                                      className="size-4"
                                    />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                onAddLinkToResource(ci, di, ai)
                              }
                              className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
                              <Icon
                                icon="heroicons:plus"
                                className="size-3"
                              />
                              {t("tourAdmin.buttons.addLink")}
                            </button>
                          </div>
                        </div>

                        {/* Activity location fields — ALL activity types */}
                        <div className="mb-3 mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              {t("tourAdmin.itineraries.locationName", "Location")} (VI)
                            </label>
                            <input
                              type="text"
                              value={act.locationName}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "locationName", e.target.value)}
                              placeholder={t("tourAdmin.itineraries.placeholderLocation", "Location name...")}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              {t("tourAdmin.itineraries.locationName", "Location")} (EN)
                            </label>
                            <input
                              type="text"
                              value={act.enLocationName}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "enLocationName", e.target.value)}
                              placeholder="Location name in English..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">City (VI)</label>
                            <input
                              type="text"
                              value={act.locationCity}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "locationCity", e.target.value)}
                              placeholder="City..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">City (EN)</label>
                            <input
                              type="text"
                              value={act.enLocationCity}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "enLocationCity", e.target.value)}
                              placeholder="City in English..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Country (VI)</label>
                            <input
                              type="text"
                              value={act.locationCountry}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "locationCountry", e.target.value)}
                              placeholder="Country..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Country (EN)</label>
                            <input
                              type="text"
                              value={act.enLocationCountry}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "enLocationCountry", e.target.value)}
                              placeholder="Country in English..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Address (VI)</label>
                            <input
                              type="text"
                              value={act.locationAddress}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "locationAddress", e.target.value)}
                              placeholder="Address..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Address (EN)</label>
                            <input
                              type="text"
                              value={act.enLocationAddress}
                              onChange={(e) => onUpdateActivity(ci, di, ai, "enLocationAddress", e.target.value)}
                              placeholder="Address in English..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                        </div>

                        {/* Type 7: Transportation */}
                        {act.activityType === "7" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Từ (VI) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={act.fromLocation}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "fromLocation", e.target.value)}
                                placeholder="Hà Nội..."
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                From (EN)
                              </label>
                              <input
                                type="text"
                                value={act.enFromLocation}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "enFromLocation", e.target.value)}
                                placeholder="Hanoi..."
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Đến (VI) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={act.toLocation}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "toLocation", e.target.value)}
                                placeholder="Hạ Long..."
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                To (EN)
                              </label>
                              <input
                                type="text"
                                value={act.enToLocation}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "enToLocation", e.target.value)}
                                placeholder="Halong..."
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Loại phương tiện (VI)
                              </label>
                              <select
                                value={act.transportationType}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "transportationType", e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition cursor-pointer">
                                {TRANSPORTATION_TYPE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Transportation Type (EN)
                              </label>
                              <input
                                type="text"
                                value={act.enTransportationType}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "enTransportationType", e.target.value)}
                                placeholder="Car / Bus / Train..."
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                {t("tourAdmin.itineraries.durationMinutes", "Duration (min)")}
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={act.durationMinutes}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "durationMinutes", e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                          </div>
                        )}

                        {/* Type 8: Accommodation */}
                        {act.activityType === "8" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                {t("tourAdmin.itineraries.accommodationName", "Hotel Name")} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={act.accommodationName}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "accommodationName", e.target.value)}
                                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  (errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.accommodationName
                                    ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600"
                                }`}
                              />
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.accommodationName && (
                                <p className="text-red-500 text-xs mt-0.5">
                                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                  {(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any).accommodationName.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                {t("tourAdmin.itineraries.checkInTime", "Check-in")}
                              </label>
                              <input
                                type="time"
                                step={300}
                                value={act.checkInTime}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "checkInTime", e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                {t("tourAdmin.itineraries.checkOutTime", "Check-out")}
                              </label>
                              <input
                                type="time"
                                step={300}
                                value={act.checkOutTime}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "checkOutTime", e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                {t("tourAdmin.itineraries.contactPhone", "Phone")}
                              </label>
                              <input
                                type="text"
                                value={act.accommodationPhone}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "accommodationPhone", e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                {t("tourAdmin.itineraries.accommodationAddress", "Address")}
                              </label>
                              <input
                                type="text"
                                value={act.accommodationAddress}
                                onChange={(e) => onUpdateActivity(ci, di, ai, "accommodationAddress", e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                          </div>
                        )}

                        {/* Type 8: Accommodation — Room Details */}
                        {act.activityType === "8" && (
                          <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/30">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                {t("tourAdmin.accommodation.roomDetails", "Room Details")}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {act.roomType ? (
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    {t("tourAdmin.accommodation.roomType", "Room Type")} (Legacy)
                                  </label>
                                  <div className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed">
                                    {act.roomType}
                                  </div>
                                </div>
                              ) : null}
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  {t("tourAdmin.accommodation.roomCapacity", "Capacity")}
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={act.roomCapacity}
                                  onChange={(e) => onUpdateActivity(ci, di, ai, "roomCapacity", e.target.value)}
                                  className={`w-full px-2 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none ${
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.roomCapacity ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600"
                                  }`}
                                />
                                {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.roomCapacity && (
                                  <p className="text-red-500 text-xs mt-0.5">{// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.roomCapacity}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  {t("tourAdmin.accommodation.numberOfRooms", "Rooms")}
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={act.numberOfRooms}
                                  onChange={(e) => onUpdateActivity(ci, di, ai, "numberOfRooms", e.target.value)}
                                  className={`w-full px-2 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none ${
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.numberOfRooms ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600"
                                  }`}
                                />
                                {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.numberOfRooms && (
                                  <p className="text-red-500 text-xs mt-0.5">{// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.numberOfRooms}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  {t("tourAdmin.accommodation.numberOfNights", "Nights")}
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={act.numberOfNights}
                                  onChange={(e) => onUpdateActivity(ci, di, ai, "numberOfNights", e.target.value)}
                                  className={`w-full px-2 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none ${
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.numberOfNights ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600"
                                  }`}
                                />
                                {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.numberOfNights && (
                                  <p className="text-red-500 text-xs mt-0.5">{// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.numberOfNights}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  {t("tourAdmin.accommodation.mealsIncluded", "Meals")}
                                </label>
                                <select
                                  value={act.mealsIncluded}
                                  onChange={(e) => onUpdateActivity(ci, di, ai, "mealsIncluded", e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none">
                                  <option value="">—</option>
                                  <option value="none">{t("tourAdmin.accommodation.mealsOptions.none", "None")}</option>
                                  <option value="breakfast">{t("tourAdmin.accommodation.mealsOptions.breakfast", "Breakfast")}</option>
                                  <option value="lunch">{t("tourAdmin.accommodation.mealsOptions.lunch", "Lunch")}</option>
                                  <option value="dinner">{t("tourAdmin.accommodation.mealsOptions.dinner", "Dinner")}</option>
                                  <option value="breakfast_lunch">{t("tourAdmin.accommodation.mealsOptions.breakfast_lunch", "Breakfast & Lunch")}</option>
                                  <option value="breakfast_dinner">{t("tourAdmin.accommodation.mealsOptions.breakfast_dinner", "Breakfast & Dinner")}</option>
                                  <option value="lunch_dinner">{t("tourAdmin.accommodation.mealsOptions.lunch_dinner", "Lunch & Dinner")}</option>
                                  <option value="all">{t("tourAdmin.accommodation.mealsOptions.all", "All")}</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  {t("tourAdmin.accommodation.roomPrice", "Price")}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={act.roomPrice}
                                  onChange={(e) => onUpdateActivity(ci, di, ai, "roomPrice", e.target.value)}
                                  className={`w-full px-2 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none ${
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.roomPrice ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600"
                                  }`}
                                />
                                {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.roomPrice && (
                                  <p className="text-red-500 text-xs mt-0.5">{// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.roomPrice}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  {t("tourAdmin.accommodation.latitude", "Latitude")}
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={act.latitude}
                                  onChange={(e) => onUpdateActivity(ci, di, ai, "latitude", e.target.value)}
                                  className={`w-full px-2 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none ${
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.latitude ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600"
                                  }`}
                                />
                                {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.latitude && (
                                  <p className="text-red-500 text-xs mt-0.5">{// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.latitude}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  {t("tourAdmin.accommodation.longitude", "Longitude")}
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={act.longitude}
                                  onChange={(e) => onUpdateActivity(ci, di, ai, "longitude", e.target.value)}
                                  className={`w-full px-2 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none ${
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.longitude ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600"
                                  }`}
                                />
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any)?.longitude && (
                                  <p className="text-red-500 text-xs mt-0.5">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {(errors.dayPlans?.[ci]?.[di]?.activities?.[ai] as any).longitude}
                                  </p>
                                )}
                              </div>
                              <div className="md:col-span-4">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  {t("tourAdmin.accommodation.specialRequest", "Special Request")}
                                </label>
                                <textarea
                                  rows={2}
                                  value={act.specialRequest}
                                  onChange={(e) => onUpdateActivity(ci, di, ai, "specialRequest", e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Route Section */}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {t("tourAdmin.itineraries.routes", "Routes")}
                            </span>
                            <button
                              type="button"
                              onClick={() => onAddRoute(ci, di, ai)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                              <Icon icon="heroicons:plus" className="size-3" />
                              {t("tourAdmin.itineraries.addRoute")}
                            </button>
                          </div>

                          {act.routes.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-2">
                              {t("tourAdmin.itineraries.noRoutesYet", "No routes yet")}
                            </p>
                          )}

                          {act.routes.map((route, ri) => {
                            const routeKey = ci + "_" + di + "_" + ai + "_" + ri;
                            const isExpanded = expandedRoutes[routeKey] ?? false;
                            return (
                              <div
                                key={route.id}
                                className="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-3 mb-2 border border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    {t("tourAdmin.itineraries.route", "Route")} #{ri + 1}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onToggleActivityRoute(ci, di, ai, ri)}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                      <Icon
                                        icon={isExpanded ? "heroicons:chevron-up" : "heroicons:chevron-down"}
                                        className="size-3.5"
                                      />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onRemoveRoute(ci, di, ai, ri)}
                                      aria-label={t("tourAdmin.itineraries.removeRoute")}
                                      className="text-red-400 hover:text-red-600 transition-colors">
                                      <Icon icon="heroicons:trash" className="size-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {isExpanded ? (
                                  <div className="space-y-2">
                                    {/* From + To Location */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                          {t("tourAdmin.itineraries.fromLocation", "From")} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={route.fromLocationCustom}
                                          onChange={(e) => onUpdateRoute(ci, di, ai, ri, "fromLocationCustom", e.target.value)}
                                          placeholder={t("tourAdmin.itineraries.placeholderFromLocation", "Departure location")}
                                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.fromLocationCustom ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600"
                                          }`}
                                        />
                                        {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.fromLocationCustom && (
                                          <p className="text-red-500 text-xs mt-0.5">{// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.fromLocationCustom}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                          {t("tourAdmin.itineraries.toLocation", "To")} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={route.toLocationCustom}
                                          onChange={(e) => onUpdateRoute(ci, di, ai, ri, "toLocationCustom", e.target.value)}
                                          placeholder={t("tourAdmin.itineraries.placeholderToLocation", "Arrival location")}
                                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.toLocationCustom ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600"
                                          }`}
                                        />
                                        {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.toLocationCustom && (
                                          <p className="text-red-500 text-xs mt-0.5">{// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.toLocationCustom}</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Transportation Type */}
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        {t("tourAdmin.transportation.type", "Type")}
                                      </label>
                                      <select
                                        value={route.transportationType}
                                        onChange={(e) => onUpdateRoute(ci, di, ai, ri, "transportationType", e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none transition">
                                        {TRANSPORTATION_TYPE_OPTIONS.map((opt, idx) => (
                                          <option key={opt.value} value={opt.value}>
                                            {transportationTypes[idx]}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Transportation Name VI / EN */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                          🇻🇳 {t("tourAdmin.transportation.name", "Name (VI)")}
                                        </label>
                                        <input
                                          type="text"
                                          value={route.transportationName}
                                          onChange={(e) => onUpdateRoute(ci, di, ai, ri, "transportationName", e.target.value)}
                                          placeholder={t("tourAdmin.transportation.placeholderTransportationName", "e.g. Bus")}
                                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                          🇬🇧 {t("tourAdmin.transportation.name", "Name (EN)")}
                                        </label>
                                        <input
                                          type="text"
                                          value={route.enTransportationName}
                                          onChange={(e) => onUpdateRoute(ci, di, ai, ri, "enTransportationName", e.target.value)}
                                          placeholder="Name in English..."
                                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition"
                                        />
                                      </div>
                                    </div>

                                    {/* Duration + Price */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                          {t("tourAdmin.transportation.duration", "Duration (min)")}
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={route.durationMinutes}
                                          onChange={(e) => onUpdateRoute(ci, di, ai, ri, "durationMinutes", e.target.value)}
                                          placeholder="0"
                                          className={`w-full px-2 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition ${
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.durationMinutes
                                              ? "border-red-400 dark:border-red-500"
                                              : "border-slate-300 dark:border-slate-600"
                                          }`}
                                        />
                                        {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.durationMinutes && (
                                          <p className="text-red-500 text-xs mt-0.5">{// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.durationMinutes}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                          {t("tourAdmin.transportation.price", "Price ($)")}
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          step={1000}
                                          value={route.price}
                                          onChange={(e) => onUpdateRoute(ci, di, ai, ri, "price", e.target.value)}
                                          placeholder="0"
                                          className={`w-full px-2 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition ${
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.price
                                              ? "border-red-400 dark:border-red-500"
                                              : "border-slate-300 dark:border-slate-600"
                                          }`}
                                        />
                                        {// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.price && (
                                          <p className="text-red-500 text-xs mt-0.5">{// eslint-disable-next-line @typescript-eslint/no-explicit-any
(errors.dayPlans?.[ci]?.[di]?.activities?.[ai]?.routes?.[ri] as any)?.price}</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Note VI / EN */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                          🇻🇳 {t("tourAdmin.itineraries.note", "Note (VI)")}
                                        </label>
                                        <input
                                          type="text"
                                          value={route.note}
                                          onChange={(e) => onUpdateRoute(ci, di, ai, ri, "note", e.target.value)}
                                          placeholder={t("tourAdmin.itineraries.placeholderAdditionalNotes", "Additional notes...")}
                                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                          🇬🇧 {t("tourAdmin.itineraries.note", "Note (EN)")}
                                        </label>
                                        <input
                                          type="text"
                                          value={route.enNote}
                                          onChange={(e) => onUpdateRoute(ci, di, ai, ri, "enNote", e.target.value)}
                                          placeholder="Notes in English..."
                                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-400 italic">
                                    {route.transportationName || t("tourAdmin.itineraries.customLocation", "Custom location...")}
                                    {" → "}
                                    {route.transportationName || t("tourAdmin.itineraries.customLocation", "Custom location...")}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
