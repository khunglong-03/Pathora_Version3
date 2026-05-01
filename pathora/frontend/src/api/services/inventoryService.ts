import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ServiceResponse } from "@/types/api";
import { executeApiRequest } from "./serviceExecutor";

export const inventoryService = {
  getInventoryItems: <T = unknown[]>(): Promise<ServiceResponse<T>> => {
    return executeApiRequest<T>(() => api.get(API_ENDPOINTS.INVENTORY.GET_LIST));
  },

  getInventoryDetail: <T = unknown>(id: string): Promise<ServiceResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.get(API_ENDPOINTS.INVENTORY.GET_DETAIL(id)),
    );
  },

  createInventoryItem: <T = unknown>(
    payload: unknown,
  ): Promise<ServiceResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.post(API_ENDPOINTS.INVENTORY.CREATE, payload),
    );
  },
};
