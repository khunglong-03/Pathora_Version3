// Auth & Public Home Endpoints

export interface AuthEndpoints {
  LOGIN: string;
  REGISTER: string;
  REFRESH: string;
  LOGOUT: string;
  GET_ME: string;
  GET_TABS: string;
  GOOGLE_LOGIN: string;
}

export interface PublicHomeEndpoints {
  GET_FEATURED_TOURS: (limit?: number) => string;
  GET_LATEST_TOURS: (limit?: number) => string;
  GET_TRENDING_DESTINATIONS: (limit?: number) => string;
  GET_TOP_ATTRACTIONS: (limit?: number) => string;
  GET_HOME_STATS: string;
  GET_TOP_REVIEWS: (limit?: number) => string;
  GET_ALL_TOURS: (params?: {
    searchText?: string;
    page?: number;
    pageSize?: number;
    lang?: string;
  }) => string;
  SEARCH_TOURS: (params?: SearchToursParams) => string;
  GET_DESTINATIONS: string;
  GET_TOUR_DETAIL: (id: string) => string;
}

export interface SearchToursParams {
  q?: string;
  destination?: string;
  classification?: string;
  category?: string;
  date?: string;
  people?: number;
  minPrice?: number;
  maxPrice?: number;
  minDays?: number;
  maxDays?: number;
  page?: number;
  pageSize?: number;
}

export const AUTH: AuthEndpoints = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  REFRESH: "/api/auth/refresh",
  LOGOUT: "/api/auth/logout",
  GET_ME: "/api/auth/me",
  GET_TABS: "/api/auth/tabs",
  GOOGLE_LOGIN: "/api/auth/google-login",
};

export const PUBLIC_HOME: PublicHomeEndpoints = {
  GET_FEATURED_TOURS: (limit = 8): string => `/api/public/tours/featured?limit=${limit}`,
  GET_LATEST_TOURS: (limit = 6): string => `/api/public/tours/latest?limit=${limit}`,
  GET_TRENDING_DESTINATIONS: (limit = 6): string =>
    `/api/public/destinations/trending?limit=${limit}`,
  GET_TOP_ATTRACTIONS: (limit = 8): string => `/api/public/attractions/top?limit=${limit}`,
  GET_HOME_STATS: "/api/public/stats",
  GET_TOP_REVIEWS: (limit = 6): string => `/api/public/reviews/top?limit=${limit}`,
  GET_ALL_TOURS: (params?: {
    searchText?: string;
    page?: number;
    pageSize?: number;
    lang?: string;
  }): string => {
    const url = new URLSearchParams();
    if (params?.searchText) url.append("searchText", params.searchText);
    if (params?.page) url.append("pageNumber", params.page.toString());
    if (params?.pageSize) url.append("pageSize", params.pageSize.toString());
    if (params?.lang) url.append("lang", params.lang);
    return `/api/public/tours?${url.toString()}`;
  },
  SEARCH_TOURS: (params?: SearchToursParams): string => {
    const url = new URLSearchParams();
    if (params?.q) url.append("q", params.q);
    if (params?.destination) url.append("destination", params.destination);
    if (params?.classification) url.append("classification", params.classification);
    if (params?.category) url.append("category", params.category);
    if (params?.date) url.append("date", params.date);
    if (params?.people) url.append("people", params.people.toString());
    if (params?.minPrice !== undefined) url.append("minPrice", params.minPrice.toString());
    if (params?.maxPrice !== undefined) url.append("maxPrice", params.maxPrice.toString());
    if (params?.minDays !== undefined) url.append("minDays", params.minDays.toString());
    if (params?.maxDays !== undefined) url.append("maxDays", params.maxDays.toString());
    if (params?.page) url.append("page", params.page.toString());
    if (params?.pageSize) url.append("pageSize", params.pageSize.toString());
    return `/api/public/tours/search?${url.toString()}`;
  },
  GET_DESTINATIONS: "/api/public/destinations",
  GET_TOUR_DETAIL: (id: string): string => `/api/public/tours/${id}`,
};
