import { api } from "@/api/axiosInstance";
import type { ServiceResponse } from "@/types/api";
import type {
  DepositPolicy,
  CreateDepositPolicyRequest,
  UpdateDepositPolicyRequest,
} from "@/types/depositPolicy";
import { executeApiRequest } from "./serviceExecutor";

export const depositPolicyService = {
  getAll: (): Promise<ServiceResponse<DepositPolicy[]>> => {
    return executeApiRequest<DepositPolicy[]>(() =>
      api.get("/api/deposit-policies"),
    );
  },

  getById: (id: string): Promise<ServiceResponse<DepositPolicy>> => {
    return executeApiRequest<DepositPolicy>(() =>
      api.get(`/api/deposit-policies/${id}`),
    );
  },

  create: (payload: CreateDepositPolicyRequest): Promise<ServiceResponse<string>> => {
    return executeApiRequest<string>(() =>
      api.post("/api/deposit-policies", payload),
    );
  },

  update: (payload: UpdateDepositPolicyRequest): Promise<ServiceResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.put("/api/deposit-policies", payload),
    );
  },

  delete: (id: string): Promise<ServiceResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.delete(`/api/deposit-policies/${id}`),
    );
  },
};
