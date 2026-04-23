"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Icon, CollapsibleSection } from "@/components/ui";
import {
  CreateTourInstancePayload,
  CheckDuplicateResult,
  tourInstanceService,
} from "@/api/services/tourInstanceService";
import type { GuideConflict } from "@/api/services/tourInstanceService";
import { tourService } from "@/api/services/tourService";
import { userService } from "@/api/services/userService";
import { tourRequestService } from "@/api/services/tourRequestService";
import { supplierService } from "@/api/services/supplierService";
import type { SupplierItem } from "@/api/services/supplierService";
import { adminService } from "@/api/services/adminService";
import { fileService } from "@/api/services/fileService";
import type { TourRequestDetailDto } from "@/types/tourRequest";
import { handleApiError } from "@/utils/apiResponse";
import { getProviderRoomOptions } from "@/utils/providerRoomOptions";
import { useDebounce } from "@/hooks/useDebounce";
import {
  clearRoomTypeAssignments,
  hasRoomAssignments,
  mapActivityAssignmentsForPayload,
} from "@/features/dashboard/components/createTourInstanceAssignments";
import {
  SearchTourVm,
  TourClassificationDto,
  TourDto,
  UserInfo,
  VehicleTypeMap,
  vehicleTypeNameToKey,
} from "@/types/tour";
import type { HotelProviderDetail, TransportProviderDetail } from "@/types/admin";
import dayjs from "dayjs";

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
  activityAssignments: Record<
    string,
    {
      supplierId?: string;
      roomType?: string;
      accommodationQuantity?: number;
      vehicleId?: string;
      requestedVehicleType?: number;
      requestedSeatCount?: number;
      requestedVehicleCount?: number;
    }
  >;
};

/** A mutable copy of a classification day for local edits before submission. */
type EditableDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  activities: EditableActivity[];
};

type EditableActivity = {
  id: string;
  order: number;
  activityType: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  isOptional: boolean;
  /** When true, show inline edit form instead of read-only */
  _editing?: boolean;
};

type Translate = (
  key: string,
  fallback?: string,
  options?: Record<string, unknown>,
) => string;

/** Maps backend activity-type enum values to their i18n keys. */
const ACTIVITY_TYPE_OPTIONS = [
  { value: "Sightseeing",    key: "tour.activityTypes.0" },
  { value: "Dining",         key: "tour.activityTypes.1" },
  { value: "Shopping",       key: "tour.activityTypes.2" },
  { value: "Entertainment",  key: "tour.activityTypes.6" },
  { value: "Cultural",       key: "tour.activityTypes.5" },
  { value: "Adventure",      key: "tour.activityTypes.3" },
  { value: "Transportation", key: "tour.activityTypes.7" },
  { value: "Accommodation",  key: "tour.activityTypes.8" },
  { value: "FreeTime",       key: "tour.activityTypes.9" },
  { value: "Other",          key: "tour.activityTypes.99" },
] as const;

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
  activityAssignments: {},
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
                }`}>
                {isCompleted ? (
                  <Icon icon="heroicons:check" className="size-4" />
                ) : (
                  step.num
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive
                    ? "text-orange-600"
                    : isCompleted
                      ? "text-emerald-600"
                      : "text-stone-400"
                }`}>
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
  updateField: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
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
              className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 active:scale-98 whitespace-nowrap">
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
                onChange={(event) => updateField("tourId", event.target.value)}>
                <option value="">
                  {t(
                    "tourInstance.selectPackageTour",
                    "Select a package tour...",
                  )}
                </option>
                {tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.tourName}
                  </option>
                ))}
              </select>
              {tours.length === 0 && !loading && !loadError && (
                <p className="mt-2 text-sm text-stone-500 italic">
                  {t(
                    "tourInstance.noActiveTours",
                    "No active tours available.",
                  )}
                </p>
              )}
            </>
          )}
          {errors.tourId && (
            <p className="text-xs text-red-600">{errors.tourId}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">
            {t("tourInstance.packageClassification", "Package Classification")}{" "}
            *
          </label>
          <select
            className={inputClassName}
            value={form.classificationId}
            disabled={!tourDetail || loadingTour}
            onChange={(event) =>
              updateField("classificationId", event.target.value)
            }>
            <option value="">
              {t(
                "tourInstance.selectClassification",
                "Select a classification...",
              )}
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
          className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 active:scale-98">
          {t("tourInstance.cancel", "Cancel")}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled-opacity-50 active:scale-98">
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
        className="ml-0.5 flex size-3.5 items-center justify-center rounded-full text-orange-500 hover:text-orange-700">
        <Icon icon="heroicons:x-mark" className="size-3" />
      </button>
    </span>
  );
}

// Pure validators for the Transport Plan block. Exported only for tests.
export function isVehicleTypeInvalidForSupplier(
  assignment:
    | { supplierId?: string; requestedVehicleType?: number }
    | undefined,
  allowed: Record<string, Set<number>>,
): boolean {
  if (!assignment) return false;
  const rawSupplier = assignment.supplierId;
  const supplierId =
    typeof rawSupplier === "string" && rawSupplier.trim() !== ""
      ? rawSupplier.trim()
      : undefined;
  const vehicleType = assignment.requestedVehicleType;
  if (!supplierId) {
    if (vehicleType === undefined || vehicleType === null) return false;
    return true;
  }
  if (vehicleType === undefined || vehicleType === null) return true;
  const set = allowed[supplierId];
  if (!set) return true;
  return !set.has(vehicleType);
}

export function validateTransportActivities(
  assignments: FormState["activityAssignments"],
  classification: TourClassificationDto | null,
  allowed: Record<string, Set<number>>,
): string[] {
  if (!classification?.plans?.length) return [];
  const invalid: string[] = [];
  for (const day of classification.plans) {
    for (const activity of day.activities ?? []) {
      if (activity.activityType !== "Transportation") continue;
      if (isVehicleTypeInvalidForSupplier(assignments[activity.id], allowed)) {
        invalid.push(activity.id);
      }
    }
  }
  return invalid;
}

/**
 * Returns activity IDs whose `requestedSeatCount` is set but lower than the
 * tour's `maxParticipation`. Mirrors the backend FluentValidation rule so we
 * fail fast on the client instead of surfacing a 500 from the API.
 *
 * Walks `form.activityAssignments` directly — `requestedSeatCount` is only
 * written by the Transport Plan UI, so user-added activities (which live in
 * `editableItinerary`, not `classification.plans`) are still covered.
 */
export function validateTransportSeatCounts(
  assignments: FormState["activityAssignments"],
  _classification: TourClassificationDto | null,
  maxParticipation: number,
): string[] {
  if (!Number.isFinite(maxParticipation) || maxParticipation <= 0) return [];
  const invalid: string[] = [];
  for (const [activityId, assignment] of Object.entries(assignments)) {
    const seat = assignment?.requestedSeatCount;
    if (typeof seat === "number" && seat > 0 && seat < maxParticipation) {
      invalid.push(activityId);
    }
  }
  return invalid;
}

export function buildAllowedVehicleKeysBySupplierId(
  transportDetailsBySupplierId: Record<string, TransportProviderDetail>,
): Record<string, Set<number>> {
  const out: Record<string, Set<number>> = {};
  for (const [supplierId, counts] of Object.entries(
    buildVehicleCountsBySupplierId(transportDetailsBySupplierId),
  )) {
    out[supplierId] = new Set(Object.keys(counts).map(Number));
  }
  return out;
}

/**
 * For each supplier, count **active** vehicles grouped by numeric VehicleType key.
 * Used by the UI to render "Bus (3 xe)" labels and a running total badge.
 * Vehicles whose `vehicleType` string doesn't map to VehicleTypeMap are dropped
 * (and `vehicleTypeNameToKey` emits a console.warn listing known values).
 */
