"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { pricingPolicyService } from "@/api/services/pricingPolicyService";
import { depositPolicyService } from "@/api/services/depositPolicyService";
import { cancellationPolicyService } from "@/api/services/cancellationPolicyService";
import { visaPolicyService } from "@/api/services/visaPolicyService";
import { buildTourFormData } from "@/api/services/tourCreatePayload";
import type { PricingPolicy } from "@/types/pricingPolicy";
import type { DepositPolicy } from "@/types/depositPolicy";
import type { CancellationPolicy } from "@/types/cancellationPolicy";
import type { VisaPolicy } from "@/types/visaPolicy";
import type { TourDto, ImageDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { tourFormSchema, type TourFormValues } from "@/schemas/tour-form";
import {
  BasicInfoSection,
  TourClassificationsBuilder,
  TourItineraryBuilder,
  ServicesSection,
  InsuranceSection,
  TourPreviewSection,
} from "./builders";

/* ── TourForm Props ─────────────────────────────────────────── */
export interface TourFormProps {
  mode: "create" | "edit";
  /** Pre-populated data from server for edit mode */
  initialData?: TourDto;
  /** Existing server images for edit mode (managed by parent) */
  existingImages?: ImageDto[];
  /**
   * When true, status field is read-only (designers cannot change status)
   */
  isDesignerMode?: boolean;
  /**
   * Called when the form is submitted.
   * For create: calls tourService.createTour
   * For edit: calls tourService.updateTour with full FormData including id, existingImages, deleted IDs
   */
  onSubmit: (
    formData: FormData,
    deletedClassificationIds?: string[],
    deletedActivityIds?: string[],
  ) => Promise<void>;
  onCancel?: () => void;
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
  routes: ActivityRouteForm[];
  // Location fields
  locationName: string;
  enLocationName: string;
  locationCity: string;
  enLocationCity: string;
  locationCountry: string;
  enLocationCountry: string;
  locationAddress: string;
  enLocationAddress: string;
  locationEntranceFee: string;
  // Transportation fields (type 7)
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
  // Accommodation fields (type 8)
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

const WIZARD_STEPS = [
  { key: "basic", label: "", icon: "heroicons:information-circle" },
  { key: "packages", label: "", icon: "heroicons:cube" },
  { key: "itineraries", label: "", icon: "heroicons:calendar-days" },
  { key: "services", label: "", icon: "heroicons:wrench-screwdriver" },
  { key: "insurance", label: "", icon: "heroicons:shield-check" },
  { key: "preview", label: "", icon: "heroicons:eye" },
];

/* ── URL validation helper ─────────────────────────────────── */
const isValidUrl = (value: string): boolean => {
  if (!value.trim()) return true;
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
  routes: [],
  locationName: "",
  enLocationName: "",
  locationCity: "",
  enLocationCity: "",
  locationCountry: "",
  enLocationCountry: "",
  locationAddress: "",
  enLocationAddress: "",
  locationEntranceFee: "",
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
  accommodationName: "",
  enAccommodationName: "",
  accommodationAddress: "",
  enAccommodationAddress: "",
  accommodationPhone: "",
  checkInTime: "",
  checkOutTime: "",
  roomType: "",
  roomCapacity: "",
  mealsIncluded: "",
  roomPrice: "",
  numberOfRooms: "",
  numberOfNights: "",
  specialRequest: "",
  latitude: "",
  longitude: "",
});

const emptyRoute = (): ActivityRouteForm => ({
  id: crypto.randomUUID(),
  fromLocationIndex: "",
  fromLocationCustom: "",
  enFromLocationCustom: "",
  toLocationIndex: "",
  toLocationCustom: "",
  enToLocationCustom: "",
  transportationType: "0",
  enTransportationType: "",
  transportationName: "",
  enTransportationName: "",
  durationMinutes: "",
  price: "",
  note: "",
  enNote: "",
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
  durationDays: string | number,
): DayPlanForm[] => {
  const targetDays = Number.parseInt(String(durationDays), 10);
  if (!Number.isFinite(targetDays) || targetDays <= 0) {
    return plans;
  }
  const normalizedPlans = plans.map((plan, dayIndex) => ({
    ...plan,
    dayNumber: String(dayIndex + 1),
  }));
  if (normalizedPlans.length === targetDays) return normalizedPlans;
  if (normalizedPlans.length > targetDays) return normalizedPlans.slice(0, targetDays);
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
   Step JSX is delegated to builder components in ./builders/
   ══════════════════════════════════════════════════════════════ */
export default function TourForm({ mode, initialData, existingImages: initialExistingImages, onSubmit, onCancel }: TourFormProps) {
  const { t } = useTranslation();
  const isEditMode = mode === "edit";

  /* ── React Hook Form state ─────────────────────────────────── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<TourFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tourFormSchema) as any,
    defaultValues: {
      basicInfo: {
        tourName: "",
        shortDescription: "",
        longDescription: "",
        seoTitle: "",
        seoDescription: "",
        status: "3",
        tourScope: "1",
        continent: "",
        customerSegment: "2",
      },
      enTranslation: {
        tourName: "",
        shortDescription: "",
        longDescription: "",
        seoTitle: "",
        seoDescription: "",
      },
      classifications: [{ id: "", name: "", enName: "", description: "", enDescription: "", basePrice: "", durationDays: "" }],
      dayPlans: [[]],
      insurances: [[]],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      services: [{ serviceName: "", enServiceName: "", pricingType: "", price: "", salePrice: "", email: "", contactNumber: "" }] as any,
      activeLang: "vi",
      deletedClassificationIds: [],
      deletedActivityIds: [],
    },
    mode: "onBlur",
  });

  const watchedValues = form.watch();

  const wizardStepLabels = [
    t("tourAdmin.steps.basic"),
    t("tourAdmin.steps.packages"),
    t("tourAdmin.steps.itineraries"),
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

  /* ── Step 0: Basic Info ───────────────────────────────────── */
  const [activeLang, setActiveLang] = useState<"vi" | "en">("vi");

  const [basicInfo, setBasicInfo] = useState<BasicInfoForm>({
    tourName: "",
    shortDescription: "",
    longDescription: "",
    seoTitle: "",
    seoDescription: "",
    status: "3",
    tourScope: "1",
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

  /* ── Step 1: Classifications ──────────────────────────────── */
  const [classifications, setClassifications] = useState<ClassificationForm[]>([
    emptyClassification(),
  ]);

  /* ── Step 2: Day Plans (per classification) ───────────────── */
  const [dayPlans, setDayPlans] = useState<DayPlanForm[][]>([[]]);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);

  /* ── Step 4: Insurance (per classification) ───────────────── */
  const [insurances, setInsurances] = useState<InsuranceForm[][]>([[]]);

  /* ── Step 3: Services ─────────────────────────────────────── */
  const [services, setServices] = useState<ServiceForm[]>([emptyService()]);

  /* ── Route UI State ──────────────────────────────────────── */
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});
  const toggleActivityRoute = (pi: number, di: number, ai: number, ri?: number) => {
    const key = ri !== undefined
      ? pi + "_" + di + "_" + ai + "_" + ri
      : pi + "_" + di + "_" + ai;
    setExpandedRoutes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ── Policies ──────────────────────────────────────────── */
  const [pricingPolicies, setPricingPolicies] = useState<PricingPolicy[]>([]);
  const [depositPolicies, setDepositPolicies] = useState<DepositPolicy[]>([]);
  const [cancellationPolicies, setCancellationPolicies] = useState<CancellationPolicy[]>([]);
  const [visaPolicies, setVisaPolicies] = useState<VisaPolicy[]>([]);
  const [selectedPricingPolicyId, setSelectedPricingPolicyId] = useState<string>("");
  const [selectedDepositPolicyId, setSelectedDepositPolicyId] = useState<string>("");
  const [selectedCancellationPolicyId, setSelectedCancellationPolicyId] = useState<string>("");
  const [selectedVisaPolicyId, setSelectedVisaPolicyId] = useState<string>("");

  /* ── Edit mode state ──────────────────────────────────────── */
  const [existingImages, setExistingImages] = useState<ImageDto[]>(
    initialExistingImages ?? [],
  );
  const [deletedClassificationIds, setDeletedClassificationIds] = useState<string[]>([]);
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
        selectedPricingPolicyId,
        selectedDepositPolicyId,
        selectedCancellationPolicyId,
        selectedVisaPolicyId,
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
      selectedCancellationPolicyId, selectedVisaPolicyId,
      currentStep, thumbnail, images.length]);

  useEffect(() => {
    if (isEditMode) return;
    const timeoutId = setTimeout(saveDraft, 180000);
    return () => clearTimeout(timeoutId);
  }, [saveDraft, isEditMode]);

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
        setBasicInfo(draft.basicInfo);
        if (draft.selectedPricingPolicyId) setSelectedPricingPolicyId(draft.selectedPricingPolicyId);
        if (draft.selectedDepositPolicyId) setSelectedDepositPolicyId(draft.selectedDepositPolicyId);
        if (draft.selectedCancellationPolicyId) setSelectedCancellationPolicyId(draft.selectedCancellationPolicyId);
        if (draft.selectedVisaPolicyId) setSelectedVisaPolicyId(draft.selectedVisaPolicyId);
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

  /* ── Edit mode initialization ────────────────────────────── */
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
            activityType: String(act.activityType),
            title: act.title ?? "",
            enTitle: act.translations?.en?.title ?? "",
            description: act.description ?? "",
            enDescription: act.translations?.en?.description ?? "",
            note: act.note ?? "",
            enNote: act.translations?.en?.note ?? "",
            estimatedCost: String(act.estimatedCost ?? ""),
            isOptional: act.isOptional ?? false,
            startTime: act.startTime ?? "",
            endTime: act.endTime ?? "",
            linkToResources: [""],
            routes: (act.routes ?? []).map((route) => ({
              id: route.id,
              fromLocationIndex: "",
              fromLocationCustom: route.fromLocation?.locationName ?? "",
              enFromLocationCustom: route.translations?.en?.fromLocationName ?? "",
              toLocationIndex: "",
              toLocationCustom: route.toLocation?.locationName ?? "",
              enToLocationCustom: route.translations?.en?.toLocationName ?? "",
              transportationType: String(route.transportationType),
              enTransportationType: route.translations?.en?.transportationType ?? "",
              transportationName: route.transportationName ?? "",
              enTransportationName: route.translations?.en?.transportationName ?? "",
              durationMinutes: String(route.durationMinutes ?? ""),
              price: String(route.price ?? ""),
              note: route.note ?? "",
              enNote: route.translations?.en?.note ?? "",
            })),
            locationName: act.locationName ?? "",
            enLocationName: "",
            locationCity: act.locationCity ?? "",
            enLocationCity: "",
            locationCountry: act.locationCountry ?? "",
            enLocationCountry: "",
            locationAddress: act.locationAddress ?? "",
            enLocationAddress: "",
            locationEntranceFee: String(act.locationEntranceFee ?? ""),
            fromLocation: act.fromLocation ?? "",
            enFromLocation: "",
            toLocation: act.toLocation ?? "",
            enToLocation: "",
            transportationType: act.transportationType ?? "0",
            enTransportationType: act.translations?.en?.transportationType ?? "",
            transportationName: act.transportationName ?? "",
            enTransportationName: act.translations?.en?.transportationName ?? "",
            durationMinutes: String(act.durationMinutes ?? ""),
            price: String(act.price ?? ""),
            accommodationName: act.accommodationName ?? "",
            enAccommodationName: "",
            accommodationAddress: act.accommodationAddress ?? "",
            enAccommodationAddress: "",
            accommodationPhone: act.accommodationPhone ?? "",
            checkInTime: act.checkInTime ?? "",
            checkOutTime: act.checkOutTime ?? "",
            roomType: "",
            roomCapacity: "",
            mealsIncluded: "",
            roomPrice: "",
            numberOfRooms: "",
            numberOfNights: "",
            specialRequest: "",
            latitude: "",
            longitude: "",
          })),
        })),
      );
      setDayPlans(dayPlansForms);

      const insForms: InsuranceForm[][] = tour.classifications.map((cls) =>
        (cls.insurances ?? []).map((ins) => ({
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

    if (tour.pricingPolicyId) setSelectedPricingPolicyId(String(tour.pricingPolicyId));
    if (tour.depositPolicyId) setSelectedDepositPolicyId(String(tour.depositPolicyId));
    if (tour.cancellationPolicyId) setSelectedCancellationPolicyId(String(tour.cancellationPolicyId));
    if (tour.visaPolicyId) setSelectedVisaPolicyId(String(tour.visaPolicyId));

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
  const [thumbnailError, setThumbnailError] = useState<string>();
  const [imagesError, setImagesError] = useState<string>();

  /* ── Fetch Policies ──────────────────────────────────────────── */
  const policiesFetched = useRef(false);
  useEffect(() => {
    if (policiesFetched.current) return;
    policiesFetched.current = true;
    const fetchPolicies = async () => {
      try {
        const [ppRes, dpRes, cpRes, vpRes] = await Promise.all([
          pricingPolicyService.getAll(),
          depositPolicyService.getAll(),
          cancellationPolicyService.getAll(),
          visaPolicyService.getAll(),
        ]);
        if (ppRes.success && ppRes.data) setPricingPolicies(ppRes.data);
        if (dpRes.success && dpRes.data) setDepositPolicies(dpRes.data);
        if (cpRes.success && cpRes.data) setCancellationPolicies(cpRes.data);
        if (vpRes.success && vpRes.data) setVisaPolicies(vpRes.data);
      } catch (err) {
        console.error("Failed to fetch policies:", err);
      }
    };
    fetchPolicies();
  }, []);

  // Step field name maps for trigger-based wizard validation
  const STEP_FIELD_NAMES: Record<number, (keyof TourFormValues)[]> = {
    0: ["basicInfo", "enTranslation"],
    1: ["classifications"],
    2: ["dayPlans"],
    3: ["services"],
    4: ["insurances"],
    5: [],
  };

  const goNext = async () => {
    const fieldsForStep = STEP_FIELD_NAMES[currentStep] ?? [];
    const isValid = await form.trigger(fieldsForStep as (keyof TourFormValues)[]);
    if (isValid) {
      setThumbnailError(undefined);
      setImagesError(undefined);
      const nextStep = Math.min(currentStep + 1, WIZARD_STEPS.length - 1);
      setCurrentStep(nextStep);
      setMaxNavigableStep((max) => Math.max(max, nextStep));
    }
  };

  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  /* ── Classification CRUD ──────────────────────────────────── */
  const addClassification = () => {
    const current = form.getValues("classifications");
    const newCls = { id: "", name: "", enName: "", description: "", enDescription: "", basePrice: "", durationDays: "" };
    form.setValue("classifications", [...current, newCls]);
    setDayPlans((prev) => [...prev, []]);
    setInsurances((prev) => [...prev, []]);
  };

  const removeClassification = (index: number) => {
    const current = form.getValues("classifications");
    if (current.length <= 1) return;
    const deletedId = current[index]?.id;
    if (deletedId) {
      setDeletedClassificationIds((prev) => [...prev, deletedId]);
    }
    const updated = current.filter((_, i) => i !== index);
    form.setValue("classifications", updated);
    setDayPlans((prev) => prev.filter((_, i) => i !== index));
    setInsurances((prev) => prev.filter((_, i) => i !== index));
  };

  const updateClassification = (
    index: number,
    field: keyof ClassificationForm,
    value: string,
  ) => {
    const current = form.getValues("classifications");
    const updated = current.map((cls, i) =>
      i === index ? { ...cls, [field]: value } : cls,
    );
    form.setValue("classifications", updated);
    if (field === "durationDays") {
      setDayPlans((prev) =>
        prev.map((plans, i) =>
          i !== index ? plans : syncPlansByDuration(plans, value),
        ),
      );
    }
  };

  useEffect(() => {
    const current = form.getValues("classifications");
    setDayPlans((prev) =>
      current.map((classification, index) =>
        syncPlansByDuration(prev[index] ?? [], classification.durationDays),
      ),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.getValues("classifications")]);

  const updateClassificationPackageTypeVi = (index: number, value: string) => {
    const option = findPackageTypeOption(value);
    const current = form.getValues("classifications");
    if (!option) {
      form.setValue("classifications", current.map((cls, i) =>
        i === index ? { ...cls, name: value } : cls,
      ));
      return;
    }
    form.setValue("classifications", current.map((cls, i) =>
      i === index ? { ...cls, name: option.vi, enName: option.en } : cls,
    ));
  };

  const updateClassificationPackageTypeEn = (index: number, value: string) => {
    const option = findPackageTypeOption(value);
    const current = form.getValues("classifications");
    if (!option) {
      form.setValue("classifications", current.map((cls, i) =>
        i === index ? { ...cls, enName: value } : cls,
      ));
      return;
    }
    form.setValue("classifications", current.map((cls, i) =>
      i === index ? { ...cls, name: option.vi, enName: option.en } : cls,
    ));
  };

  /* ── Day Plan CRUD ────────────────────────────────────────── */
  const addDayPlan = (clsIndex: number) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? [...plans, { ...emptyDayPlan(), dayNumber: String(plans.length + 1) }]
          : plans,
      ),
    );
  };

  const removeDayPlan = (clsIndex: number, dayIndex: number) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex ? plans.filter((_, j) => j !== dayIndex) : plans,
      ),
    );
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
          ? plans.map((day, j) => (j === dayIndex ? { ...day, [field]: value } : day))
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
              j === dayIndex ? { ...day, activities: [...day.activities, emptyActivity()] } : day,
            )
          : plans,
      ),
    );
  };

  const removeActivity = (clsIndex: number, dayIndex: number, actIndex: number) => {
    const deletedId = dayPlans[clsIndex]?.[dayIndex]?.activities[actIndex]?.id;
    if (deletedId) {
      setDeletedActivityIds((prev) => [...prev, deletedId]);
    }
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? plans.map((day, j) =>
              j === dayIndex
                ? { ...day, activities: day.activities.filter((_, k) => k !== actIndex) }
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

  /* ── Route CRUD ───────────────────────────────────────────── */
  const addRoute = (pi: number, di: number, ai: number) => {
    setDayPlans((prev) => {
      const updated = [...prev];
      updated[pi][di].activities[ai].routes.push(emptyRoute());
      return updated;
    });
  };

  const removeRoute = (pi: number, di: number, ai: number, ri: number) => {
    setDayPlans((prev) => {
      const updated = [...prev];
      updated[pi][di].activities[ai].routes.splice(ri, 1);
      return updated;
    });
  };

  const updateRoute = (pi: number, di: number, ai: number, ri: number, field: keyof ActivityRouteForm, value: string) => {
    setDayPlans((prev) => {
      const updated = [...prev];
      (updated[pi][di].activities[ai].routes[ri] as Record<keyof ActivityRouteForm, string>)[field] = value;
      return updated;
    });
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
          ? insList.map((ins, j) => (j === insIndex ? { ...ins, [field]: value } : ins))
          : insList,
      ),
    );
  };

  /* ── Link to Resources CRUD ─────────────────────────────────── */
  const addLinkToResource = (clsIndex: number, dayIndex: number, actIndex: number) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? plans.map((day, j) =>
              j === dayIndex
                ? {
                    ...day,
                    activities: day.activities.map((act, k) =>
                      k === actIndex
                        ? { ...act, linkToResources: [...act.linkToResources, ""] }
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
                            linkToResources: act.linkToResources.map((link, l) => (l === linkIndex ? value : link)),
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

  const removeLinkToResource = (clsIndex: number, dayIndex: number, actIndex: number, linkIndex: number) => {
    setDayPlans((prev) =>
      prev.map((plans, i) =>
        i === clsIndex
          ? plans.map((day, j) =>
              j === dayIndex
                ? {
                    ...day,
                    activities: day.activities.map((act, k) =>
                      k === actIndex
                        ? { ...act, linkToResources: act.linkToResources.filter((_, l) => l !== linkIndex) }
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
    const current = form.getValues("services");
    const newSvc = { serviceName: "", enServiceName: "", pricingType: "", price: "", salePrice: "", email: "", contactNumber: "" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue("services", [...current, newSvc] as any);
  };

  const removeService = (index: number) => {
    const current = form.getValues("services");
    if (current.length <= 1) return;
    const updated = current.filter((_, i) => i !== index);
    form.setValue("services", updated);
  };

  const updateService = (
    index: number,
    field: keyof ServiceForm,
    value: string,
  ) => {
    const current = form.getValues("services");
    const updated = current.map((svc, i) => (i === index ? { ...svc, [field]: value } : svc));
    form.setValue("services", updated);
  };

  /* ── Submit ───────────────────────────────────────────────── */
  // Internal submit handler — called by form.handleSubmit after Zod validation passes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = (form.handleSubmit as (handler: (values: TourFormValues) => Promise<void>) => () => void)(async (values: TourFormValues) => {
    try {
      setSaving(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formData = buildTourFormData({
        basicInfo: values.basicInfo as any,
        thumbnail,
        images,
        vietnameseTranslation: {
          tourName: values.basicInfo.tourName ?? "",
          shortDescription: values.basicInfo.shortDescription ?? "",
          longDescription: values.basicInfo.longDescription ?? "",
          seoTitle: values.basicInfo.seoTitle ?? "",
          seoDescription: values.basicInfo.seoDescription ?? "",
        },
        englishTranslation: values.enTranslation as any,
        classifications: values.classifications as any,
        dayPlans,
        insurances,
        services,
        selectedPricingPolicyId,
        selectedDepositPolicyId,
        selectedCancellationPolicyId,
        selectedVisaPolicyId,
      });

      if (isEditMode) {
        if (initialData?.id) {
          formData.append("id", initialData.id);
        }
        if (existingImages.length > 0) {
          const preservedImages = existingImages
            .filter((img) => img.fileId && img.publicURL)
            .map((img) => ({
              fileId: img.fileId,
              originalFileName: img.originalFileName ?? "",
              fileName: img.fileName ?? "",
              publicURL: img.publicURL,
            }));
          if (preservedImages.length > 0) {
            formData.append("existingImages", JSON.stringify(preservedImages));
          }
        }
        if (deletedClassificationIds.length > 0) {
          formData.append("deletedClassificationIds", JSON.stringify(deletedClassificationIds));
        }
        if (deletedActivityIds.length > 0) {
          formData.append("deletedActivityIds", JSON.stringify(deletedActivityIds));
        }
      }

      await onSubmit(formData, deletedClassificationIds, deletedActivityIds);

      if (!isEditMode) {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    } catch (error: unknown) {
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
  });

  /* ── Sync selectedPackageIndex with classifications ─────────── */
  useEffect(() => {
    setSelectedPackageIndex((prev) => {
      if (classifications.length === 0) return 0;
      return Math.min(prev, classifications.length - 1);
    });
  }, [classifications.length]);

  /* ══════════════════════════════════════════════════════════
     Render — Shell with wizard chrome + builder delegation
     ══════════════════════════════════════════════════════════ */
  return (
    <FormProvider {...form}>
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
      {/* Saving overlay */}
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
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditMode
                ? t("tourAdmin.editPage.title", "Edit Tour")
                : t("tourAdmin.createPage.title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("tourAdmin.createPage.stepOf", { current: currentStep + 1, total: WIZARD_STEPS.length })}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={handleFormSubmit}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              {saving && <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />}
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

      {/* Step Content — delegate to builders */}
      <div className="p-4 sm:p-6 max-w-5xl">
        {currentStep === 0 && (
          <BasicInfoSection
            basicInfo={watchedValues.basicInfo as BasicInfoForm}
            enTranslation={watchedValues.enTranslation as TranslationFields}
            activeLang={watchedValues.activeLang}
            thumbnail={thumbnail}
            existingThumbnail={existingThumbnail}
            images={images}
            existingImages={existingImages}
            thumbnailError={thumbnailError}
            imagesError={imagesError}
            pricingPolicies={pricingPolicies}
            depositPolicies={depositPolicies}
            cancellationPolicies={cancellationPolicies}
            selectedPricingPolicyId={selectedPricingPolicyId}
            selectedDepositPolicyId={selectedDepositPolicyId}
            selectedCancellationPolicyId={selectedCancellationPolicyId}
            selectedVisaPolicyId={selectedVisaPolicyId}
            isEditMode={isEditMode}
            setBasicInfo={(field, value) => form.setValue(`basicInfo.${field}` as keyof TourFormValues, value as never, { shouldValidate: true })}
            setEnTranslation={(field, value) => form.setValue(`enTranslation.${field}` as keyof TourFormValues, value as never, { shouldValidate: true })}
            setActiveLang={setActiveLang}
            setThumbnail={setThumbnail}
            setExistingThumbnail={setExistingThumbnail}
            setImages={setImages}
            setExistingImages={setExistingImages}
            setThumbnailError={setThumbnailError}
            setImagesError={setImagesError}
            setSelectedPricingPolicyId={setSelectedPricingPolicyId}
            setSelectedDepositPolicyId={setSelectedDepositPolicyId}
            setSelectedCancellationPolicyId={setSelectedCancellationPolicyId}
            setSelectedVisaPolicyId={setSelectedVisaPolicyId}
            onRemoveExistingImage={(img) =>
              setExistingImages((prev) => prev.filter((i) => i.fileId !== img.fileId))
            }
            onRemoveExistingThumbnail={() => setExistingThumbnail(null)}
          />
        )}

        {currentStep === 1 && (
          <TourClassificationsBuilder
            classifications={watchedValues.classifications as ClassificationForm[]}
            isEditMode={isEditMode}
            onAddClassification={addClassification}
            onRemoveClassification={(i) =>
              isEditMode ? setConfirmDelete({ type: "classification", index1: i }) : removeClassification(i)
            }
            onUpdateClassification={updateClassification}
            onUpdateClassificationPackageTypeVi={updateClassificationPackageTypeVi}
            onUpdateClassificationPackageTypeEn={updateClassificationPackageTypeEn}
            setConfirmDelete={setConfirmDelete}
          />
        )}

        {currentStep === 2 && (
          <TourItineraryBuilder
            classifications={watchedValues.classifications as ClassificationForm[]}
            dayPlans={dayPlans}
            selectedPackageIndex={selectedPackageIndex}
            expandedRoutes={expandedRoutes}
            isEditMode={isEditMode}
            activeLang={activeLang}
            activityTypes={activityTypes}
            transportationTypes={transportationTypes}
            onSetSelectedPackageIndex={setSelectedPackageIndex}
            onAddDayPlan={addDayPlan}
            onRemoveDayPlan={removeDayPlan}
            onUpdateDayPlan={updateDayPlan}
            onAddActivity={addActivity}
            onRemoveActivity={(pi, di, ai) =>
              isEditMode ? setConfirmDelete({ type: "activity", index1: pi, index2: di, index3: ai }) : removeActivity(pi, di, ai)
            }
            onUpdateActivity={updateActivity}
            onAddRoute={addRoute}
            onRemoveRoute={removeRoute}
            onUpdateRoute={updateRoute}
            onToggleActivityRoute={toggleActivityRoute}
            onAddLinkToResource={addLinkToResource}
            onUpdateLinkToResource={updateLinkToResource}
            onRemoveLinkToResource={removeLinkToResource}
            onConfirmDelete={() => {}}
            setConfirmDelete={setConfirmDelete}
          />
        )}

        {currentStep === 3 && (
          <ServicesSection
            services={watchedValues.services as unknown as ServiceForm[]}
            onAddService={addService}
            onRemoveService={removeService}
            onUpdateService={updateService}
          />
        )}

        {currentStep === 4 && (
          <InsuranceSection
            classifications={watchedValues.classifications as ClassificationForm[]}
            insurances={insurances}
            activeLang={activeLang}
            insuranceTypes={insuranceTypes}
            onAddInsurance={addInsurance}
            onRemoveInsurance={removeInsurance}
            onUpdateInsurance={updateInsurance}
          />
        )}

        {currentStep === 5 && (
          <TourPreviewSection
            basicInfo={watchedValues.basicInfo as BasicInfoForm}
            thumbnail={thumbnail}
            existingThumbnail={existingThumbnail}
            images={images}
            existingImages={existingImages}
            classifications={watchedValues.classifications as ClassificationForm[]}
            dayPlans={dayPlans}
            services={watchedValues.services as unknown as ServiceForm[]}
            insurances={insurances}
          />
        )}

        {/* Navigation Buttons */}
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
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
              {saving && <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />}
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

      {/* Delete Confirmation Dialog (Edit Mode) */}
      <ConfirmationDialog
        active={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("tourAdmin.confirmDelete.title")}
        message={t("tourAdmin.confirmDelete.message")}
        confirmLabel={t("tourAdmin.confirmDelete.confirm")}
        cancelLabel={t("tourAdmin.confirmDelete.cancel")}
      />
    </div>
    </FormProvider>
  );
}
