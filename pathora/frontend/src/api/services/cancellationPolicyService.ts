import { api } from "@/api/axiosInstance";
import type { ServiceResponse } from "@/types/api";
import type {
  CancellationPolicy,
  CreateCancellationPolicyRequest,
  UpdateCancellationPolicyRequest,
} from "@/types/cancellationPolicy";
import { executeApiRequest } from "./serviceExecutor";

export const cancellationPolicyService = {
  getAll: (): Promise<ServiceResponse<CancellationPolicy[]>> => {
    return executeApiRequest<CancellationPolicy[]>(() =>
      api.get("/api/cancellation-policies"),
    );
  },

  getById: (id: string): Promise<ServiceResponse<CancellationPolicy>> => {
    return executeApiRequest<CancellationPolicy>(() =>
      api.get(`/api/cancellation-policies/${id}`),
    );
  },

  create: (payload: CreateCancellationPolicyRequest): Promise<ServiceResponse<string>> => {
    return executeApiRequest<string>(() =>
      api.post("/api/cancellation-policies", payload),
    );
  },

  update: (payload: UpdateCancellationPolicyRequest): Promise<ServiceResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.put("/api/cancellation-policies", payload),
    );
  },

  delete: (id: string): Promise<ServiceResponse<void>> => {
    return executeApiRequest<void>(() =>
      api.delete(`/api/cancellation-policies/${id}`),
    );
  },
};
