import axiosInstance from "@/api/axiosInstance";
import { extractData, handleApiError } from "@/utils/apiResponse";

export type UserStatus = "Active" | "Inactive" | "Banned";

export interface UpdateUserStatusRequest {
  userId: string;
  newStatus: UserStatus;
}

class AdminUserService {
  async updateUserStatus(data: UpdateUserStatusRequest): Promise<boolean> {
    try {
      await axiosInstance.put("/user/status", data);
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  }
}

export const adminUserService = new AdminUserService();
