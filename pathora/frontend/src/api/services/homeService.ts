import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import {
  ApiResponse,
  FeaturedTour,
  FeaturedTourResponse,
  HomeStats,
  LatestTourResponse,
  LatestTour,
  SearchTour,
  TrendingDestinationResponse,
  TrendingDestination,
  TopAttractionResponse,
  TopAttraction,
  HomeStatsResponse,
  TopReviewResponse,
  TopReview,
  SearchTourResponse,
} from "@/types/home";
import {
  NormalizedTourInstanceDto,
  NormalizedTourInstanceVm,
  PaginatedResponse,
  TourInstanceDto,
  TourInstanceVm,
} from "@/types/tour";
import { extractItems, extractResult } from "@/utils/apiResponse";
import i18n from "@/i18n/config";

const normalizeStatus = (status: string): string =>
  status.trim().toLowerCase().replace(/[\s_]+/g, "");

const normalizePublicInstance = (
  item: TourInstanceVm,
): NormalizedTourInstanceVm => ({
  ...item,
  location: item.location ?? null,
  images: item.images ?? [],
  currentParticipation: item.currentParticipation ?? 0,
  maxParticipation: item.maxParticipation ?? 0,
  status: normalizeStatus(item.status),
  registeredParticipants: item.currentParticipation ?? 0,
});

const normalizePublicInstanceDetail = (
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

export const homeService = {
  getFeaturedTours: async (limit = 8, language?: string) => {
    const lang = language ?? i18n.resolvedLanguage ?? i18n.language ?? "en";
    const response = await api.get<FeaturedTourResponse>(
      `${API_ENDPOINTS.PUBLIC_HOME.GET_FEATURED_TOURS(limit)}&lang=${lang}`
    );
    return extractItems<FeaturedTour>(response.data);
  },

  getLatestTours: async (limit = 6, language?: string) => {
    const lang = language ?? i18n.resolvedLanguage ?? i18n.language ?? "en";
    const response = await api.get<LatestTourResponse>(
      `${API_ENDPOINTS.PUBLIC_HOME.GET_LATEST_TOURS(limit)}&lang=${lang}`
    );
    return extractItems<LatestTour>(response.data);
  },

  getTrendingDestinations: async (limit = 6) => {
    const response = await api.get<TrendingDestinationResponse>(
      API_ENDPOINTS.PUBLIC_HOME.GET_TRENDING_DESTINATIONS(limit)
    );
    return extractItems<TrendingDestination>(response.data);
  },

  getTopAttractions: async (limit = 8) => {
    const response = await api.get<TopAttractionResponse>(
      API_ENDPOINTS.PUBLIC_HOME.GET_TOP_ATTRACTIONS(limit)
    );
    return extractItems<TopAttraction>(response.data);
  },

  getHomeStats: async () => {
    const response = await api.get<HomeStatsResponse>(
      API_ENDPOINTS.PUBLIC_HOME.GET_HOME_STATS
    );
    return extractResult<HomeStats>(response.data);
  },

  getTopReviews: async (limit = 6) => {
    const response = await api.get<TopReviewResponse>(
      API_ENDPOINTS.PUBLIC_HOME.GET_TOP_REVIEWS(limit)
    );
    return extractItems<TopReview>(response.data);
  },

  searchTours: async (params?: {
    q?: string;
    destination?: string;
    classification?: string;
    date?: string;
    people?: number;
    minPrice?: number;
    maxPrice?: number;
    minDays?: number;
    maxDays?: number;
    page?: number;
    pageSize?: number;
    language?: string;
  }) => {
    const lang = params?.language ?? i18n.resolvedLanguage ?? i18n.language ?? "en";
    const response = await api.get<SearchTourResponse>(
      `${API_ENDPOINTS.PUBLIC_HOME.SEARCH_TOURS(params)}&lang=${lang}`
    );
    return extractResult<{ total: number; data: SearchTour[] }>(response.data);
  },

  getDestinations: async () => {
    const response = await api.get<ApiResponse<string[]>>(
      API_ENDPOINTS.PUBLIC_HOME.GET_DESTINATIONS
    );
    return extractItems<string>(response.data);
  },

  getAvailablePublicInstances: async (
    destination?: string,
    page = 1,
    pageSize = 6,
    language?: string,
    sortBy?: string,
  ) => {
    const lang = language ?? i18n.resolvedLanguage ?? i18n.language ?? "en";
    const params = new URLSearchParams();
    if (destination) params.append("destination", destination);
    if (sortBy) params.append("sortBy", sortBy);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    const response = await api.get<
      ApiResponse<PaginatedResponse<TourInstanceVm>>
    >(`${API_ENDPOINTS.PUBLIC_TOUR_INSTANCE.GET_AVAILABLE}?${params.toString()}&lang=${lang}`);
    const result = extractResult<PaginatedResponse<TourInstanceVm>>(response.data);
    if (!result) {
      return null;
    }

    return {
      ...result,
      data: (result.data ?? []).map(normalizePublicInstance),
    } as PaginatedResponse<NormalizedTourInstanceVm>;
  },

  getPublicInstanceDetail: async (id: string, language?: string) => {
    const lang = language ?? i18n.resolvedLanguage ?? i18n.language ?? "en";
    const response = await api.get<ApiResponse<TourInstanceDto>>(
      `${API_ENDPOINTS.PUBLIC_TOUR_INSTANCE.GET_DETAIL(id)}?lang=${lang}`
    );
    const result = extractResult<TourInstanceDto>(response.data);
    return result ? normalizePublicInstanceDetail(result) : null;
  },
};
