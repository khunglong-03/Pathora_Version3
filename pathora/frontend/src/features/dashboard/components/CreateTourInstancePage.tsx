"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Icon, CollapsibleSection } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
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
import { useDebounce } from "@/hooks/useDebounce";
import {
  buildActivityTypeByActivityId,
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
  titleEn: string;
  instanceType: string;
  startDate: string;
  endDate: string;
  maxParticipation: string;
  basePrice: string;
  location: string;
  locationEn: string;
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
  /**
   * Mode of transport (Flight/Train/Boat/Bus/Car/...) — only meaningful when
   * activityType === "Transportation". Drives whether the create wizard
   * pre-books a vehicle/supplier or defers assignment to post-payment.
   */
  transportationType?: string | null;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  isOptional: boolean;
  /** When true, show inline edit form instead of read-only */
  _editing?: boolean;
};

/**
 * Tickets booked per-passenger after the customer pays — manager assigns these
 * (along with hotels) during fulfilment, not at instance creation. Anything
 * else (Bus, Car, Motorbike, Taxi, Bicycle, Walking, Other) is ground transport
 * that the manager pre-books here.
 */
const POST_PAYMENT_TRANSPORT_MODES = new Set(["Flight", "Train", "Boat"]);

function isPostPaymentTransportation(
  transportationType?: string | null,
): boolean {
  return !!transportationType && POST_PAYMENT_TRANSPORT_MODES.has(transportationType);
}

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
  titleEn: "",
  instanceType: "2",
  startDate: "",
  endDate: "",
  maxParticipation: "",
  basePrice: "",
  location: "",
  locationEn: "",
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
// ─── Step Indicator ────────────────────────────────────────────────────────────
interface StepIndicatorProps {
  currentStep: number;
  t: Translate;
}

