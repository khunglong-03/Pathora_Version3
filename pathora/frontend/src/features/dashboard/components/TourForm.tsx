"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";
import Checkbox from "@/components/ui/Checkbox";
import SearchableSelect from "@/components/ui/SearchableSelect";
import TourImageUpload from "@/components/ui/TourImageUpload";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import LanguageTabs, {
  type SupportedLanguage,
} from "@/components/ui/LanguageTabs";
import { pricingPolicyService } from "@/api/services/pricingPolicyService";
import { depositPolicyService } from "@/api/services/depositPolicyService";
import { cancellationPolicyService } from "@/api/services/cancellationPolicyService";

import { buildTourFormData } from "@/api/services/tourCreatePayload";
import type { PricingPolicy } from "@/types/pricingPolicy";
import type { DepositPolicy } from "@/types/depositPolicy";
import type { CancellationPolicy } from "@/types/cancellationPolicy";

import type { TourDto, ImageDto } from "@/types/tour";
import { TourStatusMap } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { formatCurrency } from "@/utils/format";

/* ── TourForm Props ─────────────────────────────────────────── */
export interface TourFormProps {
  mode: "create" | "edit";
  /** Pre-populated data from server for edit mode */
  initialData?: TourDto;
  /** Existing server images for edit mode (managed by parent) */
  existingImages?: ImageDto[];
  /**
   * Called when the form is submitted.
   * For create: calls tourService.createTour
   * For edit: calls tourService.updateTour with full FormData including id, existingImages, deleted IDs
   */
  onSubmit: (
    formData: FormData,
    deletedClassificationIds?: string[],
    deletedPlanIds?: string[],
    deletedActivityIds?: string[],
    lastModifiedOnUtc?: string,
  ) => Promise<void>;
  onCancel?: () => void;
  /** Show policy/policy selector sections (hide for TourDesigner role) */
  showPolicySections?: boolean;
}

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


  // Location — all activity types (replaces standalone Locations step)
  locationName: string;
  enLocationName: string;
  locationCity: string;
  enLocationCity: string;
  locationCountry: string;
  enLocationCountry: string;
  locationAddress: string;
  enLocationAddress: string;
  locationEntranceFee: string;

  // Transportation — type 7 (replaces standalone Transportation step)
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

  // Accommodation — type 8 (replaces standalone Accommodations step)
  // Phase 2: Supplier details (hotel name, contact, rooms, pricing) now handled at instance/provider selection time
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

interface ServiceForm {
  serviceName: string;
  enServiceName: string;
  pricingType: string;
  price: string;
  salePrice: string;
  email: string;
  contactNumber: string;
}

interface BasicInfoForm {
  tourName: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
  status: string;
  tourScope: string;
  isVisa: boolean;
  continent: string;
  customerSegment: string;
}

interface TranslationFields {
  tourName: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
}

/* ── Constants ──────────────────────────────────────────────── */
const PACKAGE_TYPE_OPTIONS = [
  { key: "standard", vi: "Tiêu chuẩn", en: "Standard" },
  { key: "premium", vi: "Cao cấp", en: "Premium" },
  { key: "luxury", vi: "Sang trọng", en: "Luxury" },
  { key: "budget", vi: "Tiết kiệm", en: "Budget" },
  { key: "vip", vi: "VIP", en: "VIP" },
];

const findPackageTypeOption = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  return PACKAGE_TYPE_OPTIONS.find(
    (option) =>
      option.key === normalized
      || option.vi.toLowerCase() === normalized
      || option.en.toLowerCase() === normalized,
  );
};

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

