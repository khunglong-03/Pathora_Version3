import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { ApiResponse } from "@/types/home";
import {
  DynamicPricingDto,
  DynamicPricingResolutionDto,
  NormalizedTourInstanceDto,
  NormalizedTourInstanceVm,
  PaginatedResponse,
  TourDayActivityDto,
  TourInstanceDayDto,
  TourInstanceDto,
  TourInstanceStats,
  TourInstanceVm,
} from "@/types/tour";
import { extractResult } from "@/utils/apiResponse";

interface AddCustomDayResponse {
  id: string;
  title: string;
  actualDate: string;
}

export interface CreateTourInstanceActivityAssignment {
  originalActivityId: string;
  roomType?: number | null;
  accommodationQuantity?: number | null;
  vehicleId?: string | null;
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
  includedServices?: string[];
  guideUserIds?: string[];
  thumbnailUrl?: string | null;
  imageUrls?: string[];
  tourRequestId?: string | null;
  hotelProviderId?: string | null;
  transportProviderId?: string | null;
  activityAssignments?: CreateTourInstanceActivityAssignment[];
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
    excludePast = false
  ) => {
    const params = new URLSearchParams();
    if (searchText) params.append("searchText", searchText);
    if (status && status !== "all") params.append("status", status);
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());
    if (excludePast) params.append("excludePast", "true");

    // Backend returns PaginatedList<T> mapped as { items: [], totalCount: 0 }
    type TourInstancePage = { data?: TourInstanceVm[]; items?: TourInstanceVm[]; total?: number; totalCount?: number };

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
      includedServices: normalizeStringArray(data.includedServices),
      guideUserIds: data.guideUserIds,
      thumbnailUrl: data.thumbnailUrl || null,
      imageUrls: normalizeStringArray(data.imageUrls),
      tourRequestId: data.tourRequestId || null,
      hotelProviderId: data.hotelProviderId || null,
      transportProviderId: data.transportProviderId || null,
      activityAssignments: data.activityAssignments?.length
        ? data.activityAssignments
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
  ): Promise<AddCustomDayResponse> => {
    const response = await api.post(
      `${API_ENDPOINTS.TOUR_INSTANCE.GET_ALL}/${instanceId}/days`,
      payload,
    );
    return extractResult(response.data);
  },

  getProviderAssigned: async (
    pageNumber = 1,
    pageSize = 10,
  ) => {
    const params = new URLSearchParams();
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

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

  hotelApprove: async (
    id: string,
    isApproved: boolean,
    note?: string,
  ) => {
    const response = await api.post<ApiResponse<string>>(
      API_ENDPOINTS.TOUR_INSTANCE.HOTEL_APPROVE(id),
      { isApproved, note },
    );
    return extractResult<string>(response.data);
  },

  transportApprove: async (
    id: string,
    isApproved: boolean,
    note?: string,
  ) => {
    const response = await api.post<ApiResponse<string>>(
      API_ENDPOINTS.TOUR_INSTANCE.TRANSPORT_APPROVE(id),
      { isApproved, note },
    );
    return extractResult<string>(response.data);
  },

  assignVehicleToRoute: async (
    instanceId: string,
    routeId: string,
    data: { vehicleId: string; driverId: string },
  ) => {
    const response = await api.put<ApiResponse<{
      success: boolean;
      seatCapacityWarning: boolean;
      vehicleSeatCapacity?: number | null;
      tourMaxParticipation?: number | null;
    }>>(
      API_ENDPOINTS.TOUR_INSTANCE.ASSIGN_ROUTE_VEHICLE(instanceId, routeId),
      { vehicleId: data.vehicleId, driverId: data.driverId },
    );
    return extractResult<{
      success: boolean;
      seatCapacityWarning: boolean;
      vehicleSeatCapacity?: number | null;
      tourMaxParticipation?: number | null;
    }>(response.data);
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
};
