import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ApiResponse } from "@/types/home";
import type {
  CreateTourRequestPayload,
  PaginatedTourRequestResponse,
  ReviewTourRequestPayload,
  TourRequestDetailDto,
  TourRequestFilters,
  TourRequestVm,
} from "@/types/tourRequest";
import { extractResult } from "@/utils/apiResponse";

type TourRequestPaginationParams = Pick<TourRequestFilters, "pageNumber" | "pageSize">;

const normalizePaginatedResult = <T>(
  payload: PaginatedTourRequestResponse<T> | null,
): PaginatedTourRequestResponse<T> => {
  if (!payload) {
    return { total: 0, data: [] };
  }

  return {
    total: payload.total ?? 0,
    data: payload.data ?? [],
  };
};

const appendPaginationParams = (
  queryParams: URLSearchParams,
  params?: TourRequestPaginationParams,
): void => {
  queryParams.append("pageNumber", String(params?.pageNumber ?? 1));
  queryParams.append("pageSize", String(params?.pageSize ?? 10));
};

export const tourRequestService = {
  createTourRequest: async (data: CreateTourRequestPayload) => {
    const response = await api.post<ApiResponse<string>>(
      API_ENDPOINTS.TOUR_REQUESTS.CREATE,
      data,
    );

    return extractResult<string>(response.data);
  },

  getMyTourRequests: async (
    params?: TourRequestPaginationParams,
  ): Promise<PaginatedTourRequestResponse<TourRequestVm>> => {
    const queryParams = new URLSearchParams();
    appendPaginationParams(queryParams, params);

    const response = await api.get<ApiResponse<PaginatedTourRequestResponse<TourRequestVm>>>(
      `${API_ENDPOINTS.TOUR_REQUESTS.MY}?${queryParams.toString()}`,
    );

    const result = extractResult<PaginatedTourRequestResponse<TourRequestVm>>(response.data);
    return normalizePaginatedResult(result);
  },

  getTourRequestDetail: async (
    id: string,
    options?: { admin?: boolean },
  ): Promise<TourRequestDetailDto | null> => {
    const endpoint = options?.admin
      ? API_ENDPOINTS.TOUR_REQUESTS.ADMIN_DETAIL(id)
      : API_ENDPOINTS.TOUR_REQUESTS.DETAIL(id);

    const response = await api.get<ApiResponse<TourRequestDetailDto>>(endpoint);
    return extractResult<TourRequestDetailDto>(response.data);
  },

  getAllTourRequests: async (
    params?: TourRequestFilters,
  ): Promise<PaginatedTourRequestResponse<TourRequestVm>> => {
    const queryParams = new URLSearchParams();

    if (params?.status && params.status !== "All") {
      queryParams.append("status", params.status);
    }

    if (params?.searchText) {
      queryParams.append("searchText", params.searchText);
    }

    if (params?.fromDate) {
      queryParams.append("fromDate", params.fromDate);
    }

    if (params?.toDate) {
      queryParams.append("toDate", params.toDate);
    }

    appendPaginationParams(queryParams, params);

    const response = await api.get<ApiResponse<PaginatedTourRequestResponse<TourRequestVm>>>(
      `${API_ENDPOINTS.TOUR_REQUESTS.ADMIN_LIST}?${queryParams.toString()}`,
    );

    const result = extractResult<PaginatedTourRequestResponse<TourRequestVm>>(response.data);
    return normalizePaginatedResult(result);
  },

  reviewTourRequest: async (id: string, data: ReviewTourRequestPayload) => {
    const response = await api.patch<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR_REQUESTS.REVIEW(id),
      data,
    );

    return extractResult<unknown>(response.data);
  },
};
