import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { normalizeLanguageForApi } from "@/api/languageHeader";
import {
  DynamicPricingDto,
  PaginatedResponse,
  TourClassificationDto,
  TourDto,
  SearchTourVm,
  TourVm,
} from "@/types/tour";
import { extractResult } from "@/utils/apiResponse";
import { ApiResponse } from "@/types/home";

const normalizeClassification = (
  classification: TourClassificationDto,
): TourClassificationDto => {
  const derivedPrice = classification.price ?? classification.basePrice ?? 0;
  const derivedSalePrice = classification.salePrice ?? derivedPrice;
  const durationDays = classification.durationDays ?? classification.numberOfDay ?? 0;

  return {
    ...classification,
    basePrice: classification.basePrice ?? derivedPrice,
    price: derivedPrice,
    salePrice: derivedSalePrice,
    durationDays,
    dynamicPricing: classification.dynamicPricing ?? [],
  };
};

const normalizeTourDetail = (tour: TourDto): TourDto => {
  let normalizedStatus = tour.status;
  if (typeof tour.status === "string" && isNaN(Number(tour.status))) {
    // If it's a string like "Pending", map it to the corresponding number
    const statusMap: Record<string, number> = {
      Active: 1,
      Inactive: 2,
      Pending: 3,
      Rejected: 4,
    };
    if (statusMap[tour.status]) {
      normalizedStatus = statusMap[tour.status];
    }
  }

  return {
    ...tour,
    status: normalizedStatus,
    isVisa: Boolean(tour.isVisa),
    classifications: (tour.classifications ?? []).map(normalizeClassification),
  };
};

const buildPublicTourDetailUrl = (id: string, language?: string) => {
  const baseUrl = API_ENDPOINTS.PUBLIC_HOME.GET_TOUR_DETAIL(id);
  if (!language) {
    return baseUrl;
  }

  const normalizedLanguage = normalizeLanguageForApi(language);
  return `${baseUrl}?lang=${normalizedLanguage}`;
};

