import { api } from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import type {
  TaxConfig,
  CreateTaxConfigRequest,
  UpdateTaxConfigRequest,
} from "@/types/taxConfig";
import { executeApiRequest } from "./serviceExecutor";

export const taxConfigService = {
  getAll: (): Promise<ApiResponse<TaxConfig[]>> => {
    return executeApiRequest<TaxConfig[]>(() =>
      api.get("/api/tax-configs"),
    );
  },

  getById: (id: string): Promise<ApiResponse<TaxConfig>> => {
    return executeApiRequest<TaxConfig>(() =>
      api.get(`/api/tax-configs/${id}`),
    );
  },

  create: (payload: CreateTaxConfigRequest): Promise<ApiResponse<string>> => {
    return executeApiRequest<string>(() =>
      api.post("/api/tax-configs", payload),
    );
  },

  update: (payload: UpdateTaxConfigRequest): Promise<ApiResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.put("/api/tax-configs", payload),
    );
  },

  delete: (id: string): Promise<ApiResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.delete(`/api/tax-configs/${id}`),
    );
  },
};
