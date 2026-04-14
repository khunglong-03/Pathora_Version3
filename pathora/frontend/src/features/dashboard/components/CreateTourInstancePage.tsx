"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Icon, CollapsibleSection } from "@/components/ui";
import {
  CreateTourInstancePayload,
  CheckDuplicateResult,
  tourInstanceService,
} from "@/api/services/tourInstanceService";
import { tourService } from "@/api/services/tourService";
import { userService } from "@/api/services/userService";
import { tourRequestService } from "@/api/services/tourRequestService";
import { supplierService } from "@/api/services/supplierService";
import type { TourRequestDetailDto } from "@/types/tourRequest";
import { handleApiError } from "@/utils/apiResponse";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchTourVm, TourClassificationDto, TourDto, UserInfo } from "@/types/tour";

type FormState = {
  tourId: string;
  classificationId: string;
  title: string;
  instanceType: string;
  startDate: string;
  endDate: string;
  maxParticipation: string;
  basePrice: string;
  includedServices: string[];
  guideUserIds: string[];
  thumbnailUrl: string;
  imageUrls: string[];
  hotelProviderId: string;
  transportProviderId: string;
};

type Translate = (key: string, fallback?: string) => string;

const INITIAL_FORM: FormState = {
  tourId: "",
  classificationId: "",
  title: "",
  instanceType: "2",
  startDate: "",
  endDate: "",
  maxParticipation: "",
  basePrice: "",
  includedServices: [],
  guideUserIds: [],
  thumbnailUrl: "",
  imageUrls: [],
  hotelProviderId: "",
  transportProviderId: "",
};

// ─── Wizard Step Constants ────────────────────────────────────────────────────
const SELECT_TOUR_STEP = 0;
const INSTANCE_DETAILS_STEP = 1;

// ─── Step Indicator ────────────────────────────────────────────────────────────
interface StepIndicatorProps {
  currentStep: number;
  t: Translate;
}

