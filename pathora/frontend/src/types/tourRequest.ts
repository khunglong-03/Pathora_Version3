export type TourRequestStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export type TourRequestTravelInterest =
  | "Adventure"
  | "CultureAndHistory"
  | "NatureAndWildlife"
  | "FoodAndCulinary"
  | "RelaxationAndWellness";

export interface TourRequestVm {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  numberOfParticipants: number;
  budgetPerPersonUsd: number;
  travelInterests: string[];
  status: string;
  createdOnUtc: string;
  adminNote: string | null;
  reviewedAt: string | null;
}

export interface TourRequestDetailDto {
  id: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  numberOfParticipants: number;
  budgetPerPersonUsd: number;
  travelInterests: string[];
  preferredAccommodation: string | null;
  transportationPreference: string | null;
  specialRequests: string | null;
  status: string;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdBy: string | null;
  createdOnUtc: string;
  lastModifiedBy: string | null;
  lastModifiedOnUtc: string | null;
  tourInstanceId: string | null;
}

export interface CreateTourRequestPayload {
  destination: string;
  startDate: string;
  endDate?: string | null;
  numberOfParticipants: number;
  budgetPerPersonUsd?: number | null;
  travelInterests?: TourRequestTravelInterest[];
  preferredAccommodation?: string | null;
  transportationPreference?: string | null;
  specialRequests?: string | null;
}

export interface ReviewTourRequestPayload {
  status: Extract<TourRequestStatus, "Approved" | "Rejected">;
  adminNote?: string | null;
}

export interface TourRequestFilters {
  status?: TourRequestStatus | "All";
  searchText?: string;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginatedTourRequestResponse<T> {
  total: number;
  data: T[];
}

export interface TourRequestStatusMeta {
  labelKey: string;
  badgeClassName: string;
  dotClassName: string;
}

export const TOUR_REQUEST_STATUS_MAP: Record<TourRequestStatus, TourRequestStatusMeta> = {
  Pending: {
    labelKey: "tourRequest.status.pending",
    badgeClassName: "bg-amber-100 text-amber-700",
    dotClassName: "bg-amber-500",
  },
  Approved: {
    labelKey: "tourRequest.status.approved",
    badgeClassName: "bg-emerald-100 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  Rejected: {
    labelKey: "tourRequest.status.rejected",
    badgeClassName: "bg-rose-100 text-rose-700",
    dotClassName: "bg-rose-500",
  },
  Cancelled: {
    labelKey: "tourRequest.status.cancelled",
    badgeClassName: "bg-slate-100 text-slate-700",
    dotClassName: "bg-slate-500",
  },
};

const STATUS_NORMALIZATION_MAP: Record<string, TourRequestStatus> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const normalizeTourRequestStatus = (
  status: string | null | undefined,
): TourRequestStatus => {
  if (!status) {
    return "Pending";
  }

  const normalizedKey = status.trim().toLowerCase();
  return STATUS_NORMALIZATION_MAP[normalizedKey] ?? "Pending";
};

export const TOUR_REQUEST_TRAVEL_INTERESTS: TourRequestTravelInterest[] = [
  "Adventure",
  "CultureAndHistory",
  "NatureAndWildlife",
  "FoodAndCulinary",
  "RelaxationAndWellness",
];
