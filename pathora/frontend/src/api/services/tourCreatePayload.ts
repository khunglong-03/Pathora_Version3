import {
  buildTourTranslationsPayload,
  type TourTranslationFormValues,
} from "./tourTranslations";
import { tourFormSchema, type TourFormValues } from "@/schemas/tour-form";

interface BasicInfoPayload {
  tourName: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
  status: string;
  tourScope?: string;
  continent?: string;
  customerSegment?: string;
}

// Bilingual input types for nested entities
interface ClassificationPayloadInput {
  id?: string;
  name: string;
  enName: string;
  description: string;
  enDescription: string;
  basePrice: string;
  durationDays: string;
}

// Extended activity — includes location and generic transport mode; no supplier-specific identity
interface ActivityPayloadInput {
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
  routes: ActivityRoutePayloadInput[];

  // Location fields — all activity types (replaces standalone Locations step)
  locationName: string;
  enLocationName: string;
  locationCity: string;
  enLocationCity: string;
  locationCountry: string;
  enLocationCountry: string;
  locationAddress: string;
  enLocationAddress: string;
  locationEntranceFee: string;

  // Transportation fields — type 7 (itinerary-only: generic mode, no supplier identity)
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
}

interface DayPlanPayloadInput {
  id?: string;
  dayNumber: string;
  title: string;
  enTitle: string;
  description: string;
  enDescription: string;
  activities: ActivityPayloadInput[];
}

