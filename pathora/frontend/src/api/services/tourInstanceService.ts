import { isAxiosError } from "axios";
import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { ApiResponse } from "@/types/home";
import {
  DynamicPricingDto,
  DynamicPricingResolutionDto,
  NormalizedTourInstanceDto,
  NormalizedTourInstanceVm,
  PaginatedResponse,
  TicketImageDto,
  TourDayActivityDto,
  TourInstanceDayDto,
  TourInstanceDto,
  TourInstanceStats,
  TourInstanceVm,
  UploadTicketImagePayload,
} from "@/types/tour";
import { extractResult } from "@/utils/apiResponse";



/** Private tour co-design — backend TourItineraryFeedbackDto */
export interface TourItineraryFeedbackDto {
  id: string;
  tourInstanceDayId: string;
  bookingId?: string | null;
  content: string;
  isFromCustomer: boolean;
  status: string;
  rejectionReason?: string | null;
  rowVersion: string;
  createdOnUtc: string;
}

export interface PrivateTourSettlementResultDto {
  delta: number;
  topUpTransactionId?: string | null;
  creditAmount?: number | null;
}

/** One vehicle + driver row for POST .../transportation/{activityId}/approve */
export type ApproveTransportationAssignmentRow = {
  vehicleId: string;
  driverId: string;
};

/** Prefer `assignments` for multi-vehicle; legacy `{ vehicleId, driverId }` still supported by the API. */
export type ApproveTransportationPayload =
  | {
      assignments: ApproveTransportationAssignmentRow[];
      note?: string;
    }
  | {
      vehicleId: string;
      driverId: string;
      note?: string;
    };

export interface CreateTourInstanceActivityAssignment {
  originalActivityId: string;
  supplierId?: string | null;
  /** Per-activity transport supplier; backend `transportSupplierId` (distinct from hotel `supplierId`). */
  transportSupplierId?: string | null;
  roomType?: string | null;
  accommodationQuantity?: number | null;
  vehicleId?: string | null;
  requestedVehicleType?: number | null;
  requestedSeatCount?: number | null;
  requestedVehicleCount?: number | null;
}

export interface CreateTourInstancePayload {
  tourId: string;
  classificationId: string;
  title: string;
  instanceType: number;
  startDate: string;
  endDate: string;
  maxParticipation: number;
  basePrice: number;
  location?: string;
  includedServices?: string[];
  guideUserIds?: string[];
  thumbnailUrl?: string | null;
  imageUrls?: string[];
  tourRequestId?: string | null;
  activityAssignments?: CreateTourInstanceActivityAssignment[];
  translations?: Record<string, {
    title: string;
    location?: string;
  }>;
}

export interface UpdateInstanceDayPayload {
  title: string;
  description?: string | null;
  actualDate: string;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
}

export interface UpdateInstanceActivityPayload {
  note?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  price?: number | null;
  isOptional?: boolean;
}

export interface CheckDuplicateResult {
  exists: boolean;
  count: number;
  existingInstances: {
    id: string;
    title: string;
    startDate: string;
    status: string;
  }[];
}

