import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ApiResponse } from "@/types/home";
import type {
  AdminDashboard,
  AdminOverview,
  AdminUserListItem,
  AdminUserDetail,
  TransportProviderListItem,
  HotelProviderListItem,
  TourManagerStaffDto,
  ManagerSummaryDto,
  AdminDashboardOverview,
  PaginatedList,
  StaffMemberDto,
} from "@/types/admin";
import { extractResult } from "@/utils/apiResponse";

export interface AdminBooking {
  id: string | number;
  customerName?: string;
  customer?: string;
  tourName?: string;
  tour?: string;
  departureDate?: string;
  departure?: string;
  amount?: number;
  status: string;
}

export interface GetAllUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

export interface GetProvidersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface CreateStaffRequest {
  role: string;
  email: string;
  fullName: string;
}

export const adminService = {
  getOverview: async () => {
    const response = await api.get<ApiResponse<AdminOverview>>(
      API_ENDPOINTS.ADMIN.GET_OVERVIEW,
    );

    return extractResult<AdminOverview>(response.data);
  },

  getDashboard: async () => {
    const response = await api.get<ApiResponse<AdminDashboard>>(
      API_ENDPOINTS.ADMIN.GET_DASHBOARD,
    );

    return extractResult<AdminDashboard>(response.data);
  },

  getBookings: async (): Promise<AdminBooking[]> => {
    const response = await api.get(API_ENDPOINTS.BOOKING.GET_LIST);
    const items = (response.data as { items?: AdminBooking[] }).items;
    return Array.isArray(items) ? items : [];
  },

  getAllUsers: async (params: GetAllUsersParams = {}) => {
    const response = await api.get<ApiResponse<PaginatedList<AdminUserListItem>>>(
      API_ENDPOINTS.ADMIN.GET_ALL_USERS,
      { params: { page: 1, limit: 10, ...params } },
    );
    return extractResult<PaginatedList<AdminUserListItem>>(response.data);
  },

  getUserDetail: async (id: string) => {
    const response = await api.get<ApiResponse<AdminUserDetail>>(
      API_ENDPOINTS.ADMIN.GET_USER_DETAIL(id),
    );
    return extractResult<AdminUserDetail>(response.data);
  },

  getTransportProviders: async (params: GetProvidersParams = {}) => {
    const response = await api.get<ApiResponse<PaginatedList<TransportProviderListItem>>>(
      API_ENDPOINTS.ADMIN.GET_TRANSPORT_PROVIDERS,
      { params: { page: 1, limit: 10, ...params } },
    );
    return extractResult<PaginatedList<TransportProviderListItem>>(response.data);
  },

  getHotelProviders: async (params: GetProvidersParams = {}) => {
    const response = await api.get<ApiResponse<PaginatedList<HotelProviderListItem>>>(
      API_ENDPOINTS.ADMIN.GET_HOTEL_PROVIDERS,
      { params: { page: 1, limit: 10, ...params } },
    );
    return extractResult<PaginatedList<HotelProviderListItem>>(response.data);
  },

  getTourManagerStaff: async (managerId: string) => {
    const response = await api.get<ApiResponse<TourManagerStaffDto[]>>(
      API_ENDPOINTS.ADMIN.GET_TOUR_MANAGER_STAFF(managerId),
    );
    return extractResult<TourManagerStaffDto[]>(response.data);
  },

  reassignStaff: async (managerId: string, staffId: string, targetManagerId: string) => {
    const response = await api.post(
      API_ENDPOINTS.ADMIN.REASSIGN_STAFF(managerId, staffId),
      { targetManagerId },
    );
    return extractResult<{ success: boolean }>(response.data);
  },

  createStaffUnderManager: async (managerId: string, data: CreateStaffRequest) => {
    const response = await api.post<ApiResponse<StaffMemberDto>>(
      API_ENDPOINTS.ADMIN.CREATE_STAFF_UNDER_MANAGER(managerId),
      data,
    );
    return extractResult<StaffMemberDto>(response.data);
  },

  getDashboardOverview: async () => {
    const response = await api.get<ApiResponse<AdminDashboardOverview>>(
      API_ENDPOINTS.ADMIN.GET_DASHBOARD_OVERVIEW,
    );
    return extractResult<AdminDashboardOverview>(response.data);
  },
};

export type { AdminUserListItem, AdminUserDetail, TransportProviderListItem, HotelProviderListItem, TourManagerStaffDto, ManagerSummaryDto, AdminDashboardOverview, PaginatedList, StaffMemberDto };
