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
  HotelProviderDetail,
  TourManagerStaffDto,
  ManagerSummaryDto,
  AdminDashboardOverview,
  PaginatedList,
  StaffMemberDto,
  TransportProviderDetail,
} from "@/types/admin";
import { extractData, extractResult } from "@/utils/apiResponse";
import { type TourManagerSummary } from "./tourManagerAssignmentService";

export interface ManagerBankAccountDto {
  userId: string;
  username: string;
  fullName: string | null;
  email: string;
  bankAccountNumber: string | null;
  bankCode: string | null;
  bankAccountName: string | null;
  bankAccountVerified: boolean;
  bankAccountVerifiedAt: string | null;
}

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
  continents?: string[];
}

export interface CreateStaffRequest {
  /** 1 = TourDesigner, 2 = TourGuide — matches backend CreateStaffUnderManagerRequest.StaffType */
  staffType: 1 | 2;
  email: string;
  fullName: string;
}

export interface UpdateStaffRequest {
  staffType: 1 | 2;
  email: string;
  fullName: string;
  password?: string;
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

  getTransportProviderDetail: async (id: string) => {
    const response = await api.get<ApiResponse<TransportProviderDetail>>(
      API_ENDPOINTS.ADMIN.GET_TRANSPORT_PROVIDER_DETAIL(id),
    );
    return extractResult<TransportProviderDetail>(response.data);
  },

  getHotelProviders: async (params: GetProvidersParams = {}) => {
    const response = await api.get<ApiResponse<PaginatedList<HotelProviderListItem>>>(
      API_ENDPOINTS.ADMIN.GET_HOTEL_PROVIDERS,
      { params: { page: 1, limit: 10, ...params } },
    );
    return extractResult<PaginatedList<HotelProviderListItem>>(response.data);
  },

  getHotelProviderDetail: async (id: string) => {
    const response = await api.get<ApiResponse<HotelProviderDetail>>(
      API_ENDPOINTS.ADMIN.GET_HOTEL_PROVIDER_DETAIL(id),
    );
    return extractResult<HotelProviderDetail>(response.data);
  },

  getTourManagerStaff: async (managerId: string) => {
    const response = await api.get<ApiResponse<TourManagerStaffDto>>(
      API_ENDPOINTS.ADMIN.GET_TOUR_MANAGER_STAFF(managerId),
    );
    return extractResult<TourManagerStaffDto>(response.data);
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

  updateStaffUnderManager: async (managerId: string, staffId: string, data: UpdateStaffRequest) => {
    const response = await api.put<ApiResponse<StaffMemberDto>>(
      API_ENDPOINTS.ADMIN.UPDATE_STAFF_UNDER_MANAGER(managerId, staffId),
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

  getAllManagers: async () => {
    const response = await api.get<ApiResponse<TourManagerSummary[]>>(
      API_ENDPOINTS.ADMIN.GET_ALL_MANAGERS,
    );
    // Returns TourManagerSummary[] | null — null on error, extracted from ApiResponse
    return extractData<TourManagerSummary[]>(response.data);
  },

  getManagersBankAccounts: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ManagerBankAccountDto[]; total: number; page: number; limit: number; totalPages: number } | null> => {
    const response = await api.get<ApiResponse<{
      items: ManagerBankAccountDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>>(API_ENDPOINTS.ADMIN.GET_MANAGERS_BANK_ACCOUNTS, {
      params: { page: 1, limit: 50, ...params },
    });
    return extractResult(response.data);
  },

  updateManagerBankAccount: async (
    managerId: string,
    data: {
      bankAccountNumber: string;
      bankCode: string;
      bankAccountName?: string;
    }
  ) => {
    const response = await api.put<ApiResponse<ManagerBankAccountDto>>(
      API_ENDPOINTS.ADMIN.UPDATE_MANAGER_BANK_ACCOUNT(managerId),
      data
    );
    return extractResult(response.data);
  },

  verifyManagerBankAccount: async (managerId: string) => {
    const response = await api.post<ApiResponse<null>>(
      API_ENDPOINTS.ADMIN.VERIFY_MANAGER_BANK_ACCOUNT(managerId),
      {}
    );
    return extractResult(response.data);
  },
};

export type { AdminUserListItem, AdminUserDetail, TransportProviderListItem, HotelProviderListItem, TourManagerStaffDto, ManagerSummaryDto, AdminDashboardOverview, PaginatedList, StaffMemberDto, TransportProviderDetail };
export type { TourManagerSummary };
