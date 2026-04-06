import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type {
  SiteContentAdminDetailItem,
  SiteContentAdminListItem,
  UpdateAdminSiteContentRequest,
} from "@/types/siteContent";
import { handleApiError } from "@/utils/apiResponse";

const extractListItems = (payload: unknown): SiteContentAdminListItem[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const typedPayload = payload as { items?: unknown };
  return Array.isArray(typedPayload.items)
    ? (typedPayload.items as SiteContentAdminListItem[])
    : [];
};

const extractDetailItem = (payload: unknown): SiteContentAdminDetailItem | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload as SiteContentAdminDetailItem;
};

export const siteContentAdminService = {
  getList: async (
    pageKey?: string,
    search?: string,
  ): Promise<ApiResponse<SiteContentAdminListItem[]>> => {
    try {
      const response = await api.get(
        API_ENDPOINTS.SITE_CONTENT.ADMIN_LIST(pageKey, search),
      );

      return {
        success: true,
        data: extractListItems(response.data),
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<SiteContentAdminDetailItem>> => {
    try {
      const response = await api.get(API_ENDPOINTS.SITE_CONTENT.ADMIN_DETAIL(id));
      const detail = extractDetailItem(response.data);

      return {
        success: true,
        data: detail,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  updateById: async (
    id: string,
    payload: UpdateAdminSiteContentRequest,
  ): Promise<ApiResponse<unknown>> => {
    try {
      const response = await api.put(
        API_ENDPOINTS.SITE_CONTENT.ADMIN_UPSERT(id),
        payload,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
};