const PRICING_TYPE_OPTIONS = [
  { value: "0", label: "Per Person" },
  { value: "1", label: "Per Room" },
  { value: "2", label: "Per Group" },
  { value: "3", label: "Per Ride" },
  { value: "4", label: "Fixed Price" },
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

const INSURANCE_TYPE_OPTIONS = [
  { value: "0" },
  { value: "1" },
  { value: "2" },
  { value: "3" },
  { value: "4" },
  { value: "5" },
  { value: "6" },
];

const WIZARD_STEPS = [
  { key: "basic", label: "", icon: "heroicons:information-circle" },
  { key: "packages", label: "", icon: "heroicons:cube" },
  { key: "itineraries", label: "", icon: "heroicons:calendar-days" },
  // Accommodations, Locations, Transportation steps removed — data now embedded in activities
  { key: "services", label: "", icon: "heroicons:wrench-screwdriver" },
  { key: "insurance", label: "", icon: "heroicons:shield-check" },
  { key: "preview", label: "", icon: "heroicons:eye" },
];

/* ── URL validation helper ─────────────────────────────────── */
const isValidUrl = (value: string): boolean => {
  if (!value.trim()) return true; // empty is valid (field is optional)
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/* ── Empty form factories ───────────────────────────────────── */
const emptyClassification = (): ClassificationForm => ({
  name: "",
  enName: "",
  description: "",
  enDescription: "",
  basePrice: "",
  durationDays: "",
});

const emptyActivity = (): ActivityForm => ({
  activityType: "0",
  title: "",
  enTitle: "",
  description: "",
  enDescription: "",
  note: "",
  enNote: "",
  estimatedCost: "",
  isOptional: false,
  startTime: "",
  endTime: "",
  linkToResources: [""],

  // Location fields
  locationName: "",
  enLocationName: "",
  locationCity: "",
  enLocationCity: "",
  locationCountry: "",
  enLocationCountry: "",
  locationAddress: "",
  enLocationAddress: "",
  locationEntranceFee: "",
  // Transportation fields (type 7)
  fromLocation: "",
  enFromLocation: "",
  toLocation: "",
  enToLocation: "",
  transportationType: "0",
  enTransportationType: "",
  transportationName: "",
  enTransportationName: "",
  durationMinutes: "",
  price: "",
  // Accommodation fields (type 8) — Phase 2: Supplier details handled at instance time
});



const emptyDayPlan = (): DayPlanForm => ({
  dayNumber: "1",
  title: "",
  enTitle: "",
  description: "",
  enDescription: "",
  activities: [],
});

const syncPlansByDuration = (
  plans: DayPlanForm[],
  durationDays: string,
): DayPlanForm[] => {
  const targetDays = Number.parseInt(durationDays, 10);
  if (!Number.isFinite(targetDays) || targetDays <= 0) {
    return plans;
  }

  const normalizedPlans = plans.map((plan, dayIndex) => ({
    ...plan,
    dayNumber: String(dayIndex + 1),
  }));

  if (normalizedPlans.length === targetDays) {
    return normalizedPlans;
  }

  if (normalizedPlans.length > targetDays) {
    return normalizedPlans.slice(0, targetDays);
  }

  const missingCount = targetDays - normalizedPlans.length;
  const generatedPlans = Array.from({ length: missingCount }, (_, offset) => ({
    ...emptyDayPlan(),
    dayNumber: String(normalizedPlans.length + offset + 1),
  }));

  return [...normalizedPlans, ...generatedPlans];
};

const emptyInsurance = (): InsuranceForm => ({
  insuranceName: "",
  enInsuranceName: "",
  insuranceType: "1",
  insuranceProvider: "",
  coverageDescription: "",
  enCoverageDescription: "",
  coverageAmount: "",
  coverageFee: "",
  isOptional: false,
  note: "",
  enNote: "",
});

const emptyService = (): ServiceForm => ({
  serviceName: "",
  enServiceName: "",
  pricingType: "",
  price: "",
  salePrice: "",
  email: "",
  contactNumber: "",
});

/* ══════════════════════════════════════════════════════════════
   TourForm — Shell Component
   All state, handlers, validation, and wizard logic live here.
   ══════════════════════════════════════════════════════════════ */

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

/**
 * Mirrors backend TourClassificationEntity.RecalculateBasePrice:
 *  - Transportation (type "7"): price ?? estimatedCost ?? 0
 *  - Accommodation (type "8") and others: estimatedCost ?? 0
 *  - Optional activities are included; this form does not track soft-deleted
 *    activities (they are removed from the array on delete).
 */
const computeClassificationBasePrice = (plans: DayPlanForm[]): number => {
  let total = 0;
  for (const plan of plans) {
    for (const act of plan.activities) {
      const estimated = parseOptionalNumber(act.estimatedCost) ?? 0;
      if (act.activityType === "7") {
        const price = parseOptionalNumber(act.price);
        total += price ?? parseOptionalNumber(act.estimatedCost) ?? 0;
      } else {
        total += estimated;
      }
    }
  }
  return total;
};

const mapActivityType = (type: string | number): string => {
  if (typeof type === "number") return String(type);
  const map: Record<string, string> = {
    "Sightseeing": "0",
    "Dining": "1",
    "Shopping": "2",
    "Adventure": "3",
    "Relaxation": "4",
    "Cultural": "5",
    "Entertainment": "6",
    "Transportation": "7",
    "Accommodation": "8",
    "FreeTime": "9",
    "Other": "99"
  };
  return map[type] ?? String(type);
};

/* ══════════════════════════════════════════════════════════════
   Create Tour Page — Multi-step Wizard (5 Steps)
   Note: Accommodations, Locations, Transportation steps removed —
         their data is now embedded in activity forms.
   ══════════════════════════════════════════════════════════════ */
export default function TourForm({ mode, initialData, existingImages: initialExistingImages, onSubmit, onCancel, showPolicySections = true }: TourFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isManagerOrAdmin = (() => {
    const roles: string[] = (user as unknown as { roles?: string[] })?.roles ?? [];
    return roles.some((r) => r === "Manager" || r === "Admin");
  })();

  const isEditMode = mode === "edit";

  const wizardStepLabels = [
    t("tourAdmin.steps.basic"),
    t("tourAdmin.steps.packages"),
    t("tourAdmin.steps.itineraries"),
    // Accommodations, Locations, Transportation steps removed
    t("tourAdmin.steps.services"),
    t("tourAdmin.steps.insurance"),
    t("tourAdmin.steps.preview"),
  ];

  const activityTypes = [
    t("tourAdmin.activityTypes.0"),
    t("tourAdmin.activityTypes.1"),
    t("tourAdmin.activityTypes.2"),
    t("tourAdmin.activityTypes.3"),
    t("tourAdmin.activityTypes.4"),
    t("tourAdmin.activityTypes.5"),
    t("tourAdmin.activityTypes.6"),
    t("tourAdmin.activityTypes.7"),
    t("tourAdmin.activityTypes.8"),
    t("tourAdmin.activityTypes.9"),
    t("tourAdmin.activityTypes.99"),
  ];

  const insuranceTypes = [
    t("tourAdmin.insuranceTypes.0"),
    t("tourAdmin.insuranceTypes.1"),
    t("tourAdmin.insuranceTypes.2"),
    t("tourAdmin.insuranceTypes.3"),
    t("tourAdmin.insuranceTypes.4"),
    t("tourAdmin.insuranceTypes.5"),
    t("tourAdmin.insuranceTypes.6"),
  ];

  const transportationTypes = [
    t("tourAdmin.transportationTypes.0"),
    t("tourAdmin.transportationTypes.1"),
    t("tourAdmin.transportationTypes.2"),
    t("tourAdmin.transportationTypes.3"),
    t("tourAdmin.transportationTypes.4"),
    t("tourAdmin.transportationTypes.5"),
    t("tourAdmin.transportationTypes.6"),
    t("tourAdmin.transportationTypes.7"),
    t("tourAdmin.transportationTypes.8"),
    t("tourAdmin.transportationTypes.9"),
    t("tourAdmin.transportationTypes.99"),
  ];

  /* ── Wizard state ─────────────────────────────────────────── */
  const [currentStep, setCurrentStep] = useState(0);
  const [maxNavigableStep, setMaxNavigableStep] = useState(0);
  const [saving, setSaving] = useState(false);

  /* ── Step 1: Basic Info ───────────────────────────────────── */
  const [activeLang, setActiveLang] = useState<SupportedLanguage>("vi");

  const [basicInfo, setBasicInfo] = useState<BasicInfoForm>({
    tourName: "",
    shortDescription: "",
    longDescription: "",
    seoTitle: "",
    seoDescription: "",
    status: "3",
    tourScope: "1",
    isVisa: false,
    continent: "",
    customerSegment: "2",
  });
  const [enTranslation, setEnTranslation] = useState<TranslationFields>({
    tourName: "",
    shortDescription: "",
    longDescription: "",
    seoTitle: "",
    seoDescription: "",
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<ImageDto | null>(null);
  const [images, setImages] = useState<File[]>([]);

  /* ── Delete Confirmation (Edit Mode) ─────────────────────── */
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "classification" | "dayPlan" | "activity";
    index1: number;
    index2?: number;
    index3?: number;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "classification") {
      removeClassification(confirmDelete.index1);
    } else if (confirmDelete.type === "dayPlan") {
      removeDayPlan(confirmDelete.index1, confirmDelete.index2!);
    } else if (confirmDelete.type === "activity") {
      removeActivity(confirmDelete.index1, confirmDelete.index2!, confirmDelete.index3!);
    }
    setConfirmDelete(null);
  };

  /* ── Step 2: Classifications ──────────────────────────────── */
  const [classifications, setClassifications] = useState<ClassificationForm[]>([
    emptyClassification(),
  ]);

  /* ── Step 3: Day Plans (per classification) ───────────────── */
  const [dayPlans, setDayPlans] = useState<DayPlanForm[][]>([[]]);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);

  /* ── Step 8: Insurance (per classification) ───────────────── */
  const [insurances, setInsurances] = useState<InsuranceForm[][]>([[]]);

  /* ── Step 7: Services ─────────────────────────────────────── */
  const [services, setServices] = useState<ServiceForm[]>([emptyService()]);



  /* ── Policies ──────────────────────────────────────────── */

  const [selectedPricingPolicyId, setSelectedPricingPolicyId] = useState<string>("");
  const [selectedDepositPolicyId, setSelectedDepositPolicyId] = useState<string>("");
  const [selectedCancellationPolicyId, setSelectedCancellationPolicyId] = useState<string>("");

  /* ── Edit mode state ──────────────────────────────────────── */
  // Existing server images — initialized from prop, parent can manage removals
  const [existingImages, setExistingImages] = useState<ImageDto[]>(
    initialExistingImages ?? [],
  );
  // Track deleted IDs for cascade soft-delete
  const [deletedClassificationIds, setDeletedClassificationIds] = useState<string[]>([]);
  const [deletedPlanIds, setDeletedPlanIds] = useState<string[]>([]);
  const [deletedActivityIds, setDeletedActivityIds] = useState<string[]>([]);

  /* ── Auto-save draft ────────────────────────────────────────── */
  const AUTOSAVE_KEY = "tour_create_draft";

  const saveDraft = useCallback(() => {
    try {
      const draftData = {
        basicInfo,
        classifications,
        dayPlans,
        insurances,
        services,
        // NOTE: accommodations, locations, transportations removed — data now in activities
        selectedPricingPolicyId,
        selectedDepositPolicyId,
        selectedCancellationPolicyId,
        currentStep,
        thumbnail: thumbnail ? { name: thumbnail.name, size: thumbnail.size, type: thumbnail.type } : null,
        imagesCount: images.length,
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draftData));
    } catch {
      // localStorage full or unavailable
    }
  }, [basicInfo, classifications, dayPlans, insurances, services,
      selectedPricingPolicyId, selectedDepositPolicyId,
      selectedCancellationPolicyId,
      currentStep, thumbnail, images.length]);

  // Auto-save draft — create mode only
  useEffect(() => {
    if (isEditMode) return;
    const timeoutId = setTimeout(saveDraft, 180000); // 3 minutes
    return () => clearTimeout(timeoutId);
  }, [saveDraft, isEditMode]);

  // Load draft on mount — create mode only
  useEffect(() => {
    if (isEditMode) return;
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (!draft.basicInfo) return;
      const confirmed = window.confirm(
        t("toast.draftRestoreConfirm", "A draft was found from your previous session. Do you want to restore it?"),
      );
      if (confirmed) {
        setBasicInfo({ ...draft.basicInfo, isVisa: Boolean(draft.basicInfo.isVisa) });
        if (draft.selectedPricingPolicyId) setSelectedPricingPolicyId(draft.selectedPricingPolicyId);
        if (draft.selectedDepositPolicyId) setSelectedDepositPolicyId(draft.selectedDepositPolicyId);
        if (draft.selectedCancellationPolicyId) setSelectedCancellationPolicyId(draft.selectedCancellationPolicyId);
        if (draft.currentStep !== undefined) setCurrentStep(draft.currentStep);
        toast.info(t("toast.draftRestored", "Draft restored from previous session"));
      } else {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    } catch {
      // Invalid draft data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize form from initialData in edit mode
  useEffect(() => {
    if (!isEditMode || !initialData) return;

    const tour = initialData;
    const statusStr = String(tour.status ?? "3");

    setBasicInfo({
      tourName: tour.tourName ?? "",
      shortDescription: tour.shortDescription ?? "",
      longDescription: tour.longDescription ?? "",
      seoTitle: tour.seoTitle ?? "",
      seoDescription: tour.seoDescription ?? "",
      status: statusStr,
      tourScope: tour.tourScope != null ? String(tour.tourScope) : "1",
      isVisa: tour.tourScope != null && String(tour.tourScope) === "2" ? Boolean(tour.isVisa) : false,
      continent: tour.continent != null ? String(tour.continent) : "",
      customerSegment: tour.customerSegment != null ? String(tour.customerSegment) : "2",
    });

    setExistingThumbnail(tour.thumbnail ?? null);

    if (tour.translations?.en) {
      setEnTranslation({
        tourName: tour.translations.en.tourName ?? "",
        shortDescription: tour.translations.en.shortDescription ?? "",
        longDescription: tour.translations.en.longDescription ?? "",
        seoTitle: tour.translations.en.seoTitle ?? "",
        seoDescription: tour.translations.en.seoDescription ?? "",
      });
    }

    if (tour.classifications && tour.classifications.length > 0) {
      const clsForms: ClassificationForm[] = tour.classifications.map((cls) => ({
        id: cls.id,
        name: cls.name ?? "",
        enName: cls.translations?.en?.name ?? "",
        description: cls.description ?? "",
        enDescription: cls.translations?.en?.description ?? "",
        basePrice: String(cls.basePrice ?? cls.price ?? ""),
        durationDays: String(cls.durationDays ?? ""),
      }));
      setClassifications(clsForms);

      const dayPlansForms: DayPlanForm[][] = tour.classifications.map((cls) =>
        (cls.plans ?? []).map((day) => ({
          id: day.id,
          dayNumber: String(day.dayNumber),
          title: day.title ?? "",
          enTitle: day.translations?.en?.title ?? "",
          description: day.description ?? "",
          enDescription: day.translations?.en?.description ?? "",
          activities: (day.activities ?? []).map((act) => ({
            id: act.id,
            activityType: mapActivityType(act.activityType),
            title: act.title ?? "",
            enTitle: act.translations?.en?.title ?? "",
            description: act.description ?? "",
            enDescription: act.translations?.en?.description ?? "",
            note: act.note ?? "",
            enNote: act.translations?.en?.note ?? "",
            estimatedCost: String(act.estimatedCost ?? act.price ?? ""),
            isOptional: act.isOptional ?? false,
            startTime: act.startTime ?? "",
            endTime: act.endTime ?? "",
            linkToResources: [""],
            // Location fields — all activity types
            locationName: act.accommodation?.accommodationName ?? act.locationName ?? "",
            enLocationName: act.accommodation?.translations?.en?.accommodationName ?? "",
            locationCity: act.locationCity ?? "",
            enLocationCity: "",
            locationCountry: act.locationCountry ?? "",
            enLocationCountry: "",
            locationAddress: act.accommodation?.address ?? act.locationAddress ?? "",
            enLocationAddress: act.accommodation?.translations?.en?.address ?? "",
            locationEntranceFee: String(act.locationEntranceFee ?? ""),
            // Transportation fields — type 7
            fromLocation: act.fromLocationName ?? "",
            enFromLocation: act.translations?.en?.fromLocationName ?? "",
            toLocation: act.toLocationName ?? "",
            enToLocation: act.translations?.en?.toLocationName ?? "",
            transportationType: act.transportationType ?? "0",
            enTransportationType: act.translations?.en?.transportationType ?? "",
            transportationName: act.transportationName ?? "",
            enTransportationName: act.translations?.en?.transportationName ?? "",
            durationMinutes: String(act.durationMinutes ?? ""),
            price: String(act.price ?? ""),
            // Accommodation fields — type 8 — Phase 2: Supplier details handled at instance time
          })),
        })),
      );
      setDayPlans(dayPlansForms);

      const insForms: InsuranceForm[][] = tour.classifications.map((cls) =>
        (cls.insurances ?? []).map((ins) => ({
          id: ins.id,
          insuranceName: ins.insuranceName ?? "",
          enInsuranceName: "",
          insuranceType: String(ins.insuranceType),
          insuranceProvider: ins.insuranceProvider ?? "",
          coverageDescription: ins.coverageDescription ?? "",
          enCoverageDescription: "",
          coverageAmount: String(ins.coverageAmount ?? ""),
          coverageFee: String(ins.coverageFee ?? ""),
          isOptional: ins.isOptional ?? false,
          note: ins.note ?? "",
          enNote: "",
        })),
      );
      setInsurances(insForms);
    }



    // Initialize services from tour data
    if (tour.services && tour.services.length > 0) {
      const svcForms: ServiceForm[] = tour.services.map((svc) => ({
        serviceName: svc.serviceName ?? "",
        enServiceName: svc.translations?.en?.name ?? "",
        pricingType: svc.pricingType ?? "",
        price: svc.price != null ? String(svc.price) : "",
        salePrice: svc.salePrice != null ? String(svc.salePrice) : "",
        email: svc.email ?? "",
        contactNumber: svc.contactNumber ?? "",
      }));
      setServices(svcForms);
    }
  }, [isEditMode, initialData]);

  /* ── Validation ───────────────────────────────────────────── */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [thumbnailError, setThumbnailError] = useState<string>();
  const [imagesError, setImagesError] = useState<string>();



  const collectStepErrors = (
    step: number,
    packageIndexOverride?: number,
  ): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    const activePackageIndex = packageIndexOverride ?? ci;

    if (step === 0) {
      if (!basicInfo.tourName.trim())
        newErrors.tourName = t("tourAdmin.required", "Required");
      if (!basicInfo.shortDescription.trim())
        newErrors.shortDescription = t("tourAdmin.required", "Required");
      if (!basicInfo.longDescription.trim())
        newErrors.longDescription = t("tourAdmin.required", "Required");
      if (thumbnailError) newErrors.thumbnail = thumbnailError;
      if (images.length === 0 && existingImages.length === 0) newErrors.images = t("tourAdmin.validation.atLeastOneImage", "At least one image is required");
      else if (imagesError) newErrors.images = imagesError;
    }

    if (step === 1) {
      if (classifications.length === 0) {
        newErrors.classifications = t("tourAdmin.validation.atLeastOnePackage", "At least one package is required.");
      }
      classifications.forEach((cls, i) => {
        if (!cls.name.trim())
          newErrors[`cls_${i}_name`] = t("tourAdmin.required", "Required");
        if (!cls.description.trim())
          newErrors[`cls_${i}_description`] = t("tourAdmin.required", "Required");
        if (!cls.durationDays || Number(cls.durationDays) <= 0)
          newErrors[`cls_${i}_duration`] = t(
            "tourAdmin.invalidDuration",
            "Invalid duration",
          );
        // basePrice is auto-derived from activity costs — no manual-input validation.
      });
    }

    if (step === 2) {
      const plans = dayPlans[activePackageIndex] ?? [];
      if (plans.length === 0) {
        newErrors.dayPlans = t("tourAdmin.validation.atLeastOneDayPlan", "At least one day plan is required.");
      }

      // Day count must match classification.durationDays
      const durationDays = Number(classifications[activePackageIndex]?.durationDays ?? 0);
      if (Number.isFinite(durationDays) && durationDays > 0 && plans.length !== durationDays) {
        newErrors[`cls_${activePackageIndex}_dayCountMismatch`] = t(
          "tourAdmin.validation.dayCountMustMatchDuration",
          "Day count must match configured duration: {{expected}} days (currently {{actual}})",
          { expected: durationDays, actual: plans.length },
        );
      }

      plans.forEach((plan, i) => {
        if (!plan.title.trim())
          newErrors[`plan_${i}_title`] = t("tourAdmin.required", "Required");
        if (!plan.description.trim())
          newErrors[`plan_${i}_description`] = t("tourAdmin.required", "Required");
      });

      plans.forEach((plan, planIdx) => {
        // Min 1 activity per day — skip per-activity checks if day is empty
        if (plan.activities.length === 0) {
          newErrors[`day_${planIdx}_empty`] = t(
            "tourAdmin.validation.minOneActivityPerDay",
            "Day {{day}} needs at least 1 activity",
            { day: planIdx + 1 },
          );
          return;
        }

        plan.activities.forEach((act, actIdx) => {
          // Validate estimatedCost: optional, but if provided must be >= 0
          if (act.estimatedCost.trim()) {
            const cost = Number(act.estimatedCost);
            if (Number.isNaN(cost) || cost < 0) {
              newErrors[`act_${planIdx}_${actIdx}_estimatedCost`] = t(
                "tourAdmin.validation.invalidEstimatedCost",
                "Estimated cost must be 0 or greater",
              );
            }
          }

          // Validate startTime and endTime: both required; endTime must be after startTime (no overnight)
          if (!act.startTime.trim()) {
            newErrors[`act_${planIdx}_${actIdx}_startTime`] = t(
              "tourAdmin.itineraries.startTimeRequired",
              "Start time is required",
            );
          }
          if (!act.endTime.trim()) {
            newErrors[`act_${planIdx}_${actIdx}_endTime`] = t(
              "tourAdmin.itineraries.endTimeRequired",
              "End time is required",
            );
          }
          if (act.startTime.trim() && act.endTime.trim()) {
            if (act.endTime <= act.startTime) {
              newErrors[`act_${planIdx}_${actIdx}_endTime`] = t(
                "tourAdmin.validation.activityOvernight",
                "Activity cannot span overnight (End time must be after Start time within the same day)",
              );
            }
          }

          act.linkToResources.forEach((link, linkIdx) => {
            if (link.trim() && !isValidUrl(link)) {
              newErrors[`link_${planIdx}_${actIdx}_${linkIdx}`] = t(
                "tourAdmin.validation.invalidLinkUrl",
                "Please enter a valid URL starting with http:// or https://",
              );
            }
          });

          // Validate type-7 (transportation) required fields
          if (act.activityType === "7") {
            if (!act.fromLocation.trim())
              newErrors[`act_${planIdx}_${actIdx}_fromLocation`] = t("tourAdmin.required", "Required");
            if (!act.toLocation.trim())
              newErrors[`act_${planIdx}_${actIdx}_toLocation`] = t("tourAdmin.required", "Required");
          }

          // Validate type-8 (accommodation) — Phase 2: Supplier details handled at instance time
          // No form validation needed for accommodation activities anymore
        });

        // Cross-activity time ordering: no overlap when sorted by startTime
        const timed = plan.activities
          .map((act, origIdx) => ({ act, origIdx }))
          .filter(({ act }) => act.startTime.trim() && act.endTime.trim() && act.endTime > act.startTime);
        timed.sort((a, b) => a.act.startTime.localeCompare(b.act.startTime));
        for (let i = 1; i < timed.length; i += 1) {
          const prev = timed[i - 1].act;
          const curr = timed[i];
          if (curr.act.startTime < prev.endTime) {
            newErrors[`act_${planIdx}_${curr.origIdx}_startTime`] = t(
              "tourAdmin.validation.activityOverlap",
              "This activity overlaps with the previous one (ends at {{prevEnd}})",
              { prevEnd: prev.endTime },
            );
          }
        }
      });
    }

    if (step === 3) {
      // Step 3 = Services (was step 6)
      services.forEach((svc, i) => {
        const hasAnyField = svc.serviceName.trim() || svc.enServiceName.trim() || svc.pricingType.trim() || svc.price.trim() || svc.salePrice.trim() || svc.email.trim() || svc.contactNumber.trim();
        if (hasAnyField) {
          if (!svc.serviceName.trim())
            newErrors[`svc_${i}_name`] = t("tourAdmin.required", "Required");
          if (!svc.pricingType.trim())
            newErrors[`svc_${i}_pricingType`] = t("tourAdmin.required", "Required");
        }
      });
    }

    if (step === 4) {
      // Insurance is optional, but if provided, validate required fields
      const insurancesForClass = insurances[activePackageIndex] ?? [];
      insurancesForClass.forEach((ins, i) => {
        if (ins.insuranceName.trim() || ins.enInsuranceName.trim()) {
          if (!ins.insuranceName.trim())
            newErrors[`ins_${i}_name`] = t("tourAdmin.required", "Required");
          if (!ins.coverageDescription.trim())
            newErrors[`ins_${i}_coverage`] = t("tourAdmin.required", "Required");
          const amount = Number(ins.coverageAmount);
          if (!ins.coverageAmount.trim() || isNaN(amount) || amount <= 0)
            newErrors[`ins_${i}_amount`] = t(
              "tourAdmin.validation.invalidCoverageAmount",
              "Invalid coverage amount",
            );
        }
      });
    }

    return newErrors;
  };

  const validateStep = (step: number, packageIndexOverride?: number): boolean => {
    const newErrors = collectStepErrors(step, packageIndexOverride);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time field validation on blur
  const validateField = (field: string, value: string, isOptional = false) => {
    const trimmed = value.trim();
    if (!isOptional && !trimmed) {
      setErrors((prev) => ({ ...prev, [field]: t("tourAdmin.required", "Required") }));
    } else {
      setErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setThumbnailError(undefined);
      setImagesError(undefined);
      const nextStep = Math.min(currentStep + 1, WIZARD_STEPS.length - 1);
      setCurrentStep(nextStep);
      setMaxNavigableStep((max) => Math.max(max, nextStep));
    } else {
      toast.error(t("tourAdmin.validation.pleaseFixErrors", "Please fix validation errors before proceeding."));
    }
  };

  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  /* ── Classification CRUD ──────────────────────────────────── */
  const addClassification = () => {
    setClassifications((prev) => [...prev, emptyClassification()]);
    setDayPlans((prev) => [...prev, []]);
    setInsurances((prev) => [...prev, []]);
  };

  const removeClassification = (index: number) => {
    if (classifications.length <= 1) return;
    const deletedId = classifications[index]?.id;
    if (deletedId) {
      setDeletedClassificationIds((prev) => [...prev, deletedId]);
    }
    setClassifications((prev) => prev.filter((_, i) => i !== index));
    setDayPlans((prev) => prev.filter((_, i) => i !== index));
    setInsurances((prev) => prev.filter((_, i) => i !== index));
  };

  const updateClassification = (
    index: number,
    field: keyof ClassificationForm,
    value: string,
  ) => {
    setClassifications((prev) =>
      prev.map((cls, i) => (i === index ? { ...cls, [field]: value } : cls)),
    );

    if (field === "durationDays") {
      setDayPlans((prev) =>
        prev.map((plans, i) => {
          if (i !== index) {
            return plans;
          }

          return syncPlansByDuration(plans, value);
        }),
      );
    }
  };

  useEffect(() => {
    setDayPlans((prev) =>
      classifications.map((classification, index) =>
        syncPlansByDuration(prev[index] ?? [], classification.durationDays),
      ),
    );
  }, [classifications]);

  // Auto-derive each classification's basePrice from the sum of its activity costs.
  // Mirrors the authoritative server-side calculation in RecalculateBasePrice.
  useEffect(() => {
    setClassifications((prev) => {
      let changed = false;
      const next = prev.map((cls, i) => {
        const computed = String(computeClassificationBasePrice(dayPlans[i] ?? []));
        if (cls.basePrice === computed) return cls;
        changed = true;
        return { ...cls, basePrice: computed };
      });
      return changed ? next : prev;
    });
  }, [dayPlans]);

  const updateClassificationPackageTypeVi = (index: number, value: string) => {
    const option = findPackageTypeOption(value);
    if (!option) {
      updateClassification(index, "name", value);
      return;
    }

    setClassifications((prev) =>
      prev.map((cls, i) =>
        i === index
          ? { ...cls, name: option.vi, enName: option.en }
          : cls,
      ),
    );
  };

  const updateClassificationPackageTypeEn = (index: number, value: string) => {
    const option = findPackageTypeOption(value);
    if (!option) {
      updateClassification(index, "enName", value);
      return;
    }

    setClassifications((prev) =>
      prev.map((cls, i) =>
        i === index
          ? { ...cls, name: option.vi, enName: option.en }
          : cls,
      ),
    );
  };

  /* ── Day Plan CRUD ────────────────────────────────────────── */
  const addDayPlan = (clsIndex: number) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? [
              ...plans,
              {
                ...emptyDayPlan(),
                dayNumber: String(plans.length + 1),
              },
            ]
          : plans,
      ),
    );
  };

  const removeDayPlan = (clsIndex: number, dayIndex: number) => {
    setDayPlans((prev) => {
      const removedPlan = prev[clsIndex][dayIndex];
      if (removedPlan.id) {
        setDeletedPlanIds((ids) => [...ids, removedPlan.id!]);
      }
      return prev.map((plans, i) =>
        i === clsIndex ? plans.filter((_, j) => j !== dayIndex) : plans,
      );
    });
  };

  const updateDayPlan = (
    clsIndex: number,
    dayIndex: number,
    field: keyof DayPlanForm,
    value: string,
  ) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? plans.map((day, j) =>
              j === dayIndex ? { ...day, [field]: value } : day,
            )
          : plans,
      ),
    );
  };

  /* ── Activity CRUD ────────────────────────────────────────── */
  const addActivity = (clsIndex: number, dayIndex: number) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? plans.map((day, j) =>
              j === dayIndex
                ? { ...day, activities: [...day.activities, emptyActivity()] }
                : day,
            )
          : plans,
      ),
    );
  };

  const removeActivity = (
    clsIndex: number,
    dayIndex: number,
    actIndex: number,
  ) => {
    // Track deleted activity ID for cascade soft-delete
    const deletedId = dayPlans[clsIndex]?.[dayIndex]?.activities[actIndex]?.id;
    if (deletedId) {
      setDeletedActivityIds((prev) => [...prev, deletedId]);
    }
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? plans.map((day, j) =>
              j === dayIndex
                ? {
                    ...day,
                    activities: day.activities.filter((_, k) => k !== actIndex),
                  }
                : day,
            )
          : plans,
      ),
    );
  };

  const updateActivity = (
    clsIndex: number,
    dayIndex: number,
    actIndex: number,
    field: keyof ActivityForm,
    value: string | boolean,
  ) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? plans.map((day, j) =>
              j === dayIndex
                ? {
                    ...day,
                    activities: day.activities.map((act, k) =>
                      k === actIndex ? { ...act, [field]: value } : act,
                    ),
                  }
                : day,
            )
          : plans,
      ),
    );
  };




  /* ── Insurance CRUD ───────────────────────────────────────── */
  const addInsurance = (clsIndex: number) => {
    setInsurances((prev) =>
      prev.map((insList, i) =>
        i === clsIndex ? [...insList, emptyInsurance()] : insList,
      ),
    );
  };

  const removeInsurance = (clsIndex: number, insIndex: number) => {
    setInsurances((prev) =>
      prev.map((insList, i) =>
        i === clsIndex ? insList.filter((_, j) => j !== insIndex) : insList,
      ),
    );
  };

  const updateInsurance = (
    clsIndex: number,
    insIndex: number,
    field: keyof InsuranceForm,
    value: string | boolean,
  ) => {
    setInsurances((prev) =>
      prev.map((insList, i) =>
        i === clsIndex
          ? insList.map((ins, j) =>
              j === insIndex ? { ...ins, [field]: value } : ins,
            )
          : insList,
      ),
    );
  };

  /* ── Link to Resources CRUD ─────────────────────────────────── */
  const addLinkToResource = (
    clsIndex: number,
    dayIndex: number,
    actIndex: number,
  ) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? plans.map((day, j) =>
              j === dayIndex
                ? {
                    ...day,
                    activities: day.activities.map((act, k) =>
                      k === actIndex
                        ? {
                            ...act,
                            linkToResources: [...act.linkToResources, ""],
                          }
                        : act,
                    ),
                  }
                : day,
            )
          : plans,
      ),
    );
  };

  const updateLinkToResource = (
    clsIndex: number,
    dayIndex: number,
    actIndex: number,
    linkIndex: number,
    value: string,
  ) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? plans.map((day, j) =>
              j === dayIndex
                ? {
                    ...day,
                    activities: day.activities.map((act, k) =>
                      k === actIndex
                        ? {
                            ...act,
                            linkToResources: act.linkToResources.map(
                              (link, l) => (l === linkIndex ? value : link),
                            ),
                          }
                        : act,
                    ),
                  }
                : day,
            )
          : plans,
      ),
    );
  };

  const removeLinkToResource = (
    clsIndex: number,
    dayIndex: number,
    actIndex: number,
    linkIndex: number,
  ) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? plans.map((day, j) =>
              j === dayIndex
                ? {
                    ...day,
                    activities: day.activities.map((act, k) =>
                      k === actIndex
                        ? {
                            ...act,
                            linkToResources: act.linkToResources.filter(
                              (_, l) => l !== linkIndex,
                            ),
                          }
                        : act,
                    ),
                  }
                : day,
            )
          : plans,
      ),
    );
  };

  /* ── Service CRUD ─────────────────────────────────────────── */
  const addService = () => {
    setServices((prev) => [...prev, emptyService()]);
  };

  const removeService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const updateService = (
    index: number,
    field: keyof ServiceForm,
    value: string,
  ) => {
    setServices((prev) =>
      prev.map((svc, i) => (i === index ? { ...svc, [field]: value } : svc)),
    );
    
    // Real-time validation clearing
    if (field === "serviceName") {
      if (value.trim()) {
        setErrors((prev) => {
          const { [`svc_${index}_name`]: _, ...rest } = prev;
          return rest;
        });
      }
    }
    if (field === "pricingType") {
      if (value.trim()) {
        setErrors((prev) => {
          const { [`svc_${index}_pricingType`]: _, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  /* ── Submit ───────────────────────────────────────────────── */
  const handleSubmit = async () => {
    const stepIndices = WIZARD_STEPS.map((_, i) => i);
    let firstInvalidStep: number | undefined;
    let firstInvalidPackageIndex: number | undefined;
    let firstInvalidErrors: Record<string, string> = {};

    for (const step of stepIndices) {
      if (step === 2 || step === 4) {
        for (let packageIndex = 0; packageIndex < classifications.length; packageIndex += 1) {
          const stepErrors = collectStepErrors(step, packageIndex);
          if (Object.keys(stepErrors).length > 0) {
            firstInvalidStep = step;
            firstInvalidPackageIndex = packageIndex;
            firstInvalidErrors = stepErrors;
            break;
          }
        }

        if (firstInvalidStep !== undefined) {
          break;
        }
        continue;
      }

      const stepErrors = collectStepErrors(step);
      if (Object.keys(stepErrors).length > 0) {
        firstInvalidStep = step;
        firstInvalidErrors = stepErrors;
        break;
      }
    }

    if (firstInvalidStep !== undefined) {
      if (firstInvalidPackageIndex !== undefined) {
        setSelectedPackageIndex(firstInvalidPackageIndex);
      }
      setErrors(firstInvalidErrors);
      setCurrentStep(firstInvalidStep);
      console.warn("[CreateTour] Validation failed before publish", {
        currentStep,
        maxNavigableStep,
        firstInvalidStep,
        firstInvalidPackageIndex,
        firstInvalidErrorKeys: Object.keys(firstInvalidErrors),
        selectedPackageIndex,
        classificationsCount: classifications.length,
        dayPlanCounts: dayPlans.map((plans) => plans.length),
        insuranceCounts: insurances.map((items) => items.length),
        imagesCount: images.length,
        hasThumbnail: Boolean(thumbnail),
      });
      toast.error(
        t(
          "tourAdmin.validation.completeAllSteps",
          "Please complete all required fields before publishing",
        ),
      );
      return;
    }

    try {
      setSaving(true);
      const formData = buildTourFormData({
        mode: isEditMode ? "edit" : "create",
        basicInfo,
        thumbnail,
        images,
        vietnameseTranslation: {
          tourName: basicInfo.tourName,
          shortDescription: basicInfo.shortDescription,
          longDescription: basicInfo.longDescription,
          seoTitle: basicInfo.seoTitle,
          seoDescription: basicInfo.seoDescription,
        },
        englishTranslation: enTranslation,
        classifications,
        dayPlans,
        insurances,
        services,
      });

      // In edit mode, append id and management fields to FormData
      if (isEditMode) {
        if (initialData?.id) {
          formData.append("id", initialData.id);
        }
        const preservedImages = existingImages
          .filter((img) => img.fileId && img.publicURL)
          .map((img) => ({
            fileId: img.fileId,
            originalFileName: img.originalFileName ?? "",
            fileName: img.fileName ?? "",
            publicURL: img.publicURL,
          }));
        formData.append("existingImages", JSON.stringify(preservedImages));
        if (deletedClassificationIds.length > 0) {
          formData.append("deletedClassificationIds", JSON.stringify(deletedClassificationIds));
        }
        if (deletedPlanIds.length > 0) {
          formData.append("deletedPlanIds", JSON.stringify(deletedPlanIds));
        }
        if (deletedActivityIds.length > 0) {
          formData.append("deletedActivityIds", JSON.stringify(deletedActivityIds));
        }
      }

      await onSubmit(
        formData, 
        deletedClassificationIds, 
        deletedPlanIds,
        deletedActivityIds, 
        isEditMode ? initialData?.lastModifiedOnUtc : undefined
      );

      // Only clear draft in create mode
      if (!isEditMode) {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    } catch (error: unknown) {
      // Only show toast for edit mode — create mode toast is handled by the page's onSubmit
      if (isEditMode) {
        const handledError = handleApiError(error);
        const errorDetail = handledError.details || handledError.message;
        const displayMsg = errorDetail && errorDetail !== "DEFAULT_ERROR"
          ? errorDetail
          : t("tourAdmin.updateError", "Failed to update tour");
        console.error("Failed to update tour:", errorDetail);
        toast.error(displayMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  /* ══════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════ */
  const ci = selectedPackageIndex;

  useEffect(() => {
    setSelectedPackageIndex((prev) => {
      if (classifications.length === 0) {
        return 0;
      }

      return Math.min(prev, classifications.length - 1);
    });
  }, [classifications.length]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
      {/* Full-screen saving overlay */}
      {saving && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
            <Icon icon="heroicons:arrow-path" className="size-12 text-orange-500 animate-spin" />
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              {isEditMode
                ? t("tourAdmin.updatingTour", "Updating tour...")
                : t("tourAdmin.creatingTour", "Creating tour...")}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              {isEditMode
                ? t("tourAdmin.updatingTourHint", "Please wait while we update your tour.")
                : t("tourAdmin.creatingTourHint", "Please wait while we publish your tour.")}
            </p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditMode
                ? t("tourAdmin.editPage.title", "Edit Tour")
                : t("tourAdmin.createPage.title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("tourAdmin.createPage.stepOf", { current: currentStep + 1, total: WIZARD_STEPS.length })}
            </p>
          </div>
          <div className="flex items-center gap-2 pr-16 lg:pr-20">
            <button
              onClick={() => onCancel?.()}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50">
              {t("tourAdmin.createPage.cancel")}
            </button>
            {!isEditMode && (
              <button
                onClick={() => {
                  saveDraft();
                  toast.success(t("toast.draftSaved", "Draft saved"));
                }}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors disabled:opacity-50">
                {t("tourAdmin.createPage.saveDraft")}
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              {saving && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="size-4 animate-spin"
                />
              )}
              {isEditMode
                ? t("tourAdmin.editPage.updateTour", "Update Tour")
                : t("tourAdmin.createPage.publishTour")}
            </button>
          </div>
        </div>
      </header>

        {/* Stepper */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {WIZARD_STEPS.map((step, i) => (
              <React.Fragment key={step.key}>
                {i > 0 && (
                  <div
                    className={`hidden sm:block h-px w-6 shrink-0 ${
                      i <= currentStep
                        ? "bg-orange-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (i <= maxNavigableStep) setCurrentStep(i);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    i === currentStep
                      ? "bg-orange-500 text-white"
                      : i < currentStep
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-500/30"
                        : i <= maxNavigableStep
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-500/30"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                  }`}
                  disabled={i > maxNavigableStep}>
                  {i < currentStep ? (
                    <Icon icon="heroicons:check" className="size-3.5" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                      {i + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{wizardStepLabels[i]}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 sm:p-6 max-w-5xl">
          {/* ── Step 1: Basic Info ───────────────────────────── */}
          {currentStep === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                {t("tourAdmin.basicInfo.sectionTitle")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {t("tourAdmin.basicInfo.sectionSubtitle")}
              </p>

              {/* Language Tabs */}
              <div className="mb-5">
                <LanguageTabs
                  activeLanguage={activeLang}
                  onChange={setActiveLang}
                />
                <p className="text-xs text-slate-400 mt-2">
                  {t("tourAdmin.langTabs.translationHint")}
                </p>
              </div>

              {/* Tour Scope + Customer Segment — shared (not translatable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("tourAdmin.tourScope.label")}
                  </label>
                  <select
                    value={basicInfo.tourScope}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({
                        ...prev,
                        tourScope: e.target.value,
                        continent: e.target.value === "1" ? "" : prev.continent,
                        isVisa: e.target.value === "1" ? false : prev.isVisa,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  >
                    <option value="1">{t("tourAdmin.tourScope.domestic")}</option>
                    <option value="2">{t("tourAdmin.tourScope.international")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("tourAdmin.customerSegment.label")}
                  </label>
                  <select
                    value={basicInfo.customerSegment}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({ ...prev, customerSegment: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  >
                    <option value="1">{t("tourAdmin.customerSegment.individual")}</option>
                    <option value="2">{t("tourAdmin.customerSegment.group")}</option>
                    <option value="3">{t("tourAdmin.customerSegment.family")}</option>
                    <option value="4">{t("tourAdmin.customerSegment.corporate")}</option>
                  </select>
                </div>
              </div>

              {/* Continent — only visible when International */}
              {basicInfo.tourScope === "2" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("tourAdmin.continent.label")}
                  </label>
                  <select
                    value={basicInfo.continent}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({ ...prev, continent: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  >
                    <option value="">{t("tourAdmin.continent.placeholder", "-- Chọn châu lục --")}</option>
                    <option value="1">{t("tourAdmin.continent.asia")}</option>
                    <option value="2">{t("tourAdmin.continent.europe")}</option>
                    <option value="3">{t("tourAdmin.continent.africa")}</option>
                    <option value="4">{t("tourAdmin.continent.americas")}</option>
                    <option value="5">{t("tourAdmin.continent.oceania")}</option>
                    <option value="6">{t("tourAdmin.continent.antarctica")}</option>
                  </select>
                  <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50/70 px-3 py-2.5 dark:border-orange-500/30 dark:bg-orange-500/10">
                    <Checkbox
                      id="tour-is-visa"
                      name="isVisa"
                      value={basicInfo.isVisa}
                      onChange={() =>
                        setBasicInfo((prev) => ({ ...prev, isVisa: !prev.isVisa }))
                      }
                      activeClass="ring-orange-500 bg-orange-500 dark:bg-orange-500 dark:ring-orange-400"
                      label={
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {t("tourAdmin.visa.label")}
                        </span>
                      }
                    />
                  </div>
                </div>
              )}

              {/* Tour Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("tourAdmin.status.label", "Status")}
                </label>
                <div className="flex items-center gap-3">
                  {!isManagerOrAdmin ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      {!isEditMode ? "Pending (Wait for Review)" : (TourStatusMap[Number(basicInfo.status)] ?? "Pending")}
                    </div>
                  ) : (
                    <>
                      <select
                        value={basicInfo.status}
                        onChange={(e) =>
                          setBasicInfo((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      >
                        <option value="1">{TourStatusMap[1]}</option>
                        <option value="2">{TourStatusMap[2]}</option>
                        <option value="3">{TourStatusMap[3]}</option>
                        <option value="4">{TourStatusMap[4]}</option>
                      </select>
                      {isEditMode && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {t("tourAdmin.status.currently", "Currently:")}{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {TourStatusMap[Number(basicInfo.status)] ?? basicInfo.status}
                          </span>
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ── Vietnamese Content ── */}
              {activeLang === "vi" && (
                <div className="space-y-5">
                  {/* Tour Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("tourAdmin.basicInfo.tourName")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={basicInfo.tourName}
                        onChange={(e) =>
                          setBasicInfo((prev) => ({
                            ...prev,
                            tourName: e.target.value,
                          }))
                        }
                        onBlur={(e) => validateField("tourName", e.target.value)}
                        placeholder={t("placeholder.enterTourName")}
                        className={`w-full px-3 py-2 pr-8 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
                          errors.tourName
                            ? "border-red-400 dark:border-red-500"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      />
                      {errors.tourName && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                          <Icon icon="heroicons:x-circle" className="size-4" />
                        </span>
                      )}
                    </div>
                    {errors.tourName && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                        {errors.tourName}
                      </p>
                    )}
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("tourAdmin.basicInfo.shortDescription")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        value={basicInfo.shortDescription}
                        onChange={(e) =>
                          setBasicInfo((prev) => ({
                            ...prev,
                            shortDescription: e.target.value,
                          }))
                        }
                        onBlur={(e) => validateField("shortDescription", e.target.value)}
                        rows={2}
                        placeholder={t("placeholder.briefTourDescription")}
                        className={`w-full px-3 py-2 pr-8 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none ${
                          errors.shortDescription
                            ? "border-red-400 dark:border-red-500"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      />
                      {errors.shortDescription && (
                        <span className="absolute right-3 top-3 text-red-500">
                          <Icon icon="heroicons:x-circle" className="size-4" />
                        </span>
                      )}
                    </div>
                    {errors.shortDescription && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                        {errors.shortDescription}
                      </p>
                    )}
                  </div>

                  {/* Long Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("tourAdmin.basicInfo.longDescription")}
                    </label>
                    <div className="relative">
                      <textarea
                        value={basicInfo.longDescription}
                        onChange={(e) =>
                          setBasicInfo((prev) => ({
                            ...prev,
                            longDescription: e.target.value,
                          }))
                        }
                        onBlur={(e) => validateField("longDescription", e.target.value)}
                        rows={4}
                        placeholder={t("placeholder.detailedTourDescription")}
                        className={`w-full px-3 py-2 pr-8 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none ${
                          errors.longDescription
                            ? "border-red-400 dark:border-red-500"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      />
                      {errors.longDescription && (
                        <span className="absolute right-3 top-3 text-red-500">
                          <Icon icon="heroicons:x-circle" className="size-4" />
                        </span>
                      )}
                    </div>
                    {errors.longDescription && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                        {errors.longDescription}
                      </p>
                    )}
                  </div>

                  {/* SEO Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("tourAdmin.basicInfo.seoTitle")}
                    </label>
                    <input
                      type="text"
                      value={basicInfo.seoTitle}
                      onChange={(e) =>
                        setBasicInfo((prev) => ({
                          ...prev,
                          seoTitle: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder.seoOptimizedTitle")}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* SEO Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("tourAdmin.basicInfo.seoDescription")}
                    </label>
                    <textarea
                      value={basicInfo.seoDescription}
                      onChange={(e) =>
                        setBasicInfo((prev) => ({
                          ...prev,
                          seoDescription: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder={t("placeholder.seoOptimizedDescription")}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ── English Content ── */}
              {activeLang === "en" && (
                <div className="space-y-5">
                  {/* Tour Name EN */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("tourAdmin.basicInfo.tourName")} (EN)
                    </label>
                    <input
                      type="text"
                      value={enTranslation.tourName}
                      onChange={(e) =>
                        setEnTranslation((prev) => ({
                          ...prev,
                          tourName: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder.enterTourNameEn")}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* Short Description EN */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("tourAdmin.basicInfo.shortDescription")} (EN)
                    </label>
                    <textarea
                      value={enTranslation.shortDescription}
                      onChange={(e) =>
                        setEnTranslation((prev) => ({
                          ...prev,
                          shortDescription: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder={t("placeholder.briefDescEn")}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                    />
                  </div>

                  {/* Long Description EN */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("tourAdmin.basicInfo.longDescription")} (EN)
                    </label>
                    <textarea
                      value={enTranslation.longDescription}
                      onChange={(e) =>
                        setEnTranslation((prev) => ({
                          ...prev,
                          longDescription: e.target.value,
                        }))
                      }
                      rows={4}
                      placeholder={t("placeholder.detailedDescEn")}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                    />
                  </div>

                  {/* SEO Title EN */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("tourAdmin.basicInfo.seoTitle")} (EN)
                    </label>
                    <input
                      type="text"
                      value={enTranslation.seoTitle}
                      onChange={(e) =>
                        setEnTranslation((prev) => ({
                          ...prev,
                          seoTitle: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder.seoOptimizedTitle")}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* SEO Description EN */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("tourAdmin.basicInfo.seoDescription")} (EN)
                    </label>
                    <textarea
                      value={enTranslation.seoDescription}
                      onChange={(e) =>
                        setEnTranslation((prev) => ({
                          ...prev,
                          seoDescription: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder={t("placeholder.seoOptimizedDescription")}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ── Image Upload (shared — always visible regardless of language tab) ── */}
              <div className="mt-8">
                <TourImageUpload
                  thumbnail={thumbnail}
                  setThumbnail={setThumbnail}
                  images={images}
                  setImages={setImages}
                  t={t}
                  thumbnailError={thumbnailError}
                  imagesError={imagesError}
                  onThumbnailError={setThumbnailError}
                  onImagesError={setImagesError}
                  existingImages={existingImages}
                  onRemoveExistingImage={(img) => {
                    setExistingImages((prev) =>
                      prev.filter((e) => e.fileId !== img.fileId),
                    );
                  }}
                  existingThumbnail={existingThumbnail}
                  onRemoveExistingThumbnail={() => setExistingThumbnail(null)}
                />
              </div>


            </div>
          )}

          {/* ── Step 2: Packages ─────────────────────────────── */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t("tourAdmin.packages.sectionTitle")}
                </h2>
                <button
                  type="button"
                  onClick={addClassification}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  <Icon icon="heroicons:plus" className="size-4" />
                  {t("tourAdmin.buttons.addPackage")}
                </button>
              </div>
              <div className="flex items-center gap-2 mb-6 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
                <Icon
                  icon="heroicons:information-circle"
                  className="size-4 text-blue-500 shrink-0"
                />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  {t("tourAdmin.packages.infoBanner")}
                </p>
              </div>

              <div className="space-y-4">
                {classifications.map((cls, clsI) => (
                  <div
                    key={clsI}
                    className="border border-stone-200 dark:border-stone-700 rounded-2xl p-5 relative overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          {clsI + 1}
                        </div>
                        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                          {cls.name || cls.enName
                            ? `${cls.name || ""}${cls.name && cls.enName ? " / " : ""}${cls.enName || ""}`
                            : t("tourAdmin.review.untitled")}
                        </h3>
                      </div>
                      {classifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({ type: "classification", index1: clsI })
                          }
                          aria-label={t("tourAdmin.packages.removePackage")}
                          className="text-stone-400 hover:text-red-500 transition-colors">
                          <Icon icon="heroicons:trash" className="size-4" />
                        </button>
                      )}
                    </div>

                    {/* Duration & Base Price — shared fields */}
                    <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                          {t("tourAdmin.packages.durationDays")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={cls.durationDays}
                          onChange={(e) =>
                            updateClassification(clsI, "durationDays", e.target.value)
                          }
                          placeholder={t("tourAdmin.packages.placeholderDuration")}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                        />
                        {errors[`cls_${clsI}_duration`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`cls_${clsI}_duration`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                          {t("tourAdmin.packages.basePrice")}
                        </label>
                        <div
                          aria-readonly="true"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-slate-700/50 text-stone-900 dark:text-white"
                        >
                          {formatCurrency(Number(cls.basePrice) || 0)}
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1">
                          <Icon icon="heroicons:calculator" className="size-3" />
                          {t("tourAdmin.packages.basePriceAutoCalculated", "Auto-calculated from activities")}
                        </p>
                      </div>
                    </div>

                    {/* VI / EN parallel columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ── VI Column ── */}
                      <div className="space-y-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">🇻🇳</span>
                          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
                            Tiếng Việt
                          </span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                            {t("tourAdmin.packages.packageType")} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={findPackageTypeOption(cls.name)?.key ?? ""}
                              onChange={(e) => updateClassificationPackageTypeVi(clsI, e.target.value)}
                              onBlur={() => validateField(`cls_${clsI}_name`, cls.name)}
                              className={`w-full px-3 py-2 pr-8 text-sm rounded-lg border bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition cursor-pointer ${
                                errors[`cls_${clsI}_name`]
                                  ? "border-red-400 dark:border-red-500"
                                  : "border-stone-300 dark:border-stone-600"
                              }`}>
                              <option value="">{t("tourAdmin.packages.placeholderPackageType")}</option>
                              {PACKAGE_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.key} value={opt.key}>{opt.vi}</option>
                              ))}
                            </select>
                            {errors[`cls_${clsI}_name`] && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                                <Icon icon="heroicons:x-circle" className="size-4" />
                              </span>
                            )}
                          </div>
                          {errors[`cls_${clsI}_name`] && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                              {errors[`cls_${clsI}_name`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                            {t("tourAdmin.packages.description")}
                          </label>
                          <textarea
                            value={cls.description}
                            onChange={(e) => updateClassification(clsI, "description", e.target.value)}
                            rows={3}
                            placeholder={t("tourAdmin.packages.placeholderDescription")}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                          />
                          {errors[`cls_${clsI}_description`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`cls_${clsI}_description`]}</p>
                          )}
                        </div>
                      </div>

                      {/* ── EN Column ── */}
                      <div className="space-y-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">🇬🇧</span>
                          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
                            English
                          </span>
                          <span className="text-[10px] font-normal text-stone-400 dark:text-stone-500">
                            (Tùy chọn)
                          </span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                            {t("tourAdmin.packages.packageType")} / Type
                          </label>
                          <select
                            value={findPackageTypeOption(cls.enName)?.key ?? ""}
                            onChange={(e) => updateClassificationPackageTypeEn(clsI, e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition cursor-pointer">
                            <option value="">Select type...</option>
                            {PACKAGE_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.key} value={opt.key}>{opt.en}</option>
                            ))}
                          </select>
                          {errors[`cls_${clsI}_enName`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`cls_${clsI}_enName`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                            {t("tourAdmin.packages.description")} / Description
                          </label>
                          <textarea
                            value={cls.enDescription}
                            onChange={(e) => updateClassification(clsI, "enDescription", e.target.value)}
                            rows={3}
                            placeholder="Describe what this package includes..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                          />
                          {errors[`cls_${clsI}_enDescription`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`cls_${clsI}_enDescription`]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Itineraries ──────────────────────────── */}
          {currentStep === 2 && (
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
                        onClick={() => setSelectedPackageIndex(i)}
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
                    onClick={() => addDayPlan(ci)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    <Icon icon="heroicons:plus" className="size-4" />
                    {t("tourAdmin.buttons.addDay")}
                  </button>
                </div>

                {errors[`cls_${ci}_dayCountMismatch`] && (
                  <div className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-4 py-2">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {errors[`cls_${ci}_dayCountMismatch`]}
                    </p>
                  </div>
                )}

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
                    {(dayPlans[ci] ?? []).map((day, di) => {
                      const classificationDurationDays = Number(classifications[ci]?.durationDays ?? 0);
                      const cannotRemoveDay =
                        Number.isFinite(classificationDurationDays) &&
                        classificationDurationDays > 0 &&
                        (dayPlans[ci] ?? []).length <= classificationDurationDays;
                      return (
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
                              onChange={(e) => updateDayPlan(ci, di, "title", e.target.value)}
                              placeholder={t("tourAdmin.itineraries.placeholderDayTitle", { number: day.dayNumber })}
                              className="flex-1 px-2 py-1 text-sm bg-white/10 text-white rounded border border-white/20 placeholder:text-white/60 focus:ring-2 focus:ring-white/30 outline-none"
                            />
                            <input
                              type="text"
                              value={day.enTitle}
                              onChange={(e) => updateDayPlan(ci, di, "enTitle", e.target.value)}
                              placeholder="Day title EN..."
                              className="flex-1 px-2 py-1 text-sm bg-white/5 text-white/70 rounded border border-white/10 placeholder:text-white/30 focus:ring-2 focus:ring-white/20 outline-none"
                            />
                          </div>
                          {(errors[`plan_${di}_title`] || errors[`plan_${di}_enTitle`]) && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors[`plan_${di}_title`] || errors[`plan_${di}_enTitle`]}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDelete({ type: "dayPlan", index1: ci, index2: di })
                            }
                            disabled={cannotRemoveDay}
                            title={
                              cannotRemoveDay
                                ? t("tourAdmin.itineraries.cannotRemoveDayTooltip", {
                                    durationDays: classificationDurationDays,
                                  })
                                : t("tourAdmin.itineraries.removeDay")
                            }
                            aria-label={t("tourAdmin.itineraries.removeDay")}
                            className="text-white/70 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-white/70">
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
                                onChange={(e) => updateDayPlan(ci, di, "description", e.target.value)}
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
                                onChange={(e) => updateDayPlan(ci, di, "enDescription", e.target.value)}
                                rows={2}
                                placeholder="Day description in English..."
                                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                              />
                              {(errors[`plan_${di}_description`] || errors[`plan_${di}_enDescription`]) && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`plan_${di}_description`] || errors[`plan_${di}_enDescription`]}
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
                                onClick={() => addActivity(ci, di)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                                <Icon
                                  icon="heroicons:plus"
                                  className="size-3"
                                />
                                {t("tourAdmin.buttons.addActivity")}
                              </button>
                            </div>

                            {day.activities.length === 0 && (
                              <>
                                <p className="text-xs text-slate-400 text-center py-4">
                                  {t("tourAdmin.itineraries.noActivitiesYet")}
                                </p>
                                {errors[`day_${di}_empty`] && (
                                  <p className="text-xs text-red-600 text-center pb-2">
                                    {errors[`day_${di}_empty`]}
                                  </p>
                                )}
                              </>
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
                                      setConfirmDelete({ type: "activity", index1: ci, index2: di, index3: ai })
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
                                        updateActivity(
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
                                        updateActivity(
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
                                        updateActivity(
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
                                        updateActivity(
                                          ci,
                                          di,
                                          ai,
                                          "estimatedCost",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="0"
                                      className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
                                        errors[`act_${di}_${ai}_estimatedCost`]
                                          ? "border-red-400 dark:border-red-500"
                                          : "border-slate-300 dark:border-slate-600"
                                      }`}
                                    />
                                    {errors[`act_${di}_${ai}_estimatedCost`] && (
                                      <p className="text-red-500 text-xs mt-0.5">
                                        {errors[`act_${di}_${ai}_estimatedCost`]}
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
                                      onChange={(e) => updateActivity(ci, di, ai, "title", e.target.value)}
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
                                      onChange={(e) => updateActivity(ci, di, ai, "enTitle", e.target.value)}
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
                                      onChange={(e) => updateActivity(ci, di, ai, "description", e.target.value)}
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
                                      onChange={(e) => updateActivity(ci, di, ai, "enDescription", e.target.value)}
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
                                      onChange={(e) => updateActivity(ci, di, ai, "note", e.target.value)}
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
                                      onChange={(e) => updateActivity(ci, di, ai, "enNote", e.target.value)}
                                      placeholder="Additional notes in English..."
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                    />
                                  </div>
                                </div>



                                {/* Type 8: Accommodation */}
                                {act.activityType === "8" && (
                                  <div className="mb-3 mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="md:col-span-2">
                                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                                        {t("tourAdmin.itineraries.accommodationDetails", "Accommodation Details")}
                                      </h4>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        {t("tourAdmin.itineraries.accommodationName", "Accommodation Name")} (VI)
                                      </label>
                                      <input
                                        type="text"
                                        value={act.locationName}
                                        onChange={(e) => updateActivity(ci, di, ai, "locationName", e.target.value)}
                                        placeholder="Tên khách sạn / Nơi lưu trú..."
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        {t("tourAdmin.itineraries.accommodationName", "Accommodation Name")} (EN)
                                      </label>
                                      <input
                                        type="text"
                                        value={act.enLocationName}
                                        onChange={(e) => updateActivity(ci, di, ai, "enLocationName", e.target.value)}
                                        placeholder="Accommodation name in English..."
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        {t("tourAdmin.itineraries.address", "Address")} (VI)
                                      </label>
                                      <input
                                        type="text"
                                        value={act.locationAddress}
                                        onChange={(e) => updateActivity(ci, di, ai, "locationAddress", e.target.value)}
                                        placeholder="Địa chỉ..."
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        {t("tourAdmin.itineraries.address", "Address")} (EN)
                                      </label>
                                      <input
                                        type="text"
                                        value={act.enLocationAddress}
                                        onChange={(e) => updateActivity(ci, di, ai, "enLocationAddress", e.target.value)}
                                        placeholder="Address in English..."
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>
                                  </div>
                                )}

                            {/* Type 7: Transportation — TU, DEN, Phuong tien, Thoi gian */}
                                {act.activityType === "7" && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        🇻🇳 {t("tourAdmin.itineraries.fromLocation", "Từ (địa điểm)")} <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={act.fromLocation || ""}
                                        onChange={(e) => updateActivity(ci, di, ai, "fromLocation", e.target.value)}
                                        placeholder={t("tourAdmin.itineraries.fromLocationPlaceholder", "VD: Hà Nội")}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        🇬🇧 {t("tourAdmin.itineraries.fromLocationEn", "From (location)")}
                                      </label>
                                      <input
                                        type="text"
                                        value={act.enFromLocation || ""}
                                        onChange={(e) => updateActivity(ci, di, ai, "enFromLocation", e.target.value)}
                                        placeholder={t("tourAdmin.itineraries.fromLocationPlaceholder", "e.g., Hanoi")}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        🇻🇳 {t("tourAdmin.itineraries.toLocation", "Đến (địa điểm)")} <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={act.toLocation || ""}
                                        onChange={(e) => updateActivity(ci, di, ai, "toLocation", e.target.value)}
                                        placeholder={t("tourAdmin.itineraries.toLocationPlaceholder", "VD: TP. Hồ Chí Minh")}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        🇬🇧 {t("tourAdmin.itineraries.toLocationEn", "To (location)")}
                                      </label>
                                      <input
                                        type="text"
                                        value={act.enToLocation || ""}
                                        onChange={(e) => updateActivity(ci, di, ai, "enToLocation", e.target.value)}
                                        placeholder={t("tourAdmin.itineraries.toLocationPlaceholder", "e.g., Ho Chi Minh City")}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        {t("tourAdmin.itineraries.transportationType", "Vehicle Type")}
                                      </label>
                                      <select
                                        value={act.transportationType}
                                        onChange={(e) => updateActivity(ci, di, ai, "transportationType", e.target.value)}
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
                                        {t("tourAdmin.itineraries.durationMinutes", "Duration (min)")}
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={act.durationMinutes || ""}
                                        onChange={(e) => updateActivity(ci, di, ai, "durationMinutes", e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        🇻🇳 Tên phương tiện (VD: Limousine 9 chỗ)
                                      </label>
                                      <input
                                        type="text"
                                        value={act.transportationName || ""}
                                        onChange={(e) => updateActivity(ci, di, ai, "transportationName", e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        🇬🇧 Vehicle Name (EN)
                                      </label>
                                      <input
                                        type="text"
                                        value={act.enTransportationName || ""}
                                        onChange={(e) => updateActivity(ci, di, ai, "enTransportationName", e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                      />
                                    </div>

                                  </div>
                                )}

                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}



          {/* ── Step 3: Services ───────────────────────────────── */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:wrench-screwdriver"
                    className="size-5 text-orange-500"
                  />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    {t("tourAdmin.services.sectionTitle")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={addService}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  <Icon icon="heroicons:plus" className="size-4" />
                  {t("tourAdmin.buttons.addService")}
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {t("tourAdmin.services.infoBanner")}
              </p>

              <div className="space-y-4">
                {services.map((svc, svcI) => (
                  <div
                    key={svcI}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {svcI + 1}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {t("tourAdmin.services.serviceNumber", { number: svcI + 1 })}
                        </h3>
                      </div>
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeService(svcI)}
                          aria-label={t("tourAdmin.services.removeService")}
                          className="text-red-400 hover:text-red-600 transition-colors">
                          <Icon icon="heroicons:trash" className="size-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {/* Service Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          {t("tourAdmin.services.serviceName")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={svc.serviceName}
                          onChange={(e) => updateService(svcI, "serviceName", e.target.value)}
                          placeholder={t("tourAdmin.services.placeholderServiceName")}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                        />
                        {errors[`svc_${svcI}_name`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`svc_${svcI}_name`]}</p>
                        )}
                      </div>
                      {/* English Service Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          {t("tourAdmin.services.serviceName")} (English)
                        </label>
                        <input
                          type="text"
                          value={svc.enServiceName}
                          onChange={(e) => updateService(svcI, "enServiceName", e.target.value)}
                          placeholder={t("tourAdmin.services.placeholderServiceNameEn", "Enter English service name")}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                        />
                      </div>
                      {/* Pricing Type + Price + Sale Price */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t("tourAdmin.services.pricingType")} <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={svc.pricingType}
                            onChange={(e) => updateService(svcI, "pricingType", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition cursor-pointer">
                            <option value="">{t("tourAdmin.services.placeholderPricingType")}</option>
                            {PRICING_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          {errors[`svc_${svcI}_pricingType`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`svc_${svcI}_pricingType`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t("tourAdmin.services.price")}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={svc.price}
                            onChange={(e) => updateService(svcI, "price", e.target.value)}
                            placeholder={t("tourAdmin.services.placeholderPrice")}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t("tourAdmin.services.salePrice")}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={svc.salePrice}
                            onChange={(e) => updateService(svcI, "salePrice", e.target.value)}
                            placeholder={t("tourAdmin.services.placeholderSalePrice")}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                          />
                        </div>
                      </div>
                      {/* Email + Contact */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t("tourAdmin.services.email")}
                          </label>
                          <input
                            type="email"
                            value={svc.email}
                            onChange={(e) => updateService(svcI, "email", e.target.value)}
                            placeholder={t("tourAdmin.services.placeholderEmail")}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t("tourAdmin.services.contactNumber")}
                          </label>
                          <input
                            type="text"
                            value={svc.contactNumber}
                            onChange={(e) => updateService(svcI, "contactNumber", e.target.value)}
                            placeholder={t("tourAdmin.services.placeholderContactNumber")}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Insurance ────────────────────────────── */}
          {currentStep === 4 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  icon="heroicons:shield-check"
                  className="size-5 text-orange-500"
                />
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t("tourAdmin.insurance.sectionTitle")}
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {t("tourAdmin.insurance.sectionSubtitle")}
              </p>

              <div className="space-y-5">
                {classifications.map((cls, clsI) => (
                  <div key={clsI}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {activeLang === "vi" ? (cls.name || t("tourAdmin.packages.packageNumber", { number: clsI + 1 })) : (cls.enName || cls.name || t("tourAdmin.packages.packageNumber", { number: clsI + 1 }))}
                      </h3>
                      <button
                        type="button"
                        onClick={() => addInsurance(clsI)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                        <Icon icon="heroicons:plus" className="size-4" />
                        {t("tourAdmin.buttons.addInsurance")}
                      </button>
                    </div>

                    {(insurances[clsI] ?? []).length === 0 ? (
                      <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg py-6 text-center">
                        <p className="text-sm text-slate-400">
                          {t("tourAdmin.insurance.noInsuranceYet")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(insurances[clsI] ?? []).map((ins, ii) => (
                          <div
                            key={ii}
                            className="flex items-start justify-between border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-slate-900 dark:text-white">
                                  {activeLang === "vi" ? (ins.insuranceName || t("tourAdmin.review.untitled")) : (ins.enInsuranceName || ins.insuranceName || t("tourAdmin.review.untitled"))}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
                                  {insuranceTypes[Number(ins.insuranceType)] || insuranceTypes[1]}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t("tourAdmin.insurance.coverage")}: ${ins.coverageAmount || "0"} &bull;
                                {t("tourAdmin.insurance.durationOfTour")}
                                {ins.coverageFee
                                  ? ` • ${t("tourAdmin.insurance.fee")}: $${ins.coverageFee}`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <span className="text-sm font-semibold text-orange-500 whitespace-nowrap">
                                ${ins.coverageFee || "0"}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeInsurance(clsI, ii)}
                                aria-label={t("tourAdmin.buttons.addInsurance")}
                                className="text-red-400 hover:text-red-600 transition-colors">
                                <Icon
                                  icon="heroicons:trash"
                                  className="size-4"
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Editing panel for selected insurance */}
              {classifications.map((cls, clsI) =>
                (insurances[clsI] ?? []).map((ins, ii) => (
                  <div
                    key={`edit-${clsI}-${ii}`}
                    className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
                      {t("tourAdmin.insurance.editInsurance", {
                        insuranceName: activeLang === "vi" ? (ins.insuranceName || t("tourAdmin.review.untitled")) : (ins.enInsuranceName || ins.insuranceName || t("tourAdmin.review.untitled")),
                        packageName: activeLang === "vi" ? (cls.name || t("tourAdmin.packages.packageNumber", { number: clsI + 1 })) : (cls.enName || cls.name || t("tourAdmin.packages.packageNumber", { number: clsI + 1 })),
                      })}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {t("tourAdmin.insurance.insuranceName")}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <span>VN</span>
                              <span className="font-medium text-stone-500">Name (VI)</span>
                            </div>
                            <input
                              type="text"
                              value={ins.insuranceName}
                              onChange={(e) =>
                                updateInsurance(
                                  clsI,
                                  ii,
                                  "insuranceName",
                                  e.target.value,
                                )
                              }
                              placeholder={t("tourAdmin.insurance.insuranceName")}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <span>EN</span>
                              <span className="font-medium text-stone-500">Name (EN)</span>
                            </div>
                            <input
                              type="text"
                              value={ins.enInsuranceName}
                              onChange={(e) =>
                                updateInsurance(
                                  clsI,
                                  ii,
                                  "enInsuranceName",
                                  e.target.value,
                                )
                              }
                              placeholder={t("tourAdmin.insurance.insuranceName")}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {t("tourAdmin.insurance.insuranceType")}
                        </label>
                        <select
                          value={ins.insuranceType}
                          onChange={(e) =>
                            updateInsurance(
                              clsI,
                              ii,
                              "insuranceType",
                              e.target.value,
                            )
                          }
                          aria-label={t("tourAdmin.insurance.insuranceType")}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition">
                          {INSURANCE_TYPE_OPTIONS.map((opt, idx) => (
                            <option key={opt.value} value={opt.value}>
                              {insuranceTypes[idx]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {t("tourAdmin.insurance.provider")}
                        </label>
                        <input
                          type="text"
                          value={ins.insuranceProvider}
                          onChange={(e) =>
                            updateInsurance(
                              clsI,
                              ii,
                              "insuranceProvider",
                              e.target.value,
                            )
                          }
                          placeholder={t("tourAdmin.insurance.provider")}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {t("tourAdmin.insurance.coverageDescription")}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <span>VN</span>
                            <span className="font-medium text-stone-500">Coverage (VI)</span>
                          </div>
                          <textarea
                            value={ins.coverageDescription}
                            onChange={(e) =>
                              updateInsurance(
                                clsI,
                                ii,
                                "coverageDescription",
                                e.target.value,
                              )
                            }
                            rows={2}
                            placeholder={t("tourAdmin.insurance.coverageDescription")}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <span>EN</span>
                            <span className="font-medium text-stone-500">Coverage (EN)</span>
                          </div>
                          <textarea
                            value={ins.enCoverageDescription}
                            onChange={(e) =>
                              updateInsurance(
                                clsI,
                                ii,
                                "enCoverageDescription",
                                e.target.value,
                              )
                            }
                            rows={2}
                            placeholder={t("tourAdmin.insurance.coverageDescription")}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {t("tourAdmin.insurance.coverageAmount")}
                        </label>
                        <input
                          type="number"
                          value={ins.coverageAmount}
                          onChange={(e) =>
                            updateInsurance(
                              clsI,
                              ii,
                              "coverageAmount",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {t("tourAdmin.insurance.coverageFee")}
                        </label>
                        <input
                          type="number"
                          value={ins.coverageFee}
                          onChange={(e) =>
                            updateInsurance(
                              clsI,
                              ii,
                              "coverageFee",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 self-end pb-2">
                        <input
                          type="checkbox"
                          checked={ins.isOptional}
                          onChange={(e) =>
                            updateInsurance(
                              clsI,
                              ii,
                              "isOptional",
                              e.target.checked,
                            )
                          }
                          className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                        />
                        {t("tourAdmin.insurance.optional")}
                      </label>
                    </div>
                  </div>
                )),
              )}

              {/* Info banner */}
              {classifications.every(
                (_, i) => (insurances[i] ?? []).length === 0,
              ) && (
                <div className="mt-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-4 py-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {t("tourAdmin.insurance.noInsuranceSelected")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 5: Preview ───────────────────────────────── */}
          {currentStep === 5 && (
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
                              key={`existing-${img.fileId ?? i}-${i}`}
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
                              {cls.basePrice ? `$${cls.basePrice}` : ""} / {cls.durationDays || "?"} days
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
                          <span className="text-slate-500">{svc.price ? `$${svc.price}` : ""}</span>
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
                            <span className="ml-2 text-slate-500">{ins.coverageFee ? `$${ins.coverageFee}` : ""}</span>
                          </div>
                        )),
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ───────────────────────────── */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                currentStep === 0 ? onCancel?.() : goPrev()
              }
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {currentStep === 0 ? t("tourAdmin.buttons.backToList") : t("tourAdmin.buttons.previous")}
            </button>

            {currentStep === WIZARD_STEPS.length - 1 ? (
              // Preview step: show Confirm button
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
                {saving && (
                  <Icon
                    icon="heroicons:arrow-path"
                    className="size-4 animate-spin"
                  />
                )}
                <Icon icon="heroicons:check" className="size-4" />
                {isEditMode
                  ? t("tourAdmin.editPage.updateTour", "Update Tour")
                  : t("tourAdmin.createPage.publishTour")}
              </button>
            ) : currentStep < WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
                {currentStep === WIZARD_STEPS.length - 2
                  ? t("tourAdmin.preview.sectionTitle", "Preview")
                  : t("tourAdmin.buttons.next")}
                <Icon icon="heroicons:arrow-right" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        active={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("tourAdmin.confirmDelete.title")}
        message={(() => {
          if (!confirmDelete) return t("tourAdmin.confirmDelete.message");
          if (confirmDelete.type === "dayPlan") {
            const dayNumber = (dayPlans[confirmDelete.index1]?.[confirmDelete.index2!]?.dayNumber) ?? String((confirmDelete.index2 ?? 0) + 1);
            return t("tourAdmin.confirm.removeDay", { dayNumber });
          }
          if (confirmDelete.type === "activity") {
            const act = dayPlans[confirmDelete.index1]?.[confirmDelete.index2!]?.activities[confirmDelete.index3!];
            const title = act?.title?.trim() || t("tourAdmin.itineraries.activityNumber", { number: (confirmDelete.index3 ?? 0) + 1 });
            return t("tourAdmin.confirm.removeActivity", { title });
          }
          if (confirmDelete.type === "classification") {
            const name = classifications[confirmDelete.index1]?.name?.trim() || t("tourAdmin.packages.packageNumber", { number: confirmDelete.index1 + 1 });
            return t("tourAdmin.confirm.removeClassification", { name });
          }
          return t("tourAdmin.confirmDelete.message");
        })()}
        confirmLabel={t("tourAdmin.confirmDelete.confirm")}
        cancelLabel={t("tourAdmin.confirmDelete.cancel")}
      />
    </div>
  );
}
