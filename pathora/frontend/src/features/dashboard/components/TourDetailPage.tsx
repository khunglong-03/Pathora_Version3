"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { PricingTierEditor } from "@/features/dashboard/components/PricingTierEditor";
import { tourService } from "@/api/services/tourService";
import { handleApiError } from "@/utils/apiResponse";
import {
  DynamicPricingDto,
  TourDto,
  TourClassificationDto,
  TourPlanAccommodationDto,
  TourPlanLocationDto,
  TransportationTypeMap,
  ActivityTypeMap,
  RoomTypeMap,
  MealTypeMap,
  LocationTypeMap,
  InsuranceTypeMap,
} from "@/types/tour";
import { AdminSidebar, TopBar } from "./AdminSidebar";

type TourDetailDataState = "loading" | "ready" | "empty" | "error";

/* ── Animation Variants ───────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

/* ══════════════════════════════════════════════════════════════
   Content Tab Definitions
   ══════════════════════════════════════════════════════════════ */
const CONTENT_TABS = [
  { id: "overview", label: "Overview", icon: "heroicons:information-circle" },
  { id: "itinerary", label: "Itinerary", icon: "heroicons:map" },
  { id: "accommodations", label: "Accommodations", icon: "heroicons:home-modern" },
  { id: "transportation", label: "Transportation Routes", icon: "heroicons:truck" },
  { id: "locations", label: "Locations", icon: "heroicons:map-pin" },
  { id: "services", label: "Other Services", icon: "heroicons:wrench-screwdriver" },
  { id: "insurance", label: "Insurance", icon: "heroicons:shield-check" },
];

/* ══════════════════════════════════════════════════════════════
   Status Badge
   ══════════════════════════════════════════════════════════════ */
// StatusBadge was replaced by StatusDropdown below

/* ══════════════════════════════════════════════════════════════
   Info Field
   ══════════════════════════════════════════════════════════════ */