export interface GuideConflictInstance {
  instanceId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface GuideConflict {
  guideId: string;
  conflictingInstances: GuideConflictInstance[];
}

export interface GuideAvailabilityResult {
  conflicts: GuideConflict[];
}

export interface ProviderApprovalPayload {
  providerType: "Hotel" | "Transport";
  isApproved: boolean;
  note?: string;
  accommodationActivityIds?: string[];
  transportationActivityIds?: string[];
}

export interface UpdateTourInstancePayload {
  id: string;
  title: string;
  instanceType?: number;
  startDate: string;
  endDate: string;
  maxParticipation: number;
  basePrice: number;
  location?: string;
  confirmationDeadline?: string;
  includedServices?: string[];
  guideUserIds?: string[];
  managerUserIds?: string[];
  thumbnailUrl?: string | null;
  imageUrls?: string[];
}

export interface TourInstanceRequestError {
  status?: number;
  response?: {
    status?: number;
  };
}

export const getTourInstanceRequestStatus = (
  error: unknown,
): number | undefined => {
  if (isAxiosError(error)) {
    return error.response?.status ?? error.status;
  }

  if (error && typeof error === "object") {
    const possibleError = error as TourInstanceRequestError;
    return possibleError.response?.status ?? possibleError.status;
  }

  return undefined;
};

const attachTourInstanceRequestStatus = (error: unknown): unknown => {
  const status = getTourInstanceRequestStatus(error);
  if (status && error && typeof error === "object") {
    (error as TourInstanceRequestError).status = status;
  }

  return error;
};

const normalizeStatus = (status: string): string =>
  status.trim().toLowerCase().replace(/[\s_]+/g, "");

const normalizeStringArray = (values?: string[]): string[] =>
  (values ?? []).map((value) => value.trim()).filter(Boolean);

const normalizeInstanceVm = (item: TourInstanceVm): NormalizedTourInstanceVm => ({
  ...item,
  location: item.location ?? null,
  images: item.images ?? [],
  currentParticipation: item.currentParticipation ?? 0,
  maxParticipation: item.maxParticipation ?? 0,
  status: normalizeStatus(item.status),
  registeredParticipants: item.currentParticipation ?? 0,
});

const normalizeInstanceDetail = (
  item: TourInstanceDto,
): NormalizedTourInstanceDto => ({
  ...item,
  location: item.location ?? null,
  images: item.images ?? [],
  currentParticipation: item.currentParticipation ?? 0,
  maxParticipation: item.maxParticipation ?? 0,
  includedServices: item.includedServices ?? [],
  managers: item.managers ?? [],
  status: normalizeStatus(item.status),
  registeredParticipants: item.currentParticipation ?? 0,
});

export const tourInstanceService = {
  getAllInstances: async (
    searchText?: string,
    status?: string,
    pageNumber = 1,
    pageSize = 10,
    excludePast = false,
    wantsCustomization?: boolean
  ) => {
    const params = new URLSearchParams();
    if (searchText) params.append("searchText", searchText);
    if (status && status !== "all") params.append("status", status);
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());
    if (excludePast) params.append("excludePast", "true");
    if (wantsCustomization !== undefined) params.append("wantsCustomization", wantsCustomization.toString());

    // Backend returns PaginatedList<T> mapped as { items: [], totalCount: 0 }
    type TourInstancePage = { data?: TourInstanceVm[]; items?: TourInstanceVm[]; total?: number; totalCount?: number };

    try {
      const response = await api.get<ApiResponse<TourInstancePage>>(
        `${API_ENDPOINTS.TOUR_INSTANCE.GET_ALL}?${params.toString()}`,
      );

      const result = extractResult<TourInstancePage>(response.data);
      if (!result) return null;

      const items = result.items ?? result.data ?? [];
      const total = result.totalCount ?? result.total ?? 0;

      return {
        total,
        data: items.map(normalizeInstanceVm),
      } as PaginatedResponse<NormalizedTourInstanceVm>;
    } catch (error) {
      throw attachTourInstanceRequestStatus(error);
    }
  },

  getInstanceDetail: async (id: string) => {
    const response = await api.get<ApiResponse<TourInstanceDto>>(
      API_ENDPOINTS.TOUR_INSTANCE.GET_DETAIL(id),
    );

    const result = extractResult<TourInstanceDto>(response.data);
    return result ? normalizeInstanceDetail(result) : null;
  },

  getPricingTiers: async (id: string) => {
    const response = await api.get<ApiResponse<DynamicPricingDto[]>>(
      API_ENDPOINTS.TOUR_INSTANCE.GET_PRICING_TIERS(id),
    );
    return extractResult<DynamicPricingDto[]>(response.data) ?? [];
  },

