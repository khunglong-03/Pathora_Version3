import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ServiceResponse } from "@/types/api";
import { executeApiRequest } from "./serviceExecutor";

export const notificationService = {
  getNotifications: <T = unknown[]>(): Promise<ServiceResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.get(API_ENDPOINTS.NOTIFICATION.GET_LIST),
    );
  },

  getUnreadCount: <T = unknown>(): Promise<ServiceResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.get(API_ENDPOINTS.NOTIFICATION.GET_COUNT_UNREAD),
    );
  },

  markAsRead: <T = unknown>(payload: unknown): Promise<ServiceResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.post(API_ENDPOINTS.NOTIFICATION.MARK_AS_READ, payload),
    );
  },
};