export function buildVehicleCountsBySupplierId(
  transportDetailsBySupplierId: Record<string, TransportProviderDetail>,
): Record<string, Record<number, number>> {
  const out: Record<string, Record<number, number>> = {};
  for (const [supplierId, detail] of Object.entries(
    transportDetailsBySupplierId,
  )) {
    const counts: Record<number, number> = {};
    for (const vehicle of detail.vehicles ?? []) {
      if (!vehicle.isActive) continue;
      const key = vehicleTypeNameToKey(vehicle.vehicleType);
      if (key === undefined) continue;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    out[supplierId] = counts;
  }
  return out;
}

/** Sum of active vehicles across all types for a supplier. */
export function sumVehicleCounts(
  counts: Record<number, number> | undefined,
): number {
  if (!counts) return 0;
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

/**
 * "Bus" + 3 → "Bus (3 vehicles)" / "Bus (3 xe)".
 * Localised via the `t` function so the label follows the active locale.
 */
export function formatVehicleOptionLabel(
  label: string,
  count: number,
  t: Translate,
): string {
  return t(
    "tourInstance.wizard.vehicleType.optionWithCount_other",
    "{{label}} ({{count}} vehicles)",
    { label, count },
  );
}

/** Total-fleet badge label: 3 → "3 vehicles available" / "3 xe khả dụng". */
export function formatVehiclesAvailableBadge(
  total: number,
  t: Translate,
): string {
  return t(
    "tourInstance.wizard.vehicleType.vehiclesAvailable_other",
    "{{count}} vehicles available",
    { count: total },
  );
}

// Renders the Vehicle Type <select> with 6 tracked states, a11y wiring, and
// inline invalid messaging. The "supplier has no vehicles" path keeps the
// select enabled when a stale value is present so the user can clear it.
interface VehicleTypeSelectProps {
  activityId: string;
  supplierId?: string;
  value?: number;
  transportDetailsLoading: boolean;
  hasDetail: boolean;
  hasError: boolean;
  allowedKeys: Set<number> | undefined;
  /** Map of numeric vehicle-type key → count of active vehicles for the selected supplier. */
  vehicleCountsByType?: Record<number, number>;
  invalid: boolean;
  className: string;
  onChange: (next: number | undefined) => void;
  t: Translate;
}

function VehicleTypeSelect({
  activityId,
  supplierId,
  value,
  transportDetailsLoading,
  hasDetail,
  hasError,
  allowedKeys,
  vehicleCountsByType,
  invalid,
  className,
  onChange,
  t,
}: VehicleTypeSelectProps) {
  type State =
    | "selectProviderFirst"
    | "loading"
    | "fetchFailed"
    | "noActiveVehicles"
    | "invalidStale"
    | "ready";

  const hasValue = value !== undefined && value !== null;

  let state: State;
  if (!supplierId) {
    state = "selectProviderFirst";
  } else if (hasError) {
    state = "fetchFailed";
  } else if (!hasDetail && transportDetailsLoading) {
    state = "loading";
  } else if (!allowedKeys || allowedKeys.size === 0) {
    state = "noActiveVehicles";
  } else if (hasValue && !allowedKeys.has(value)) {
    state = "invalidStale";
  } else {
    state = "ready";
  }

  // In noActiveVehicles, keep the select enabled so the user can clear a stale
  // value. Same logic when invalid — user needs to fix it.
  const disabled =
    state === "selectProviderFirst" ||
    state === "loading" ||
    state === "fetchFailed" ||
    (state === "noActiveVehicles" && !hasValue);

  const selectId = `vehicleType-${activityId}`;
  const errorId = `${selectId}-error`;
  const invalidClasses = invalid
    ? " ring-1 ring-rose-500 border-rose-500"
    : "";

  const placeholderByState: Record<State, string> = {
    selectProviderFirst: t(
      "tourInstance.wizard.vehicleType.selectProviderFirst",
      "Select a transport provider first",
    ),
    loading: t(
      "tourInstance.wizard.vehicleType.loadingVehicles",
      "Loading available vehicles…",
    ),
    fetchFailed: t(
      "tourInstance.wizard.vehicleType.fetchFailed",
      "Could not load vehicles. Try again later.",
    ),
    noActiveVehicles: t(
      "tourInstance.wizard.vehicleType.noActiveVehicles",
      "This provider has no active vehicles yet",
    ),
    invalidStale: "",
    ready: "",
  };

  return (
    <>
      <select
        id={selectId}
        className={className + invalidClasses}
        value={hasValue ? String(value) : ""}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}>
        <option value="">{placeholderByState[state]}</option>
        {(state === "ready" || state === "invalidStale") &&
          [...(allowedKeys ?? [])]
            .sort((a, b) => a - b)
            .map((k) => {
              const label = VehicleTypeMap[k];
              const count = vehicleCountsByType?.[k];
              // Render "Bus (3 xe)" when we know how many active vehicles of
              // this type exist; fall back to bare label ("Bus") otherwise.
              // Interpolation is done inline instead of through i18next to
              // stay independent of the mocked `t` signature in unit tests.
              return (
                <option key={k} value={k}>
                  {count && count > 0 ? formatVehicleOptionLabel(label, count, t) : label}
                </option>
              );
            })}
        {/* Render the current stale value so the browser can keep showing it while the user fixes the mismatch. */}
        {hasValue &&
          state !== "ready" &&
          VehicleTypeMap[value!] !== undefined && (
            <option value={String(value)}>{VehicleTypeMap[value!]}</option>
          )}
      </select>
      {invalid && (
        <p
          id={errorId}
          className="mt-0.5 text-[10px] text-rose-600 break-words">
          {t(
            "tourInstance.wizard.vehicleType.invalidForSupplier",
            "This vehicle type is not offered by the selected provider",
          )}
        </p>
      )}
    </>
  );
}

// ─── InstanceDetailsStep ───────────────────────────────────────────────────────
interface InstanceDetailsStepProps {
  form: FormState;
  errors: Record<string, string>;
  inputClassName: string;
  t: Translate;
  updateField: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
  guides: UserInfo[];
  guideConflicts: GuideConflict[];
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
  onUploadThumbnail: (file: File) => Promise<void>;
  onUploadImages: (files: FileList) => Promise<void>;
  uploadingThumbnail: boolean;
  uploadingImages: boolean;
  hotelDetailsBySupplierId: Record<string, HotelProviderDetail>;
  transportDetailsBySupplierId: Record<string, TransportProviderDetail>;
  transportDetailsError: Record<string, true>;
  transportDetailsLoading: boolean;
  allowedVehicleKeysBySupplierId: Record<string, Set<number>>;
  vehicleCountsBySupplierId: Record<string, Record<number, number>>;
  invalidVehicleActivityIds: Set<string>;
  invalidSeatCountActivityIds: Set<string>;
  updateActivityAssignment: (
    activityId: string,
    updates: { supplierId?: string; roomType?: string; accommodationQuantity?: number; vehicleId?: string; requestedVehicleType?: number; requestedSeatCount?: number; requestedVehicleCount?: number },
  ) => void;
  editableItinerary: EditableDay[];
  onUpdateActivity: (
    dayId: string,
    activityId: string,
    updates: Partial<EditableActivity>,
  ) => void;
  onDeleteActivity: (dayId: string, activityId: string) => void;
  onAddActivity: (dayId: string) => void;
  onToggleEditActivity: (dayId: string, activityId: string) => void;
}

function InstanceDetailsStep({
  form,
  errors,
  inputClassName,
  t,
  updateField,
  guides,
  guideConflicts,
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
  onUploadThumbnail,
  onUploadImages,
  uploadingThumbnail,
  uploadingImages,
  hotelDetailsBySupplierId,
  transportDetailsBySupplierId,
  transportDetailsError,
  transportDetailsLoading,
  allowedVehicleKeysBySupplierId,
  vehicleCountsBySupplierId,
  invalidVehicleActivityIds,
  invalidSeatCountActivityIds,
  updateActivityAssignment,
  editableItinerary,
  onUpdateActivity,
  onDeleteActivity,
  onAddActivity,
  onToggleEditActivity,
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
              — {t("tourInstance.form.classificationBasePrice", "Base Price")}:{" "}
              {Number(selectedClassification.basePrice).toLocaleString("vi-VN")}{" "}
              VND
            </span>
          )}
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicateWarning?.exists && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-3">
            <Icon
              icon="heroicons:exclamation-triangle"
              className="size-5 shrink-0 mt-0.5 text-amber-600"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {t(
                  "tourInstance.duplicateWarning.title",
                  "Duplicate tour instance detected",
                )}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {t(
                  "tourInstance.duplicateWarning.message",
                  "An instance for this tour, classification, and start date already exists. Please verify if you want to create a duplicate.",
                )}
              </p>
              {duplicateWarning.existingInstances.map((inst) => (
                <a
                  key={inst.id}
                  href={`/manager/tour-instances/${inst.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1.5 text-sm text-amber-800 hover:text-amber-600 underline underline-offset-2">
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
        defaultOpen>
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
              }>
              <option value="1">{t("tourInstance.private", "Private")}</option>
              <option value="2">{t("tourInstance.public", "Public")}</option>
            </select>
            {errors.instanceType && (
              <p className="text-xs text-red-600">{errors.instanceType}</p>
            )}
            {form.instanceType === "1" ? (
              <p className="text-xs text-stone-400">
                {t(
                  "tourInstance.instanceType.private.hint",
                  "Only visible in the admin dashboard",
                )}
              </p>
            ) : (
              <p className="text-xs text-stone-400">
                {t(
                  "tourInstance.instanceType.public.hint",
                  "Visible to all site users",
                )}
              </p>
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
        defaultOpen>
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
                className={`${inputClassName} cursor-not-allowed bg-stone-100 opacity-70`}
                value={form.endDate}
                readOnly
                disabled
              />
              <p className="text-xs text-stone-400 mt-1">
                {t(
                  "tourInstance.endDateAutoCalculated",
                  "Auto-calculated based on tour duration",
                )}
              </p>
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
        defaultOpen={false}>
        <div className="space-y-3">
          {selectedGuide && (
            <div className="flex flex-wrap gap-2">
              <ManagerChip
                user={selectedGuide}
                onRemove={() => updateField("guideUserIds", [])}
              />
            </div>
          )}

          {/* Conflict warning for selected guide */}
          {selectedGuide &&
            guideConflicts.some((c) => c.guideId === selectedGuide.id) && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:exclamation-triangle"
                    className="size-4 mt-0.5 shrink-0 text-amber-600"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-900">
                      {t(
                        "tourInstance.guideConflict.title",
                        "Guide has scheduling conflicts!",
                      )}
                    </p>
                    {guideConflicts
                      .find((c) => c.guideId === selectedGuide.id)
                      ?.conflictingInstances.map((inst) => (
                        <p
                          key={inst.instanceId}
                          className="mt-1 text-xs text-amber-700">
                          • <strong>{inst.title}</strong> (
                          {new Date(inst.startDate).toLocaleDateString("vi-VN")}{" "}
                          → {new Date(inst.endDate).toLocaleDateString("vi-VN")}
                          )
                          <span className="ml-1 text-amber-600">
                            ({inst.status})
                          </span>
                        </p>
                      ))}
                  </div>
                </div>
              </div>
            )}

          <select
            className={inputClassName}
            value={selectedGuide?.id ?? ""}
            onChange={(e) => {
              const guideId = e.target.value;
              updateField("guideUserIds", guideId ? [guideId] : []);
            }}>
            <option value="">
              {t(
                "tourInstance.form.selectGuideOptional",
                "Select guide (optional)",
              )}
            </option>
            {guides.map((guide) => {
              const conflict = guideConflicts.find(
                (c) => c.guideId === guide.id,
              );
              return (
                <option key={guide.id} value={guide.id}>
                  {guide.fullName || guide.username || guide.email}
                  {conflict ? " ⚠️ (Đang có tour)" : ""}
                </option>
              );
            })}
          </select>
        </div>
      </CollapsibleSection>

      {/* Optional Services */}
      <CollapsibleSection
        title={t("tourInstance.wizard.section.services", "Optional Services")}
        defaultOpen={false}>
        <div className="space-y-3">
          {availableServices.length === 0 ? (
            <p className="text-xs text-stone-500">
              {t(
                "tourInstance.form.noServicesAvailable",
                "No services available for this tour.",
              )}
            </p>
          ) : (
            <div className="space-y-2">
              {availableServices.map((service) => {
                const checked = form.includedServices.includes(service);
                return (
                  <label
                    key={service}
                    className="flex items-center gap-2 text-sm text-stone-700">
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

      {/* Media */}
      <CollapsibleSection
        title={t("tourInstance.wizard.section.media", "Media")}
        defaultOpen={form.thumbnailUrl.length > 0 || form.imageUrls.length > 0}>
        <div className="space-y-4">
          {/* Thumbnail */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              {t("tourInstance.form.thumbnail", "Thumbnail")}
            </label>
            <div className="flex items-start gap-4">
              {form.thumbnailUrl ? (
                <div className="relative group rounded-xl overflow-hidden border border-stone-200 w-32 h-32 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/placeholder.svg";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => updateField("thumbnailUrl", "")}
                    className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    title={t("common.remove", "Remove")}>
                    <Icon icon="heroicons:x-mark" className="size-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 cursor-pointer hover:bg-stone-100 hover:border-orange-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadThumbnail(file);
                      e.target.value = "";
                    }}
                  />
                  {uploadingThumbnail ? (
                    <Icon
                      icon="heroicons:arrow-path"
                      className="size-6 text-orange-500 animate-spin"
                    />
                  ) : (
                    <>
                      <Icon
                        icon="heroicons:photo"
                        className="size-6 text-stone-400"
                      />
                      <span className="mt-1 text-[10px] font-medium text-stone-500">
                        {t("tourInstance.form.uploadThumbnail", "Upload")}
                      </span>
                    </>
                  )}
                </label>
              )}
              {form.thumbnailUrl && (
                <label className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 cursor-pointer hover:bg-stone-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadThumbnail(file);
                      e.target.value = "";
                    }}
                  />
                  <Icon
                    icon="heroicons:arrow-path"
                    className={`size-3.5 ${uploadingThumbnail ? "animate-spin" : ""}`}
                  />
                  {t("tourInstance.form.changeThumbnail", "Change")}
                </label>
              )}
            </div>
          </div>

          {/* Gallery images */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              {t("tourInstance.form.images", "Gallery Images")}
            </label>
            <p className="text-xs text-stone-500">
              {t(
                "tourInstance.form.imagesHint",
                "Upload images from your computer for this tour instance.",
              )}
            </p>

            {/* Existing image previews */}
            {form.imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {form.imageUrls.map((url, index) => (
                  <div
                    key={`img-${index}`}
                    className="relative group rounded-xl overflow-hidden border border-stone-200 w-24 h-24 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/placeholder.svg";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      title={t("common.remove", "Remove")}>
                      <Icon icon="heroicons:x-mark" className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-orange-300 px-4 py-3 text-sm font-medium text-orange-600 cursor-pointer hover:bg-orange-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onUploadImages(e.target.files);
                  }
                  e.target.value = "";
                }}
              />
              {uploadingImages ? (
                <Icon
                  icon="heroicons:arrow-path"
                  className="size-4 animate-spin"
                />
              ) : (
                <Icon icon="heroicons:cloud-arrow-up" className="size-4" />
              )}
              {uploadingImages
                ? t("tourInstance.form.uploading", "Uploading...")
                : t("tourInstance.form.uploadImages", "Upload images")}
            </label>
          </div>
        </div>
      </CollapsibleSection>

      {/* Itinerary Preview — Editable */}
      {editableItinerary.length > 0 && (
        <CollapsibleSection
          title={t(
            "tourInstance.wizard.section.itineraryPreview",
            "Itinerary Preview",
          )}
          defaultOpen={false}>
          <div className="space-y-4">
            <p className="text-xs text-stone-500">
              {t(
                "tourInstance.wizard.section.itineraryEditHint",
                "You can add, edit, or remove activities for each day.",
              )}
            </p>
            {editableItinerary.map((day) => (
              <div
                key={day.id}
                className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                    {day.dayNumber}
                  </span>
                  <h4 className="text-sm font-semibold text-stone-900">
                    {day.title}
                  </h4>
                </div>
                {day.description && (
                  <p className="text-xs text-stone-600 ml-8 mb-3">
                    {day.description}
                  </p>
                )}
                {day.activities.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {day.activities.map((activity) => (
                      <div key={activity.id} className="flex flex-col gap-2">
                        {activity._editing ? (
                          /* ── Inline Edit Form ── */
                          <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-medium text-stone-500 uppercase">
                                  {t("tourInstance.wizard.activity.title", "Title")}
                                </label>
                                <input
                                  className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                  value={activity.title}
                                  onChange={(e) =>
                                    onUpdateActivity(day.id, activity.id, {
                                      title: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-stone-500 uppercase">
                                  {t("tourInstance.wizard.activity.type", "Type")}
                                </label>
                                <select
                                  className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                  value={activity.activityType}
                                  onChange={(e) => {
                                    const newType = e.target.value;
                                    onUpdateActivity(day.id, activity.id, {
                                      activityType: newType,
                                    });
                                    // Reset supplier assignment data when activity type changes
                                    if (newType !== activity.activityType) {
                                      updateActivityAssignment(activity.id, {
                                        supplierId: undefined,
                                        roomType: undefined,
                                        vehicleId: undefined,
                                      });
                                    }
                                  }}>
                                  {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {t(opt.key, opt.value)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* ── Dynamic Activity Resource Assignment (integrated 1.2) ── */}
                            {activity.activityType === "Accommodation" && (
                              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
                                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                                  {t("tourInstance.wizard.supplierAssignment", "Supplier Assignment")}
                                </p>
                                <div className="flex flex-col gap-2"> {/* 1.3 Stack layout */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-stone-500 uppercase">
                                      {t("tourInstance.wizard.hotelSupplier", "Hotel")}
                                    </label>
                                    <select
                                      className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                      value={
                                        form.activityAssignments[activity.id]
                                          ?.supplierId ?? ""
                                      }
                                      onChange={(e) => {
                                        const nextSupplierId = e.target.value || undefined;
                                        const currentSupplierId =
                                          form.activityAssignments[activity.id]
                                            ?.supplierId;

                                        updateActivityAssignment(activity.id, {
                                          supplierId: nextSupplierId,
                                          roomType:
                                            currentSupplierId !== nextSupplierId
                                              ? undefined
                                              : form.activityAssignments[activity.id]
                                                  ?.roomType,
                                        });
                                      }}>
                                      <option value="">
                                        {t(
                                          "tourInstance.wizard.selectHotelSupplier",
                                          "-- Select hotel --",
                                        )}
                                      </option>
                                      {hotelProviders.map((hotel) => (
                                        <option key={hotel.id} value={hotel.id}>
                                          {hotel.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {getProviderRoomOptions(
                                    hotelDetailsBySupplierId[
                                      form.activityAssignments[activity.id]
                                        ?.supplierId ?? ""
                                    ],
                                  ).length > 0 && (
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-medium text-stone-500 uppercase">
                                        {t("tourInstance.wizard.roomType", "Room")}
                                      </label>
                                      {(() => {
                                        const roomOptions = getProviderRoomOptions(
                                          hotelDetailsBySupplierId[
                                            form.activityAssignments[activity.id]
                                              ?.supplierId ?? ""
                                          ],
                                        );

                                        return (
                                          <select
                                            className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                            value={
                                              form.activityAssignments[activity.id]
                                                ?.roomType ?? ""
                                            }
                                            onChange={(e) => {
                                              const val = e.target.value || undefined;
                                              updateActivityAssignment(activity.id, {
                                                roomType: val,
                                              });
                                            }}>
                                            <option value="">
                                              {t(
                                                "tourInstance.wizard.selectRoomType",
                                                "-- Select room --",
                                              )}
                                            </option>
                                            {roomOptions.map((roomOption) => {
                                              return (
                                                <option
                                                  key={roomOption.roomType}
                                                  value={roomOption.roomType}>
                                                  {roomOption.label} (
                                                  {roomOption.totalRooms})
                                                </option>
                                              );
                                            })}
                                          </select>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {activity.activityType === "Transportation" && (
                              <div className="space-y-2 rounded-lg border border-cyan-200 bg-cyan-50/60 p-2.5">
                                <p className="text-[10px] font-semibold text-cyan-700 uppercase tracking-wider">
                                  {t("tourInstance.wizard.transportPlan", "Transport Plan")}
                                </p>

                                <div className="space-y-2">
                                  <div>
                                    <label className="text-[10px] font-medium text-stone-500 uppercase">
                                      {t("tourInstance.wizard.transportProvider", "Transport Provider")}
                                    </label>
                                    <select
                                      className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                      value={form.activityAssignments[activity.id]?.supplierId ?? ""}
                                      onChange={(e) => {
                                        updateActivityAssignment(activity.id, {
                                          supplierId: e.target.value || undefined,
                                        });
                                      }}>
                                      <option value="">
                                        {t("tourInstance.wizard.selectSupplierOptional", "-- Select Supplier (Optional) --")}
                                      </option>
                                      {transportProviders.map((tp) => (
                                        <option key={tp.id} value={tp.id}>{tp.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <div className="flex items-baseline justify-between gap-2">
                                        <label
                                          htmlFor={`vehicleType-${activity.id}`}
                                          className="text-[10px] font-medium text-stone-500 uppercase">
                                          {t("tourInstance.wizard.vehicleTypeLabel", "Vehicle Type")}
                                        </label>
                                        {(() => {
                                          const supId = form.activityAssignments[activity.id]?.supplierId;
                                          if (!supId) return null;
                                          const counts = vehicleCountsBySupplierId[supId];
                                          const total = sumVehicleCounts(counts);
                                          if (total <= 0) return null;
                                          return (
                                            <span className="text-[10px] font-medium text-cyan-700">
                                              {formatVehiclesAvailableBadge(total, t)}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      <VehicleTypeSelect
                                        activityId={activity.id}
                                        supplierId={form.activityAssignments[activity.id]?.supplierId}
                                        value={form.activityAssignments[activity.id]?.requestedVehicleType}
                                        transportDetailsLoading={transportDetailsLoading}
                                        hasDetail={
                                          !!form.activityAssignments[activity.id]?.supplierId &&
                                          !!transportDetailsBySupplierId[
                                            form.activityAssignments[activity.id]!.supplierId!
                                          ]
                                        }
                                        hasError={
                                          !!form.activityAssignments[activity.id]?.supplierId &&
                                          !!transportDetailsError[
                                            form.activityAssignments[activity.id]!.supplierId!
                                          ]
                                        }
                                        allowedKeys={
                                          form.activityAssignments[activity.id]?.supplierId
                                            ? allowedVehicleKeysBySupplierId[
                                                form.activityAssignments[activity.id]!.supplierId!
                                              ]
                                            : undefined
                                        }
                                        vehicleCountsByType={
                                          form.activityAssignments[activity.id]?.supplierId
                                            ? vehicleCountsBySupplierId[
                                                form.activityAssignments[activity.id]!.supplierId!
                                              ]
                                            : undefined
                                        }
                                        invalid={invalidVehicleActivityIds.has(activity.id)}
                                        className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        onChange={(next) =>
                                          updateActivityAssignment(activity.id, {
                                            requestedVehicleType: next,
                                          })
                                        }
                                        t={t}
                                      />
                                    </div>
                                    <div>
                                      <label
                                        htmlFor={`seatCount-${activity.id}`}
                                        className="text-[10px] font-medium text-stone-500 uppercase">
                                        {t("tourInstance.wizard.seatCount", "Seat Count")}
                                      </label>
                                      <input
                                        id={`seatCount-${activity.id}`}
                                        type="number"
                                        min={1}
                                        className={`w-full rounded border px-2 py-1 text-xs outline-none ${
                                          invalidSeatCountActivityIds.has(activity.id)
                                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                                            : "border-stone-300 focus:ring-orange-500 focus:border-orange-500"
                                        }`}
                                        value={form.activityAssignments[activity.id]?.requestedSeatCount ?? ""}
                                        onChange={(e) => {
                                          updateActivityAssignment(activity.id, {
                                            requestedSeatCount: e.target.value ? Number(e.target.value) : undefined,
                                          });
                                        }}
                                        placeholder={t("common.optional", "Optional")}
                                      />
                                      {invalidSeatCountActivityIds.has(activity.id) && (
                                        <p className="mt-1 text-[10px] text-red-600">
                                          {t(
                                            "tourInstance.transport.errors.seatCountBelowCapacity",
                                            "Requested seat count cannot be less than the tour's max participation.",
                                          )}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-medium text-stone-500 uppercase">
                                        {t("tourInstance.wizard.vehicleCount", "Vehicle Count")}
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        value={form.activityAssignments[activity.id]?.requestedVehicleCount ?? ""}
                                        onChange={(e) => {
                                          updateActivityAssignment(activity.id, {
                                            requestedVehicleCount: e.target.value ? Number(e.target.value) : undefined,
                                          });
                                        }}
                                        placeholder={t("common.optional", "Optional")}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-medium text-stone-500 uppercase">
                                  {t("tourInstance.wizard.activity.start", "Start")}
                                </label>
                                <input
                                  type="time"
                                  className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                  value={activity.startTime?.slice(0, 5) ?? ""}
                                  onChange={(e) =>
                                    onUpdateActivity(day.id, activity.id, {
                                      startTime: e.target.value
                                        ? e.target.value + ":00"
                                        : null,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-stone-500 uppercase">
                                  {t("tourInstance.wizard.activity.end", "End")}
                                </label>
                                <input
                                  type="time"
                                  className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                  value={activity.endTime?.slice(0, 5) ?? ""}
                                  onChange={(e) =>
                                    onUpdateActivity(day.id, activity.id, {
                                      endTime: e.target.value
                                        ? e.target.value + ":00"
                                        : null,
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-stone-500 uppercase">
                                {t("tourInstance.wizard.activity.description", "Description")}
                              </label>
                              <input
                                className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                value={activity.description ?? ""}
                                onChange={(e) =>
                                  onUpdateActivity(day.id, activity.id, {
                                    description: e.target.value || null,
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-stone-600">
                                <input
                                  type="checkbox"
                                  checked={activity.isOptional}
                                  onChange={(e) =>
                                    onUpdateActivity(day.id, activity.id, {
                                      isOptional: e.target.checked,
                                    })
                                  }
                                  className="rounded border-stone-300 text-orange-500 focus:ring-orange-500"
                                />
                                {t("tourInstance.optional", "Optional")}
                              </label>
                              <div className="flex-1" />
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleEditActivity(day.id, activity.id)
                                }
                                className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600">
                                {t("common.done", "Done")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── Read-only Row ── */
                          <div className="flex flex-col gap-2 group">
                            <div className="flex items-center gap-2 text-xs text-stone-700">
                              <span className="w-4 text-center text-stone-400">
                                {activity.order}.
                              </span>
                              <span className="font-medium">
                                {activity.title}
                              </span>
                              <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] uppercase text-stone-600 font-semibold tracking-wider">
                                {activity.activityType}
                              </span>
                              {activity.startTime && (
                                <span className="text-stone-400">
                                  ({activity.startTime}
                                  {activity.endTime
                                    ? ` - ${activity.endTime}`
                                    : ""}
                                  )
                                </span>
                              )}
                              {activity.isOptional && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 text-[10px] font-medium">
                                  {t("tourInstance.optional", "Optional")}
                                </span>
                              )}
                              {/* Edit / Delete buttons — always visible (was hover-only) */}
                              <span className="ml-auto flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onToggleEditActivity(day.id, activity.id)
                                  }
                                  className="rounded p-1 text-stone-400 hover:text-orange-600 hover:bg-orange-50"
                                  title={t("common.edit", "Edit")}>
                                  <Icon
                                    icon="heroicons:pencil"
                                    className="size-3.5"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onDeleteActivity(day.id, activity.id)
                                  }
                                  className="rounded p-1 text-stone-400 hover:text-red-600 hover:bg-red-50"
                                  title={t("common.delete", "Delete")}>
                                  <Icon
                                    icon="heroicons:trash"
                                    className="size-3.5"
                                  />
                                </button>
                              </span>
                            </div>

                            {/* Always-visible supplier picker for Accommodation */}
                            {activity.activityType === "Accommodation" && (
                              <div className="ml-6 space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
                                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                                  {t("tourInstance.wizard.supplierAssignment", "Supplier Assignment")}
                                </p>
                                <div className="flex flex-col gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-stone-500 uppercase">
                                      {t("tourInstance.wizard.hotelSupplier", "Hotel")}
                                    </label>
                                    <select
                                      className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                      value={
                                        form.activityAssignments[activity.id]
                                          ?.supplierId ?? ""
                                      }
                                      onChange={(e) => {
                                        const nextSupplierId = e.target.value || undefined;
                                        const currentSupplierId =
                                          form.activityAssignments[activity.id]
                                            ?.supplierId;

                                        updateActivityAssignment(activity.id, {
                                          supplierId: nextSupplierId,
                                          roomType:
                                            currentSupplierId !== nextSupplierId
                                              ? undefined
                                              : form.activityAssignments[activity.id]
                                                  ?.roomType,
                                        });
                                      }}>
                                      <option value="">
                                        {t(
                                          "tourInstance.wizard.selectHotelSupplier",
                                          "-- Select hotel --",
                                        )}
                                      </option>
                                      {hotelProviders.map((hotel) => (
                                        <option key={hotel.id} value={hotel.id}>
                                          {hotel.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {getProviderRoomOptions(
                                    hotelDetailsBySupplierId[
                                      form.activityAssignments[activity.id]
                                        ?.supplierId ?? ""
                                    ],
                                  ).length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-stone-500 uppercase">
                                          {t("tourInstance.wizard.roomType", "Room")}
                                        </label>
                                        {(() => {
                                          const roomOptions = getProviderRoomOptions(
                                            hotelDetailsBySupplierId[
                                              form.activityAssignments[activity.id]
                                                ?.supplierId ?? ""
                                            ],
                                          );

                                          return (
                                            <select
                                              className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                              value={
                                                form.activityAssignments[activity.id]
                                                  ?.roomType ?? ""
                                              }
                                              onChange={(e) => {
                                                const val = e.target.value || undefined;
                                                updateActivityAssignment(activity.id, {
                                                  roomType: val,
                                                });
                                              }}>
                                              <option value="">
                                                {t(
                                                  "tourInstance.wizard.selectRoomType",
                                                  "-- Select room --",
                                                )}
                                              </option>
                                              {roomOptions.map((roomOption) => (
                                                <option
                                                  key={roomOption.roomType}
                                                  value={roomOption.roomType}>
                                                  {roomOption.label} (
                                                  {roomOption.totalRooms})
                                                </option>
                                              ))}
                                            </select>
                                          );
                                        })()}
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-stone-500 uppercase">
                                          {t("tourInstance.wizard.roomQuantity", "Số phòng")}
                                        </label>
                                        <input
                                          type="number"
                                          min={1}
                                          className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                          value={
                                            form.activityAssignments[activity.id]
                                              ?.accommodationQuantity ?? ""
                                          }
                                          onChange={(e) => {
                                            updateActivityAssignment(activity.id, {
                                              accommodationQuantity: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                            });
                                          }}
                                          placeholder={t("common.optional", "Optional")}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Always-visible supplier picker for Transportation */}
                            {activity.activityType === "Transportation" && (
                              <div className="ml-6 space-y-2 rounded-lg border border-cyan-200 bg-cyan-50/60 p-2.5">
                                <p className="text-[10px] font-semibold text-cyan-700 uppercase tracking-wider">
                                  {t("tourInstance.wizard.transportPlan", "Transport Plan")}
                                </p>
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-[10px] font-medium text-stone-500 uppercase">
                                      {t("tourInstance.wizard.transportProvider", "Transport Provider")}
                                    </label>
                                    <select
                                      className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                      value={form.activityAssignments[activity.id]?.supplierId ?? ""}
                                      onChange={(e) => {
                                        updateActivityAssignment(activity.id, {
                                          supplierId: e.target.value || undefined,
                                        });
                                      }}>
                                      <option value="">
                                        {t("tourInstance.wizard.selectSupplierOptional", "-- Select Supplier (Optional) --")}
                                      </option>
                                      {transportProviders.map((tp) => (
                                        <option key={tp.id} value={tp.id}>{tp.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <div className="flex items-baseline justify-between gap-2">
                                        <label
                                          htmlFor={`vehicleType-${activity.id}`}
                                          className="text-[10px] font-medium text-stone-500 uppercase">
                                          {t("tourInstance.wizard.vehicleTypeLabel", "Vehicle Type")}
                                        </label>
                                        {(() => {
                                          const supId = form.activityAssignments[activity.id]?.supplierId;
                                          if (!supId) return null;
                                          const counts = vehicleCountsBySupplierId[supId];
                                          const total = sumVehicleCounts(counts);
                                          if (total <= 0) return null;
                                          return (
                                            <span className="text-[10px] font-medium text-cyan-700">
                                              {formatVehiclesAvailableBadge(total, t)}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      <VehicleTypeSelect
                                        activityId={activity.id}
                                        supplierId={form.activityAssignments[activity.id]?.supplierId}
                                        value={form.activityAssignments[activity.id]?.requestedVehicleType}
                                        transportDetailsLoading={transportDetailsLoading}
                                        hasDetail={
                                          !!form.activityAssignments[activity.id]?.supplierId &&
                                          !!transportDetailsBySupplierId[
                                            form.activityAssignments[activity.id]!.supplierId!
                                          ]
                                        }
                                        hasError={
                                          !!form.activityAssignments[activity.id]?.supplierId &&
                                          !!transportDetailsError[
                                            form.activityAssignments[activity.id]!.supplierId!
                                          ]
                                        }
                                        allowedKeys={
                                          form.activityAssignments[activity.id]?.supplierId
                                            ? allowedVehicleKeysBySupplierId[
                                                form.activityAssignments[activity.id]!.supplierId!
                                              ]
                                            : undefined
                                        }
                                        vehicleCountsByType={
                                          form.activityAssignments[activity.id]?.supplierId
                                            ? vehicleCountsBySupplierId[
                                                form.activityAssignments[activity.id]!.supplierId!
                                              ]
                                            : undefined
                                        }
                                        invalid={invalidVehicleActivityIds.has(activity.id)}
                                        className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        onChange={(next) =>
                                          updateActivityAssignment(activity.id, {
                                            requestedVehicleType: next,
                                          })
                                        }
                                        t={t}
                                      />
                                    </div>
                                    <div>
                                      <label
                                        htmlFor={`seatCount-${activity.id}`}
                                        className="text-[10px] font-medium text-stone-500 uppercase">
                                        {t("tourInstance.wizard.seatCount", "Seat Count")}
                                      </label>
                                      <input
                                        id={`seatCount-${activity.id}`}
                                        type="number"
                                        min={1}
                                        className={`w-full rounded border bg-white px-2 py-1 text-xs outline-none ${
                                          invalidSeatCountActivityIds.has(activity.id)
                                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                                            : "border-stone-300 focus:ring-orange-500 focus:border-orange-500"
                                        }`}
                                        value={form.activityAssignments[activity.id]?.requestedSeatCount ?? ""}
                                        onChange={(e) => {
                                          updateActivityAssignment(activity.id, {
                                            requestedSeatCount: e.target.value ? Number(e.target.value) : undefined,
                                          });
                                        }}
                                        placeholder={t("common.optional", "Optional")}
                                      />
                                      {invalidSeatCountActivityIds.has(activity.id) && (
                                        <p className="mt-1 text-[10px] text-red-600">
                                          {t(
                                            "tourInstance.transport.errors.seatCountBelowCapacity",
                                            "Requested seat count cannot be less than the tour's max participation.",
                                          )}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-medium text-stone-500 uppercase">
                                        {t("tourInstance.wizard.vehicleCount", "Vehicle Count")}
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        value={form.activityAssignments[activity.id]?.requestedVehicleCount ?? ""}
                                        onChange={(e) => {
                                          updateActivityAssignment(activity.id, {
                                            requestedVehicleCount: e.target.value ? Number(e.target.value) : undefined,
                                          });
                                        }}
                                        placeholder={t("common.optional", "Optional")}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Activity Button */}
                <button
                  type="button"
                  onClick={() => onAddActivity(day.id)}
                  className="mt-3 ml-8 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors">
                  <Icon icon="heroicons:plus" className="size-3.5" />
                  {t("tourInstance.wizard.addActivity", "Add activity")}
                </button>
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
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
          <Icon icon="heroicons:arrow-left" className="size-4" />
          {t("tourInstance.wizard.previous", "Previous")}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled-opacity-60">
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
    (key, fallback, options) =>
      mounted ? t(key, fallback ?? key, options) : (fallback ?? key),
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
  const [guideConflicts, setGuideConflicts] = useState<GuideConflict[]>([]);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] =
    useState<CheckDuplicateResult | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Providers
  const [hotelProviders, setHotelProviders] = useState<SupplierItem[]>([]);
  const [transportProviders, setTransportProviders] = useState<SupplierItem[]>(
    [],
  );
  const [isDirty, setIsDirty] = useState(false);
  const [prefillTourRequest, setPrefillTourRequest] =
    useState<TourRequestDetailDto | null>(null);

  const [hotelDetailsBySupplierId, setHotelDetailsBySupplierId] = useState<
    Record<string, HotelProviderDetail>
  >({});

  const [transportDetailsBySupplierId, setTransportDetailsBySupplierId] =
    useState<Record<string, TransportProviderDetail>>({});
  const [transportDetailsError, setTransportDetailsError] = useState<
    Record<string, true>
  >({});
  const [transportDetailsLoading, setTransportDetailsLoading] = useState(false);

  // Editable itinerary — mutable copy of classification plans
  const [editableItinerary, setEditableItinerary] = useState<EditableDay[]>([]);

  // Image upload state
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const effectiveTourRequestId =
    prefillTourRequestId ?? urlTourRequestId ?? null;

  const fetchTourRequestDetail = useCallback(async (id: string) => {
    try {
      const result = await tourRequestService.getTourRequestDetail(id, {
        admin: true,
      });
      if (result) {
        setPrefillTourRequest(result);
      }
    } catch (error: unknown) {
      const handledError = handleApiError(error);
      console.error(
        "Failed to fetch tour request detail:",
        handledError.message,
      );
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
        result = await tourService.getMyTours(
          undefined,
          "1",
          "all",
          "all",
          1,
          100,
        );
      } catch (err) {
        // Fallback for admins/managers if getMyTours fails
        result = await tourService.getAdminTourManagement(
          undefined,
          "1",
          "all",
          "all",
          1,
          100,
        );
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

  const fetchProviders = useCallback(async () => {
    setTransportDetailsLoading(true);
    try {
      const [hotels, transports] = await Promise.all([
        supplierService.getSuppliers("2"), // SupplierType.Accommodation = 2
        supplierService.getSuppliers("1"), // SupplierType.Transport = 1
      ]);

      const normalizedHotels = Array.isArray(hotels) ? hotels : [];
      const normalizedTransports = Array.isArray(transports) ? transports : [];
      setHotelProviders(normalizedHotels);
      setTransportProviders(normalizedTransports);

      const [hotelDetailResults, transportDetailResults] = await Promise.all([
        Promise.allSettled(
          normalizedHotels.map(async (hotel) => ({
            supplierId: hotel.id,
            detail: await adminService.getHotelProviderDetail(hotel.id),
          })),
        ),
        Promise.allSettled(
          normalizedTransports.map(async (tp) => ({
            supplierId: tp.id,
            detail: await adminService.getTransportProviderDetail(tp.id),
          })),
        ),
      ]);

      const nextHotelDetails: Record<string, HotelProviderDetail> = {};
      hotelDetailResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value.detail) {
          nextHotelDetails[result.value.supplierId] = result.value.detail;
        }
      });
      setHotelDetailsBySupplierId(nextHotelDetails);

      const nextTransportDetails: Record<string, TransportProviderDetail> = {};
      const nextTransportErrors: Record<string, true> = {};
      transportDetailResults.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value.detail) {
          nextTransportDetails[result.value.supplierId] = {
            ...result.value.detail,
            vehicles: result.value.detail.vehicles ?? [],
          };
        } else {
          const supplierId = normalizedTransports[idx]?.id;
          if (supplierId) nextTransportErrors[supplierId] = true;
          if (result.status === "rejected") {
            const handledError = handleApiError(result.reason);
            console.error(
              "Failed to fetch transport provider detail:",
              handledError.message,
            );
          }
        }
      });
      setTransportDetailsBySupplierId(nextTransportDetails);
      setTransportDetailsError(nextTransportErrors);
    } catch (error) {
      handleApiError(error);
    } finally {
      setTransportDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tourDetail) {
      fetchProviders();
    } else {
      setHotelProviders([]);
      setHotelDetailsBySupplierId({});
      setTransportProviders([]);
      setTransportDetailsBySupplierId({});
      setTransportDetailsError({});
      setTransportDetailsLoading(false);
    }
  }, [fetchProviders, tourDetail]);

  // Derive { supplierId -> { vehicleTypeKey -> count } } and its Set<key> projection
  // from preloaded transport details. Memoised so we don't re-filter
  // O(activities × vehicles) on every render.
  const vehicleCountsBySupplierId = useMemo(
    () => buildVehicleCountsBySupplierId(transportDetailsBySupplierId),
    [transportDetailsBySupplierId],
  );
  const allowedVehicleKeysBySupplierId = useMemo(() => {
    const out: Record<string, Set<number>> = {};
    for (const [supplierId, counts] of Object.entries(vehicleCountsBySupplierId)) {
      out[supplierId] = new Set(Object.keys(counts).map(Number));
    }
    return out;
  }, [vehicleCountsBySupplierId]);

  const invalidVehicleActivityIds = useMemo(
    () =>
      new Set(
        validateTransportActivities(
          form.activityAssignments,
          selectedClassification,
          allowedVehicleKeysBySupplierId,
        ),
      ),
    [
      form.activityAssignments,
      selectedClassification,
      allowedVehicleKeysBySupplierId,
    ],
  );

  const invalidSeatCountActivityIds = useMemo(
    () =>
      new Set(
        validateTransportSeatCounts(
          form.activityAssignments,
          selectedClassification,
          Number(form.maxParticipation),
        ),
      ),
    [
      form.activityAssignments,
      selectedClassification,
      form.maxParticipation,
    ],
  );

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

  useEffect(() => {
    fetchTours();
    fetchGuides();
  }, [fetchTours, fetchGuides]);

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
      setForm((current) => ({
        ...current,
        classificationId: "",
        includedServices: [],
      }));
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
              next.imageUrls =
                (detail as any).images
                  ?.map((i: any) => i.publicURL)
                  .filter(Boolean)
                  .slice(0, 10) ?? [];
            }
          }

          return next;
        });
      } catch (error: unknown) {
        const handledError = handleApiError(error);
        console.error("Failed to fetch tour detail:", handledError.message);
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

  // Auto-calculate endDate from startDate + classification's numberOfDay
  useEffect(() => {
    if (!form.startDate || !selectedClassification) return;

    // Fallback to 1 if numberOfDay missing or 0
    const duration =
      selectedClassification.numberOfDay &&
      selectedClassification.numberOfDay > 0
        ? selectedClassification.numberOfDay
        : 1;

    // Subtract 1 day because a 3-day tour starting on the 10th ends on the 12th
    const endDate = dayjs(form.startDate)
      .add(duration - 1, "day")
      .format("YYYY-MM-DD");

    if (form.endDate !== endDate) {
      setForm((current) => ({ ...current, endDate }));
    }
  }, [form.startDate, selectedClassification]);

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

  // Check guide availability when dates change
  useEffect(() => {
    if (
      currentStep !== INSTANCE_DETAILS_STEP ||
      !form.startDate ||
      !form.endDate ||
      guides.length === 0 ||
      form.startDate > form.endDate
    ) {
      setGuideConflicts([]);
      return;
    }

    let cancelled = false;
    const check = async () => {
      try {
        const guideIds = guides.map((g) => g.id);
        const result = await tourInstanceService.checkGuideAvailability(
          guideIds,
          form.startDate,
          form.endDate,
        );
        if (!cancelled && result) {
          setGuideConflicts(result.conflicts ?? []);
        }
      } catch {
        // Non-critical — silently ignore
        if (!cancelled) setGuideConflicts([]);
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [form.startDate, form.endDate, currentStep, guides]);

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
    setForm((current) => {
      return { ...current, [field]: value };
    });
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

  const updateActivityAssignment = (
    activityId: string,
    updates: { supplierId?: string; roomType?: string; accommodationQuantity?: number; vehicleId?: string; requestedVehicleType?: number; requestedSeatCount?: number; requestedVehicleCount?: number },
  ) => {
    setForm((prev) => {
      const current = prev.activityAssignments[activityId] || {};
      return {
        ...prev,
        activityAssignments: {
          ...prev.activityAssignments,
          [activityId]: { ...current, ...updates },
        },
      };
    });
    setIsDirty(true);
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
    setForm((current) => ({
      ...current,
      imageUrls: [...current.imageUrls, ""],
    }));
  };

  const removeImageUrl = (index: number) => {
    setForm((current) => ({
      ...current,
      imageUrls: current.imageUrls.filter((_, i) => i !== index),
    }));
  };

  // ── Editable Itinerary handlers ────────────────────────────────────────

  /** Initialise or reset editable itinerary when classification changes */
  useEffect(() => {
    if (!selectedClassification?.plans?.length) {
      setEditableItinerary([]);
      return;
    }
    setEditableItinerary(
      selectedClassification.plans.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        title: day.title,
        description: day.description,
        activities: (day.activities ?? []).map((a) => ({
          id: a.id,
          order: a.order,
          activityType: a.activityType,
          title: a.title,
          description: a.description,
          startTime: a.startTime,
          endTime: a.endTime,
          isOptional: a.isOptional,
        })),
      })),
    );
  }, [selectedClassification]);

  const handleUpdateActivity = useCallback(
    (dayId: string, activityId: string, updates: Partial<EditableActivity>) => {
      setEditableItinerary((prev) =>
        prev.map((day) =>
          day.id !== dayId
            ? day
            : {
                ...day,
                activities: day.activities.map((a) =>
                  a.id !== activityId ? a : { ...a, ...updates },
                ),
              },
        ),
      );
      setIsDirty(true);
    },
    [],
  );

  const handleDeleteActivity = useCallback(
    (dayId: string, activityId: string) => {
      setEditableItinerary((prev) =>
        prev.map((day) =>
          day.id !== dayId
            ? day
            : {
                ...day,
                activities: day.activities
                  .filter((a) => a.id !== activityId)
                  .map((a, i) => ({ ...a, order: i + 1 })),
              },
        ),
      );
      setIsDirty(true);
    },
    [],
  );

  const handleAddActivity = useCallback((dayId: string) => {
    setEditableItinerary((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        const newOrder = day.activities.length + 1;
        const newActivity: EditableActivity = {
          id: crypto.randomUUID(),
          order: newOrder,
          activityType: "Sightseeing",
          title: "",
          description: null,
          startTime: null,
          endTime: null,
          isOptional: false,
          _editing: true,
        };
        return { ...day, activities: [...day.activities, newActivity] };
      }),
    );
    setIsDirty(true);
  }, []);

  const handleToggleEditActivity = useCallback(
    (dayId: string, activityId: string) => {
      setEditableItinerary((prev) =>
        prev.map((day) =>
          day.id !== dayId
            ? day
            : {
                ...day,
                activities: day.activities.map((a) =>
                  a.id !== activityId ? a : { ...a, _editing: !a._editing },
                ),
              },
        ),
      );
    },
    [],
  );

  const handleSubmit = async () => {
    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!form.title.trim())
      newErrors.title = t(
        "tourInstance.validation.titleRequired",
        "Title is required",
      );
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
      if (end < start) {
        newErrors.endDate = t(
          "tourInstance.validation.endDateAfterStart",
          "End date must be on or after start date",
        );
      }
    }
    if (!form.maxParticipation || Number(form.maxParticipation) <= 0)
      newErrors.maxParticipation = t(
        "tourInstance.validation.maxParticipantsRequired",
        "Maximum participants must be greater than 0",
      );
    if (
      form.basePrice === "" ||
      form.basePrice === null ||
      form.basePrice === undefined
    )
      newErrors.basePrice = t(
        "tourInstance.validation.basePriceRequired",
        "Base price is required",
      );
    else if (Number(form.basePrice) < 0)
      newErrors.basePrice = t(
        "tourInstance.validation.basePriceNonNegative",
        "Base price must be 0 or greater",
      );

    // Validate startDate is not in the past
    if (form.startDate) {
      const today = new Date().toISOString().split("T")[0];
      if (form.startDate < today)
        newErrors.startDate = t(
          "tourInstance.validation.startDatePast",
          "Ngày bắt đầu không được nằm trong quá khứ",
        );
    }

    // Room assignment validation removed — hotel provider is now per-activity

    // Transport Plan: per-activity vehicle type must match selected supplier.
    const invalidTransportIds = validateTransportActivities(
      form.activityAssignments,
      selectedClassification,
      allowedVehicleKeysBySupplierId,
    );
    if (invalidTransportIds.length > 0) {
      newErrors.transportVehicleType = t(
        "tourInstance.wizard.vehicleType.submitBlocked",
        "Please fix vehicle type mismatches before continuing",
      );
    }

    // Transport Plan: requestedSeatCount must be ≥ maxParticipation (mirrors backend rule).
    const invalidSeatCountIds = validateTransportSeatCounts(
      form.activityAssignments,
      selectedClassification,
      Number(form.maxParticipation),
    );
    if (invalidSeatCountIds.length > 0) {
      newErrors.transportSeatCount = t(
        "tourInstance.transport.errors.seatCountBelowCapacity",
        "Requested seat count cannot be less than the tour's max participation.",
      );
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (
        invalidTransportIds.length === 0 &&
        invalidSeatCountIds.length === 0
      ) {
        toast.error(
          t(
            "tourInstance.validationFailed",
            "Please fill in all required fields",
          ),
        );
      }
      if (invalidSeatCountIds.length > 0) {
        toast.error(
          t(
            "tourInstance.transport.errors.seatCountBelowCapacity",
            "Requested seat count cannot be less than the tour's max participation.",
          ),
        );
      }
      if (invalidTransportIds.length > 0) {
        const firstId = invalidTransportIds[0];
        const el =
          typeof document !== "undefined"
            ? document.getElementById(`vehicleType-${firstId}`)
            : null;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          (el as HTMLSelectElement).focus();
        }
      } else if (invalidSeatCountIds.length > 0) {
        const firstId = invalidSeatCountIds[0];
        const el =
          typeof document !== "undefined"
            ? document.getElementById(`seatCount-${firstId}`)
            : null;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          (el as HTMLInputElement).focus();
        }
      }
      return;
    }

    try {
      setSubmitting(true);

      const mappedActivityAssignments = mapActivityAssignmentsForPayload(
        form.activityAssignments,
      );

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
        activityAssignments:
          mappedActivityAssignments.length > 0
            ? mappedActivityAssignments
            : undefined,
      };

      const result = await tourInstanceService.createInstance(payload);
      if (result) {
        setIsDirty(false);
        toast.success(
          t("tourInstance.created", "Tour instance created successfully!"),
        );
        // Backend returns just the Guid ID, not a full TourInstanceDto
        const instanceId = typeof result === "string" ? result : (result as any).id;
        router.push(`/manager/tour-instances/${instanceId}`);
      }
    } catch (error: unknown) {
      const handledError = handleApiError(error);
      console.error("Failed to create tour instance:", handledError);
      // Prefer translated message; fall back to the backend's raw text so the
      // user never sees a silent failure or a raw i18n key.
      const translated = t(handledError.message);
      const fallback = t(
        "tourInstance.errors.createFailed",
        "Failed to create tour instance. Please check the data and try again.",
      );
      const message =
        translated && translated !== handledError.message
          ? translated
          : (handledError.details ?? handledError.message ?? fallback);
      toast.error(message || fallback);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

  // ── Upload handlers ─────────────────────────────────────────────────
  const handleUploadThumbnail = useCallback(
    async (file: File) => {
      try {
        setUploadingThumbnail(true);
        const meta = await fileService.uploadFile(file);
        setForm((prev) => ({ ...prev, thumbnailUrl: meta.url }));
        setIsDirty(true);
      } catch (error) {
        const msg = handleApiError(error);
        toast.error(
          t(msg.message)
        );
      } finally {
        setUploadingThumbnail(false);
      }
    },
    [t],
  );

  const handleUploadImages = useCallback(
    async (files: FileList) => {
      try {
        setUploadingImages(true);
        const uploads = await Promise.all(
          Array.from(files).map((f) => fileService.uploadFile(f)),
        );
        const urls = uploads.map((m) => m.url);
        setForm((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, ...urls],
        }));
        setIsDirty(true);
      } catch (error) {
        const msg = handleApiError(error);
        toast.error(
          t(msg.message)
        );
      } finally {
        setUploadingImages(false);
      }
    },
    [t],
  );

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
              <Icon
                icon="heroicons:document-text"
                className="size-5 mt-0.5 shrink-0"
              />
              <div>
                <p className="font-semibold">
                  {safeT(
                    "tourInstance.prefillFromRequest",
                    "Creating from Tour Request",
                  )}
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
                      {safeT(
                        "tourRequest.admin.detail.destination",
                        "Destination",
                      )}
                      : <strong>{prefillTourRequest.destination}</strong>
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
            onCancel={() => router.push("/manager/tour-instances")}
            inputClassName={inputClassName}
            t={safeT}
          />
        ) : (
          <InstanceDetailsStep
            form={form}
            errors={errors}
            guides={guides}
            guideConflicts={guideConflicts}
            hotelProviders={hotelProviders}
            transportProviders={transportProviders}
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
            onUploadThumbnail={handleUploadThumbnail}
            onUploadImages={handleUploadImages}
            uploadingThumbnail={uploadingThumbnail}
            uploadingImages={uploadingImages}
            hotelDetailsBySupplierId={hotelDetailsBySupplierId}
            transportDetailsBySupplierId={transportDetailsBySupplierId}
            transportDetailsError={transportDetailsError}
            transportDetailsLoading={transportDetailsLoading}
            allowedVehicleKeysBySupplierId={allowedVehicleKeysBySupplierId}
            vehicleCountsBySupplierId={vehicleCountsBySupplierId}
            invalidVehicleActivityIds={invalidVehicleActivityIds}
            invalidSeatCountActivityIds={invalidSeatCountActivityIds}
            updateActivityAssignment={updateActivityAssignment}
            editableItinerary={editableItinerary}
            onUpdateActivity={handleUpdateActivity}
            onDeleteActivity={handleDeleteActivity}
            onAddActivity={handleAddActivity}
            onToggleEditActivity={handleToggleEditActivity}
            inputClassName={inputClassName}
            t={safeT}
          />
        )}
      </div>
    </main>
  );
}