  upsertPricingTiers: async (id: string, tiers: DynamicPricingDto[]) => {
    const response = await api.put<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.UPSERT_PRICING_TIERS(id),
      tiers,
    );
    return extractResult<unknown>(response.data);
  },

  clearPricingTiers: async (id: string) => {
    const response = await api.delete<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.CLEAR_PRICING_TIERS(id),
    );
    return extractResult<unknown>(response.data);
  },

  resolvePricing: async (
    id: string,
    participants: number,
    options?: { publicScope?: boolean },
  ) => {
    const endpoint = options?.publicScope
      ? API_ENDPOINTS.PUBLIC_TOUR_INSTANCE.RESOLVE_PRICING(id, participants)
      : API_ENDPOINTS.TOUR_INSTANCE.RESOLVE_PRICING(id, participants);

    const response = await api.get<ApiResponse<DynamicPricingResolutionDto>>(
      endpoint,
    );

    return extractResult<DynamicPricingResolutionDto>(response.data);
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<TourInstanceStats>>(
      API_ENDPOINTS.TOUR_INSTANCE.GET_STATS,
    );
    return extractResult<TourInstanceStats>(response.data);
  },

  createInstance: async (data: CreateTourInstancePayload) => {
    const payload = {
      tourId: data.tourId,
      classificationId: data.classificationId,
      title: data.title.trim(),
      instanceType: data.instanceType,
      startDate: data.startDate,
      endDate: data.endDate,
      maxParticipation: data.maxParticipation,
      basePrice: data.basePrice,
      location: data.location?.trim() || undefined,
      includedServices: normalizeStringArray(data.includedServices),
      guideUserIds: data.guideUserIds,
      thumbnailUrl: data.thumbnailUrl || null,
      imageUrls: normalizeStringArray(data.imageUrls),
      tourRequestId: data.tourRequestId || null,
      translations: data.translations,
      activityAssignments: data.activityAssignments?.length
        ? data.activityAssignments.map((assignment) => ({
            originalActivityId: assignment.originalActivityId,
            supplierId: assignment.supplierId || null,
            transportSupplierId: assignment.transportSupplierId || null,
            roomType: assignment.roomType || null,
            accommodationQuantity: assignment.accommodationQuantity ?? null,
            vehicleId: assignment.vehicleId || null,
            requestedVehicleType: assignment.requestedVehicleType ?? null,
            requestedSeatCount: assignment.requestedSeatCount ?? null,
            requestedVehicleCount: assignment.requestedVehicleCount ?? null,
          }))
        : undefined,
    };

    const response = await api.post<ApiResponse<TourInstanceDto>>(
      API_ENDPOINTS.TOUR_INSTANCE.CREATE,
      payload,
    );
    return extractResult<TourInstanceDto>(response.data);
  },

  checkDuplicate: async (tourId: string, classificationId: string, startDate: string) => {
    const params = new URLSearchParams({
      tourId,
      classificationId,
      startDate,
    });
    const response = await api.get<ApiResponse<CheckDuplicateResult>>(
      `${API_ENDPOINTS.TOUR_INSTANCE.CHECK_DUPLICATE}?${params.toString()}`,
    );
    return extractResult<CheckDuplicateResult>(response.data);
  },

  checkGuideAvailability: async (guideUserIds: string[], startDate: string, endDate: string) => {
    const params = new URLSearchParams();
    guideUserIds.forEach((id) => params.append("guideUserIds", id));
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const response = await api.get<ApiResponse<GuideAvailabilityResult>>(
      `${API_ENDPOINTS.TOUR_INSTANCE.CHECK_GUIDE_AVAILABILITY}?${params.toString()}`,
    );
    return extractResult<GuideAvailabilityResult>(response.data);
  },

  updateInstance: async (data: UpdateTourInstancePayload) => {
    const payload = {
      id: data.id,
      title: data.title.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      maxParticipation: data.maxParticipation,
      basePrice: data.basePrice,
      confirmationDeadline: data.confirmationDeadline || null,
      includedServices: normalizeStringArray(data.includedServices),
      guideUserIds: data.guideUserIds ?? [],
      managerUserIds: data.managerUserIds ?? [],
      thumbnailUrl: data.thumbnailUrl?.trim() || null,
      imageUrls: normalizeStringArray(data.imageUrls),
    };

    const response = await api.put<ApiResponse<string>>(
      API_ENDPOINTS.TOUR_INSTANCE.UPDATE,
      payload,
    );
    return extractResult<string>(response.data);
  },

  deleteInstance: async (id: string) => {
    const response = await api.delete<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.DELETE(id),
    );
    return extractResult<unknown>(response.data);
  },

  updateInstanceDay: async (
    instanceId: string,
    dayId: string,
    data: UpdateInstanceDayPayload,
  ) => {
    const response = await api.put<ApiResponse<TourInstanceDayDto>>(
      API_ENDPOINTS.TOUR_INSTANCE.UPDATE_INSTANCE_DAY(instanceId, dayId),
      data,
    );
    return extractResult<TourInstanceDayDto>(response.data);
  },

  createInstanceActivity: async (
    instanceId: string,
    dayId: string,
    data: {
      title: string;
      activityType: number;
      description?: string | null;
      note?: string | null;
      startTime?: string | null;
      endTime?: string | null;
      price?: number | null;
      isOptional?: boolean;
    },
  ) => {
    const response = await api.post<ApiResponse<TourDayActivityDto>>(
      API_ENDPOINTS.TOUR_INSTANCE.CREATE_INSTANCE_ACTIVITY(instanceId, dayId),
      data,
    );
    return extractResult<TourDayActivityDto>(response.data);
  },

  updateInstanceActivity: async (
    instanceId: string,
    dayId: string,
    activityId: string,
    data: UpdateInstanceActivityPayload,
  ) => {
    const response = await api.patch<ApiResponse<TourDayActivityDto>>(
      API_ENDPOINTS.TOUR_INSTANCE.UPDATE_INSTANCE_ACTIVITY(instanceId, dayId, activityId),
      data,
    );
    return extractResult<TourDayActivityDto>(response.data);
  },

  deleteInstanceActivity: async (
    instanceId: string,
    dayId: string,
    activityId: string,
  ) => {
    const response = await api.delete<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.DELETE_INSTANCE_ACTIVITY(instanceId, dayId, activityId),
    );
    return extractResult<unknown>(response.data);
  },

  changeStatus: async (id: string, status: string | number) => {
    const response = await api.patch<ApiResponse<string>>(
      API_ENDPOINTS.TOUR_INSTANCE.CHANGE_STATUS(id),
      { status },
    );
    return extractResult<string>(response.data);
  },

  addCustomDay: async (
    instanceId: string,
    payload: { title: string; actualDate: string; description?: string },
  ): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      `${API_ENDPOINTS.TOUR_INSTANCE.GET_ALL}/${instanceId}/days`,
      payload,
    );
    return extractResult<string>(response.data) as string;
  },

  getProviderAssigned: async (
    pageNumber = 1,
    pageSize = 10,
    approvalStatus?: number,
  ) => {
    const params = new URLSearchParams();
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());
    if (approvalStatus !== undefined) {
      params.append("approvalStatus", approvalStatus.toString());
    }

    type TourInstancePage = { data?: TourInstanceVm[]; items?: TourInstanceVm[]; total?: number; totalCount?: number };

    const response = await api.get<ApiResponse<TourInstancePage>>(
      `${API_ENDPOINTS.TOUR_INSTANCE.GET_PROVIDER_ASSIGNED}?${params.toString()}`,
    );

    const result = extractResult<TourInstancePage>(response.data);
    if (!result) return null;

    const items = result.items ?? result.data ?? [];
    const total = result.totalCount ?? result.total ?? 0;

    return {
      total,
      data: items.map(normalizeInstanceVm),
    } as PaginatedResponse<NormalizedTourInstanceVm>;
  },

  getMyAssignedInstances: async (
    pageNumber = 1,
    pageSize = 10,
  ) => {
    const params = new URLSearchParams();
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    type TourInstancePage = { data?: TourInstanceVm[]; items?: TourInstanceVm[]; total?: number; totalCount?: number };

    const response = await api.get<ApiResponse<TourInstancePage>>(
      `${API_ENDPOINTS.TOUR_INSTANCE.GET_MY_ASSIGNMENTS}?${params.toString()}`,
    );

    const result = extractResult<TourInstancePage>(response.data);
    if (!result) return null;

    const items = result.items ?? result.data ?? [];
    const total = result.totalCount ?? result.total ?? 0;

    return {
      total,
      data: items.map(normalizeInstanceVm),
    } as PaginatedResponse<NormalizedTourInstanceVm>;
  },

  getMyAssignedInstanceDetail: async (id: string) => {
    const response = await api.get<ApiResponse<TourInstanceDto>>(
      API_ENDPOINTS.TOUR_INSTANCE.GET_MY_ASSIGNMENT_DETAIL(id),
    );

    const result = extractResult<TourInstanceDto>(response.data);
    return result ? normalizeInstanceDetail(result) : null;
  },

  approve: async (id: string, payload: ProviderApprovalPayload) => {
    const response = await api.post<ApiResponse<string>>(
      API_ENDPOINTS.TOUR_INSTANCE.APPROVE(id),
      payload,
    );
    return extractResult<string>(response.data);
  },

  hotelApprove: async (
    id: string,
    isApproved: boolean,
    note?: string,
    accommodationActivityIds?: string[],
  ) =>
    tourInstanceService.approve(id, {
      providerType: "Hotel",
      isApproved,
      note,
      accommodationActivityIds,
    }),

  transportApprove: async (
    id: string,
    isApproved: boolean,
    note?: string,
    transportationActivityIds?: string[],
  ) =>
    tourInstanceService.approve(id, {
      providerType: "Transport",
      isApproved,
      note,
      transportationActivityIds,
    }),

  /** @deprecated Use approveTransportation instead */
  assignVehicleToActivity: async (
    instanceId: string,
    activityId: string,
    data: { vehicleId: string; driverId: string },
  ) => {
    const response = await api.put<ApiResponse<{
      success: boolean;
      seatCapacityWarning: boolean;
      vehicleSeatCapacity?: number | null;
      tourMaxParticipation?: number | null;
    }>>(
      API_ENDPOINTS.TOUR_INSTANCE.ASSIGN_ACTIVITY_VEHICLE(instanceId, activityId),
      { vehicleId: data.vehicleId, driverId: data.driverId },
    );
    return extractResult<{
      success: boolean;
      seatCapacityWarning: boolean;
      vehicleSeatCapacity?: number | null;
      tourMaxParticipation?: number | null;
    }>(response.data);
  },

  assignTransportSupplier: async (
    instanceId: string,
    activityId: string,
    data: { supplierId: string; requestedVehicleType: number; requestedSeatCount: number }
  ) => {
    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.ASSIGN_TRANSPORT_SUPPLIER(instanceId, activityId),
      data
    );
    return extractResult<unknown>(response.data);
  },

  approveTransportation: async (
    instanceId: string,
    activityId: string,
    data: ApproveTransportationPayload,
  ) => {
    const body =
      "assignments" in data
      && Array.isArray(data.assignments)
      && data.assignments.length > 0
        ? {
            assignments: data.assignments
              .map((a) => ({
                vehicleId: String(a.vehicleId ?? "").trim(),
                driverId: String(a.driverId ?? "").trim(),
              }))
              .filter((a) => a.vehicleId.length > 0 && a.driverId.length > 0),
            note: data.note,
          }
        : {
            vehicleId: String((data as { vehicleId: string }).vehicleId ?? "").trim(),
            driverId: String((data as { driverId: string }).driverId ?? "").trim(),
            note: (data as { note?: string }).note,
          };

    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.APPROVE_TRANSPORTATION(instanceId, activityId),
      body,
    );
    return extractResult<unknown>(response.data);
  },

  rejectTransportation: async (
    instanceId: string,
    activityId: string,
    data: { note?: string }
  ) => {
    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.REJECT_TRANSPORTATION(instanceId, activityId),
      data
    );
    return extractResult<unknown>(response.data);
  },

  assignRoomToAccommodation: async (
    instanceId: string,
    activityId: string,
    data: { roomType: string; roomCount: number },
  ) => {
    const response = await api.put<ApiResponse<{
      success: boolean;
      availabilityWarning: boolean;
      availableAfter: number;
      totalRooms: number;
    }>>(
      API_ENDPOINTS.TOUR_INSTANCE.ASSIGN_ROOM_TO_ACCOMMODATION(instanceId, activityId),
      data,
    );
    return extractResult<{
      success: boolean;
      availabilityWarning: boolean;
      availableAfter: number;
      totalRooms: number;
    }>(response.data);
  },

  assignAccommodationSupplier: async (
    instanceId: string,
    activityId: string,
    supplierId: string,
  ) => {
    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.ASSIGN_ACCOMMODATION_SUPPLIER(instanceId, activityId),
      { supplierId },
    );
    return extractResult<unknown>(response.data);
  },

  confirmExternalTransport: async (
    instanceId: string,
    activityId: string,
    confirm: boolean = true,
  ) => {
    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.CONFIRM_EXTERNAL_TRANSPORT(instanceId, activityId),
      { confirm },
    );
    return extractResult<unknown>(response.data);
  },

  getTicketImages: async (
    instanceId: string,
    activityId: string,
  ): Promise<TicketImageDto[]> => {
    const response = await api.get<ApiResponse<TicketImageDto[]>>(
      API_ENDPOINTS.TOUR_INSTANCE.TICKET_IMAGES(instanceId, activityId),
    );
    return extractResult<TicketImageDto[]>(response.data) ?? [];
  },

  uploadTicketImage: async (
    instanceId: string,
    activityId: string,
    payload: UploadTicketImagePayload,
  ): Promise<TicketImageDto | null> => {
    const formData = new FormData();
    formData.append("file", payload.file);
    if (payload.bookingId) formData.append("bookingId", payload.bookingId);
    if (payload.bookingReference?.trim()) {
      formData.append("bookingReference", payload.bookingReference.trim());
    }
    if (payload.note?.trim()) formData.append("note", payload.note.trim());

    const response = await api.post<ApiResponse<TicketImageDto>>(
      API_ENDPOINTS.TOUR_INSTANCE.TICKET_IMAGES(instanceId, activityId),
      formData,
    );
    return extractResult<TicketImageDto>(response.data);
  },

  deleteTicketImage: async (
    instanceId: string,
    activityId: string,
    imageId: string,
  ) => {
    const response = await api.delete<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.TICKET_IMAGE_BY_ID(instanceId, activityId, imageId),
    );
    return extractResult<unknown>(response.data);
  },

  listItineraryFeedback: async (instanceId: string, dayId: string) => {
    const response = await api.get<ApiResponse<TourItineraryFeedbackDto[]>>(
      API_ENDPOINTS.TOUR_INSTANCE.LIST_ITINERARY_FEEDBACK(instanceId, dayId),
    );
    return extractResult<TourItineraryFeedbackDto[]>(response.data) ?? [];
  },

  createItineraryFeedback: async (
    instanceId: string,
    dayId: string,
    body: { bookingId?: string | null; content: string; isFromCustomer: boolean },
  ) => {
    const response = await api.post<ApiResponse<TourItineraryFeedbackDto>>(
      API_ENDPOINTS.TOUR_INSTANCE.CREATE_ITINERARY_FEEDBACK(instanceId, dayId),
      body,
    );
    return extractResult<TourItineraryFeedbackDto>(response.data);
  },

  updateItineraryFeedback: async (
    instanceId: string,
    dayId: string,
    feedbackId: string,
    content: string,
  ) => {
    const response = await api.put<ApiResponse<TourItineraryFeedbackDto>>(
      API_ENDPOINTS.TOUR_INSTANCE.UPDATE_ITINERARY_FEEDBACK(instanceId, dayId, feedbackId),
      { content },
    );
    return extractResult<TourItineraryFeedbackDto>(response.data);
  },

  deleteItineraryFeedback: async (
    instanceId: string,
    dayId: string,
    feedbackId: string,
  ) => {
    const response = await api.delete<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.DELETE_ITINERARY_FEEDBACK(instanceId, dayId, feedbackId),
    );
    return extractResult<unknown>(response.data);
  },

  forwardItineraryFeedbackToOperator: async (
    instanceId: string,
    dayId: string,
    feedbackId: string,
    rowVersion: string,
  ) => {
    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.FORWARD_ITINERARY_FEEDBACK_TO_OPERATOR(instanceId, dayId, feedbackId),
      { rowVersion },
    );
    return extractResult<unknown>(response.data);
  },

  managerApproveItineraryFeedback: async (
    instanceId: string,
    dayId: string,
    feedbackId: string,
    rowVersion: string,
  ) => {
    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.MANAGER_APPROVE_ITINERARY_FEEDBACK(instanceId, dayId, feedbackId),
      { rowVersion },
    );
    return extractResult<unknown>(response.data);
  },

  managerRejectItineraryFeedback: async (
    instanceId: string,
    dayId: string,
    feedbackId: string,
    reason: string,
    rowVersion: string,
  ) => {
    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.MANAGER_REJECT_ITINERARY_FEEDBACK(instanceId, dayId, feedbackId),
      { reason, rowVersion },
    );
    return extractResult<unknown>(response.data);
  },

  setFinalSellPrice: async (instanceId: string, finalSellPrice: number) => {
    const response = await api.patch<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.SET_FINAL_SELL_PRICE(instanceId),
      { finalSellPrice },
    );
    return extractResult<unknown>(response.data);
  },

  applyPrivateSettlement: async (instanceId: string, bookingId: string) => {
    const response = await api.post<ApiResponse<PrivateTourSettlementResultDto>>(
      API_ENDPOINTS.TOUR_INSTANCE.APPLY_PRIVATE_SETTLEMENT(instanceId),
      { bookingId },
    );
    return extractResult<PrivateTourSettlementResultDto>(response.data);
  },

  getBookingTickets: async (instanceId: string, activityId: string) => {
    const response = await api.get<ApiResponse<any[]>>(
      API_ENDPOINTS.TOUR_INSTANCE.BOOKING_TICKETS(instanceId, activityId),
    );
    return extractResult<any[]>(response.data) ?? [];
  },

  saveBookingTicket: async (
    instanceId: string,
    activityId: string,
    payload: {
      bookingId: string;
      flightNumber?: string | null;
      departureAt?: string | null;
      arrivalAt?: string | null;
      seatNumbers?: string | null;
      eTicketNumbers?: string | null;
      seatClass?: string | null;
      note?: string | null;
    },
  ) => {
    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.BOOKING_TICKETS(instanceId, activityId),
      payload,
    );
    return extractResult<unknown>(response.data);
  },

  getBookingRoomAssignments: async (
    instanceId: string,
    activityId: string,
  ): Promise<BookingRoomAssignmentDto[]> => {
    const response = await api.get<ApiResponse<BookingRoomAssignmentDto[]>>(
      API_ENDPOINTS.TOUR_INSTANCE.BOOKING_ROOM_ASSIGNMENTS(instanceId, activityId),
    );
    return extractResult<BookingRoomAssignmentDto[]>(response.data) ?? [];
  },

  saveBookingRoomAssignment: async (
    instanceId: string,
    activityId: string,
    payload: {
      bookingId: string;
      roomType: string | number;
      roomCount: number;
      roomNumbers?: string | null;
      note?: string | null;
    },
  ) => {
    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_INSTANCE.BOOKING_ROOM_ASSIGNMENTS(instanceId, activityId),
      payload,
    );
    return extractResult<unknown>(response.data);
  },
};

export interface BookingRoomAssignmentDto {
  bookingId: string;
  roomType: string | number;
  roomCount: number;
  roomNumbers?: string | null;
  note?: string | null;
}
