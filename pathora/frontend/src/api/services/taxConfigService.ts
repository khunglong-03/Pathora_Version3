import { api } from "@/api/axiosInstance";
import type { ServiceResponse } from "@/types/api";
import type {
  TaxConfig,
  CreateTaxConfigRequest,
  UpdateTaxConfigRequest,
} from "@/types/taxConfig";
import { executeApiRequest } from "./serviceExecutor";

export const taxConfigService = {
  getAll: (): Promise<ServiceResponse<TaxConfig[]>> => {
    return executeApiRequest<TaxConfig[]>(() =>
      api.get("/api/tax-configs"),
    );
  },

  getActive: async (): Promise<number> => {
    try {
      const response = await api.get<ServiceResponse<TaxConfig[]>>("/api/tax-configs");
      const configs = response.data.data ?? [];
      const active = configs.find((c) => c.isActive);
      return active?.taxRate ?? 0;
    } catch {
      return 0;
    }
  },

  getById: (id: string): Promise<ServiceResponse<TaxConfig>> => {
    return executeApiRequest<TaxConfig>(() =>
      api.get(`/api/tax-configs/${id}`),
    );
  },

  create: (payload: CreateTaxConfigRequest): Promise<ServiceResponse<string>> => {
    return executeApiRequest<string>(() =>
      api.post("/api/tax-configs", payload),
    );
  },

  update: (payload: UpdateTaxConfigRequest): Promise<ServiceResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.put("/api/tax-configs", payload),
    );
  },

  delete: (id: string): Promise<ServiceResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.delete(`/api/tax-configs/${id}`),
    );
  },
};
