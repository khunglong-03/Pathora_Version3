import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { CancellationPolicy } from "@/types/cancellationPolicy";
import type { DepositPolicy } from "@/types/depositPolicy";
import type { PricingPolicy } from "@/types/pricingPolicy";
import type { VisaPolicy } from "@/types/visaPolicy";
import { extractItems, handleApiError } from "@/utils/apiResponse";

export interface DashboardPoliciesPayload {
  pricing: PricingPolicy[];
  deposit: DepositPolicy[];
  cancellation: CancellationPolicy[];
  visa: VisaPolicy[];
}

export const dashboardPoliciesService = {
  getAll: async (): Promise<ApiResponse<DashboardPoliciesPayload>> => {
    try {
      const [pricingResponse, depositResponse, cancellationResponse, visaResponse] =
        await Promise.all([
          api.get(API_ENDPOINTS.PRICING_POLICY.GET_ALL),
          api.get(API_ENDPOINTS.DEPOSIT_POLICY.GET_ALL),
          api.get(API_ENDPOINTS.CANCELLATION_POLICY.GET_ALL),
          api.get(API_ENDPOINTS.VISA_POLICY.GET_ALL),
        ]);

      return {
        success: true,
        data: {
          pricing: extractItems<PricingPolicy>(pricingResponse.data),
          deposit: extractItems<DepositPolicy>(depositResponse.data),
          cancellation: extractItems<CancellationPolicy>(cancellationResponse.data),
          visa: extractItems<VisaPolicy>(visaResponse.data),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
};
