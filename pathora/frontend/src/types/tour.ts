// Translation data types
export interface TourDayActivityTranslationData {
  title: string;
  description?: string | null;
  note?: string | null;
  transportationType?: string | null;
  transportationName?: string | null;
  fromLocationName?: string | null;
  toLocationName?: string | null;
}



export interface TourDayTranslationData {
  title: string;
  description?: string | null;
}

export interface TourClassificationTranslationData {
  name: string;
  description: string;
}

export interface TourResourceTranslationData {
  name: string;
  description?: string | null;
  note?: string | null;
  fromLocationName?: string | null;
  toLocationName?: string | null;
  transportationName?: string | null;
  ticketInfo?: string | null;
}

// Tour detail types matching backend DTOs

export interface ImageDto {
  fileId: string | null;
  originalFileName: string | null;
  fileName: string | null;
  publicURL: string | null;
}

export interface TourPlanLocationDto {
  id: string;
  locationName: string;
  locationDescription: string | null;
  locationType: number;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  entranceFee: number | null;
  openingHours: string | null;
  closingHours: string | null;
  estimatedDurationMinutes: number | null;
  note: string | null;
}



export interface TourPlanAccommodationDto {
  id: string;
  accommodationName: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  roomType: number;
  roomCapacity: number;
  roomPrice: number | null;
  numberOfRooms: number | null;
  numberOfNights: number | null;
  totalPrice: number | null;
  mealsIncluded: number;
  specialRequest: string | null;
  address: string | null;
  city: string | null;
  contactPhone: string | null;
  website: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  translations?: Record<string, any>;
}

