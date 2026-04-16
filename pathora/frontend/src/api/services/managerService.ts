import { api } from "@/api/axiosInstance";
import { extractResult } from "@/utils/apiResponse";
import type { ApiResponse } from "@/types/home";
import type { ManagerDashboardReport } from "@/types/manager";
import type { AdminOverview } from "@/types/admin";
import { API_ENDPOINTS } from "@/api/endpoints";

export interface ManagerBankAccountDto {
  userId: string;
  bankAccountNumber: string | null;
  bankCode: string | null;
  bankAccountName: string | null;
  bankAccountVerified: boolean;
  bankAccountVerifiedAt: string | null;
}

// ── Multi Bank Account types ──────────────────────────
export interface ManagerBankAccountItemDto {
  id: string;
  userId: string;
  bankAccountNumber: string;
  bankCode: string;
  bankBin: string;
  bankShortName: string | null;
  bankAccountName: string | null;
  isDefault: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  createdOnUtc: string;
}

export interface CreateManagerBankAccountRequest {
  bankAccountNumber: string;
  bankCode: string;
  bankBin: string;
  bankShortName?: string;
  bankAccountName?: string;
  isDefault: boolean;
}

export interface UpdateManagerBankAccountRequest {
  bankAccountNumber: string;
  bankCode: string;
  bankBin: string;
  bankShortName?: string;
  bankAccountName?: string;
  isDefault: boolean;
}

// ── VietQR Bank ──────────────────────────
export interface VietQRBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
  swift_code: string | null;
}

export const managerService = {
  // ── Overview (same data as admin/overview but via manager endpoint) ──
  getOverview: async (): Promise<AdminOverview | null> => {
    const response = await api.get<ApiResponse<AdminOverview>>(
      API_ENDPOINTS.MANAGER.GET_OVERVIEW,
    );
    return extractResult<AdminOverview>(response.data);
  },

  // ── Dashboard ──
  getDashboard: async (): Promise<ManagerDashboardReport | null> => {
    const response = await api.get<ApiResponse<ManagerDashboardReport>>(
      API_ENDPOINTS.MANAGER.GET_DASHBOARD,
    );
    return extractResult<ManagerDashboardReport>(response.data);
  },

  // ── Legacy single bank account ──
  getMyBankAccount: async (): Promise<ManagerBankAccountDto | null> => {
    const response = await api.get<ApiResponse<ManagerBankAccountDto>>(
      "/api/manager/me/bank-account"
    );
    return extractResult(response.data);
  },

  updateMyBankAccount: async (data: {
    bankAccountNumber: string;
    bankCode: string;
    bankAccountName?: string;
  }) => {
    const response = await api.put<ApiResponse<ManagerBankAccountDto>>(
      "/api/manager/me/bank-account",
      data
    );
    return extractResult(response.data);
  },

  // ── Multi bank accounts ──
  getMyBankAccounts: async (): Promise<ManagerBankAccountItemDto[]> => {
    const response = await api.get<ApiResponse<ManagerBankAccountItemDto[]>>(
      "/api/manager/me/bank-accounts"
    );
    return extractResult(response.data) ?? [];
  },

  createBankAccount: async (
    data: CreateManagerBankAccountRequest
  ): Promise<ManagerBankAccountItemDto> => {
    const response = await api.post<ApiResponse<ManagerBankAccountItemDto>>(
      "/api/manager/me/bank-accounts",
      data
    );
    return extractResult(response.data)!;
  },

  updateBankAccount: async (
    id: string,
    data: UpdateManagerBankAccountRequest
  ): Promise<ManagerBankAccountItemDto> => {
    const response = await api.put<ApiResponse<ManagerBankAccountItemDto>>(
      `/api/manager/me/bank-accounts/${id}`,
      data
    );
    return extractResult(response.data)!;
  },

  deleteBankAccount: async (id: string): Promise<void> => {
    await api.delete(`/api/manager/me/bank-accounts/${id}`);
  },

  // ── VietQR bank list (public, no auth) ──
  getVietQRBanks: async (): Promise<VietQRBank[]> => {
    const response = await fetch("https://api.vietqr.io/v2/banks");
    const json = await response.json();
    return json.data ?? [];
  },
};