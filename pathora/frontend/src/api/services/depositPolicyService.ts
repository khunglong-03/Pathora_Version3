import { api } from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import type {
  DepositPolicy,
  CreateDepositPolicyRequest,
  UpdateDepositPolicyRequest,
} from "@/types/depositPolicy";
import { executeApiRequest } from "./serviceExecutor";

export const depositPolicyService = {
  getAll: (): Promise<ApiResponse<DepositPolicy[]>> => {
    return executeApiRequest<DepositPolicy[]>(() =>
      api.get("/api/deposit-policies"),
    );
  },

  getById: (id: string): Promise<ApiResponse<DepositPolicy>> => {
    return executeApiRequest<DepositPolicy>(() =>
      api.get(`/api/deposit-policies/${id}`),
    );
  },

  create: (payload: CreateDepositPolicyRequest): Promise<ApiResponse<string>> => {
    return executeApiRequest<string>(() =>
      api.post("/api/deposit-policies", payload),
    );
  },

  update: (payload: UpdateDepositPolicyRequest): Promise<ApiResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.put("/api/deposit-policies", payload),
    );
  },

  delete: (id: string): Promise<ApiResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.delete(`/api/deposit-policies/${id}`),
    );
  },
};