export interface TourDayActivityDto {
  id: string;
  tourDayId: string;
  order: number;
  activityType: string;
  title: string;
  description: string | null;
  note: string | null;
  estimatedCost: number | null;
  isOptional: boolean;
  startTime: string | null;
  endTime: string | null;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  distanceKm?: number | null;
  bookingReference?: string | null;
  accommodation: TourPlanAccommodationDto | null;
  translations?: Record<string, TourDayActivityTranslationData>;
  enTransportationType?: string | null;
  enTransportationName?: string | null;
  // Location fields — populated from TourPlanLocations for all activity types
  locationName?: string | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  locationAddress?: string | null;
  locationEntranceFee?: number | null;
  // Transportation fields — for type 7 (Transportation) activities
  fromLocationName?: string | null;
  toLocationName?: string | null;
  transportationType?: string | null;
  transportationName?: string | null;
  durationMinutes?: number | null;
  price?: number | null;
  // Accommodation fields — for type 8 (Accommodation) activities
  accommodationName?: string | null;
  accommodationAddress?: string | null;
  accommodationPhone?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

export interface TourDayDto {
  id: string;
  classificationId: string;
  dayNumber: number;
  title: string;
  description: string | null;
  activities: TourDayActivityDto[];
  translations?: Record<string, TourDayTranslationData>;
}

export interface TourInsuranceDto {
  id: string;
  insuranceName: string;
  insuranceType: number;
  insuranceProvider: string;
  coverageDescription: string;
  coverageAmount: number;
  coverageFee: number;
  isOptional: boolean;
  note: string | null;
}

export interface TourClassificationDto {
  id: string;
  tourId: string;
  name: string;
  basePrice?: number;
  price: number;
  salePrice: number;
  description: string;
  numberOfDay?: number;
  numberOfNight?: number;
  durationDays: number;
  dynamicPricing?: DynamicPricingDto[];
  plans: TourDayDto[];
  insurances: TourInsuranceDto[];
  translations?: Record<string, TourClassificationTranslationData>;
}

export interface ServiceDto {
  id?: string;
  serviceName: string;
  pricingType?: string;
  price?: number;
  salePrice?: number;
  email?: string;
  contactNumber?: string;
  translations?: Record<string, TourResourceTranslationData>;
}

export interface TourDto {
  id: string;
  tourCode: string;
  tourName: string;
  shortDescription: string;
  longDescription: string;
  status: number | string;
  tourScope?: number | string;
  isVisa: boolean;
  continent?: string;
  customerSegment?: number;
  seoTitle: string | null;
  seoDescription: string | null;
  isDeleted: boolean;
  thumbnail: ImageDto;
  images: ImageDto[];
  classifications: TourClassificationDto[];
  translations?: Record<string, TourTranslationData>;
  location?: string | null;
  includedServices?: string[];
  createdBy: string | null;
  createdOnUtc: string;
  lastModifiedBy: string | null;
  lastModifiedOnUtc: string | null;
  services?: ServiceDto[];
  depositPolicy?: DepositPolicyDto | null;
}

export interface TourTranslationData {
  tourName: string;
  shortDescription: string;
  longDescription: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

// Tour admin list view model
export interface TourVm {
  id: string;
  tourCode: string;
  tourName: string;
  shortDescription: string;
  status: string;
  thumbnail: ImageDto | null;
  createdOnUtc: string;
  isVisa: boolean;
}

// Public tour list view model (used for By Tour view)
export interface SearchTourVm {
  id: string;
  tourName: string;
  thumbnail: string | null;
  shortDescription: string | null;
  location: string | null;
  durationDays: number;
  price: number;
  salePrice: number;
  classificationName: string | null;
  rating: number | null;
  isVisa: boolean;
  // Optional fields for admin page
  tourCode?: string;
  status?: string;
  createdOnUtc?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  total: number;
  data: T[];
}

// TourStatus typed constants matching backend enum values
export const TourStatus = {
  Active: 1,
  Inactive: 2,
  Pending: 3,
  Rejected: 4,
} as const;
export type TourStatusValue = typeof TourStatus[keyof typeof TourStatus];

// Enum maps for display
export const TourStatusMap: Record<number, string> = {
  1: "Active",
  2: "Inactive",
  3: "Pending",
  4: "Rejected",
};

// TourPlanStatus — matches backend enum (TourPlanStatus.cs)
export const TourPlanStatus = {
  Draft: 0,
  Planning: 1,
  Ready: 2,
  Published: 3,
  InProgress: 4,
  Completed: 5,
  Cancelled: 6,
} as const;
export type TourPlanStatusValue = typeof TourPlanStatus[keyof typeof TourPlanStatus];

export const TourPlanStatusMap: Record<number, string> = {
  0: "Draft",
  1: "Planning",
  2: "Ready",
  3: "Published",
  4: "InProgress",
  5: "Completed",
  6: "Cancelled",
};

export const ActivityTypeMap: Record<number, string> = {
  0: "Sightseeing",
  1: "Dining",
  2: "Shopping",
  3: "Adventure",
  4: "Relaxation",
  5: "Cultural",
  6: "Entertainment",
  7: "Transportation",
  8: "Accommodation",
  9: "Free Time",
  99: "Other",
};

export const TransportationTypeMap: Record<number, string> = {
  0: "Walking",
  1: "Bus",
  2: "Train",
  3: "Flight",
  4: "Boat",
  5: "Car",
  6: "Bicycle",
  7: "Motorbike",
  8: "Taxi",
  99: "Other",
};

// Phương tiện đặc thù không có in-app supplier (vé máy bay/tàu/du thuyền/khác) —
// Manager phải tự book bên ngoài và confirm sau khi khách thanh toán
// (xem TourInstanceDayActivityEntity.IsExternalOnlyTransportationType).
const EXTERNAL_ONLY_TRANSPORTATION_NAMES = new Set(["Flight", "Train", "Boat", "Other"]);
const EXTERNAL_ONLY_TRANSPORTATION_KEYS = new Set([2, 3, 4, 99]); // Train, Flight, Boat, Other

export const isExternalOnlyTransportation = (
  transportationType: string | number | null | undefined,
): boolean => {
  if (transportationType === null || transportationType === undefined) return false;
  if (typeof transportationType === "number") {
    return EXTERNAL_ONLY_TRANSPORTATION_KEYS.has(transportationType);
  }
  const numeric = Number(transportationType);
  if (Number.isInteger(numeric) && EXTERNAL_ONLY_TRANSPORTATION_KEYS.has(numeric)) {
    return true;
  }
  return EXTERNAL_ONLY_TRANSPORTATION_NAMES.has(transportationType);
};

// Boundary map between the Vehicle Type picker and the backend payload
// (`TourInstanceDayActivityEntity.RequestedVehicleType : VehicleType`).
// Keys MUST stay 1:1 with `panthora_be/src/Domain/Enums/VehicleType.cs`.
// If BE adds a value (e.g. Limousine = 7), update this map too.
// NOTE: do NOT use this on read paths — BE returns the enum name as a string
// via global JsonStringEnumConverter; use it only when the UI sends a numeric key.
export const VehicleTypeMap: Record<number, string> = {
  1: "Car",
  2: "Bus",
  3: "Minibus",
  4: "Van",
  5: "Coach",
  6: "Motorbike",
};

export function vehicleTypeNameToKey(name: string): number | undefined {
  const entry = Object.entries(VehicleTypeMap).find(([, label]) => label === name);
  if (!entry) {
    console.warn(
      `[VehicleTypeMap] Unknown vehicle type name "${name}". Known: ${Object.values(VehicleTypeMap).join(", ")}.`,
    );
    return undefined;
  }
  return Number(entry[0]);
}

export const LegacyRoomTypeMap: Record<number, string> = {
  0: "Single (Legacy)",
  1: "Double (Legacy)",
  2: "Twin (Legacy)",
  3: "Suite (Legacy)",
  4: "Family (Legacy)",
  5: "Dormitory (Legacy)",
  99: "Other (Legacy)",
};

export const MealTypeMap: Record<number, string> = {
  0: "None",
  1: "Breakfast",
  2: "Lunch",
  3: "Dinner",
  4: "All Inclusive",
};

export const InsuranceTypeMap: Record<number, string> = {
  0: "None",
  1: "Travel",
  2: "Health",
  3: "Trip Cancellation",
  4: "Baggage Loss",
  5: "Personal Liability",
  6: "Adventure Sports",
};

export const LocationTypeMap: Record<number, string> = {
  0: "City",
  1: "Historical Site",
  2: "Natural Wonder",
  3: "Temple/University",
  4: "Beach",
  5: "Museum",
  6: "Market",
  7: "Restaurant",
  8: "Hotel",
  9: "Airport",
  10: "Train Station",
  11: "Bus Station",
  12: "Port",
  99: "Other",
};

// ── Tour Instance Types ────────────────────────────────────────

export interface TourInstanceManagerDto {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  role: "Guide" | "Manager";
}

export interface DynamicPricingDto {
  minParticipants: number;
  maxParticipants: number;
  pricePerPerson: number;
}

export interface DynamicPricingResolutionDto {
  resolvedPricePerPerson: number;
  pricingSource: "instance" | "classification" | "fallback";
  minParticipants: number | null;
  maxParticipants: number | null;
}

export interface TourInstanceVm {
  id: string;
  tourId: string;
  tourInstanceCode: string;
  title: string;
  tourName: string;
  tourCode: string;
  classificationName: string;
  location: string | null;
  thumbnail: ImageDto | null;
  images: ImageDto[];
  startDate: string;
  endDate: string;
  durationDays: number;
  currentParticipation: number;
  maxParticipation: number;
  basePrice: number;
  status: string;
  instanceType: string;
  /** @deprecated Instance-level approval status is a transition artifact. Per-activity status on days[].activities[].transportationApprovalStatus is authoritative. Used by the rollup pill (section 1) only as a downscope pending backend DTO enrichment. */
  transportApprovalStatus: number;
}

export interface TourInstanceDayDto {
  id: string;
  instanceDayNumber: number;
  actualDate: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  activities: TourInstanceDayActivityDto[];
}

/** One concrete vehicle (and driver) row for a transportation activity; mirrors backend `TourInstanceTransportAssignmentDto`. */
export interface TourInstanceTransportAssignmentDto {
  id: string;
  vehicleId: string;
  driverId?: string | null;
  seatCountSnapshot?: number | null;
  vehicleType?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleSeatCapacity?: number | null;
  driverName?: string | null;
  driverPhone?: string | null;
}

export interface TourInstanceDayActivityDto {
  id: string;
  order: number;
  activityType: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  isOptional: boolean;
  note: string | null;
  accommodation: TourInstancePlanAccommodationDto | null;