function StepIndicator({ currentStep, t }: StepIndicatorProps) {
  const steps = [
    { num: 1, label: t("tourInstance.wizard.step1", "Select Template") },
    { num: 2, label: t("tourInstance.wizard.step2", "Configuration") },
  ];

  return (
    <div className="flex flex-col gap-8 relative mt-8">
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-stone-200/50 z-0"></div>
      {steps.map((step) => {
        const isActive = currentStep === step.num - 1;
        const isCompleted = currentStep > step.num - 1;
        return (
          <div key={step.num} className={`relative z-10 flex items-center gap-6 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive || isCompleted ? "opacity-100" : "opacity-40"}`}>
            <div className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isCompleted ? "bg-stone-900 text-stone-50" : isActive ? "bg-yellow-600 text-white shadow-[0_0_24px_rgba(202,138,4,0.4)] ring-4 ring-yellow-600/10 scale-110" : "bg-white/50 backdrop-blur-sm border border-stone-200/50 text-stone-400"
            }`}>
              {isCompleted ? <Icon icon="heroicons:check" className="size-3.5" /> : step.num}
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] tracking-[0.2em] uppercase font-bold transition-colors ${isActive ? "text-yellow-600" : "text-stone-400"}`}>
                Step 0{step.num}
              </span>
              <span className={`text-sm font-medium transition-colors ${isActive ? "text-stone-900" : "text-stone-500"}`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Double Bezel Card ───────────────────────────────────────────────────────
function DoubleBezelCard({ title, eyebrow, stepNumber, children, className = "" }: { title?: React.ReactNode; eyebrow?: string; stepNumber?: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[2.5rem] bg-white/40 p-2 ring-1 ring-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] fill-mode-both overflow-hidden ${className}`}>
      {/* Iridescent/Fluid background blur layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-100/50 via-white/20 to-stone-200/50 mix-blend-overlay pointer-events-none" />
      <div className="relative rounded-[calc(2.5rem-0.5rem)] bg-white/70 backdrop-blur-xl p-8 md:p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] ring-1 ring-black/[0.03]">
        {(title || eyebrow) && (
          <div className="mb-10">
            {eyebrow && <div className="inline-block rounded-full bg-stone-900/5 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-4">{eyebrow}</div>}
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-4 font-serif">
               {stepNumber && <span className="flex size-8 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-700 items-center justify-center text-sm font-black tracking-tighter shrink-0 ring-1 ring-yellow-600/20 shadow-inner">{stepNumber}</span>}
               {title}
            </h2>
          </div>
        )}
        {children}
      </div>
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
    <div className="space-y-12">
      <DoubleBezelCard title={t("tourInstance.wizard.step1", "Select Template")} eyebrow="Foundation" stepNumber={1} className="delay-100">
        {loadError && (
          <div className="mb-8 flex items-start justify-between gap-4 rounded-[1.5rem] border border-red-200/60 bg-red-50/50 p-6 backdrop-blur-sm">
            <div>
              <p className="text-sm font-semibold text-red-800">{loadError}</p>
            </div>
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 active:scale-98 transition-transform whitespace-nowrap">
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        <div className="space-y-8">
          <div className="space-y-3 relative group">
            <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-stone-500 transition-colors group-focus-within:text-yellow-700 ml-1">
              {t("tourInstance.packageTour", "Package Tour")} <span className="text-yellow-600">*</span>
            </label>
            {loading && !loadError ? (
              <div className="space-y-3">
                <div className="skeleton h-14 w-full rounded-[1.25rem] bg-stone-100" />
                <div className="skeleton h-14 w-full rounded-[1.25rem] bg-stone-100" />
              </div>
            ) : (
              <div className="relative">
                <select
                  className={`${inputClassName} ${errors.tourId ? 'ring-red-300 focus:ring-red-500' : ''}`}
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
                <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-stone-400">
                   <Icon icon="heroicons:chevron-down" className="size-4" />
                </div>
                {tours.length === 0 && !loading && !loadError && (
                  <p className="mt-3 text-xs text-stone-400 font-medium ml-1">
                    {t(
                      "tourInstance.noActiveTours",
                      "No active tours available.",
                    )}
                  </p>
                )}
              </div>
            )}
            {errors.tourId && (
              <p className="text-xs font-semibold text-red-500 ml-1 mt-2">{errors.tourId}</p>
            )}
          </div>

          <div className="space-y-3 relative group">
            <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-stone-500 transition-colors group-focus-within:text-yellow-700 ml-1">
              {t("tourInstance.packageClassification", "Package Classification")} <span className="text-yellow-600">*</span>
            </label>
            <div className="relative">
              <select
                className={`${inputClassName} ${errors.classificationId ? 'ring-red-300 focus:ring-red-500' : ''}`}
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
              <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-stone-400">
                 <Icon icon="heroicons:chevron-down" className="size-4" />
              </div>
            </div>
            {errors.classificationId && (
              <p className="text-xs font-semibold text-red-500 ml-1 mt-2">{errors.classificationId}</p>
            )}
          </div>
        </div>
      </DoubleBezelCard>

      <div className="flex items-center justify-end gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 ease-[cubic-bezier(0.32,0.72,0,1)] fill-mode-both">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-6 py-3 text-sm font-bold text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors active:scale-[0.98]">
          {t("tourInstance.cancel", "Cancel")}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-stone-900 py-3 pl-7 pr-2 text-sm font-bold text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black hover:shadow-xl hover:shadow-stone-900/20 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none">
          {t("tourInstance.wizard.next", "Configure Details")}
          <div className="flex size-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:scale-105">
             <Icon icon="heroicons:arrow-right" className="size-4" />
          </div>
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
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100/50 px-2.5 py-1 text-xs font-medium text-yellow-800">
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
        className="ml-0.5 flex size-3.5 items-center justify-center rounded-full text-yellow-600 hover:text-yellow-800">
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
  seatCapacityMap?: Record<string, Record<number, number>>,
): string[] {
  if (!Number.isFinite(maxParticipation) || maxParticipation <= 0) return [];
  const invalid: string[] = [];
  for (const [activityId, assignment] of Object.entries(assignments)) {
    if (!assignment) continue;
    const seat = assignment.requestedSeatCount;
    const count = assignment.requestedVehicleCount ?? 1;

    // Resolve actual vehicle seat capacity from supplier data
    let actualCap: number | undefined;
    if (seatCapacityMap && assignment.supplierId && assignment.requestedVehicleType !== undefined) {
      actualCap = seatCapacityMap[assignment.supplierId]?.[assignment.requestedVehicleType];
    }

    // Determine effective seats-per-vehicle: user input > actual vehicle capacity > skip
    const effectiveSeat = (typeof seat === "number" && seat > 0)
      ? seat
      : (typeof actualCap === "number" && actualCap > 0 ? actualCap : undefined);

    // If we have an effective seat count, validate total capacity
    if (effectiveSeat !== undefined) {
      if ((effectiveSeat * count) < maxParticipation) {
        invalid.push(activityId);
      }
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

/**
 * For each supplier + vehicle-type combination, find the **typical seat capacity**
 * of active vehicles. When a supplier has several vehicles of the same type with
 * different capacities, the *minimum* is used (conservative estimate).
 * Returns `Record<supplierId, Record<vehicleTypeKey, seatCapacity>>`.
 */
export function buildSeatCapacityBySupplierAndType(
  transportDetailsBySupplierId: Record<string, TransportProviderDetail>,
): Record<string, Record<number, number>> {
  const out: Record<string, Record<number, number>> = {};
  for (const [supplierId, detail] of Object.entries(transportDetailsBySupplierId)) {
    const caps: Record<number, number> = {};
    for (const vehicle of detail.vehicles ?? []) {
      if (!vehicle.isActive) continue;
      const key = vehicleTypeNameToKey(vehicle.vehicleType);
      if (key === undefined) continue;
      if (caps[key] === undefined || vehicle.seatCapacity < caps[key]) {
        caps[key] = vehicle.seatCapacity;
      }
    }
    out[supplierId] = caps;
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
  instanceBasePath: string;
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
  seatCapacityBySupplierAndType: Record<string, Record<number, number>>;
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
  activeLang: "vi" | "en";
  setActiveLang: (lang: "vi" | "en") => void;
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
  instanceBasePath,
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
  seatCapacityBySupplierAndType,
  updateActivityAssignment,
  editableItinerary,
  onUpdateActivity,
  onDeleteActivity,
  onAddActivity,
  onToggleEditActivity,
  activeLang,
  setActiveLang,
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
                  href={`${instanceBasePath}/${inst.id}`}
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
      <DoubleBezelCard
        title={t("tourInstance.wizard.section.basicInfo", "Basic Information")}>
        <div className="space-y-4">
          {/* Language Tabs */}
          <div className="flex items-center gap-1 border-b border-stone-100 mb-6">
            <button
              type="button"
              onClick={() => setActiveLang("vi")}
              className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 ${
                activeLang === "vi"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-stone-400 hover:text-stone-600"
              }`}>
              {t("tourAdmin.langTabs.vi", "Tiếng Việt")}
            </button>
            <button
              type="button"
              onClick={() => setActiveLang("en")}
              className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 ${
                activeLang === "en"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-stone-400 hover:text-stone-600"
              }`}>
              {t("tourAdmin.langTabs.en", "English")}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              {t("tourInstance.form.title", "Title")} ({activeLang.toUpperCase()}) *
            </label>
            {activeLang === "vi" ? (
              <input
                className={inputClassName}
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder={t(
                  "tourInstance.form.titlePlaceholder",
                  "Ex: Ha Long 3N2D - June Departure",
                )}
              />
            ) : (
              <input
                className={inputClassName}
                value={form.titleEn}
                onChange={(event) => updateField("titleEn", event.target.value)}
                placeholder={t(
                  "tourInstance.form.titlePlaceholderEn",
                  "Ex: Ha Long 3D2N - June Departure",
                )}
              />
            )}
            {errors.title && activeLang === "vi" && (
              <p className="text-xs text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              {t("tourInstance.departureLocation", "Địa điểm xuất phát")} ({activeLang.toUpperCase()})
            </label>
            {activeLang === "vi" ? (
              <input
                className={inputClassName}
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                placeholder={t("tourInstance.form.locationPlaceholder", "Ex: Ha Noi")}
              />
            ) : (
              <input
                className={inputClassName}
                value={form.locationEn}
                onChange={(event) => updateField("locationEn", event.target.value)}
                placeholder={t("tourInstance.form.locationPlaceholderEn", "Ex: Hanoi")}
              />
            )}
          </div>

          <div className="pt-4 border-t border-stone-50">
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
      </DoubleBezelCard>

      {/* Schedule & Pricing */}
      <DoubleBezelCard
        title={t(
          "tourInstance.wizard.section.scheduleAndPricing",
          "Schedule & Pricing",
        )}>
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
      </DoubleBezelCard>

      {/* Guide */}
      <DoubleBezelCard
        title={t("tourInstance.wizard.section.guide", "Guide")}>
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
      </DoubleBezelCard>

      {/* Optional Services */}
      <DoubleBezelCard
        title={t("tourInstance.wizard.section.services", "Optional Services")}>
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
                      className="size-4 rounded border-stone-300 text-yellow-600 focus:ring-yellow-600"
                    />
                    <span>{service}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </DoubleBezelCard>

      {/* Media */}
      <DoubleBezelCard
        title={t("tourInstance.wizard.section.media", "Media")}>
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
                      className="size-6 text-yellow-600 animate-spin"
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
            <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-yellow-400 px-4 py-3 text-sm font-medium text-yellow-700 cursor-pointer hover:bg-yellow-50 transition-colors">
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
      </DoubleBezelCard>

      {/* Itinerary Preview — Editable */}
      {editableItinerary.length > 0 && (
        <DoubleBezelCard
          title={t(
            "tourInstance.wizard.section.itineraryPreview",
            "Itinerary Preview",
          )}>
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
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-yellow-100/50 text-xs font-bold text-yellow-800">
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
                                  className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
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
                                  className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
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
                              <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-[11px] text-amber-800">
                                <p className="font-semibold uppercase tracking-wider">
                                  {t(
                                    "tourInstance.wizard.postPaymentAssignment.title",
                                    "Hotel will be assigned after payment",
                                  )}
                                </p>
                                <p className="text-amber-700">
                                  {t(
                                    "tourInstance.wizard.postPaymentAssignment.hotelDescription",
                                    "Manager assigns the hotel and room after the customer completes payment.",
                                  )}
                                </p>
                              </div>
                            )}

                            {activity.activityType === "Transportation" &&
                              isPostPaymentTransportation(activity.transportationType) && (
                              <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-[11px] text-amber-800">
                                <p className="font-semibold uppercase tracking-wider">
                                  {t(
                                    "tourInstance.wizard.postPaymentAssignment.title",
                                    "Tickets will be assigned after payment",
                                  )}
                                </p>
                                <p className="text-amber-700">
                                  {t(
                                    "tourInstance.wizard.postPaymentAssignment.ticketDescription",
                                    "{{mode}} tickets are issued per passenger and assigned by the manager after payment.",
                                    { mode: activity.transportationType ?? "" },
                                  )}
                                </p>
                              </div>
                            )}

                            {activity.activityType === "Transportation" &&
                              !isPostPaymentTransportation(activity.transportationType) && (
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
                                      className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
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
                                        className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
                                        onChange={(next) => {
                                          const updates: Record<string, unknown> = { requestedVehicleType: next };
                                          // Auto-fill seat count from actual vehicle capacity
                                          const supId = form.activityAssignments[activity.id]?.supplierId;
                                          if (next !== undefined && supId) {
                                            const cap = seatCapacityBySupplierAndType[supId]?.[next];
                                            if (typeof cap === "number" && cap > 0) {
                                              updates.requestedSeatCount = cap;
                                            }
                                          }
                                          updateActivityAssignment(activity.id, updates as Parameters<typeof updateActivityAssignment>[1]);
                                        }}
                                        t={t}
                                      />
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <label
                                          htmlFor={`seatCount-${activity.id}`}
                                          className="text-[10px] font-medium text-stone-500 uppercase">
                                          {t("tourInstance.wizard.seatCount", "Seat Count")}
                                        </label>
                                        {(() => {
                                          const supId = form.activityAssignments[activity.id]?.supplierId;
                                          const vType = form.activityAssignments[activity.id]?.requestedVehicleType;
                                          if (!supId || vType === undefined) return null;
                                          const cap = seatCapacityBySupplierAndType[supId]?.[vType];
                                          if (typeof cap !== "number" || cap <= 0) return null;
                                          return (
                                            <span className="text-[10px] font-medium text-emerald-600">
                                              {activeLang === "vi" ? `${cap} ghế/xe` : `${cap} seats/vehicle`}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      <input
                                        id={`seatCount-${activity.id}`}
                                        type="number"
                                        min={1}
                                        className={`w-full rounded border px-2 py-1 text-xs outline-none ${
                                          invalidSeatCountActivityIds.has(activity.id)
                                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                                            : "border-stone-300 focus:ring-yellow-600 focus:border-yellow-600"
                                        }`}
                                        value={form.activityAssignments[activity.id]?.requestedSeatCount ?? ""}
                                        onChange={(e) => {
                                          updateActivityAssignment(activity.id, {
                                            requestedSeatCount: e.target.value ? Number(e.target.value) : undefined,
                                          });
                                        }}
                                        placeholder={(() => {
                                          const supId = form.activityAssignments[activity.id]?.supplierId;
                                          const vType = form.activityAssignments[activity.id]?.requestedVehicleType;
                                          if (supId && vType !== undefined) {
                                            const cap = seatCapacityBySupplierAndType[supId]?.[vType];
                                            if (typeof cap === "number" && cap > 0) return String(cap);
                                          }
                                          return t("common.optional", "Optional");
                                        })()}
                                      />
                                      {invalidSeatCountActivityIds.has(activity.id) && (() => {
                                        const rsc = form.activityAssignments[activity.id]?.requestedSeatCount;
                                        const rvc = form.activityAssignments[activity.id]?.requestedVehicleCount || 1;
                                        const maxP = Number(form.maxParticipation) || 0;
                                        const supId = form.activityAssignments[activity.id]?.supplierId;
                                        const vType = form.activityAssignments[activity.id]?.requestedVehicleType;
                                        const actualCap = (supId && vType !== undefined) ? seatCapacityBySupplierAndType[supId]?.[vType] : undefined;
                                        const effectiveSeat = (typeof rsc === "number" && rsc > 0) ? rsc : (typeof actualCap === "number" ? actualCap : 0);
                                        const totalCap = effectiveSeat * rvc;
                                        const minVehicles = effectiveSeat > 0 ? Math.ceil(maxP / effectiveSeat) : 1;
                                        return (
                                          <p className="mt-1 text-[10px] text-red-600">
                                            {activeLang === "vi" ? (
                                              <>
                                                Tổng sức chứa ({effectiveSeat} × {rvc} = {totalCap}) nhỏ hơn số khách tối đa ({maxP}).
                                                {typeof actualCap === "number" && actualCap > 0 && (
                                                  <><br />Xe loại này có <b>{actualCap} ghế</b>. Cần tối thiểu <b>{minVehicles} xe</b>.</>
                                                )}
                                              </>
                                            ) : (
                                              <>
                                                Total capacity ({effectiveSeat} × {rvc} = {totalCap}) is below max participation ({maxP}).
                                                {typeof actualCap === "number" && actualCap > 0 && (
                                                  <><br />This vehicle type has <b>{actualCap} seats</b>. Need at least <b>{minVehicles} vehicles</b>.</>
                                                )}
                                              </>
                                            )}
                                          </p>
                                        );
                                      })()}
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-medium text-stone-500 uppercase">
                                        {t("tourInstance.wizard.vehicleCount", "Vehicle Count")}
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
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
                                  className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
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
                                  className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
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
                                className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
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
                                  className="rounded border-stone-300 text-yellow-600 focus:ring-yellow-600"
                                />
                                {t("tourInstance.optional", "Optional")}
                              </label>
                              <div className="flex-1" />
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleEditActivity(day.id, activity.id)
                                }
                                className="rounded-lg bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600">
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
                                  className="rounded p-1 text-stone-400 hover:text-yellow-700 hover:bg-yellow-50"
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

                            {/* Accommodation hotel is assigned post-payment (no picker here) */}
                            {activity.activityType === "Accommodation" && (
                              <div className="ml-6 space-y-1 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-[11px] text-amber-800">
                                <p className="font-semibold uppercase tracking-wider">
                                  {t(
                                    "tourInstance.wizard.postPaymentAssignment.title",
                                    "Hotel will be assigned after payment",
                                  )}
                                </p>
                                <p className="text-amber-700">
                                  {t(
                                    "tourInstance.wizard.postPaymentAssignment.hotelDescription",
                                    "Manager assigns the hotel and room after the customer completes payment.",
                                  )}
                                </p>
                              </div>
                            )}

                            {/* Transportation: ticket modes (Flight/Train/Boat) are post-payment */}
                            {activity.activityType === "Transportation" &&
                              isPostPaymentTransportation(activity.transportationType) && (
                              <div className="ml-6 space-y-1 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-[11px] text-amber-800">
                                <p className="font-semibold uppercase tracking-wider">
                                  {t(
                                    "tourInstance.wizard.postPaymentAssignment.title",
                                    "Tickets will be assigned after payment",
                                  )}
                                </p>
                                <p className="text-amber-700">
                                  {t(
                                    "tourInstance.wizard.postPaymentAssignment.ticketDescription",
                                    "{{mode}} tickets are issued per passenger and assigned by the manager after payment.",
                                    { mode: activity.transportationType ?? "" },
                                  )}
                                </p>
                              </div>
                            )}

                            {/* Always-visible supplier picker for ground Transportation */}
                            {activity.activityType === "Transportation" &&
                              !isPostPaymentTransportation(activity.transportationType) && (
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
                                      className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
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
                                        className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
                                        onChange={(next) => {
                                          const updates: Record<string, unknown> = { requestedVehicleType: next };
                                          const supId = form.activityAssignments[activity.id]?.supplierId;
                                          if (next !== undefined && supId) {
                                            const cap = seatCapacityBySupplierAndType[supId]?.[next];
                                            if (typeof cap === "number" && cap > 0) {
                                              updates.requestedSeatCount = cap;
                                            }
                                          }
                                          updateActivityAssignment(activity.id, updates as Parameters<typeof updateActivityAssignment>[1]);
                                        }}
                                        t={t}
                                      />
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <label
                                          htmlFor={`seatCount-${activity.id}`}
                                          className="text-[10px] font-medium text-stone-500 uppercase">
                                          {t("tourInstance.wizard.seatCount", "Seat Count")}
                                        </label>
                                        {(() => {
                                          const supId = form.activityAssignments[activity.id]?.supplierId;
                                          const vType = form.activityAssignments[activity.id]?.requestedVehicleType;
                                          if (!supId || vType === undefined) return null;
                                          const cap = seatCapacityBySupplierAndType[supId]?.[vType];
                                          if (typeof cap !== "number" || cap <= 0) return null;
                                          return (
                                            <span className="text-[10px] font-medium text-emerald-600">
                                              {activeLang === "vi" ? `${cap} ghế/xe` : `${cap} seats/vehicle`}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      <input
                                        id={`seatCount-${activity.id}`}
                                        type="number"
                                        min={1}
                                        className={`w-full rounded border bg-white px-2 py-1 text-xs outline-none ${
                                          invalidSeatCountActivityIds.has(activity.id)
                                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                                            : "border-stone-300 focus:ring-yellow-600 focus:border-yellow-600"
                                        }`}
                                        value={form.activityAssignments[activity.id]?.requestedSeatCount ?? ""}
                                        onChange={(e) => {
                                          updateActivityAssignment(activity.id, {
                                            requestedSeatCount: e.target.value ? Number(e.target.value) : undefined,
                                          });
                                        }}
                                        placeholder={(() => {
                                          const supId = form.activityAssignments[activity.id]?.supplierId;
                                          const vType = form.activityAssignments[activity.id]?.requestedVehicleType;
                                          if (supId && vType !== undefined) {
                                            const cap = seatCapacityBySupplierAndType[supId]?.[vType];
                                            if (typeof cap === "number" && cap > 0) return String(cap);
                                          }
                                          return t("common.optional", "Optional");
                                        })()}
                                      />
                                      {invalidSeatCountActivityIds.has(activity.id) && (() => {
                                        const rsc = form.activityAssignments[activity.id]?.requestedSeatCount;
                                        const rvc = form.activityAssignments[activity.id]?.requestedVehicleCount || 1;
                                        const maxP = Number(form.maxParticipation) || 0;
                                        const supId = form.activityAssignments[activity.id]?.supplierId;
                                        const vType = form.activityAssignments[activity.id]?.requestedVehicleType;
                                        const actualCap = (supId && vType !== undefined) ? seatCapacityBySupplierAndType[supId]?.[vType] : undefined;
                                        const effectiveSeat = (typeof rsc === "number" && rsc > 0) ? rsc : (typeof actualCap === "number" ? actualCap : 0);
                                        const totalCap = effectiveSeat * rvc;
                                        const minVehicles = effectiveSeat > 0 ? Math.ceil(maxP / effectiveSeat) : 1;
                                        return (
                                          <p className="mt-1 text-[10px] text-red-600">
                                            {activeLang === "vi" ? (
                                              <>
                                                Tổng sức chứa ({effectiveSeat} × {rvc} = {totalCap}) nhỏ hơn số khách tối đa ({maxP}).
                                                {typeof actualCap === "number" && actualCap > 0 && (
                                                  <><br />Xe loại này có <b>{actualCap} ghế</b>. Cần tối thiểu <b>{minVehicles} xe</b>.</>
                                                )}
                                              </>
                                            ) : (
                                              <>
                                                Total capacity ({effectiveSeat} × {rvc} = {totalCap}) is below max participation ({maxP}).
                                                {typeof actualCap === "number" && actualCap > 0 && (
                                                  <><br />This vehicle type has <b>{actualCap} seats</b>. Need at least <b>{minVehicles} vehicles</b>.</>
                                                )}
                                              </>
                                            )}
                                          </p>
                                        );
                                      })()}
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-medium text-stone-500 uppercase">
                                        {t("tourInstance.wizard.vehicleCount", "Vehicle Count")}
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs focus:ring-yellow-600 focus:border-yellow-600 outline-none"
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
                  className="mt-3 ml-8 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-yellow-400 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-50 transition-colors">
                  <Icon icon="heroicons:plus" className="size-3.5" />
                  {t("tourInstance.wizard.addActivity", "Add activity")}
                </button>
              </div>
            ))}
          </div>
        </DoubleBezelCard>
      )}

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-stone-100 pt-8">
        <button
          type="button"
          onClick={onPrevious}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-stone-200 bg-white px-8 py-3.5 text-sm font-semibold tracking-wide text-stone-700 transition-all hover:bg-stone-50 active:scale-[0.98]">
          <span className="relative z-10 flex items-center gap-2">
            <Icon icon="heroicons:arrow-left" className="size-4 transition-transform group-hover:-translate-x-1" />
            {t("tourInstance.wizard.previous", "Previous")}
          </span>
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-black px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
          <span className="relative z-10 flex items-center gap-2">
            {submitting ? (
              <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
            ) : (
              <Icon icon="heroicons:check" className="size-4" />
            )}
            {submitting
              ? t("tourInstance.creating", "Creating...")
              : t("tourInstance.createAction", "Create instance")}
          </span>
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
  const pathname = usePathname();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlTourRequestId = searchParams.get("tourRequestId");
  const instanceBasePath = useMemo(
    () =>
      pathname.startsWith("/tour-designer")
        ? "/tour-designer/tour-instances"
        : "/manager/tour-instances",
    [pathname],
  );

  const [currentStep, setCurrentStep] = useState(SELECT_TOUR_STEP);
  const [activeLang, setActiveLang] = useState<"vi" | "en">("vi");
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
  const lastAutoFilledClassificationIdRef = useRef<string | null>(null);

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
        const handledFallbackError = handleApiError(err);
        if (
          handledFallbackError.message === "error_response.UNAUTHORIZED" ||
          handledFallbackError.message === "error_response.ACCESS_DENIED" ||
          handledFallbackError.message === "error_response.NETWORK_ERROR" ||
          handledFallbackError.message === "error_response.TIMEOUT_ERROR"
        ) {
          throw err;
        }

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

  const seatCapacityBySupplierAndType = useMemo(
    () => buildSeatCapacityBySupplierAndType(transportDetailsBySupplierId),
    [transportDetailsBySupplierId],
  );

  const invalidSeatCountActivityIds = useMemo(
    () =>
      new Set(
        validateTransportSeatCounts(
          form.activityAssignments,
          selectedClassification,
          Number(form.maxParticipation),
          seatCapacityBySupplierAndType,
        ),
      ),
    [
      form.activityAssignments,
      selectedClassification,
      form.maxParticipation,
      seatCapacityBySupplierAndType,
    ],
  );

  // Fetch guides for optional guide selection
  const fetchGuides = useCallback(async () => {
    try {
      const isManager = user?.roles.some((r) => r.name === "Manager");
      
      if (isManager && user?.id) {
        const staffData = await adminService.getTourManagerStaff(user.id);
        if (staffData?.staff) {
          // Filter only TourGuides and convert to UserInfo-like structure
          const mappedGuides: UserInfo[] = staffData.staff
            .filter((s) => s.role === "Tour Guide")
            .map((g) => ({
              id: g.id,
              fullName: g.fullName,
              username: g.fullName,
              email: g.email,
              avatar: g.avatarUrl ?? null,
              forcePasswordChange: false,
              roles: [],
              departments: [],
              portal: null,
              defaultPath: null,
            }));
          setGuides(mappedGuides);
          return;
        }
      }

      // Fallback for Admins or if staff fetching fails: get all guides
      const guides = await userService.getGuides();
      setGuides(guides ?? []);
    } catch (error: unknown) {
      console.error("Failed to fetch guides:", error);
      setGuides([]);
    }
  }, [user?.id, user?.roles]);

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

        const servicesFromDetail = detail?.includedServices ??
                                  detail?.services?.map(s => s.serviceName) ??
                                  [];
        setAvailableServices(servicesFromDetail);

        setForm((current) => {
          const next = { ...current, classificationId: "" };

          if (detail) {
            if (
              next.includedServices.length === 0 &&
              servicesFromDetail.length > 0
            ) {
              next.includedServices = servicesFromDetail;
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
    if (!selectedClassification) {
      lastAutoFilledClassificationIdRef.current = null;
      return;
    }

    if (lastAutoFilledClassificationIdRef.current === selectedClassification.id) {
      return;
    }

    setForm((current) => {
      const next = { ...current };
      const fallbackPrice =
        selectedClassification.basePrice ?? selectedClassification.price ?? 0;

      if (!next.title.trim()) {
        next.title = `${selectedTour?.tourName ?? "Tour"} - ${
          selectedClassification.name
        }`;
      }

      // Automatically apply the base price of the newly selected classification
      next.basePrice = fallbackPrice > 0 ? String(fallbackPrice) : "";

      return next;
    });

    lastAutoFilledClassificationIdRef.current = selectedClassification.id;
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
          transportationType: a.transportationType ?? null,
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
      seatCapacityBySupplierAndType,
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

      // Build a map of activityId -> activityType from our editable state
      // to ensure we correctly route assignments (Hotel vs Transport) even if the user changed types.
      const activityTypeMap: Record<string, string> = {};
      editableItinerary.forEach((day) => {
        day.activities.forEach((act) => {
          activityTypeMap[act.id] = act.activityType;
        });
      });

      const mappedActivityAssignments = mapActivityAssignmentsForPayload(
        form.activityAssignments,
        activityTypeMap,
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
        location: form.location.trim() || undefined,
        includedServices: form.includedServices
          .map((s) => s.trim())
          .filter(Boolean),
        guideUserIds: form.guideUserIds,
        thumbnailUrl: form.thumbnailUrl.trim() || undefined,
        imageUrls: form.imageUrls.map((url) => url.trim()).filter(Boolean),
        tourRequestId: effectiveTourRequestId ?? undefined,
        translations: {
          vi: {
            title: form.title.trim(),
            location: form.location.trim() || undefined,
          },
          en: {
            title: (form.titleEn || form.title).trim(),
            location: (form.locationEn || form.location).trim() || undefined,
          },
        },
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
        router.push(`${instanceBasePath}/${instanceId}`);
      }
    } catch (error: unknown) {
      const handledError = handleApiError(error);
      console.warn(`Failed to create tour instance: ${handledError.message}`, {
        code: handledError.code,
        details: handledError.details,
      });
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
    "w-full appearance-none rounded-[1.25rem] border-0 bg-stone-50 px-5 py-4 text-sm font-medium text-stone-900 ring-1 ring-inset ring-stone-200/60 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-stone-100/50 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-yellow-600 focus:shadow-[0_8px_16px_-6px_rgba(249,115,22,0.15)]";

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
    <main className="min-h-[100dvh] bg-[#FDFBF7] selection:bg-yellow-600/20 text-stone-900 relative">
      {/* CSS Noise Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      
      <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row min-h-[100dvh]">
        
        {/* Left Editorial Pane (Sticky) */}
        <div className="w-full md:w-[40%] md:sticky top-0 md:h-[100dvh] flex flex-col justify-between px-6 py-12 md:px-12 md:py-16 border-b md:border-b-0 md:border-r border-stone-200/50">
          <div className="animate-in fade-in slide-in-from-left-8 duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]">
             <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-yellow-100/50 text-[10px] uppercase tracking-[0.2em] font-bold text-yellow-800 mb-8 ring-1 ring-inset ring-yellow-500/50">
               Tour Builder
             </div>
             <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 mb-6 font-serif leading-[1.1]">
               {safeT("tourInstance.createTitle", "Deploy Tour Instance.")}
             </h1>
             <p className="text-base text-stone-500 leading-relaxed max-w-sm">
               {safeT("tourInstance.createSubtitle", "Schedule a new occurrence from your package templates. Precision capacity and pricing.")}
             </p>
             
             <div className="mt-12 hidden md:block">
                <StepIndicator currentStep={currentStep} t={safeT} />
             </div>
          </div>

          <div className="mt-12 md:mt-0 animate-in fade-in duration-1000 delay-300">
            {prefillTourRequest && (
              <div className="rounded-[2rem] bg-blue-50/50 p-6 ring-1 ring-blue-100/50 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-100/50 text-blue-600 shrink-0">
                    <Icon icon="heroicons:document-text" className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900">
                      {safeT("tourInstance.prefillFromRequest", "Creating from Request")}
                    </p>
                    <p className="mt-1 text-xs text-blue-800">
                      {prefillTourRequest.customerName && (
                        <span className="font-medium">{prefillTourRequest.customerName} · </span>
                      )}
                      {prefillTourRequest.destination && (
                        <span>{prefillTourRequest.destination}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!prefillTourRequest && (
              <p className="text-[10px] uppercase tracking-[0.1em] font-bold text-stone-400">
                Pathora Platform • Tour Operations
              </p>
            )}
          </div>
        </div>

        {/* Right Interactive Pane (Scrollable) */}
        <div className="w-full md:w-[60%] px-6 py-12 md:p-16 md:py-24 max-h-[100dvh] overflow-y-auto no-scrollbar scroll-smooth">
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
              onCancel={() => router.push(instanceBasePath)}
              inputClassName={inputClassName}
              t={safeT}
            />
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
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
                instanceBasePath={instanceBasePath}
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
                seatCapacityBySupplierAndType={seatCapacityBySupplierAndType}
                updateActivityAssignment={updateActivityAssignment}
                editableItinerary={editableItinerary}
                onUpdateActivity={handleUpdateActivity}
                onDeleteActivity={handleDeleteActivity}
                onAddActivity={handleAddActivity}
                onToggleEditActivity={handleToggleEditActivity}
                activeLang={activeLang}
                setActiveLang={setActiveLang}
                inputClassName={inputClassName}
                t={safeT}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
