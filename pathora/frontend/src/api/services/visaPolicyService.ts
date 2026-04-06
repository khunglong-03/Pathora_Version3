import { api } from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import type {
  VisaPolicy,
  CreateVisaPolicyRequest,
  UpdateVisaPolicyRequest,
} from "@/types/visaPolicy";
import { executeApiRequest } from "./serviceExecutor";

export const visaPolicyService = {
  getAll: (): Promise<ApiResponse<VisaPolicy[]>> => {
    return executeApiRequest<VisaPolicy[]>(() =>
      api.get("/api/visa-policy"),
    );
  },

  getById: (id: string): Promise<ApiResponse<VisaPolicy>> => {
    return executeApiRequest<VisaPolicy>(() =>
      api.get(`/api/visa-policy/${id}`),
    );
  },

  create: (payload: CreateVisaPolicyRequest): Promise<ApiResponse<string>> => {
    return executeApiRequest<string>(() =>
      api.post("/api/visa-policy", payload),
    );
  },

  update: (payload: UpdateVisaPolicyRequest): Promise<ApiResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.put("/api/visa-policy", payload),
    );
  },

  delete: (id: string): Promise<ApiResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.delete(`/api/visa-policy/${id}`),
    );
  },
};
