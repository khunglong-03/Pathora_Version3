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
  TransportProviderStats,
  DriverActivity,
} from "@/types/admin";
import { extractData, extractItems, extractResult } from "@/utils/apiResponse";
import { type TourManagerSummary } from "./tourManagerAssignmentService";
import type { CreateVehicleDto, UpdateVehicleDto, Vehicle } from "./transportProviderService";

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
  totalPrice?: number;
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
  /** 1 = TourOperator, 2 = TourGuide — matches backend CreateStaffUnderManagerRequest.StaffType */
  staffType: 1 | 2;
  username?: string;
  email: string;
  fullName: string;
  password?: string;
}

export interface UpdateStaffRequest {
  staffType: 1 | 2;
  email: string;
  fullName: string;
  password?: string;
}

const normalizeAdminBookingStatus = (status: string | undefined): AdminBooking["status"] => {
  switch ((status ?? "pending").toLowerCase()) {
    case "confirmed":
    case "deposited":
    case "paid":
    case "completed":
      return "confirmed";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
};

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
    return extractItems<AdminBooking>(response.data).map((booking) => ({
      ...booking,
      amount: booking.amount ?? booking.totalPrice ?? 0,
      status: normalizeAdminBookingStatus(booking.status),
    }));
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
    const queryParams = new URLSearchParams();
    queryParams.set("pageNumber", String(params.page ?? 1));
    queryParams.set("pageSize", String(params.limit ?? 10));

    if (params.search) {
      queryParams.set("search", params.search);
    }

    if (params.status) {
      queryParams.set("status", params.status);
    }

    params.continents?.forEach((continent) => {
      queryParams.append("continents", continent);
    });

    const response = await api.get<ApiResponse<PaginatedList<TransportProviderListItem>>>(
      API_ENDPOINTS.ADMIN.GET_TRANSPORT_PROVIDERS,
      { params: queryParams },
    );
    return extractResult<PaginatedList<TransportProviderListItem>>(response.data);
  },

  getTransportProviderStats: async (params: { search?: string; continents?: string[] } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.set("search", params.search);
    params.continents?.forEach((c) => queryParams.append("continents", c));

    const response = await api.get<ApiResponse<TransportProviderStats>>(
      API_ENDPOINTS.ADMIN.GET_TRANSPORT_PROVIDER_STATS,
      { params: queryParams }
    );
    return extractResult<TransportProviderStats>(response.data);
  },

  getTransportProviderDetail: async (id: string) => {
    const response = await api.get<ApiResponse<TransportProviderDetail>>(
      API_ENDPOINTS.ADMIN.GET_TRANSPORT_PROVIDER_DETAIL(id),
    );
    return extractResult<TransportProviderDetail>(response.data);
  },

  getHotelProviders: async (params: GetProvidersParams = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.set("pageNumber", String(params.page ?? 1));
    queryParams.set("pageSize", String(params.limit ?? 10));

    if (params.search) {
      queryParams.set("search", params.search);
    }

    if (params.status) {
      queryParams.set("status", params.status);
    }

    params.continents?.forEach((continent) => {
      queryParams.append("continents", continent);
    });

    const response = await api.get<ApiResponse<PaginatedList<HotelProviderListItem>>>(
      API_ENDPOINTS.ADMIN.GET_HOTEL_PROVIDERS,
      { params: queryParams },
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
      API_ENDPOINTS.MANAGER.GET_TOUR_MANAGER_STAFF(managerId),
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

  // Vehicle Management for Transport Providers (Admin-on-behalf)
  createAdminTransportVehicle: async (providerId: string, data: CreateVehicleDto) => {
    const response = await api.post<ApiResponse<Vehicle>>(
      API_ENDPOINTS.ADMIN.CREATE_TRANSPORT_PROVIDER_VEHICLE(providerId),
      data
    );
    return extractResult<Vehicle>(response.data);
  },

  updateAdminTransportVehicle: async (providerId: string, plate: string, data: UpdateVehicleDto) => {
    const response = await api.put<ApiResponse<Vehicle>>(
      API_ENDPOINTS.ADMIN.UPDATE_TRANSPORT_PROVIDER_VEHICLE(providerId, plate),
      data
    );
    return extractResult<Vehicle>(response.data);
  },

  deleteAdminTransportVehicle: async (providerId: string, plate: string) => {
    const response = await api.delete<ApiResponse<null>>(
      API_ENDPOINTS.ADMIN.DELETE_TRANSPORT_PROVIDER_VEHICLE(providerId, plate)
    );
    return extractResult<null>(response.data);
  },

  getDriverActivities: async (providerId: string, driverId: string, params: { page?: number; limit?: number } = {}) => {
    const response = await api.get<ApiResponse<PaginatedList<DriverActivity>>>(
      API_ENDPOINTS.ADMIN.GET_DRIVER_ACTIVITIES(providerId, driverId),
      { params: { pageNumber: params.page ?? 1, pageSize: params.limit ?? 50 } }
    );
    return extractResult<PaginatedList<DriverActivity>>(response.data);
  },
};

export type { AdminUserListItem, AdminUserDetail, TransportProviderListItem, HotelProviderListItem, TourManagerStaffDto, ManagerSummaryDto, AdminDashboardOverview, PaginatedList, StaffMemberDto, TransportProviderDetail, TransportProviderStats };
export type { TourManagerSummary };
