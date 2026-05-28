import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  TourGuideTask,
  CreateTourGuideTaskRequest,
  UpdateTourGuideTaskRequest,
  UpdateTourGuideTaskStatusRequest,
} from "@/types/tour-guide-tasks";
import { extractResult } from "@/utils/apiResponse";

export const tourGuideService = {
  getTasks: async (tourInstanceId: string): Promise<TourGuideTask[]> => {
    const response = await api.get(
      API_ENDPOINTS.TOUR_INSTANCE.GET_GUIDE_TASKS(tourInstanceId)
    );
    return extractResult<TourGuideTask[]>(response.data) ?? [];
  },

  createTask: async (request: CreateTourGuideTaskRequest): Promise<string> => {
    const response = await api.post(
      API_ENDPOINTS.TOUR_INSTANCE.CREATE_GUIDE_TASK,
      request
    );
    return extractResult<string>(response.data) ?? "";
  },

  updateTask: async (id: string, request: UpdateTourGuideTaskRequest): Promise<void> => {
    await api.put(
      API_ENDPOINTS.TOUR_INSTANCE.UPDATE_GUIDE_TASK(id),
      request
    );
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(
      API_ENDPOINTS.TOUR_INSTANCE.DELETE_GUIDE_TASK(id)
    );
  },

  updateTaskStatus: async (
    id: string,
    request: UpdateTourGuideTaskStatusRequest
  ): Promise<void> => {
    await api.patch(
      API_ENDPOINTS.TOUR_INSTANCE.UPDATE_GUIDE_TASK_STATUS(id),
      request
    );
  },
};
