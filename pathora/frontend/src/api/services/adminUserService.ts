import { api } from "@/api/axiosInstance";
import { extractResult } from "@/utils/apiResponse";
import type { ServiceResponse } from "@/types/api";

export type UserStatus = "Active" | "Inactive" | "Banned";

export interface UpdateUserStatusRequest {
  userId: string;
  newStatus: UserStatus;
}

class AdminUserService {
  async updateUserStatus(data: UpdateUserStatusRequest): Promise<boolean> {
    try {
      const response = await api.put<ServiceResponse<any>>(`/api/user/status`, data);
      const result = extractResult(response.data);
      return !!result;
    } catch (error) {
      console.error("Failed to update user status", error);
      return false;
    }
  }
}

export const adminUserService = new AdminUserService();
