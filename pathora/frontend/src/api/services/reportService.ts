import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ApiResponse } from "@/types/api";
import { executeApiRequest } from "./serviceExecutor";

export const reportService = {
  getDashboardStatistics: <T = unknown>(): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.get(API_ENDPOINTS.REPORT.DASHBOARD_STATISTICS),
    );
  },

  getOrderGrowthLineChart: <T = unknown>(): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.get(API_ENDPOINTS.REPORT.ORDER_GROWTH_LINE_CHART),
    );
  },

  getTopProductPieChart: <T = unknown>(): Promise<ApiResponse<T>> => {
    return executeApiRequest<T>(() =>
      api.get(API_ENDPOINTS.REPORT.TOP_PRODUCT_PIE_CHART),
    );
  },
};