export const tourService = {
  getAllTours: async (
    searchText?: string,
    pageNumber = 1,
    pageSize = 10,
    language?: string,
  ) => {
    const normalizedLanguage = normalizeLanguageForApi(language);
    const url = API_ENDPOINTS.PUBLIC_HOME.GET_ALL_TOURS({
      searchText,
      page: pageNumber,
      pageSize,
      lang: normalizedLanguage,
    });

    const response = await api.get<ApiResponse<PaginatedResponse<SearchTourVm>>>(url);
    const result = extractResult<PaginatedResponse<SearchTourVm>>(response.data);
    return {
      total: result?.total ?? 0,
      data: result?.data ?? [],
    };
  },

  getMyTours: async (
    searchText?: string,
    status?: string,
    tourScope?: string,
    continent?: string,
    pageNumber = 1,
    pageSize = 10,
  ) => {
    const params = new URLSearchParams({
      searchText: searchText || "",
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });
    if (status && status !== "all") {
      params.append("status", status);
    }
    if (tourScope && tourScope !== "all") {
      params.append("tourScope", tourScope);
    }
    if (continent && continent !== "all") {
      params.append("continent", continent);
    }
    // Backend returns PaginatedList<T> mapped as { items: TourVm[], total: number } or { data: ..., totalCount: ... }
    type MyTourPage = { data?: TourVm[]; items?: TourVm[]; total?: number; totalCount?: number };
    const response = await api.get<ApiResponse<MyTourPage>>(
      `${API_ENDPOINTS.TOUR.GET_MY_TOURS}?${params.toString()}`,
    );
    const result = extractResult<MyTourPage>(response.data);
    return {
      total: result?.total ?? result?.totalCount ?? 0,
      data: result?.items ?? result?.data ?? [],
    };
  },

  getAdminTourManagement: async (
    searchText?: string,
    status?: string,
    tourScope?: string,
    continent?: string,
    pageNumber = 1,
    pageSize = 10,
  ) => {
    const params = new URLSearchParams({
      searchText: searchText || "",
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });
    if (status && status !== "all") {
      params.append("status", status);
    }
    if (tourScope && tourScope !== "all") {
      params.append("tourScope", tourScope);
    }
    if (continent && continent !== "all") {
      params.append("continent", continent);
    }
    type AdminTourPage = { data?: TourVm[]; items?: TourVm[]; total?: number; totalCount?: number };
    const response = await api.get<ApiResponse<AdminTourPage>>(
      `${API_ENDPOINTS.TOUR.GET_ALL_ADMIN_TOUR_MANAGEMENT}?${params.toString()}`,
    );
    const result = extractResult<AdminTourPage>(response.data);
    return {
      total: result?.total ?? result?.totalCount ?? 0,
      data: result?.items ?? result?.data ?? [],
    };
  },

  getAdminTourManagementStats: async (
    searchText?: string,
    tourScope?: string,
    continent?: string,
  ) => {
    const params = new URLSearchParams({
      searchText: searchText || "",
    });
    if (tourScope && tourScope !== "all") {
      params.append("tourScope", tourScope);
    }
    if (continent && continent !== "all") {
      params.append("continent", continent);
    }
    
    type AdminTourStats = {
      total: number;
      active: number;
      inactive: number;
      rejected: number;
    };
    
    const response = await api.get<ApiResponse<AdminTourStats>>(
      `${API_ENDPOINTS.TOUR.GET_ALL_MANAGER_TOUR_MANAGEMENT_STATS}?${params.toString()}`,
    );
    return extractResult<AdminTourStats>(response.data) ?? {
      total: 0,
      active: 0,
      inactive: 0,
      rejected: 0
    };
  },

  getTourDetail: async (id: string) => {
    const response = await api.get<ApiResponse<TourDto>>(
      API_ENDPOINTS.TOUR.GET_DETAIL(id),
    );
    const result = extractResult<TourDto>(response.data);
    return result ? normalizeTourDetail(result) : null;
  },

  getClassificationPricingTiers: async (classificationId: string) => {
    const response = await api.get<ApiResponse<DynamicPricingDto[]>>(
      API_ENDPOINTS.TOUR.GET_CLASSIFICATION_PRICING_TIERS(classificationId),
    );
    return extractResult<DynamicPricingDto[]>(response.data) ?? [];
  },

  upsertClassificationPricingTiers: async (
    classificationId: string,
    tiers: DynamicPricingDto[],
  ) => {
    const response = await api.put<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR.UPSERT_CLASSIFICATION_PRICING_TIERS(classificationId),
      tiers,
    );
    return extractResult<unknown>(response.data);
  },

  createTour: async (formData: FormData) => {
    // NOTE: Do NOT set Content-Type header manually for FormData.
    // Axios must set it automatically with the correct boundary parameter,
    // otherwise ASP.NET Core [FromForm] will fail to parse IFormFile fields (null).
    const response = await api.post<ApiResponse<string>>(
      API_ENDPOINTS.TOUR.CREATE,
      formData,
    );
    return extractResult<string>(response.data);
  },

  updateTour: async (formData: FormData, lastModifiedOnUtc?: string) => {
    // NOTE: Do NOT set Content-Type header manually for FormData.
    // Axios must set it automatically with the correct boundary parameter,
    // otherwise ASP.NET Core [FromForm] will fail to parse IFormFile fields (null).
    const headers: Record<string, string> = {};
    if (lastModifiedOnUtc) {
      headers["If-Unmodified-Since"] = lastModifiedOnUtc;
    }

    const response = await api.put<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR.UPDATE,
      formData,
      { headers }
    );
    return extractResult<unknown>(response.data);
  },

  deleteTour: async (id: string) => {
    const response = await api.delete<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR.DELETE(id),
    );
    return extractResult<unknown>(response.data);
  },

  updateTourStatus: async (tourId: string, status: number) => {
    const response = await api.put<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR.UPDATE_STATUS(tourId),
      { status },
    );
    return extractResult<unknown>(response.data);
  },

  reviewTour: async (tourId: string, action: "Approve" | "Reject", reason?: string) => {
    const response = await api.post<ApiResponse<unknown>>(
      API_ENDPOINTS.TOUR.REVIEW(tourId),
      { Action: action, Reason: reason },
    );
    return extractResult<unknown>(response.data);
  },

  getPublicTourDetail: async (id: string, language?: string) => {
    // MOCK DATA ĐỂ VIEW GIAO DIỆN
    const MOCK_TOUR_DTO = {
      id: id,
      tourCode: "TR-DALAT-001",
      tourName: "Khám Phá Đà Lạt - Thành Phố Ngàn Hoa",
      shortDescription: "Chuyến đi 3 ngày 2 đêm tham quan Đà Lạt mộng mơ với các điểm dừng chân siêu đẹp, phù hợp để thư giãn cuối tuần.",
      longDescription: "Trải nghiệm không khí se lạnh, thưởng thức cafe chồn, tham quan đỉnh Langbiang huyền thoại, check-in với cẩm tú cầu và săn mây sáng sớm.",
      status: 1, // 1 = Active
      isVisa: false,
      thumbnail: { publicURL: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800", fileId: "thumb1", originalFileName: "thumb.jpg", fileName: "thumb.jpg" },
      images: [
        { publicURL: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800", fileId: "img1", originalFileName: "img1.jpg", fileName: "img1.jpg" },
        { publicURL: "https://images.unsplash.com/photo-1596422846543-75c6fc197f0a?w=800", fileId: "img2", originalFileName: "img2.jpg", fileName: "img2.jpg" }
      ],
      classifications: [
        {
          id: "pkg-1",
          tourId: "tour-123",
          name: "Gói Tiêu Chuẩn 3N2Đ",
          description: "Mô tả gói",
          price: 2500000,
          salePrice: 2000000,
          basePrice: 2000000,
          durationDays: 3,
          numberOfDay: 3,
          dynamicPricing: [],
          insurances: [
            {
              id: "ins-1",
              insuranceName: "Bảo hiểm toàn diện",
              insuranceProvider: "Bảo Việt",
              insuranceType: 1,
              coverageAmount: 100000000,
              coverageFee: 50000,
              coverageDescription: "Bồi thường các rủi ro trong suốt chuyến đi",
              isOptional: false,
              note: ""
            }
          ],
          plans: [
            { id: "p1", classificationId: "cls-123", dayNumber: 1, title: "Đón khách, lên Đà Lạt", description: "Xe giường nằm...", activities: [] },
            { id: "p2", classificationId: "cls-123", dayNumber: 2, title: "Săn mây, Langbiang", description: "Dậy sớm...", activities: [] },
            { id: "p3", classificationId: "cls-123", dayNumber: 3, title: "Chợ Đà Lạt, Về lại SG", description: "Mua sắm...", activities: [] }
          ]
        }
      ]
    };
    return normalizeTourDetail(MOCK_TOUR_DTO as unknown as TourDto);
  },
};
