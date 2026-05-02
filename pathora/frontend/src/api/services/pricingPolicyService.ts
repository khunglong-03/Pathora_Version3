import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ServiceResponse } from "@/types/api";
import type {
  PricingPolicy,
  CreatePricingPolicyRequest,
  UpdatePricingPolicyRequest
} from "@/types/pricingPolicy";
import { executeApiRequest } from "./serviceExecutor";

export const pricingPolicyService = {
  getAll: (): Promise<ServiceResponse<PricingPolicy[]>> => {
    return executeApiRequest<PricingPolicy[]>(() =>
      api.get(API_ENDPOINTS.PRICING_POLICY.GET_ALL),
    );
  },

  getById: (id: string): Promise<ServiceResponse<PricingPolicy>> => {
    return executeApiRequest<PricingPolicy>(() =>
      api.get(API_ENDPOINTS.PRICING_POLICY.GET_DETAIL(id)),
    );
  },

  create: (payload: CreatePricingPolicyRequest): Promise<ServiceResponse<string>> => {
    return executeApiRequest<string>(() =>
      api.post(API_ENDPOINTS.PRICING_POLICY.CREATE, payload),
    );
  },

  update: (payload: UpdatePricingPolicyRequest): Promise<ServiceResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.put(API_ENDPOINTS.PRICING_POLICY.UPDATE, payload),
    );
  },

  delete: (id: string): Promise<ServiceResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.delete(API_ENDPOINTS.PRICING_POLICY.DELETE(id)),
    );
  },

  setAsDefault: (id: string): Promise<ServiceResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.put(API_ENDPOINTS.PRICING_POLICY.SET_DEFAULT(id)),
    );
  },
};
