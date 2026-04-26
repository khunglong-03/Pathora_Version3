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
  status
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");

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
      `${API_ENDPOINTS.PUBLIC_HOME.GET_FEATURED_TOURS(limit)}&lang=${lang}`,
    );
    return extractItems<FeaturedTour>(response.data);
  },

  getLatestTours: async (limit = 6, language?: string) => {
    const lang = language ?? i18n.resolvedLanguage ?? i18n.language ?? "en";
    const response = await api.get<LatestTourResponse>(
      `${API_ENDPOINTS.PUBLIC_HOME.GET_LATEST_TOURS(limit)}&lang=${lang}`,
    );
    return extractItems<LatestTour>(response.data);
  },

  getTrendingDestinations: async (limit = 6) => {
    const response = await api.get<TrendingDestinationResponse>(
      API_ENDPOINTS.PUBLIC_HOME.GET_TRENDING_DESTINATIONS(limit),
    );
    return extractItems<TrendingDestination>(response.data);
  },

  getTopAttractions: async (limit = 8) => {
    const response = await api.get<TopAttractionResponse>(
      API_ENDPOINTS.PUBLIC_HOME.GET_TOP_ATTRACTIONS(limit),
    );
    return extractItems<TopAttraction>(response.data);
  },

  getHomeStats: async () => {
    const response = await api.get<HomeStatsResponse>(
      API_ENDPOINTS.PUBLIC_HOME.GET_HOME_STATS,
    );
    return extractResult<HomeStats>(response.data);
  },

  getTopReviews: async (limit = 6) => {
    const response = await api.get<TopReviewResponse>(
      API_ENDPOINTS.PUBLIC_HOME.GET_TOP_REVIEWS(limit),
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
    const lang =
      params?.language ?? i18n.resolvedLanguage ?? i18n.language ?? "en";
    const response = await api.get<SearchTourResponse>(
      `${API_ENDPOINTS.PUBLIC_HOME.SEARCH_TOURS(params)}&lang=${lang}`,
    );
    const result = extractResult<SearchTourResponse["data"]>(response.data);
    return result ? { total: result.total, data: result.items } : null;
  },

  getDestinations: async () => {
    const response = await api.get<ApiResponse<string[]>>(
      API_ENDPOINTS.PUBLIC_HOME.GET_DESTINATIONS,
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
    >(
      `${API_ENDPOINTS.PUBLIC_TOUR_INSTANCE.GET_AVAILABLE}?${params.toString()}&lang=${lang}`,
    );
    const result = extractResult<PaginatedResponse<TourInstanceVm> & { items?: TourInstanceVm[] }>(
      response.data,
    );
    if (!result) {
      return null;
    }

    return {
      ...result,
      data: (result.items ?? result.data ?? []).map(normalizePublicInstance),
    } as PaginatedResponse<NormalizedTourInstanceVm>;
  },

  getPublicInstanceDetail: async (id: string, language?: string) => {
    // MOCK DATA ĐỂ VIEW GIAO DIỆN
    const MOCK_INSTANCE_DTO = {
      id: id,
      tourId: "tour-123",
      tourInstanceCode: "TI-DALAT-001",
      title: "Khám Phá Đà Lạt Dịp Lễ 30/4",
      tourName: "Khám Phá Đà Lạt - Thành Phố Ngàn Hoa",
      tourCode: "TR-DALAT-001",
      classificationId: "cls-123",
      classificationName: "Gói Tiêu Chuẩn 3N2Đ",
      location: "Đà Lạt, Lâm Đồng",
      startDate: "2026-04-30T00:00:00",
      endDate: "2026-05-02T00:00:00",
      durationDays: 3,
      basePrice: 2000000,
      maxParticipation: 20,
      currentParticipation: 5,
      status: "active",
      instanceType: "public",
      rating: 4.8,
      totalBookings: 15,
      revenue: 30000000,
      confirmationDeadline: "2026-04-20T00:00:00",
      transportApprovalStatus: 2,
      thumbnail: { publicURL: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800", fileId: "thumb1", originalFileName: "thumb.jpg", fileName: "thumb.jpg" },
      images: [
        { publicURL: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800", fileId: "img1", originalFileName: "img1.jpg", fileName: "img1.jpg" },
        { publicURL: "https://images.unsplash.com/photo-1596422846543-75c6fc197f0a?w=800", fileId: "img2", originalFileName: "img2.jpg", fileName: "img2.jpg" }
      ],
      managers: [
        { id: "guide1", userId: "user1", userName: "Nguyễn Văn Hướng Dẫn", role: "Guide", userAvatar: "" }
      ],
      includedServices: ["Xe đưa đón tận nơi", "Khách sạn 3 sao", "Bảo hiểm du lịch 100tr", "Vé tham quan"],
      days: [
        {
          id: "d1",
          instanceDayNumber: 1,
          actualDate: "2026-04-30T00:00:00",
          title: "Khởi hành đi Đà Lạt",
          description: "Xe giường nằm chất lượng cao xuất phát lúc 22h.",
          startTime: null,
          endTime: null,
          note: null,
          activities: [
            {
              id: "act1",
              order: 1,
              title: "Xe đưa đón",
              description: "Điểm đón tại Q1, TP.HCM",
              activityType: "1", // Transportation
              vehicleType: "Xe giường nằm 40 chỗ",
              pickupLocation: "Hồ Chí Minh",
              dropoffLocation: "Đà Lạt",
              isOptional: false,
              startTime: null,
              endTime: null,
              note: null,
              accommodation: null
            }
          ]
        }
      ]
    };
    return normalizePublicInstanceDetail(MOCK_INSTANCE_DTO as unknown as TourInstanceDto);
  },
};
