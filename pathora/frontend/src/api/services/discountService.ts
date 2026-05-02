import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ServiceResponse } from "@/types/api";
import { executeApiRequest } from "./serviceExecutor";

export const discountService = {
  getCoupons: <T = unknown[]>(): Promise<ServiceResponse<T>> => {
    return executeApiRequest<T>(() => api.get(API_ENDPOINTS.DISCOUNT.GET_LIST));
  },

  getCouponDetail: <T = unknown>(id: string): Promise<ServiceResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.get(API_ENDPOINTS.DISCOUNT.GET_DETAIL(id)),
    );
  },

  createCoupon: <T = unknown>(payload: unknown): Promise<ServiceResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.post(API_ENDPOINTS.DISCOUNT.CREATE, payload),
    );
  },
};