function InfoField({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
        {label}
      </p>
      <p className={`text-sm text-stone-700 leading-relaxed ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Overview Tab
   ══════════════════════════════════════════════════════════════ */
function OverviewTab({
  tour,
  classifications,
  selectedPackageIdx,
  allRoutes,
  formatCurrency,
}: {
  tour: TourDto;
  classifications: TourClassificationDto[];
  selectedPackageIdx: number;
  allRoutes: {
    id: string;
    order: number;
    transportationName: string | null;
    note: string | null;
    durationMinutes: number | null;
    price: number | null;
  }[];
  formatCurrency: (n: number) => string;
}) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      {/* Tour Information */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-stone-200/50 rounded-[2.5rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <h2 className="flex items-center gap-2 text-base font-bold text-stone-900 mb-5">
          <Icon icon="heroicons:information-circle" className="size-5 text-amber-500" />
          Tour Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Tour Code" value={tour.tourCode} mono />
          <InfoField label="Tour Name" value={tour.tourName} />
        </div>
        <div className="mt-5 space-y-5">
          <InfoField label="SEO Title" value={tour.seoTitle} />
          <InfoField label="Short Description" value={tour.shortDescription} />
          <InfoField label="Long Description" value={tour.longDescription} />
          <InfoField label="ECO Description" value={tour.seoDescription} />
        </div>
      </motion.div>

      {/* Package Classifications */}
      {classifications.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white border border-stone-200/50 rounded-[2.5rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <h2 className="flex items-center gap-2 text-base font-bold text-stone-900 mb-5">
            <Icon icon="heroicons:tag" className="size-5 text-amber-500" />
            Package Classifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classifications.map((cls, idx) => {
              const isSelected = idx === selectedPackageIdx;
              const accommodationCount =
                cls.plans?.flatMap((d) =>
                  d.activities.filter((a) => a.accommodation),
                ).length ?? 0;
              const locationCount =
                cls.plans?.flatMap((d) =>
                  d.activities.flatMap((a) =>
                    a.routes.flatMap((r) =>
                      [r.fromLocation, r.toLocation].filter(Boolean),
                    ),
                  ),
                ).length ?? 0;
              const serviceCount = cls.insurances?.length ?? 0;

              return (
                <motion.div
                  key={cls.id}
                  variants={itemVariants}
                  className={`relative overflow-hidden rounded-2xl border-2 p-4 transition-all duration-200 ${
                    isSelected
                      ? "border-amber-400 bg-amber-50/50"
                      : "border-stone-200/80 bg-white hover:border-stone-300"
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-stone-900 tracking-tight">
                      {cls.name}
                    </h3>
                    <span className="px-2.5 py-1 rounded-xl bg-stone-100 text-stone-600 text-xs font-bold">
                      {cls.durationDays}D
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">{cls.description}</p>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-lg font-bold text-amber-500 tracking-tight">
                      {formatCurrency(cls.salePrice || cls.price)}
                    </span>
                    {cls.salePrice > 0 && cls.salePrice < cls.price && (
                      <span className="text-sm font-normal text-stone-400 line-through">
                        {formatCurrency(cls.price)}
                      </span>
                    )}
                    <span className="text-xs text-stone-400">/person</span>
                  </div>
                  <div className="border-t border-stone-200/80 mt-3 pt-3">
                    <p className="text-[11px] text-stone-400">
                      {accommodationCount} accommodations · {locationCount}{" "}
                      locations · {serviceCount} services
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Transportation Routes */}
      {allRoutes.length > 0 && <TransportationTab routes={allRoutes} formatCurrency={formatCurrency} />}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Other Services Tab
   ══════════════════════════════════════════════════════════════ */
function OtherServicesTab({
  classification,
  formatCurrency,
}: {
  classification: TourClassificationDto;
  formatCurrency: (amount: number) => string;
}) {
  const insurances = classification.insurances ?? [];

  if (insurances.length === 0) {
    return (
      <div className="bg-white border border-stone-200/50 rounded-[2.5rem] p-12 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Icon icon="heroicons:wrench-screwdriver" className="size-6 text-stone-300" />
        </div>
        <p className="text-sm text-stone-500">
          No other services available for {classification.name}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200/60 rounded-2xl px-5 py-3">
        <p className="text-sm text-amber-700">
          Viewing services for:{" "}
          <span className="font-semibold">{classification.name}</span>
        </p>
      </div>

      {insurances.map((ins) => (
        <div
          key={ins.id}
          className="bg-white border border-stone-200/50 rounded-[2.5rem] p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <Icon icon="heroicons:star" className="size-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-stone-900">{ins.insuranceName}</h3>
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[11px] font-semibold text-amber-700 bg-amber-100 rounded-lg">
                Per Person
              </span>
            </div>
            <span className="text-base font-bold text-stone-900 shrink-0 tracking-tight">
              {formatCurrency(ins.coverageFee)}
            </span>
          </div>
          {ins.insuranceProvider && (
            <div className="flex items-center gap-2 mt-3 ml-14 text-xs text-stone-500">
              <Icon icon="heroicons:envelope" className="size-3.5 text-stone-400" />
              {ins.insuranceProvider}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Insurance Tab
   ══════════════════════════════════════════════════════════════ */
const INSURANCE_BADGE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-stone-100", text: "text-stone-600" },
  1: { bg: "bg-blue-50", text: "text-blue-700" },
  2: { bg: "bg-emerald-50", text: "text-emerald-700" },
  3: { bg: "bg-amber-50", text: "text-amber-700" },
  4: { bg: "bg-amber-50", text: "text-amber-700" },
  5: { bg: "bg-red-50", text: "text-red-700" },
  6: { bg: "bg-amber-50", text: "text-amber-700" },
};

function InsuranceTab({
  classification,
  allClassifications,
  formatCurrency,
}: {
  classification: TourClassificationDto;
  allClassifications: TourClassificationDto[];
  formatCurrency: (amount: number) => string;
}) {
  const insurances = classification.insurances ?? [];

  if (insurances.length === 0) {
    return (
      <div className="bg-white border border-stone-200/50 rounded-[2.5rem] p-12 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Icon icon="heroicons:shield-check" className="size-6 text-stone-300" />
        </div>
        <p className="text-sm text-stone-500">
          No insurance packages available for {classification.name}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl px-5 py-3">
        <p className="text-sm text-emerald-700">
          {insurances.length} insurance package(s) available for customers booking this tour.
        </p>
      </div>

      {insurances.map((ins) => {
        const typeName = InsuranceTypeMap[ins.insuranceType] ?? "Other";
        const badge =
          INSURANCE_BADGE_COLORS[ins.insuranceType] ?? INSURANCE_BADGE_COLORS[0];
        const descriptionLines = ins.coverageDescription
          ? ins.coverageDescription.split("\n").map((l) => l.trim()).filter(Boolean)
          : [];

        return (
          <div
            key={ins.id}
            className="bg-white border border-stone-200/50 rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center shrink-0">
                  <Icon icon="heroicons:shield-check" className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-stone-900">{ins.insuranceName}</h3>
                  <p className="text-xs text-stone-500">Provider: {ins.insuranceProvider}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 ${badge.bg} ${badge.text}`}>
                  {formatCurrency(ins.coverageFee)}/person
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                    Coverage Amount
                  </p>
                  <p className="text-sm font-bold text-emerald-600 tracking-tight">
                    {formatCurrency(ins.coverageAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                    Type
                  </p>
                  <p className="text-sm text-stone-800">{typeName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                    Optional
                  </p>
                  <p className="text-sm text-stone-800">{ins.isOptional ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            {descriptionLines.length > 0 && (
              <div className="px-6 pb-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Coverage Details
                </p>
                <ul className="space-y-1.5">
                  {descriptionLines.map((line, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-stone-600">
                      <Icon icon="heroicons:check-circle" className="size-4 text-emerald-500 shrink-0 mt-px" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {allClassifications.length > 1 && (
              <div className="px-6 pb-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Applicable Classifications
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allClassifications
                    .filter((c) => (c.insurances ?? []).some((i) => i.id === ins.id))
                    .map((c) => (
                      <span key={c.id} className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                        {c.name}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {ins.note && (
              <div className="mx-6 mb-5 px-3 py-2 bg-amber-50 border border-amber-200/60 rounded-xl">
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Note:</span> {ins.note}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Accommodations Tab
   ══════════════════════════════════════════════════════════════ */
const decodeMeals = (value: number): string => {
  if (value === 0) return "None";
  const meals: string[] = [];
  if (value & 1) meals.push("Breakfast");
  if (value & 2) meals.push("Lunch");
  if (value & 4) meals.push("Dinner");
  if (meals.length > 0) return meals.join(", ");
  return MealTypeMap[value] ?? "—";
};

function AccommodationsTab({
  classification,
  formatCurrency,
  t,
}: {
  classification: TourClassificationDto;
  formatCurrency: (amount: number) => string;
  t: ReturnType<typeof useTranslation>[0];
}) {
  const accommodations: TourPlanAccommodationDto[] = (
    classification.plans ?? []
  ).flatMap((day) =>
    day.activities.filter((a) => a.accommodation != null).map((a) => a.accommodation!),
  );

  if (accommodations.length === 0) {
    return (
      <div className="bg-white border border-stone-200/50 rounded-[2.5rem] p-12 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Icon icon="heroicons:home-modern" className="size-6 text-stone-300" />
        </div>
        <p className="text-sm text-stone-500">
          {t("tourDetail.accommodations.empty", "No accommodations available for this package.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200/60 rounded-2xl px-5 py-3">
        <p className="text-sm text-amber-700">
          Viewing accommodations for:{" "}
          <span className="font-semibold">{classification.name}</span>
        </p>
      </div>

      {accommodations.map((acc) => (
        <div
          key={acc.id}
          className="bg-white border border-stone-200/50 rounded-[2.5rem] p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center shrink-0">
              <Icon icon="heroicons:building-office" className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">{acc.accommodationName}</h3>
          </div>

          <div className="grid grid-cols-3 gap-x-8 gap-y-4 mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Room Type</p>
              <p className="text-sm text-stone-800">{RoomTypeMap[acc.roomType] ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Capacity</p>
              <p className="text-sm text-stone-800">
                <Icon icon="heroicons:users" className="size-3.5 inline mr-1 -mt-0.5 text-stone-500" />
                {acc.roomCapacity} guests
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Price</p>
              <p className="text-sm font-semibold text-amber-600">
                {acc.roomPrice != null ? formatCurrency(acc.roomPrice) : "—"}
                {acc.roomPrice != null && <span className="text-stone-400 text-xs font-normal"> / Per Room</span>}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Check-in</p>
              <p className="text-sm text-stone-800">{acc.checkInTime ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Check-out</p>
              <p className="text-sm text-stone-800">{acc.checkOutTime ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Meals</p>
              <p className="text-sm text-stone-800 italic">{decodeMeals(acc.mealsIncluded)}</p>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3 space-y-1.5">
            {(acc.address || acc.city) && (
              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <Icon icon="heroicons:map-pin" className="size-3.5 text-stone-400 shrink-0" />
                {[acc.address, acc.city].filter(Boolean).join(", ")}
              </p>
            )}
            {acc.contactPhone && (
              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <Icon icon="heroicons:phone" className="size-3.5 text-stone-400 shrink-0" />
                {acc.contactPhone}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Locations Tab
   ══════════════════════════════════════════════════════════════ */
const LOCATION_BADGE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-teal-50", text: "text-teal-700" },
  1: { bg: "bg-emerald-50", text: "text-emerald-700" },
  2: { bg: "bg-green-100", text: "text-green-700" },
  3: { bg: "bg-rose-50", text: "text-rose-700" },
  4: { bg: "bg-sky-50", text: "text-sky-700" },
  5: { bg: "bg-amber-100", text: "text-amber-700" },
  6: { bg: "bg-pink-100", text: "text-pink-700" },
  7: { bg: "bg-red-100", text: "text-red-700" },
  8: { bg: "bg-stone-100", text: "text-stone-700" },
  9: { bg: "bg-sky-100", text: "text-sky-700" },
  10: { bg: "bg-amber-100", text: "text-amber-700" },
  11: { bg: "bg-teal-100", text: "text-teal-700" },
  12: { bg: "bg-stone-200", text: "text-stone-700" },
  99: { bg: "bg-stone-100", text: "text-stone-700" },
};

function LocationsTab({ classification }: { classification: TourClassificationDto }) {
  const locationMap = new Map<string, TourPlanLocationDto>();
  (classification.plans ?? []).forEach((day) =>
    day.activities.forEach((activity) =>
      activity.routes.forEach((route) => {
        if (route.fromLocation) locationMap.set(route.fromLocation.id, route.fromLocation);
        if (route.toLocation) locationMap.set(route.toLocation.id, route.toLocation);
      }),
    ),
  );
  const locations = Array.from(locationMap.values());

  if (locations.length === 0) {
    return (
      <div className="bg-white border border-stone-200/50 rounded-[2.5rem] p-12 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Icon icon="heroicons:map-pin" className="size-6 text-stone-300" />
        </div>
        <p className="text-sm text-stone-500">
          No locations available{classification.name ? ` for ${classification.name}` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200/60 rounded-2xl px-5 py-3">
        <p className="text-sm text-amber-700">
          Viewing locations for:{" "}
          <span className="font-semibold">{classification.name}</span>
        </p>
      </div>

      {locations.map((loc) => {
        const typeName = LocationTypeMap[loc.locationType] ?? "Other";
        const badge = LOCATION_BADGE_COLORS[loc.locationType] ?? LOCATION_BADGE_COLORS[99];
        const hasCoords = loc.latitude != null && loc.longitude != null;

        return (
          <div
            key={loc.id}
            className="bg-white border border-stone-200/50 rounded-[2.5rem] p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon icon="heroicons:map-pin" className="size-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-stone-900">{loc.locationName}</h3>
                {loc.locationDescription && (
                  <p className="text-xs text-stone-500 mt-0.5">{loc.locationDescription}</p>
                )}
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium shrink-0 ${badge.bg} ${badge.text}`}>
                {typeName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 ml-12">
              {(loc.address || loc.city) && (
                <div>
                  <span className="text-xs font-semibold text-stone-800">Address: </span>
                  <span className="text-xs text-stone-500">{[loc.address, loc.city].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {loc.city && (
                <div>
                  <span className="text-xs font-semibold text-stone-800">City: </span>
                  <span className="text-xs text-stone-500">{[loc.city, loc.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {loc.entranceFee != null && (
                <div>
                  <span className="text-xs font-semibold text-stone-800">Entrance Fee: </span>
                  <span className="text-xs text-stone-500">
                    {loc.entranceFee === 0 ? "Free (Per Person)" : `${loc.entranceFee.toLocaleString()} VND (Per Person)`}
                  </span>
                </div>
              )}
              {hasCoords && (
                <div>
                  <span className="text-xs font-semibold text-stone-800">Coordinates: </span>
                  <span className="text-xs text-stone-500 font-mono">{loc.latitude}, {loc.longitude}</span>
                </div>
              )}
            </div>

            {loc.note && (
              <div className="mt-3 ml-12 px-3 py-2 bg-amber-50 border border-amber-200/60 rounded-xl">
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Note:</span> {loc.note}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Transportation Tab
   ══════════════════════════════════════════════════════════════ */
function TransportationTab({
  routes,
  packageName,
  formatCurrency,
}: {
  routes: {
    id: string;
    order: number;
    transportationName: string | null;
    note: string | null;
    durationMinutes: number | null;
    price: number | null;
    fromLocation?: { locationName: string } | null;
    toLocation?: { locationName: string } | null;
    transportationType?: number;
  }[];
  packageName?: string;
  formatCurrency: (n: number) => string;
}) {
  if (routes.length === 0) {
    return (
      <div className="bg-white border border-stone-200/50 rounded-[2.5rem] p-12 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Icon icon="heroicons:truck" className="size-6 text-stone-300" />
        </div>
        <p className="text-sm text-stone-500">
          No transportation routes available{packageName ? ` for ${packageName}` : ""}
        </p>
      </div>
    );
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="bg-white border border-stone-200/50 rounded-[2.5rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
      <h2 className="flex items-center gap-2 text-base font-bold text-stone-900 mb-5">
        <Icon icon="heroicons:truck" className="size-5 text-amber-500" />
        Transportation Routes
      </h2>

      <div className="space-y-3">
        {routes.map((route, idx) => {
          const routeTitle =
            route.fromLocation && route.toLocation
              ? `${route.fromLocation.locationName} to ${route.toLocation.locationName}`
              : route.transportationName || `Route ${idx + 1}`;

          const transportType =
            route.transportationType !== undefined
              ? (TransportationTypeMap[route.transportationType] ?? "")
              : (route.transportationName ?? "");

          const details = [transportType, formatDuration(route.durationMinutes), route.note]
            .filter(Boolean)
            .join(" · ");

          return (
            <div
              key={route.id}
              className="flex items-center gap-4 px-4 py-4 bg-stone-50/80 rounded-2xl hover:bg-stone-100 transition-colors duration-150">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 tracking-tight">{routeTitle}</p>
                {details && <p className="text-xs text-stone-500 mt-0.5">{details}</p>}
              </div>
              {route.price != null && route.price > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold shrink-0">
                  {formatCurrency(route.price)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Itinerary Tab
   ══════════════════════════════════════════════════════════════ */
const ACTIVITY_BADGE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-blue-50", text: "text-blue-700" },
  1: { bg: "bg-red-50", text: "text-red-700" },
  2: { bg: "bg-rose-50", text: "text-rose-700" },
  3: { bg: "bg-green-100", text: "text-green-700" },
  4: { bg: "bg-teal-100", text: "text-teal-700" },
  5: { bg: "bg-amber-100", text: "text-amber-700" },
  6: { bg: "bg-pink-100", text: "text-pink-700" },
  7: { bg: "bg-sky-100", text: "text-sky-700" },
  8: { bg: "bg-rose-100", text: "text-rose-700" },
  9: { bg: "bg-teal-100", text: "text-teal-700" },
  99: { bg: "bg-amber-50", text: "text-amber-700" },
};

const ACTIVITY_ICONS: Record<number, string> = {
  0: "heroicons:eye",
  1: "heroicons:cake",
  2: "heroicons:shopping-bag",
  3: "heroicons:fire",
  4: "heroicons:sparkles",
  5: "heroicons:building-library",
  6: "heroicons:musical-note",
  7: "heroicons:truck",
  8: "heroicons:home-modern",
  9: "heroicons:clock",
  99: "heroicons:ellipsis-horizontal-circle",
};

function ItineraryTab({ classification }: { classification: TourClassificationDto }) {
  const days = [...(classification.plans ?? [])].sort((a, b) => a.dayNumber - b.dayNumber);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    () => new Set(days.length > 0 ? [days[0].id] : []),
  );

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  if (days.length === 0) {
    return (
      <div className="bg-white border border-stone-200/50 rounded-[2.5rem] p-12 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Icon icon="heroicons:map" className="size-6 text-stone-300" />
        </div>
        <p className="text-sm text-stone-500">No itinerary available for this package.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const isExpanded = expandedDays.has(day.id);
        const sortedActivities = [...day.activities].sort((a, b) => a.order - b.order);

        return (
          <div
            key={day.id}
            className="bg-white border border-stone-200/50 rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={() => toggleDay(day.id)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50/60 transition-colors duration-150">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {day.dayNumber}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-stone-900 tracking-tight">{day.title}</h3>
                {day.description && (
                  <p className="text-xs text-stone-500 truncate mt-0.5">{day.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isExpanded && sortedActivities.length > 0 && (
                  <span className="text-xs text-amber-600 font-semibold">
                    {sortedActivities.length} activities
                  </span>
                )}
                <Icon
                  icon="heroicons:chevron-down"
                  className={`size-5 text-stone-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {isExpanded && sortedActivities.length > 0 && (
              <div className="px-5 pb-5">
                <div className="border-t border-stone-100 pt-4 space-y-3">
                  {sortedActivities.map((activity, idx) => {
                    const badgeColor =
                      ACTIVITY_BADGE_COLORS[activity.activityType] ?? ACTIVITY_BADGE_COLORS[99];
                    const actIcon =
                      ACTIVITY_ICONS[activity.activityType] ?? ACTIVITY_ICONS[99];
                    const typeName = ActivityTypeMap[activity.activityType] ?? "Other";

                    return (
                      <div
                        key={activity.id}
                        className="flex gap-3 p-4 bg-stone-50/60 rounded-2xl">
                        <div className={`w-8 h-8 rounded-xl ${badgeColor.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon icon={actIcon} className={`size-4 ${badgeColor.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold ${badgeColor.bg} ${badgeColor.text}`}>
                              {typeName}
                            </span>
                            {activity.startTime && (
                              <span className="text-xs text-stone-400">
                                {activity.startTime}{activity.endTime && ` – ${activity.endTime}`}
                              </span>
                            )}
                            {activity.isOptional && (
                              <span className="text-[11px] text-blue-500 font-medium">Optional</span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-stone-800 tracking-tight">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-stone-500 mt-0.5">{activity.description}</p>
                          )}
                          {activity.note && (
                            <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200/60 rounded-xl">
                              <p className="text-xs text-amber-700">
                                <Icon icon="heroicons:information-circle" className="size-3.5 inline mr-1 -mt-0.5" />
                                {activity.note}
                              </p>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-stone-400 font-medium shrink-0">#{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Status Dropdown
   ══════════════════════════════════════════════════════════════ */
const STATUS_OPTIONS = [
  { value: 1, label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  { value: 2, label: "Inactive", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  { value: 3, label: "Pending", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  { value: 4, label: "Rejected", bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
] as const;

// Sensitive transitions that require confirmation
const SENSITIVE_TRANSITIONS = new Set(["1_2", "2_1", "3_4", "4_3"]);

function StatusDropdown({
  currentStatus,
  isLoading,
  onChange,
}: {
  currentStatus: number;
  isLoading: boolean;
  onChange: (newStatus: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = STATUS_OPTIONS.find((o) => o.value === currentStatus) ?? STATUS_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen]);

  const handleSelect = (value: number) => {
    if (value === currentStatus) {
      setIsOpen(false);
      return;
    }
    const transitionKey = `${currentStatus}_${value}`;
    if (SENSITIVE_TRANSITIONS.has(transitionKey)) {
      // Store pending change, open confirm — handled by parent
      onChange(value);
    } else {
      onChange(value);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
          currentOption.bg
        } ${currentOption.text} ${isLoading ? "opacity-60 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}>
        <span className={`w-2 h-2 rounded-full ${currentOption.dot}`} />
        <span>{currentOption.label}</span>
        {isLoading ? (
          <svg className="w-3 h-3 animate-spin ml-1" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <Icon icon={isOpen ? "heroicons:chevron-up" : "heroicons:chevron-down"} className="size-3 ml-1" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 z-50 bg-white border border-stone-200/80 rounded-xl shadow-lg py-1 min-w-[120px]">
          {STATUS_OPTIONS.map((option) => {
            const isCurrent = option.value === currentStatus;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors ${
                  isCurrent
                    ? `${option.bg} ${option.text} cursor-default`
                    : "text-stone-600 hover:bg-stone-50"
                }`}>
                <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                {option.label}
                {isCurrent && <Icon icon="heroicons:check" className="size-3 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TourDetailPage - Main Export
   ══════════════════════════════════════════════════════════════ */
export function TourDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const tourId = params?.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tour, setTour] = useState<TourDto | null>(null);
  const [dataState, setDataState] = useState<TourDetailDataState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPackageIdx, setSelectedPackageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [classificationTiers, setClassificationTiers] = useState<Record<string, DynamicPricingDto[]>>({});
  const [savingTierForClassificationId, setSavingTierForClassificationId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  /* ── Fetch tour detail ────────────────────────────────────── */
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
        setDataState("empty");
      }
    } catch (error: unknown) {
      const handledError = handleApiError(error);
      console.error("Failed to fetch tour detail:", handledError.message);
      setTour(null);
      setDataState("error");
      setErrorMessage(handledError.message);
    }
  }, [tourId]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour, reloadToken]);

  /* ── Derived data ─────────────────────────────────────────── */
  const classifications = tour?.classifications ?? [];
  const selectedPackage: TourClassificationDto | undefined = classifications[selectedPackageIdx];

  useEffect(() => {
    if (!tour) return;
    setClassificationTiers((current) => {
      const next = { ...current };
      for (const classification of tour.classifications ?? []) {
        if (!next[classification.id]) {
          next[classification.id] = classification.dynamicPricing ?? [];
        }
      }
      return next;
    });
  }, [tour]);

  useEffect(() => {
    if (!selectedPackage?.id) return;
    let mounted = true;
    const fetchClassificationTiers = async () => {
      try {
        const tiers = await tourService.getClassificationPricingTiers(selectedPackage.id);
        if (!mounted) return;
        setClassificationTiers((current) => ({ ...current, [selectedPackage.id]: tiers }));
      } catch (error: unknown) {
        const handledError = handleApiError(error);
        console.error("Failed to load classification pricing tiers:", handledError.message);
      }
    };
    fetchClassificationTiers();
    return () => { mounted = false; };
  }, [selectedPackage?.id]);

  /* ── Format helpers ───────────────────────────────────────── */
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "numeric", day: "numeric", year: "numeric",
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

  /* ── Collect all routes from selected package ─────────────── */
  const allRoutes =
    selectedPackage?.plans?.flatMap((day) =>
      day.activities.flatMap((activity) => activity.routes),
    ) ?? [];

  const selectedClassificationTiers = selectedPackage
    ? classificationTiers[selectedPackage.id] ?? []
    : [];

  const handleSaveClassificationTiers = useCallback(async () => {
    if (!selectedPackage?.id) return;
    const tiers = classificationTiers[selectedPackage.id] ?? [];
    try {
      setSavingTierForClassificationId(selectedPackage.id);
      await tourService.upsertClassificationPricingTiers(selectedPackage.id, tiers);
      toast.success(t("toast.classificationPricingSaved", "Classification pricing tiers saved."));
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(apiError.message || "Failed to save classification pricing tiers.");
    } finally {
      setSavingTierForClassificationId(null);
    }
  }, [classificationTiers, selectedPackage?.id, t]);

  const applyStatusChange = useCallback(async (newStatus: number) => {
    if (!tourId) return;
    setStatusUpdating(true);
    try {
      await tourService.updateTourStatus(tourId, newStatus);
      setTour((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success(t("toast.statusUpdated", "Tour status updated successfully."));
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(apiError.message || "Failed to update tour status.");
    } finally {
      setStatusUpdating(false);
      setPendingStatus(null);
    }
  }, [tourId, t]);

  const handleStatusChange = useCallback((newStatus: number) => {
    const currentStatus = tour?.status ?? 0;
    const transitionKey = `${currentStatus}_${newStatus}`;
    if (SENSITIVE_TRANSITIONS.has(transitionKey)) {
      setPendingStatus(newStatus);
      setShowConfirmDialog(true);
    } else {
      applyStatusChange(newStatus);
    }
  }, [tour?.status, applyStatusChange]);

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <div className="lg:ml-64">
        {/* Loading */}
        {dataState === "loading" && (
          <div className="p-6 space-y-4">
            <div className="bg-white border border-stone-200/50 rounded-[2.5rem] p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <SkeletonTable rows={2} columns={4} />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-stone-200/50 rounded-[2.5rem] p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                  <SkeletonTable rows={1} columns={1} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {dataState === "error" && (
          <div className="p-6">
            <div className="bg-white border border-red-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-red-800">
                    {t("tourAdmin.error.title", "Could not load tour details")}
                  </h2>
                  <p className="text-sm text-red-700 mt-1">
                    {errorMessage ?? t("tourAdmin.error.fallback", "Unable to load tour data. Please try again.")}
                  </p>
                </div>
                <button
                  onClick={() => setReloadToken((v) => v + 1)}
                  className="px-3 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-colors">
                  {t("common.retry", "Retry")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Not found */}
        {dataState === "empty" && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
              <Icon icon="heroicons:exclamation-triangle" className="size-8 text-stone-300" />
            </div>
            <p className="text-sm text-stone-500">{t("tourAdmin.notFound", "Tour not found")}</p>
            <Link href="/tour-management" className="mt-4 text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors">
              {t("tourAdmin.backToList", "Back to Tours")}
            </Link>
          </div>
        )}

        {/* Main Content */}
        {dataState === "ready" && tour && (
          <>
            {/* Header Section */}
            <div className="bg-white border-b border-stone-200/80">
              <div className="px-8 pt-5 pb-0 max-w-[87.5rem] mx-auto">
                {/* Back + Actions */}
                <div className="flex items-center justify-between mb-5">
                  <Link
                    href="/tour-management"
                    className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 text-sm font-semibold transition-colors duration-150">
                    <Icon icon="heroicons:arrow-left" className="size-4" />
                    Back to Tours
                  </Link>
                  <div className="flex items-center gap-3">
                    <StatusDropdown
                      currentStatus={tour.status}
                      isLoading={statusUpdating}
                      onChange={handleStatusChange}
                    />
                    <button
                      onClick={() => router.push(`/tour-management/${tourId}/edit`)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md">
                      <Icon icon="heroicons:pencil-square" className="size-4" />
                      Edit Tour
                    </button>
                  </div>
                </div>

                {/* Tour Info Header */}
                <div className="flex gap-5 mb-5">
                  <div className="w-24 h-24 rounded-2xl border-2 border-stone-200/80 bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden hover:border-amber-300 transition-colors duration-200">
                    {tour.thumbnail?.publicURL ? (
                      <img src={tour.thumbnail.publicURL} alt={tour.tourName} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Icon icon="heroicons:photo" className="size-8 text-stone-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h1 className="text-3xl font-bold tracking-tight text-stone-900">{tour.tourName}</h1>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-200/60">
                        {tour.tourCode}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mb-2">{tour.shortDescription}</p>
                    <div className="flex items-center gap-5 text-xs text-stone-400">
                      <span className="inline-flex items-center gap-1">
                        <Icon icon="heroicons:calendar" className="size-3.5" />
                        Created: {formatDate(tour.createdOnUtc)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon icon="heroicons:clock" className="size-3.5" />
                        Updated: {formatDate(tour.lastModifiedOnUtc)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon icon="heroicons:cube" className="size-3.5" />
                        {classifications.length} Packages
                      </span>
                    </div>
                  </div>
                </div>

                {/* Package Selector */}
                {classifications.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Select Package to View Details
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {classifications.map((cls, idx) => (
                        <button
                          key={cls.id}
                          onClick={() => setSelectedPackageIdx(idx)}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                            idx === selectedPackageIdx
                              ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                              : "bg-white border-stone-200/80 text-stone-600 hover:border-stone-300 active:scale-[0.98]"
                          }`}>
                          <span>{cls.name}</span>
                          <span className={`text-xs ${idx === selectedPackageIdx ? "opacity-80" : "text-stone-400"}`}>
                            {formatCurrency(cls.salePrice || cls.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                    {selectedPackage && (
                      <p className="text-sm text-stone-500 mt-2">
                        <span className="font-semibold">Package Details:</span>{" "}
                        {selectedPackage.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Content Tabs */}
                <div className="flex gap-1 border-t border-stone-200/80 -mx-8 px-8 overflow-x-auto">
                  {CONTENT_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors duration-150 ${
                        activeTab === tab.id
                          ? "border-amber-500 text-amber-600"
                          : "border-transparent text-stone-400 hover:text-stone-600 hover:border-stone-200"
                      }`}>
                      <Icon icon={tab.icon} className="size-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8 space-y-6 max-w-[87.5rem] mx-auto">
              {activeTab === "overview" && (
                <>
                  <OverviewTab
                    tour={tour}
                    classifications={classifications}
                    selectedPackageIdx={selectedPackageIdx}
                    allRoutes={allRoutes}
                    formatCurrency={formatCurrency}
                  />
                  {selectedPackage && (
                    <PricingTierEditor
                      title="Classification Tier Pricing"
                      subtitle={`Manage default participant-tier pricing for ${selectedPackage.name}.`}
                      tiers={selectedClassificationTiers}
                      saving={savingTierForClassificationId === selectedPackage.id}
                      saveLabel="Save classification tiers"
                      infoMessage="These are default tiers. Instance-level override tiers will take precedence when configured."
                      onChange={(tiers) =>
                        setClassificationTiers((current) => ({ ...current, [selectedPackage.id]: tiers }))
                      }
                      onSave={handleSaveClassificationTiers}
                    />
                  )}
                </>
              )}

              {activeTab === "itinerary" && selectedPackage && (
                <ItineraryTab classification={selectedPackage} />
              )}

              {activeTab === "accommodations" && selectedPackage && (
                <AccommodationsTab classification={selectedPackage} formatCurrency={formatCurrency} t={t} />
              )}

              {activeTab === "transportation" && (
                <TransportationTab routes={allRoutes} packageName={selectedPackage?.name} formatCurrency={formatCurrency} />
              )}

              {activeTab === "locations" && selectedPackage && (
                <LocationsTab classification={selectedPackage} />
              )}

              {activeTab === "services" && selectedPackage && (
                <OtherServicesTab classification={selectedPackage} formatCurrency={formatCurrency} />
              )}

              {activeTab === "insurance" && selectedPackage && (
                <InsuranceTab
                  classification={selectedPackage}
                  allClassifications={classifications}
                  formatCurrency={formatCurrency}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog for Sensitive Status Transitions */}
      <ConfirmationDialog
        active={showConfirmDialog}
        onClose={() => { setShowConfirmDialog(false); setPendingStatus(null); }}
        onConfirm={() => { if (pendingStatus !== null) applyStatusChange(pendingStatus); setShowConfirmDialog(false); }}
        title={t("tourAdmin.confirmStatusChange.title", "Confirm Status Change")}
        message={t("tourAdmin.confirmStatusChange.message", "This status change requires confirmation. Are you sure you want to proceed?")}
        confirmLabel={t("tourAdmin.confirmStatusChange.confirm", "Confirm")}
        cancelLabel={t("tourAdmin.confirmStatusChange.cancel", "Cancel")}
        isDestructive={false}
      />
    </div>
  );
}
