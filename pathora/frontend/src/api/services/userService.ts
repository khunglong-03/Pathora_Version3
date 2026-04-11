import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { UserInfo } from "@/types/tour";
import { extractResult } from "@/utils/apiResponse";

type PaginatedUsersResponse = {
  total: number;
  data: UserInfo[];
  buttonShow?: Record<string, boolean>;
};

export interface UpdateUserStatusPayload {
  userId: string;
  newStatus: "Active" | "Inactive" | "Banned";
}

export const userService = {
  getAll: async (textSearch?: string, pageNumber = 1, pageSize = 100) => {
    const params = new URLSearchParams();
    if (textSearch) params.append("textSearch", textSearch);
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    const response = await api.get(`${API_ENDPOINTS.USER.GET_ALL}?${params.toString()}`);
    const result = extractResult<PaginatedUsersResponse>(response.data);
    return result?.data ?? [];
  },

  getGuides: async (): Promise<UserInfo[]> => {
    const response = await api.get(API_ENDPOINTS.USER.GET_ALL, {
      params: { role: "TourGuide", pageSize: 100 },
    });
    return extractResult<PaginatedUsersResponse>(response.data)?.data ?? [];
  },

  /** PUT /api/user/status — Admin-only. Ban/unban a user account. */
  updateStatus: async (payload: UpdateUserStatusPayload) => {
    const response = await api.put(API_ENDPOINTS.USER.UPDATE_STATUS, {
      userId: payload.userId,
      newStatus: payload.newStatus,
    });
    return extractResult<{ success: boolean }>(response.data);
  },
};
