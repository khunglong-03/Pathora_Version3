import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ApiResponse } from "@/types/api";
import { executeApiRequest } from "./serviceExecutor";

export const catalogService = {
  getProducts: <T = unknown[]>(): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() => api.get(API_ENDPOINTS.CATALOG.GET_PRODUCTS));
  },

  getAllProducts: <T = unknown[]>(): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.get(API_ENDPOINTS.CATALOG.GET_ALL_PRODUCTS),
    );
  },

  getProductDetail: <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.get(API_ENDPOINTS.CATALOG.GET_PRODUCT_DETAIL(id)),
    );
  },

  createProduct: <T = unknown>(
    payload: unknown,
  ): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.post(API_ENDPOINTS.CATALOG.CREATE_PRODUCT, payload),
    );
  },

  updateProduct: <T = unknown>(
    id: string,
    payload: unknown,
  ): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.put(API_ENDPOINTS.CATALOG.UPDATE_PRODUCT(id), payload),
    );
  },

  deleteProduct: <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.delete(API_ENDPOINTS.CATALOG.DELETE_PRODUCT(id)),
    );
  },
};