  // Transportation plan info (flattened from former routes)
  transportationType?: string | null;
  transportationName?: string | null;
  fromLocation?: TourPlanLocationDto | null;
  toLocation?: TourPlanLocationDto | null;
  durationMinutes?: number | null;
  price?: number | null;

  // Transport Plan fields (per-activity)
  requestedVehicleType?: string | null;
  requestedSeatCount?: number | null;
  /** Scope addendum 2026-04-23 — manager-requested vehicle count (nullable for legacy). */
  requestedVehicleCount?: number | null;
  transportSupplierId?: string | null;
  transportSupplierName?: string | null;
  transportationApprovalStatus?: string | null;
  transportationApprovalNote?: string | null;

  // Instance-specific vehicle assignment (flattened)
  vehicleId?: string | null;
  vehicleType?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  seatCapacity?: number | null;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  /** Multi-vehicle rows when present; legacy flattened `vehicleId` / `driverId` may still reflect the primary row. */
  transportAssignments?: TourInstanceTransportAssignmentDto[];

  // External transport confirmation (Flight/Train/Boat) — Manager confirms manually post-payment
  externalTransportConfirmed?: boolean | null;
  externalTransportConfirmedAt?: string | null;
  externalTransportConfirmedBy?: string | null;
}

export interface TicketImageDto {
  id: string;
  tourInstanceDayActivityId: string;
  imageUrl?: string | null;
  originalFileName?: string | null;
  uploadedBy: string;
  uploadedAt: string;
  bookingId?: string | null;
  bookingReference?: string | null;
  note?: string | null;
}

export interface UploadTicketImagePayload {
  file: File;
  bookingId?: string | null;
  bookingReference?: string | null;
  note?: string | null;
}

export interface TourInstancePlanAccommodationDto {
  id: string;
  roomType: string;
  quantity: number;
  roomBlocksTotal?: number;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierApprovalStatus?: string | null;
  supplierApprovalNote?: string | null;
}

// TourInstancePlanRouteDto removed — vehicle/driver data is now flattened onto TourInstanceDayActivityDto

export interface PricingPolicyTierDto {
  label: string;
  ageFrom: number;
  ageTo?: number | null;
  pricePercentage: number;
}

export interface PricingPolicyDto {
  id: string;
  policyCode: string;
  name: string;
  tiers: PricingPolicyTierDto[];
}

export interface CancellationPolicyTierDto {
  minDaysBeforeDeparture: number;
  maxDaysBeforeDeparture: number;
  penaltyPercentage: number;
}

export interface CancellationPolicyDto {
  id: string;
  policyCode: string;
  tiers: CancellationPolicyTierDto[];
}

export interface DepositPolicyDto {
  id: string;
  depositType: string | number;
  depositValue: number;
  minDaysBeforeDeparture: number;
}

export interface TourInstanceDto {
  id: string;
  tourId: string;
  tourInstanceCode: string;
  title: string;
  tourName: string;
  tourCode: string;
  classificationId: string;
  classificationName: string;
  location: string | null;
  thumbnail: ImageDto | null;
  images: ImageDto[];
  startDate: string;
  endDate: string;
  durationDays: number;
  currentParticipation: number;
  maxParticipation: number;
  basePrice: number;
  status: string;
  instanceType: string;
  cancellationReason?: string | null;
  rating: number;
  totalBookings: number;
  revenue: number;
  confirmationDeadline: string | null;
  managers: TourInstanceManagerDto[];
  includedServices: string[];
  /** @deprecated Instance-level approval status is a transition artifact. Per-activity status on days[].activities[].transportationApprovalStatus is authoritative. */
  transportApprovalStatus: number;
  /** @deprecated Instance-level approval note is a transition artifact. Per-activity note on days[].activities[].transportationApprovalNote is authoritative. */
  transportApprovalNote?: string | null;
  days?: TourInstanceDayDto[];
  pricingPolicy?: PricingPolicyDto | null;
  cancellationPolicy?: CancellationPolicyDto | null;
  depositPolicy?: DepositPolicyDto | null;
  /** Giá chốt sau co-design (private tour); từ API khi đã set. */
  finalSellPrice?: number | null;
  /** Khách muốn tùy chỉnh lịch trình (private custom tour). */
  wantsCustomization?: boolean;
  /** Ghi chú tùy chỉnh từ khách. */
  customizationNotes?: string | null;
}

export type NormalizedTourInstanceVm = TourInstanceVm & {
  registeredParticipants: number;
};

export type NormalizedTourInstanceDto = TourInstanceDto & {
  registeredParticipants: number;
};

export interface TourInstanceStats {
  totalInstances: number;
  available: number;
  confirmed: number;
  soldOut: number;
  completed: number;
}

export interface UserInfo {
  id: string;
  username?: string;
  email: string;
  fullName?: string;
  avatar?: string;
  forcePasswordChange?: boolean;
  isDeleted?: boolean;
}

export interface DepositPolicyDisplayDto {
  depositType: string;
  depositValue: number;
  description: string;
}

export const TourInstanceStatusMap: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  available: { label: "Available", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  confirmed: { label: "Confirmed", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  soldout: { label: "Sold Out", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  inprogress: { label: "In Progress", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  cancelled: { label: "Cancelled", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  completed: { label: "Completed", bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  pendingapproval: { label: "Pending Approval", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
};
