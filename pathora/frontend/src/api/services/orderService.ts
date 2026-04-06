import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ApiResponse } from "@/types/api";
import { executeApiRequest } from "./serviceExecutor";

export const orderService = {
  getOrders: <T = unknown[]>(): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() => api.get(API_ENDPOINTS.ORDER.GET_LIST));
  },

  getAllOrders: <T = unknown[]>(): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() => api.get(API_ENDPOINTS.ORDER.GET_ALL));
  },

  getOrderDetail: <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() => api.get(API_ENDPOINTS.ORDER.GET_DETAIL(id)));
  },

  getOrderByOrderNo: <T = unknown>(
    orderNo: string,
  ): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.get(API_ENDPOINTS.ORDER.GET_BY_ORDER_NO(orderNo)),
    );
  },

  updateOrderStatus: <T = unknown>(
    id: string,
    payload: unknown,
  ): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.put(API_ENDPOINTS.ORDER.UPDATE_STATUS(id), payload),
    );
  },
};
