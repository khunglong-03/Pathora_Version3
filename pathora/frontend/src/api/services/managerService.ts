import { api } from "@/api/axiosInstance";
import { extractResult } from "@/utils/apiResponse";
import type { ApiResponse } from "@/types/home";

export interface ManagerBankAccountDto {
  userId: string;
  bankAccountNumber: string | null;
  bankCode: string | null;
  bankAccountName: string | null;
  bankAccountVerified: boolean;
  bankAccountVerifiedAt: string | null;
}

export const managerService = {
  getMyBankAccount: async () => {
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
};