function StepIndicator({ currentStep, t }: StepIndicatorProps) {
  const steps = [
    { num: 1, label: t("tourInstance.wizard.step1", "Select Tour") },
    { num: 2, label: t("tourInstance.wizard.step2", "Instance Details") },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.num - 1;
        const isCompleted = currentStep > step.num - 1;
        return (
          <React.Fragment key={step.num}>
            <div className="flex items-center gap-2">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "bg-orange-500 text-white"
                      : "bg-stone-200 text-stone-500"
                }`}
              >
                {isCompleted ? (
                  <Icon icon="heroicons:check" className="size-4" />
                ) : (
                  step.num
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive ? "text-orange-600" : isCompleted ? "text-emerald-600" : "text-stone-400"
                }`}
              >
                {t("tourInstance.wizard.step", "Step")} {step.num}: {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-px w-8 transition-colors ${
                  isCompleted ? "bg-emerald-500" : "bg-stone-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── SelectTourStep ────────────────────────────────────────────────────────────
interface SelectTourStepProps {
  form: FormState;
  errors: Record<string, string>;
  inputClassName: string;
  t: Translate;
  tours: SearchTourVm[];
  tourDetail: TourDto | null;
  loadingTour: boolean;
  loading: boolean;
  loadError: string | null;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  setReloadToken: React.Dispatch<React.SetStateAction<number>>;
  onNext: () => void;
  onCancel: () => void;
}

function SelectTourStep({
  form,
  errors,
  tours,
  tourDetail,
  loadingTour,
  loading,
  loadError,
  inputClassName,
  t,
  updateField,
  setReloadToken,
  onNext,
  onCancel,
}: SelectTourStepProps) {
  const canProceed = Boolean(form.tourId && form.classificationId);

  return (
    <div className="space-y-6">
      <div className="space-y-6 rounded-[2.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <h2 className="text-base font-bold text-stone-900">
          {t("tourInstance.wizard.step1", "Step 1: Select Tour")}
        </h2>

        {loadError && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div>
              <p className="text-sm font-semibold text-red-800">{loadError}</p>
            </div>
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 active:scale-98 whitespace-nowrap"
            >
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">
            {t("tourInstance.packageTour", "Package Tour")} *
          </label>
          {loading && !loadError ? (
            <div className="space-y-2">
              <div className="skeleton h-10 w-full rounded-xl" />
              <div className="skeleton h-10 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <select
                className={inputClassName}
                value={form.tourId}
                disabled={!!loadError}
                onChange={(event) => updateField("tourId", event.target.value)}
              >
                <option value="">
                  {t("tourInstance.selectPackageTour", "Select a package tour...")}
                </option>
                {tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.tourName}
                  </option>
                ))}
              </select>
              {tours.length === 0 && !loading && !loadError && (
                <p className="mt-2 text-sm text-stone-500 italic">
                  {t("tourInstance.noActiveTours", "No active tours available.")}
                </p>
              )}
            </>
          )}
          {errors.tourId && <p className="text-xs text-red-600">{errors.tourId}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">
            {t("tourInstance.packageClassification", "Package Classification")} *
          </label>
          <select
            className={inputClassName}
            value={form.classificationId}
            disabled={!tourDetail || loadingTour}
            onChange={(event) => updateField("classificationId", event.target.value)}
          >
            <option value="">
              {t("tourInstance.selectClassification", "Select a classification...")}
            </option>
            {(tourDetail?.classifications ?? []).map((classification) => (
              <option key={classification.id} value={classification.id}>
                {classification.name}
              </option>
            ))}
          </select>
          {errors.classificationId && (
            <p className="text-xs text-red-600">{errors.classificationId}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 active:scale-98"
        >
          {t("tourInstance.cancel", "Cancel")}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled-opacity-50 active:scale-98"
        >
          {t("tourInstance.wizard.next", "Next")}
          <Icon icon="heroicons:arrow-right" className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ─── ManagerUserChip ─────────────────────────────────────────────────────────
interface ManagerChipProps {
  user: UserInfo;
  onRemove: () => void;
}

function ManagerChip({ user, onRemove }: ManagerChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt=""
          className="size-5 rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Icon icon="heroicons:user" className="size-3" />
      )}
      <span className="max-w-24 truncate">
        {user.fullName || user.username || user.email}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 flex size-3.5 items-center justify-center rounded-full text-orange-500 hover:text-orange-700"
      >
        <Icon icon="heroicons:x-mark" className="size-3" />
      </button>
    </span>
  );
}

import { SupplierItem } from "@/api/services/supplierService";

// ─── InstanceDetailsStep ───────────────────────────────────────────────────────
interface InstanceDetailsStepProps {
  form: FormState;
  errors: Record<string, string>;
  inputClassName: string;
  t: Translate;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  guides: UserInfo[];
  hotelProviders: SupplierItem[];
  transportProviders: SupplierItem[];
  submitting: boolean;
  selectedClassification: TourClassificationDto | null;
  duplicateWarning: CheckDuplicateResult | null;
  availableServices: string[];
  onSubmit: () => void;
  onPrevious: () => void;
  toggleService: (service: string) => void;
  updateImageUrl: (index: number, value: string) => void;
  appendImageUrl: () => void;
  removeImageUrl: (index: number) => void;
}

function InstanceDetailsStep({
  form,
  errors,
  inputClassName,
  t,
  updateField,
  guides,
  hotelProviders,
  transportProviders,
  submitting,
  selectedClassification,
  duplicateWarning,
  availableServices,
  onSubmit,
  onPrevious,
  toggleService,
  updateImageUrl,
  appendImageUrl,
  removeImageUrl,
}: InstanceDetailsStepProps) {
  const selectedGuide = useMemo(
    () => guides.find((u) => form.guideUserIds.includes(u.id)) ?? null,
    [guides, form.guideUserIds],
  );

  return (
    <div className="space-y-5">
      {/* Classification summary */}
      {selectedClassification && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.06)]">
          {t(
            "tourInstance.form.selectedClassification",
            "Selected classification",
          )}
          : <strong>{selectedClassification.name}</strong>
          {selectedClassification.basePrice != null && (
            <span className="ml-2 text-emerald-600">
              —{" "}
              {t("tourInstance.form.classificationBasePrice", "Base Price")}:{" "}
              {Number(selectedClassification.basePrice).toLocaleString("vi-VN")} VND
            </span>
          )}
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicateWarning?.exists && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-3">
            <Icon icon="heroicons:exclamation-triangle" className="size-5 shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {t("tourInstance.duplicateWarning.title", "Duplicate tour instance detected")}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {t("tourInstance.duplicateWarning.message", "An instance for this tour, classification, and start date already exists. Please verify if you want to create a duplicate.")}
              </p>
              {duplicateWarning.existingInstances.map((inst) => (
                <a
                  key={inst.id}
                  href={`/tour-instances/${inst.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1.5 text-sm text-amber-800 hover:text-amber-600 underline underline-offset-2"
                >
                  <Icon icon="heroicons:external-link" className="size-3.5" />
                  {inst.title} ({inst.status})
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <CollapsibleSection
        title={t("tourInstance.wizard.section.basicInfo", "Basic Information")}
        defaultOpen
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              {t("tourInstance.form.title", "Title")} *
            </label>
            <input
              className={inputClassName}
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={t(
                "tourInstance.form.titlePlaceholder",
                "Ex: Ha Long 3N2D - June Departure",
              )}
            />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              {t("tourInstance.instanceType", "Tour Instance Type")} *
            </label>
            <select
              className={inputClassName}
              value={form.instanceType}
              onChange={(event) =>
                updateField("instanceType", event.target.value)
              }
            >
              <option value="1">
                {t("tourInstance.private", "Private")}
              </option>
              <option value="2">
                {t("tourInstance.public", "Public")}
              </option>
            </select>
            {errors.instanceType && (
              <p className="text-xs text-red-600">{errors.instanceType}</p>
            )}
            {form.instanceType === "1" ? (
              <p className="text-xs text-stone-400">{t("tourInstance.instanceType.private.hint", "Only visible in the admin dashboard")}</p>
            ) : (
              <p className="text-xs text-stone-400">{t("tourInstance.instanceType.public.hint", "Visible to all site users")}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Schedule & Pricing */}
      <CollapsibleSection
        title={t(
          "tourInstance.wizard.section.scheduleAndPricing",
          "Schedule & Pricing",
        )}
        defaultOpen
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">
                {t("tourInstance.startDate", "Start Date")} *
              </label>
              <input
                type="date"
                className={inputClassName}
                value={form.startDate}
                onChange={(event) =>
                  updateField("startDate", event.target.value)
                }
              />
              {errors.startDate && (
                <p className="text-xs text-red-600">{errors.startDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">
                {t("tourInstance.endDate", "End Date")} *
              </label>
              <input
                type="date"
                className={inputClassName}
                value={form.endDate}
                onChange={(event) =>
                  updateField("endDate", event.target.value)
                }
              />
              {errors.endDate && (
                <p className="text-xs text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">
                {t("tourInstance.maxParticipants", "Maximum Participants")} *
              </label>
              <input
                type="number"
                min={1}
                className={inputClassName}
                value={form.maxParticipation}
                onChange={(event) =>
                  updateField("maxParticipation", event.target.value)
                }
              />
              {errors.maxParticipation && (
                <p className="text-xs text-red-600">
                  {errors.maxParticipation}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">
                {t("tourInstance.form.basePrice", "Base Price (Snapshot)")} *
              </label>
              <input
                type="number"
                min={0}
                className={inputClassName}
                value={form.basePrice}
                onChange={(event) =>
                  updateField("basePrice", event.target.value)
                }
              />
              <p className="text-xs text-stone-400">
                {t(
                  "tourInstance.form.basePriceHint",
                  "Snapshot from classification. Can be overridden for special departures.",
                )}
              </p>
              {errors.basePrice && (
                <p className="text-xs text-red-600">{errors.basePrice}</p>
              )}
            </div>
          </div>

        </div>
      </CollapsibleSection>

      {/* Guide */}
      <CollapsibleSection
        title={t("tourInstance.wizard.section.guide", "Guide")}
        defaultOpen={false}
      >
        <div className="space-y-3">
          {selectedGuide && (
            <div className="flex flex-wrap gap-2">
              <ManagerChip
                user={selectedGuide}
                onRemove={() => updateField("guideUserIds", [])}
              />
            </div>
          )}
          <select
            className={inputClassName}
            value={selectedGuide?.id ?? ""}
            onChange={(e) => {
              const guideId = e.target.value;
              updateField("guideUserIds", guideId ? [guideId] : []);
            }}
          >
            <option value="">
              {t("tourInstance.form.selectGuideOptional", "Select guide (optional)")}
            </option>
            {guides.map((guide) => (
              <option key={guide.id} value={guide.id}>
                {guide.fullName || guide.username || guide.email}
              </option>
            ))}
          </select>
        </div>
      </CollapsibleSection>

      {/* Optional Services */}
      <CollapsibleSection
        title={t("tourInstance.wizard.section.services", "Optional Services")}
        defaultOpen={false}
      >
        <div className="space-y-3">
          {availableServices.length === 0 ? (
            <p className="text-xs text-stone-500">
              {t("tourInstance.form.noServicesAvailable", "No services available for this tour.")}
            </p>
          ) : (
            <div className="space-y-2">
              {availableServices.map((service) => {
                const checked = form.includedServices.includes(service);
                return (
                  <label key={service} className="flex items-center gap-2 text-sm text-stone-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(service)}
                      className="size-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span>{service}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Provider Assignment */}
      <CollapsibleSection
        title={t("tourInstance.wizard.section.providers", "Provider Assignment")}
        defaultOpen={true}
      >
        <div className="grid gap-4 md:grid-cols-2 text-sm text-stone-700">
          <div className="space-y-2">
            <label className="font-semibold text-stone-700">
              {t("tourInstance.form.hotelProvider", "Hotel Provider")}
            </label>
            <select
              className={inputClassName}
              value={form.hotelProviderId}
              onChange={(e) => updateField("hotelProviderId", e.target.value)}
            >
              <option value="">{t("tourInstance.form.selectHotel", "Select Hotel Provider...")}</option>
              {hotelProviders.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-stone-700">
              {t("tourInstance.form.transportProvider", "Transport Provider")}
            </label>
            <select
              className={inputClassName}
              value={form.transportProviderId}
              onChange={(e) => updateField("transportProviderId", e.target.value)}
            >
              <option value="">{t("tourInstance.form.selectTransport", "Select Transport Provider...")}</option>
              {transportProviders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Media */}
      <CollapsibleSection
        title={t("tourInstance.wizard.section.media", "Media")}
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              {t("tourInstance.form.thumbnailUrl", "Thumbnail URL")}
            </label>
            <input
              className={inputClassName}
              value={form.thumbnailUrl}
              onChange={(event) => updateField("thumbnailUrl", event.target.value)}
              placeholder={t(
                "tourInstance.form.thumbnailUrlPlaceholder",
                "https://example.com/image.jpg",
              )}
            />
            {form.thumbnailUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-stone-200 w-32 h-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.thumbnailUrl}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              {t("tourInstance.form.imageUrls", "Image URLs")}
            </label>
            <p className="text-xs text-stone-500">
              {t("tourInstance.form.imageUrlsHint", "Add image URLs that will be associated with this tour instance.")}
            </p>
            <div className="space-y-2">
              {form.imageUrls.map((url, index) => (
                <div key={`img-${index}`} className="flex items-center gap-2">
                  <input
                    className={inputClassName}
                    value={url}
                    onChange={(event) => updateImageUrl(index, event.target.value)}
                    placeholder={t("tourInstance.form.imageUrlPlaceholder", "https://example.com/image.jpg")}
                  />
                  {url && (
                    <div className="shrink-0 rounded-xl overflow-hidden border border-stone-200 w-14 h-14">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImageUrl(index)}
                    className="shrink-0 rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 whitespace-nowrap">
                    {t("common.remove", "Remove")}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={appendImageUrl}
                className="rounded-xl border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-500 hover:bg-orange-50">
                + {t("tourInstance.form.addImage", "Add image")}
              </button>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Itinerary Preview */}
      {selectedClassification && selectedClassification.plans && selectedClassification.plans.length > 0 && (
        <CollapsibleSection
          title={t("tourInstance.wizard.section.itineraryPreview", "Itinerary Preview")}
          defaultOpen={false}
        >
          <div className="space-y-4">
            <p className="text-xs text-stone-500">
              {t("tourInstance.wizard.section.itineraryPreviewHint", "This itinerary will be cloned from the selected classification.")}
            </p>
            {selectedClassification.plans.map((day) => (
              <div key={day.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                    {day.dayNumber}
                  </span>
                  <h4 className="text-sm font-semibold text-stone-900">{day.title}</h4>
                </div>
                {day.description && (
                  <p className="text-xs text-stone-600 ml-8 mb-3">{day.description}</p>
                )}
                {day.activities && day.activities.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {day.activities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-2 text-xs text-stone-700">
                        <span className="w-4 text-center text-stone-400">{activity.order}.</span>
                        <span className="font-medium">{activity.title}</span>
                        {activity.startTime && (
                          <span className="text-stone-400">({activity.startTime}{activity.endTime ? ` - ${activity.endTime}` : ""})</span>
                        )}
                        {activity.isOptional && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 text-[10px] font-medium">
                            {t("tourInstance.optional", "Optional")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
        >
          <Icon icon="heroicons:arrow-left" className="size-4" />
          {t("tourInstance.wizard.previous", "Previous")}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled-opacity-60"
        >
          <Icon icon="heroicons:check" className="size-4" />
          {submitting
            ? t("tourInstance.creating", "Creating...")
            : t("tourInstance.createAction", "Create instance")}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function CreateTourInstancePage({
  prefillTourRequestId,
}: {
  prefillTourRequestId?: string;
}) {
  const { t } = useTranslation();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const safeT = useCallback<Translate>(
    (key, fallback) => (mounted ? t(key, fallback ?? key) : fallback ?? key),
    [mounted, t],
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTourRequestId = searchParams.get("tourRequestId");

  const [currentStep, setCurrentStep] = useState(SELECT_TOUR_STEP);
  const [tours, setTours] = useState<SearchTourVm[]>([]);
  const [tourDetail, setTourDetail] = useState<TourDto | null>(null);
  const [loadingTour, setLoadingTour] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reloadToken, setReloadToken] = useState(0);
  const [guides, setGuides] = useState<UserInfo[]>([]);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<CheckDuplicateResult | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Providers
  const [hotelProviders, setHotelProviders] = useState<SupplierItem[]>([]);
  const [transportProviders, setTransportProviders] = useState<SupplierItem[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [prefillTourRequest, setPrefillTourRequest] = useState<TourRequestDetailDto | null>(null);

  const effectiveTourRequestId = prefillTourRequestId ?? urlTourRequestId ?? null;

  const fetchTourRequestDetail = useCallback(async (id: string) => {
    try {
      const result = await tourRequestService.getTourRequestDetail(id, { admin: true });
      if (result) {
        setPrefillTourRequest(result);
      }
    } catch (error: unknown) {
      const handledError = handleApiError(error);
      console.error("Failed to fetch tour request detail:", handledError.message);
    }
  }, []);

  const debouncedStartDate = useDebounce(form.startDate, 500);
  const prevDebouncedStartDate = useRef<string>("");

  const selectedTour = useMemo(
    () => tours.find((tour) => tour.id === form.tourId) ?? null,
    [form.tourId, tours],
  );

  const selectedClassification = useMemo(
    () =>
      tourDetail?.classifications?.find(
        (c) => c.id === form.classificationId,
      ) ?? null,
    [form.classificationId, tourDetail],
  );

  // Fetch tours
  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      let result;
      try {
        result = await tourService.getMyTours(undefined, "1", "all", "all", 1, 100);
      } catch (err) {
        // Fallback for admins/managers if getMyTours fails
        result = await tourService.getAdminTourManagement(undefined, "1", "all", "all", 1, 100);
      }
      // @ts-ignore - TourVm and SearchTourVm are compatible for id and name
      setTours(result?.data ?? []);
    } catch (error: unknown) {
      const handledError = handleApiError(error);
      console.error("Failed to fetch tours:", handledError.message);
      setLoadError(handledError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch guides for optional guide selection
  const fetchGuides = useCallback(async () => {
    try {
      const guides = await userService.getGuides();
      setGuides(guides ?? []);
    } catch (error: unknown) {
      console.error("Failed to fetch guides:", error);
      setGuides([]);
    }
  }, []);

  // Fetch Providers
  const fetchProviders = useCallback(async () => {
    try {
      const [hotels, transports] = await Promise.all([
        supplierService.getSuppliers(1), // Hotel = 1
        supplierService.getSuppliers(0), // Transport = 0
      ]);
      setHotelProviders(hotels ?? []);
      setTransportProviders(transports ?? []);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    }
  }, []);

  useEffect(() => {
    fetchTours();
    fetchGuides();
    fetchProviders();
  }, [fetchTours, fetchGuides, fetchProviders]);

  useEffect(() => {
    if (effectiveTourRequestId) {
      void fetchTourRequestDetail(effectiveTourRequestId);
    }
  }, [effectiveTourRequestId, fetchTourRequestDetail]);

  // Pre-fill form fields from tour request
  useEffect(() => {
    if (!prefillTourRequest) return;

    const tr = prefillTourRequest;

    setForm((current) => {
      // Only pre-fill empty fields so user can still change them
      const next = { ...current };

      // Pre-fill dates (use YYYY-MM-DD format for date inputs)
      if (!next.startDate && tr.startDate) {
        const start = new Date(tr.startDate);
        if (!Number.isNaN(start.getTime())) {
          next.startDate = start.toISOString().split("T")[0];
        }
      }
      if (!next.endDate && tr.endDate) {
        const end = new Date(tr.endDate);
        if (!Number.isNaN(end.getTime())) {
          next.endDate = end.toISOString().split("T")[0];
        }
      }

      // Pre-fill maxParticipation from numberOfParticipants
      if (!next.maxParticipation && tr.numberOfParticipants > 0) {
        next.maxParticipation = String(tr.numberOfParticipants);
      }

      // Pre-fill basePrice from budgetPerPersonUsd if no price set yet
      if (!next.basePrice && tr.budgetPerPersonUsd > 0) {
        next.basePrice = String(tr.budgetPerPersonUsd);
      }

      return next;
    });
  }, [prefillTourRequest]);

  // Load tour detail when tour selected
  useEffect(() => {
    if (!form.tourId) {
      setTourDetail(null);
      setAvailableServices([]);
      setForm((current) => ({ ...current, classificationId: "", includedServices: [] }));
      return;
    }

    const loadTourDetail = async () => {
      try {
        setLoadingTour(true);
        const detail = await tourService.getTourDetail(form.tourId);
        setTourDetail(detail);

        const defaults = ["Shuttle bus", "Meals", "Insurance"];
        const mergedServices = Array.from(
          new Set([...(detail?.includedServices ?? []), ...defaults]),
        );
        setAvailableServices(mergedServices);

        setForm((current) => {
          const next = { ...current, classificationId: "" };

          if (detail) {
            if (
              next.includedServices.length === 0 &&
              detail.includedServices?.length > 0
            ) {
              next.includedServices = detail.includedServices;
            }
            // Auto-fill images from tour
            if (!next.thumbnailUrl) {
              next.thumbnailUrl = (detail as any).thumbnail?.publicURL ?? "";
            }
            if (next.imageUrls.length === 0) {
              next.imageUrls = (detail as any).images
                ?.map((i: any) => i.publicURL)
                .filter(Boolean)
                .slice(0, 10) ?? [];
            }
          }

          return next;
        });
      } catch (error: unknown) {
        const handledError = handleApiError(error);
        console.error(
          "Failed to fetch tour detail:",
          handledError.message,
        );
        toast.error(
          t("toast.failedToLoadTourDetails", "Failed to load tour details"),
        );
      } finally {
        setLoadingTour(false);
      }
    };

    loadTourDetail();
  }, [form.tourId, t]);

  // Auto-fill basePrice and title when classification selected
  useEffect(() => {
    if (!selectedClassification) return;

    setForm((current) => {
      const next = { ...current };
      const fallbackPrice =
        selectedClassification.basePrice ?? selectedClassification.price ?? 0;

      if (!next.title.trim()) {
        next.title = `${selectedTour?.tourName ?? "Tour"} - ${
          selectedClassification.name
        }`;
      }

      if (next.basePrice === "" || next.basePrice === "0") {
        next.basePrice = fallbackPrice > 0 ? String(fallbackPrice) : "";
      }

      return next;
    });
  }, [selectedClassification, selectedTour?.tourName]);

  // Check for duplicate on startDate change (debounced)
  useEffect(() => {
    // Only check on Step 2, when all required fields are present
    if (
      currentStep !== INSTANCE_DETAILS_STEP ||
      !form.tourId ||
      !form.classificationId ||
      !debouncedStartDate ||
      debouncedStartDate === prevDebouncedStartDate.current
    ) {
      return;
    }

    prevDebouncedStartDate.current = debouncedStartDate;

    const check = async () => {
      try {
        setCheckingDuplicate(true);
        const result = await tourInstanceService.checkDuplicate(
          form.tourId,
          form.classificationId,
          debouncedStartDate,
        );
        setDuplicateWarning(result);
      } catch {
        // Silently ignore — duplicate check is non-critical
        setDuplicateWarning(null);
      } finally {
        setCheckingDuplicate(false);
      }
    };

    void check();
  }, [debouncedStartDate, form.tourId, form.classificationId, currentStep]);

  // Navigation guard — beforeunload
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field as string]) return current;
      const next = { ...current };
      delete next[field as string];
      return next;
    });
    // Mark form dirty
    setIsDirty(true);
    // Clear duplicate warning when startDate is cleared
    if (field === "startDate" && !value) {
      setDuplicateWarning(null);
    }
  };

  const toggleService = (service: string) => {
    setForm((current) => {
      const exists = current.includedServices.includes(service);
      return {
        ...current,
        includedServices: exists
          ? current.includedServices.filter((s) => s !== service)
          : [...current.includedServices, service],
      };
    });
  };

  const updateImageUrl = (index: number, value: string) => {
    setForm((current) => {
      const items = [...current.imageUrls];
      items[index] = value;
      return { ...current, imageUrls: items };
    });
  };

  const appendImageUrl = () => {
    setForm((current) => ({ ...current, imageUrls: [...current.imageUrls, ""] }));
  };

  const removeImageUrl = (index: number) => {
    setForm((current) => ({
      ...current,
      imageUrls: current.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!form.title.trim())
      newErrors.title = t("tourInstance.validation.titleRequired", "Title is required");
    if (!form.startDate)
      newErrors.startDate = t(
        "tourInstance.validation.startDateRequired",
        "Start date is required",
      );
    if (!form.endDate)
      newErrors.endDate = t(
        "tourInstance.validation.endDateRequired",
        "End date is required",
      );
    else if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end <= start) {
        newErrors.endDate = t(
          "tourInstance.validation.endDateAfterStart",
          "End date must be after start date",
        );
      }
    }
    if (!form.maxParticipation || Number(form.maxParticipation) <= 0)
      newErrors.maxParticipation = t(
        "tourInstance.validation.maxParticipantsRequired",
        "Maximum participants must be greater than 0",
      );
    if (form.basePrice === "" || form.basePrice === null || form.basePrice === undefined)
      newErrors.basePrice = t(
        "tourInstance.validation.basePriceRequired",
        "Base price is required",
      );
    else if (Number(form.basePrice) < 0)
      newErrors.basePrice = t(
        "tourInstance.validation.basePriceNonNegative",
        "Base price must be 0 or greater",
      );

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t("tourInstance.validationFailed", "Please fill in all required fields"));
      return;
    }

    try {
      setSubmitting(true);

      const payload: CreateTourInstancePayload = {
        tourId: form.tourId,
        classificationId: form.classificationId,
        title: form.title.trim(),
        instanceType: Number(form.instanceType),
        startDate: form.startDate + "T00:00:00Z",
        endDate: form.endDate + "T00:00:00Z",
        maxParticipation: Number(form.maxParticipation),
        basePrice: Number(form.basePrice),
        includedServices: form.includedServices
          .map((s) => s.trim())
          .filter(Boolean),
        guideUserIds: form.guideUserIds,
        thumbnailUrl: form.thumbnailUrl.trim() || undefined,
        imageUrls: form.imageUrls.map((url) => url.trim()).filter(Boolean),
        tourRequestId: effectiveTourRequestId ?? undefined,
      };

      const instance = await tourInstanceService.createInstance(payload);
      if (instance) {
        setIsDirty(false);
        toast.success(
          t("tourInstance.created", "Tour instance created successfully!"),
        );
        // Store full POST response for detail page to avoid redundant GET
        try {
          sessionStorage.setItem("tourInstanceCreated", JSON.stringify(instance));
        } catch {
          // sessionStorage may fail if data is too large — detail page will fall back to GET
        }
        router.push(`/tour-instances/${instance.id}`);
      }
    } catch (error: unknown) {
      const handledError = handleApiError(error);
      console.error(
        "Failed to create tour instance:",
        handledError.message,
      );
      toast.error(
        t("tourInstance.createError", "Failed to create tour instance"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

  return (
    <main className="min-h-screen bg-stone-50 p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[2.5rem] border border-stone-200 bg-white p-4 md:p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div>
            <h1 className="text-xl font-bold text-stone-900">
              {safeT("tourInstance.createTitle", "Create Tour Instance")}
            </h1>
            <p className="text-sm text-stone-500">
              {safeT(
                "tourInstance.createSubtitle",
                "Create a scheduled tour from a package template",
              )}
            </p>
          </div>
          <StepIndicator currentStep={currentStep} t={safeT} />
        </header>

        {/* Info banner */}
        <section className="rounded-[2.5rem] border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          {safeT(
            "tourInstance.createInfo",
            "A Tour Instance is a scheduled occurrence with specific dates, capacity, and pricing.",
          )}
        </section>

        {/* Tour Request prefill banner */}
        {prefillTourRequest && (
          <section className="rounded-[2.5rem] border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-start gap-3">
              <Icon icon="heroicons:document-text" className="size-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {safeT("tourInstance.prefillFromRequest", "Creating from Tour Request")}
                </p>
                <p className="mt-1">
                  {prefillTourRequest.customerName && (
                    <span>
                      {safeT("tourRequest.common.customer", "Customer")}:{" "}
                      <strong>{prefillTourRequest.customerName}</strong>
                      {" · "}
                    </span>
                  )}
                  {prefillTourRequest.destination && (
                    <span>
                      {safeT("tourRequest.admin.detail.destination", "Destination")}:{" "}
                      <strong>{prefillTourRequest.destination}</strong>
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-blue-700">
                  {safeT(
                    "tourInstance.prefillHint",
                    "Some fields have been pre-filled based on the tour request. You can adjust them before submitting.",
                  )}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Step Content */}
        {currentStep === SELECT_TOUR_STEP ? (
          <SelectTourStep
            form={form}
            errors={errors}
            tours={tours}
            tourDetail={tourDetail}
            loadingTour={loadingTour}
            loading={loading}
            loadError={loadError}
            updateField={updateField}
            setReloadToken={setReloadToken}
            onNext={() => setCurrentStep(INSTANCE_DETAILS_STEP)}
            onCancel={() => router.push("/tour-instances")}
            inputClassName={inputClassName}
            t={safeT}
          />
        ) : (
          <InstanceDetailsStep
            form={form}
            errors={errors}
            guides={guides}
            submitting={submitting}
            selectedClassification={selectedClassification}
            duplicateWarning={duplicateWarning}
            availableServices={availableServices}
            onSubmit={handleSubmit}
            onPrevious={() => setCurrentStep(SELECT_TOUR_STEP)}
            toggleService={toggleService}
            updateField={updateField}
            updateImageUrl={updateImageUrl}
            appendImageUrl={appendImageUrl}
            removeImageUrl={removeImageUrl}
            inputClassName={inputClassName}
            t={safeT}
          />
        )}
      </div>
    </main>
  );
}