interface InsurancePayloadInput {
  id?: string;
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

// Keep these for the extracted/payload versions (used internally)
interface AccommodationPayloadInput {
  accommodationName: string;
  enAccommodationName: string;
  address: string;
  enAddress: string;
  contactPhone: string;
  checkInTime: string;
  checkOutTime: string;
  note: string;
  enNote: string;
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

interface LocationPayloadInput {
  locationName: string;
  enLocationName: string;
  type: string;
  enType: string;
  description: string;
  enDescription: string;
  city: string;
  enCity: string;
  country: string;
  enCountry: string;
  entranceFee: string;
  address: string;
  enAddress: string;
}

// Route within an activity
interface ActivityRoutePayloadInput {
  id: string;
  fromLocationIndex: string;
  fromLocationCustom: string;
  enFromLocationCustom: string;
  toLocationIndex: string;
  toLocationCustom: string;
  enToLocationCustom: string;
  transportationType: string;
  enTransportationType: string;
  durationMinutes: string;
  price: string;
  note: string;
  enNote: string;
}

interface ServicePayloadInput {
  id?: string;
  serviceName: string;
  enServiceName: string;
  pricingType: string;
  price: string;
  salePrice: string;
  email: string;
  contactNumber: string;
}

interface CreateTourPayloadOptions {
  mode?: "create" | "edit";
  basicInfo: BasicInfoPayload;
  thumbnail: File | null;
  images: File[];
  vietnameseTranslation: TourTranslationFormValues;
  englishTranslation: TourTranslationFormValues;
  classifications: ClassificationPayloadInput[];
  dayPlans: DayPlanPayloadInput[][];
  insurances: InsurancePayloadInput[][];
  services?: ServicePayloadInput[];
  // NOTE: accommodations, locations, transportations removed — data now lives in activities
  selectedPricingPolicyId?: string;
  selectedDepositPolicyId?: string;
  selectedCancellationPolicyId?: string;
  selectedVisaPolicyId?: string;
}

const parseDecimal = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseIntValue = (value: string, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalString = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// ── Nested translation helpers ─────────────────────────────────────────

// Builds { vi: {...}, en?: {...} } — en is omitted if empty
const buildClassificationTranslations = (
  viName: string,
  viDesc: string,
  enName: string,
  enDesc: string,
): Record<string, Record<string, string>> => {
  const result: Record<string, Record<string, string>> = {
    vi: { name: viName, description: viDesc },
  };
  if (enName.trim().length > 0 || enDesc.trim().length > 0) {
    result.en = { name: enName, description: enDesc };
  }
  return result;
};

const buildDayPlanTranslations = (
  viTitle: string,
  viDesc: string,
  enTitle: string,
  enDesc: string,
): Record<string, Record<string, string>> => {
  const result: Record<string, Record<string, string>> = {
    vi: { title: viTitle, description: viDesc },
  };
  if (enTitle.trim().length > 0 || enDesc.trim().length > 0) {
    result.en = { title: enTitle, description: enDesc };
  }
  return result;
};

const buildActivityTranslations = (
  viTitle: string,
  viDesc: string,
  viNote: string,
  enTitle: string,
  enDesc: string,
  enNote: string,
  enTransportationType?: string,
  enTransportationName?: string,
): Record<string, Record<string, string | undefined>> => {
  const result: Record<string, Record<string, string | undefined>> = {
    vi: { title: viTitle, description: viDesc, note: viNote },
  };
  const hasEnTransportation = (enTransportationType?.trim().length ?? 0) > 0 || (enTransportationName?.trim().length ?? 0) > 0;
  if (
    enTitle.trim().length > 0 ||
    enDesc.trim().length > 0 ||
    enNote.trim().length > 0 ||
    hasEnTransportation
  ) {
    const enObj: Record<string, string | undefined> = {
      title: enTitle,
      description: enDesc,
      note: enNote,
    };
    if (hasEnTransportation) {
      if (enTransportationType?.trim().length) enObj.transportationType = enTransportationType;
      if (enTransportationName?.trim().length) enObj.transportationName = enTransportationName;
    }
    result.en = enObj;
  }
  return result;
};

const buildInsuranceTranslations = (
  viName: string,
  viDesc: string,
  enName: string,
  enDesc: string,
): Record<string, Record<string, string>> => {
  const result: Record<string, Record<string, string>> = {
    vi: { name: viName, description: viDesc },
  };
  if (enName.trim().length > 0 || enDesc.trim().length > 0) {
    result.en = { name: enName, description: enDesc };
  }
  return result;
};

// ── Deduplication helper ──────────────────────────────────────────────

/** Deduplicate locations/accommodations by name to avoid sending duplicates to API */
const deduplicateByName = <T extends { locationName?: string; accommodationName?: string }>(
  items: T[],
): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.locationName ?? item.accommodationName ?? "";
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ── Classification payload builder ──────────────────────────────────

const buildClassificationsPayload = (
  classifications: ClassificationPayloadInput[],
  dayPlans: DayPlanPayloadInput[][],
  insurances: InsurancePayloadInput[][],
  mode: "create" | "edit" = "create",
) => {
  return classifications.map((classification, classificationIndex) => {
    const numberOfDay = Math.max(parseIntValue(classification.durationDays, 1), 1);
    const basePrice = parseDecimal(classification.basePrice, 0);

    const plans = dayPlans[classificationIndex] ?? [];

    // Extract locations from activities (deduplicated)
    // NOTE: Accommodations are now itinerary-only and handled at instance time, not template time
    const activityLocations: LocationPayloadInput[] = [];

    for (const dayPlan of plans) {
      for (const activity of dayPlan.activities) {
        // Location from all activity types
        if (activity.locationName?.trim()) {
          activityLocations.push({
            locationName: activity.locationName,
            enLocationName: activity.enLocationName ?? "",
            type: "activity",
            enType: "",
            description: "",
            enDescription: "",
            city: activity.locationCity ?? "",
            enCity: activity.enLocationCity ?? "",
            country: activity.locationCountry ?? "",
            enCountry: activity.enLocationCountry ?? "",
            entranceFee: activity.locationEntranceFee ?? "",
            address: activity.locationAddress ?? "",
            enAddress: activity.enLocationAddress ?? "",
          });
        }
      }
    }

    const uniqueLocations = deduplicateByName(activityLocations);
    const uniqueAccommodations: AccommodationPayloadInput[] = [];

    // Build the plans with activities (itinerary-only, no supplier-specific fields)
    const builtPlans = plans.map((dayPlan) => ({
      id: mode === "edit" && dayPlan.id && !dayPlan.id.includes("temp-") ? dayPlan.id : undefined,
      dayNumber: Math.max(parseIntValue(dayPlan.dayNumber, 1), 1),
      title: dayPlan.title,
      description: toOptionalString(dayPlan.description),
      translations: buildDayPlanTranslations(
        dayPlan.title,
        dayPlan.description,
        dayPlan.enTitle,
        dayPlan.enDescription,
      ),
      activities: dayPlan.activities.map((activity) => {
        const isAccommodation = activity.activityType === "8";
        
        return {
          id: mode === "edit" && activity.id && !activity.id.includes("temp-") ? activity.id : undefined,
          activityType: activity.activityType,
          title: activity.title,
          description: toOptionalString(activity.description),
          note: toOptionalString(activity.note),
          estimatedCost: parseDecimal(activity.estimatedCost, 0),
          isOptional: activity.isOptional,
          startTime: toOptionalString(activity.startTime),
          endTime: toOptionalString(activity.endTime),
          routes: buildRoutesPayload(activity, uniqueLocations),
          accommodation: isAccommodation ? {
            accommodationName: activity.locationName || activity.title,
            address: activity.locationAddress || "",
            contactPhone: "",
            checkInTime: toOptionalString(activity.startTime),
            checkOutTime: toOptionalString(activity.endTime),
            roomType: "",
            roomCapacity: 2,
            mealsIncluded: "",
            roomPrice: parseDecimal(activity.estimatedCost, 0),
            numberOfRooms: 1,
            numberOfNights: 1,
            latitude: 0,
            longitude: 0,
            specialRequest: "",
            translations: {
              en: {
                accommodationName: activity.enLocationName || activity.enTitle,
                address: activity.enLocationAddress || "",
                roomType: "",
                mealsIncluded: "",
                specialRequest: ""
              }
            }
          } : null,
          // Include activity-level location/transport data
          // Accommodation supplier details and transport supplier names are now instance-time only
          locationName: activity.locationName ?? "",
          enLocationName: activity.enLocationName ?? "",
          locationCity: activity.locationCity ?? "",
          enLocationCity: activity.enLocationCity ?? "",
          locationCountry: activity.locationCountry ?? "",
          enLocationCountry: activity.enLocationCountry ?? "",
          locationAddress: activity.locationAddress ?? "",
          enLocationAddress: activity.enLocationAddress ?? "",
          locationEntranceFee: activity.locationEntranceFee ?? "",
          fromLocation: activity.fromLocation ?? "",
          enFromLocation: activity.enFromLocation ?? "",
          toLocation: activity.toLocation ?? "",
          enToLocation: activity.enToLocation ?? "",
          transportationType: activity.transportationType ?? "",
          enTransportationType: activity.enTransportationType ?? "",
          transportationName: activity.transportationName ?? "",
          enTransportationName: activity.enTransportationName ?? "",
          durationMinutes: activity.durationMinutes ?? "",
          price: activity.price ?? "",
          translations: buildActivityTranslations(
            activity.title,
            activity.description,
            activity.note,
            activity.enTitle,
            activity.enDescription,
            activity.enNote,
            activity.enTransportationType,
            activity.enTransportationName,
          ),
        };
      }),
    }));

    const builtInsurances = (insurances[classificationIndex] ?? []).map((insurance) => ({
      id: mode === "edit" && insurance.id && !insurance.id.includes("temp-") ? insurance.id : undefined,
      insuranceName: insurance.insuranceName,
      insuranceType: insurance.insuranceType,
      insuranceProvider: insurance.insuranceProvider,
      coverageDescription: insurance.coverageDescription,
      coverageAmount: parseDecimal(insurance.coverageAmount, 0),
      coverageFee: parseDecimal(insurance.coverageFee, 0),
      isOptional: insurance.isOptional,
      note: toOptionalString(insurance.note),
      translations: buildInsuranceTranslations(
        insurance.insuranceName,
        insurance.coverageDescription,
        insurance.enInsuranceName,
        insurance.enCoverageDescription,
      ),
    }));

    return {
      id: mode === "edit" && classification.id && !classification.id.includes("temp-") ? classification.id : undefined,
      name: classification.name,
      description: classification.description,
      basePrice,
      numberOfDay,
      numberOfNight: Math.max(numberOfDay - 1, 0),
      translations: buildClassificationTranslations(
        classification.name,
        classification.description,
        classification.enName,
        classification.enDescription,
      ),
      plans: builtPlans,
      locations: uniqueLocations,
      accommodations: uniqueAccommodations,
      insurances: builtInsurances,
    };
  });
};

// ── Route payload builder ─────────────────────────────────────────────

const buildRoutesPayload = (
  activity: any,
  locations: LocationPayloadInput[],
) => {
  const routes = activity.routes || [];
  let mappedRoutes = routes.map((route: any) => {
    // Resolve from location
    let fromLocationName: string | null = null;
    let fromLocationId: string | null = null;
    if (route.fromLocationIndex !== "") {
      const idx = parseIntValue(route.fromLocationIndex);
      if (idx < locations.length) {
        fromLocationName = locations[idx].locationName;
        fromLocationId = null;
      }
    } else {
      fromLocationName = route.fromLocationCustom || null;
      fromLocationId = null;
    }

    // Resolve to location
    let toLocationName: string | null = null;
    let toLocationId: string | null = null;
    if (route.toLocationIndex !== "") {
      const idx = parseIntValue(route.toLocationIndex);
      if (idx < locations.length) {
        toLocationName = locations[idx].locationName;
        toLocationId = null;
      }
    } else {
      toLocationName = route.toLocationCustom || null;
      toLocationId = null;
    }

    const hasEnTransportation =
      route.enTransportationType.trim().length > 0 ||
      (route.enNote ?? "").trim().length > 0;

    return {
      id: route.id,
      fromLocationIndex: route.fromLocationIndex !== "" ? parseIntValue(route.fromLocationIndex) : null,
      fromLocationCustom: route.fromLocationIndex === "" ? route.fromLocationCustom : null,
      enFromLocationCustom: route.fromLocationIndex === "" ? route.enFromLocationCustom : null,
      toLocationIndex: route.toLocationIndex !== "" ? parseIntValue(route.toLocationIndex) : null,
      toLocationCustom: route.toLocationIndex === "" ? route.toLocationCustom : null,
      enToLocationCustom: route.toLocationIndex === "" ? route.enToLocationCustom : null,
      fromLocationName,
      toLocationName,
      fromLocationId,
      toLocationId,
      transportationType: route.transportationType,
      enTransportationType: route.enTransportationType || null,
      transportationName: null,
      enTransportationName: null,
      durationMinutes: parseIntValue(route.durationMinutes, 0),
      price: parseDecimal(route.price, 0),
      pricingType: null,
      requiresIndividualTicket: false,
      ticketInfo: null,
      note: route.note || null,
      enNote: route.enNote || null,
      routeTranslations: {
        vi: {
          transportationName: null,
          note: route.note,
        },
        ...(hasEnTransportation
          ? {
              en: {
                transportationName: null,
                note: route.enNote,
              },
            }
          : {}),
      },
    };
  });

  // If activityType is 7 (Transportation), extract top-level transportation fields as the first route
  if (activity.activityType === "7") {
    const hasTopLevelRoute = activity.fromLocation || activity.toLocation || activity.transportationType;
    if (hasTopLevelRoute) {
      const topLevelRoute = {
        transportationType: activity.transportationType || "1",
        fromLocationName: activity.fromLocation || null,
        toLocationName: activity.toLocation || null,
        fromLocationId: null,
        toLocationId: null,
        transportationName: activity.transportationName || null,
        durationMinutes: parseIntValue(activity.durationMinutes, 0),
        price: parseDecimal(activity.price, 0),
        pricingType: null,
        requiresIndividualTicket: false,
        ticketInfo: null,
        note: null,
        routeTranslations: {
          vi: {
            transportationName: null,
            note: null,
          },
          ...(activity.enTransportationName ? {
            en: {
              transportationName: null,
              note: null,
            }
          } : {})
        }
      };
      mappedRoutes = [topLevelRoute, ...mappedRoutes];
    }
  }

  return mappedRoutes;
};

export const buildServicesPayload = (services: ServicePayloadInput[], mode: "create" | "edit" = "create") =>
  services
    .filter((svc) => svc.serviceName.trim().length > 0)
    .map((svc) => ({
      id: mode === "edit" && svc.id && !svc.id.includes("temp-") ? svc.id : undefined,
      serviceName: svc.serviceName,
      pricingType: toOptionalString(svc.pricingType),
      price: parseDecimal(svc.price, 0),
      salePrice: parseDecimal(svc.salePrice, 0),
      email: toOptionalString(svc.email),
      contactNumber: toOptionalString(svc.contactNumber),
      translations: svc.enServiceName.trim().length > 0
        ? { en: { name: svc.enServiceName } }
        : undefined,
    }));

// ── Main export ─────────────────────────────────────────────────────

export const buildTourFormData = ({
  mode = "create",
  basicInfo,
  thumbnail,
  images,
  vietnameseTranslation,
  englishTranslation,
  classifications,
  dayPlans,
  insurances,
  services = [],
  // NOTE: accommodations, locations, transportations removed from signature
  selectedPricingPolicyId,
  selectedDepositPolicyId,
  selectedCancellationPolicyId,
  selectedVisaPolicyId,
}: CreateTourPayloadOptions): FormData => {
  // Safety-net Zod validation — surfaces errors early before sending to API
  const payload: TourFormValues = {
    basicInfo: {
      tourName: basicInfo.tourName,
      shortDescription: basicInfo.shortDescription,
      longDescription: basicInfo.longDescription,
      seoTitle: basicInfo.seoTitle ?? "",
      seoDescription: basicInfo.seoDescription ?? "",
      status: basicInfo.status,
      tourScope: basicInfo.tourScope ?? "",
      continent: basicInfo.continent ?? "",
      customerSegment: basicInfo.customerSegment ?? "",
    },
    enTranslation: {
      tourName: "",
      shortDescription: "",
      longDescription: "",
      seoTitle: "",
      seoDescription: "",
    },
    classifications: classifications.map((c) => ({
      id: mode === "edit" && c.id && !c.id.includes("temp-") ? c.id : undefined,
      name: c.name,
      enName: c.enName ?? "",
      description: c.description ?? "",
      enDescription: c.enDescription ?? "",
      basePrice: c.basePrice,
      durationDays: c.durationDays,
    })),
    dayPlans: dayPlans as unknown as TourFormValues["dayPlans"],
    insurances: insurances as unknown as TourFormValues["insurances"],
    services: services as unknown as TourFormValues["services"],
    activeLang: "vi",
    deletedClassificationIds: [],
    deletedActivityIds: [],
  };

  const result = tourFormSchema.safeParse(payload);
  if (!result.success) {
    // Safety-net: warn but don't block — form-level validation handles field errors
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `[${i.path.join(".")}] ${i.message}`)
      .join("; ");
    console.warn("[tourCreatePayload] Zod validation warning:", issues);
  }
  const formData = new FormData();

  formData.append("tourName", basicInfo.tourName);
  formData.append("shortDescription", basicInfo.shortDescription);
  formData.append("longDescription", basicInfo.longDescription);
  formData.append("seoTitle", basicInfo.seoTitle);
  formData.append("seoDescription", basicInfo.seoDescription);
  formData.append("status", basicInfo.status);
  if (basicInfo.tourScope) {
    formData.append("tourScope", basicInfo.tourScope);
  }
  if (basicInfo.continent) {
    formData.append("continent", basicInfo.continent);
  }
  if (basicInfo.customerSegment) {
    formData.append("customerSegment", basicInfo.customerSegment);
  }

  if (thumbnail) {
    formData.append("thumbnail", thumbnail);
  }

  images.forEach((image) => {
    formData.append("images", image);
  });

  if (selectedPricingPolicyId) {
    formData.append("pricingPolicyId", selectedPricingPolicyId);
  }

  if (selectedDepositPolicyId) {
    formData.append("depositPolicyId", selectedDepositPolicyId);
  }

  if (selectedCancellationPolicyId) {
    formData.append("cancellationPolicyId", selectedCancellationPolicyId);
  }

  if (selectedVisaPolicyId) {
    formData.append("visaPolicyId", selectedVisaPolicyId);
  }

  const translationsPayload = buildTourTranslationsPayload(
    vietnameseTranslation,
    englishTranslation,
  );
  formData.append("translations", JSON.stringify(translationsPayload));

  // accommodations, locations are now derived from activities inside classifications
  const classificationsPayload = buildClassificationsPayload(
    classifications,
    dayPlans,
    insurances,
    mode,
  );

  if (classificationsPayload.length > 0) {
    formData.append("classifications", JSON.stringify(classificationsPayload));
  }

  if (services.length > 0) {
    const servicesPayload = buildServicesPayload(services, mode);
    if (servicesPayload.length > 0) {
      formData.append("services", JSON.stringify(servicesPayload));
    }
  }

  // NOTE: standalone accommodations, locations, transportations steps removed.
  // Their data is now embedded in activity forms and routed through classifications payload.
  // Keeping the builder functions above for reference but not calling them here.

  return formData;
};
