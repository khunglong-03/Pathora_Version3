"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import type { ImageDto } from "@/types/tour";
import { TourStatusMap } from "@/types/tour";
import { formatCurrency } from "@/utils/format";

/* ── Types ──────────────────────────────────────────────────── */
interface BasicInfoForm {
  tourName: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
  status: string;
  tourScope: string;
  continent: string;
  customerSegment: string;
}

interface ClassificationForm {
  id?: string;
  name: string;
  enName: string;
  description: string;
  enDescription: string;
  basePrice: string;
  durationDays: string;
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

interface ServiceForm {
  serviceName: string;
  enServiceName: string;
  pricingType: string;
  price: string;
  email: string;
  contactNumber: string;
}

interface InsuranceForm {
  insuranceName: string;
  enInsuranceName: string;
  insuranceType: string;
  insuranceProvider: string;
  coverageDescription: string;
  enCoverageDescription: string;
  coverageAmount: string;
  coverageFee: string;
  isOptional: boolean;
  note: string;
  enNote: string;
}

/* ── Props ──────────────────────────────────────────────────── */
interface TourPreviewSectionProps {
  basicInfo: BasicInfoForm;
  thumbnail: File | null;
  existingThumbnail: ImageDto | null;
  images: File[];
  existingImages: ImageDto[];
  classifications: ClassificationForm[];
  dayPlans: DayPlanForm[][];
  services: ServiceForm[];
  insurances: InsuranceForm[][];
}

export function TourPreviewSection({
  basicInfo,
  thumbnail,
  existingThumbnail,
  images,
  existingImages,
  classifications,
  dayPlans,
  services,
  insurances,
}: TourPreviewSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          {t("tourAdmin.preview.sectionTitle", "Tour Preview")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {t("tourAdmin.preview.sectionSubtitle", "Review all tour information before creating.")}
        </p>

        {/* Basic Info */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {t("tourAdmin.preview.basicInfo", "Basic Information")}
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Tour Name:</span>
                <p className="font-medium text-slate-900 dark:text-white">{basicInfo.tourName || "—"}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Short Description:</span>
                <p className="font-medium text-slate-900 dark:text-white">{basicInfo.shortDescription || "—"}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Tour Scope:</span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {basicInfo.tourScope === "1"
                    ? t("tourAdmin.tourScope.domestic")
                    : t("tourAdmin.tourScope.international")}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Customer Segment:</span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {basicInfo.customerSegment === "1" ? t("tourAdmin.customerSegment.individual")
                    : basicInfo.customerSegment === "2" ? t("tourAdmin.customerSegment.group")
                    : basicInfo.customerSegment === "3" ? t("tourAdmin.customerSegment.family")
                    : t("tourAdmin.customerSegment.corporate")}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {TourStatusMap[Number(basicInfo.status)] ?? basicInfo.status}
                </p>
              </div>
            </div>
            {/* Thumbnail */}
            {thumbnail ? (
              <div>
                <span className="text-slate-500 dark:text-slate-400">Thumbnail:</span>
                <div className="mt-1">
                  <img
                    src={URL.createObjectURL(thumbnail)}
                    alt="Thumbnail"
                    className="h-24 w-auto rounded-lg object-cover"
                  />
                </div>
              </div>
            ) : existingThumbnail?.publicURL ? (
              <div>
                <span className="text-slate-500 dark:text-slate-400">Thumbnail:</span>
                <div className="mt-1">
                  <img
                    src={existingThumbnail.publicURL}
                    alt="Existing thumbnail"
                    className="h-24 w-auto rounded-lg object-cover"
                  />
                </div>
              </div>
            ) : null}
            {/* Images */}
            {(images.length > 0 || existingImages.length > 0) && (
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Gallery ({existingImages.length + images.length}):
                </span>
                <div
                  role="list"
                  aria-label="Tour gallery images"
                  className="mt-1 flex flex-wrap gap-1">
                  {existingImages.map((img, i) => (
                    <img
                      key={`existing-${img.fileId ?? i}`}
                      src={img.publicURL}
                      alt={`Existing image ${i + 1}`}
                      className="h-12 w-auto rounded object-cover"
                    />
                  ))}
                  {images.map((img, i) => (
                    <img
                      key={`new-${i}`}
                      src={URL.createObjectURL(img)}
                      alt={`New image ${i + 1}`}
                      className="h-12 w-auto rounded object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Packages + Itineraries */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {t("tourAdmin.preview.packages", "Packages (#{count})", { count: classifications.length })}
          </h3>
          {classifications.length === 0 ? (
            <p className="text-sm text-slate-400">No packages defined.</p>
          ) : (
            <div className="space-y-3">
              {classifications.map((cls, ci) => (
                <div key={cls.id ?? ci} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {cls.name || `Package #${ci + 1}`}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {cls.basePrice ? formatCurrency(Number(cls.basePrice)) : ""} / {cls.durationDays || "?"} days
                    </span>
                  </div>
                  {/* Day plans preview */}
                  {(dayPlans[ci] ?? []).length > 0 && (
                    <div className="mt-2 pl-3 border-l-2 border-orange-200 dark:border-orange-700 space-y-1">
                      {(dayPlans[ci] ?? []).map((day, di) => (
                        <div key={day.id ?? di} className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Day {day.dayNumber}:</span> {day.title || "—"}
                          {day.activities.length > 0 && (
                            <span className="ml-1 text-slate-400">({day.activities.length} activities)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Services */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {t("tourAdmin.preview.services", "Services")}
          </h3>
          {services.length === 0 ? (
            <p className="text-sm text-slate-400">No services added.</p>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-1">
              {services.map((svc, i) => (
                <div key={i} className="text-sm text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>{svc.serviceName || "—"}</span>
                  <span className="text-slate-500">{svc.price ? formatCurrency(Number(svc.price)) : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Insurances */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {t("tourAdmin.preview.insurances", "Insurances")}
          </h3>
          {classifications.every((_, i) => (insurances[i] ?? []).length === 0) ? (
            <p className="text-sm text-slate-400">No insurances added.</p>
          ) : (
            <div className="space-y-2">
              {classifications.map((cls, ci) =>
                (insurances[ci] ?? []).map((ins, ii) => (
                  <div key={`${ci}-${ii}`} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{ins.insuranceName}</span>
                    <span className="ml-2 text-slate-500">{ins.coverageFee ? formatCurrency(Number(ins.coverageFee)) : ""}</span>
                  </div>
                )),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
