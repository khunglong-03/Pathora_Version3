import { api } from "@/api/axiosInstance";
import { extractResult } from "@/utils/apiResponse";
import type { ServiceResponse } from "@/types/api";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  WithdrawalSummaryDto,
  AdminWithdrawalSummaryDto,
  WithdrawalDetailDto,
  CreateWithdrawalPayload,
  WithdrawalStatus,
} from "@/types/withdrawal";
import type { PaginatedResponse } from "@/types/api";

export const withdrawalService = {
  // ── Manager Methods ──────────────────────────
  createWithdrawal: async (data: CreateWithdrawalPayload): Promise<string> => {
    const response = await api.post<ServiceResponse<string>>(
      API_ENDPOINTS.WITHDRAWAL.MANAGER_WITHDRAWALS,
      data
    );
    return extractResult(response.data)!;
  },

  getWithdrawals: async (params?: {
    status?: WithdrawalStatus;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<WithdrawalSummaryDto>> => {
    const response = await api.get<ServiceResponse<PaginatedResponse<WithdrawalSummaryDto>>>(
      API_ENDPOINTS.WITHDRAWAL.MANAGER_WITHDRAWALS,
      { params }
    );
    return extractResult(response.data)!;
  },

  getWithdrawalDetail: async (id: string): Promise<WithdrawalDetailDto> => {
    const response = await api.get<ServiceResponse<WithdrawalDetailDto>>(
      API_ENDPOINTS.WITHDRAWAL.MANAGER_WITHDRAWAL_DETAIL(id)
    );
    return extractResult(response.data)!;
  },

  cancelWithdrawal: async (id: string): Promise<void> => {
    await api.put<ServiceResponse<void>>(
      API_ENDPOINTS.WITHDRAWAL.MANAGER_CANCEL_WITHDRAWAL(id)
    );
  },

  // ── Admin Methods ──────────────────────────
  getAdminWithdrawals: async (params?: {
    status?: WithdrawalStatus;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<AdminWithdrawalSummaryDto>> => {
    const response = await api.get<ServiceResponse<PaginatedResponse<AdminWithdrawalSummaryDto>>>(
      API_ENDPOINTS.WITHDRAWAL.ADMIN_WITHDRAWALS,
      { params }
    );
    return extractResult(response.data)!;
  },

  approveWithdrawal: async (id: string): Promise<void> => {
    await api.put<ServiceResponse<void>>(
      API_ENDPOINTS.WITHDRAWAL.ADMIN_APPROVE_WITHDRAWAL(id)
    );
  },

  confirmTransfer: async (id: string): Promise<void> => {
    await api.put<ServiceResponse<void>>(
      API_ENDPOINTS.WITHDRAWAL.ADMIN_CONFIRM_TRANSFER(id)
    );
  },

  rejectWithdrawal: async (id: string, reason: string): Promise<void> => {
    await api.put<ServiceResponse<void>>(
      API_ENDPOINTS.WITHDRAWAL.ADMIN_REJECT_WITHDRAWAL(id),
      { reason }
    );
  },

  getWithdrawalQR: async (id: string): Promise<string> => {
    const response = await api.get<ServiceResponse<string>>(
      API_ENDPOINTS.WITHDRAWAL.ADMIN_WITHDRAWAL_QR(id)
    );
    return extractResult(response.data)!;
  },
};
