import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { TourGuideManifestDto } from "@/types/tour";
import { extractResult, handleApiError } from "@/utils/apiResponse";

export class ManifestForbiddenError extends Error {
  constructor(message = "Bạn không được phân công cho tour này") {
    super(message);
    this.name = "ManifestForbiddenError";
  }
}

export const tourGuideManifestService = {
  getManifest: async (tourInstanceId: string): Promise<TourGuideManifestDto | null> => {
    try {
      const response = await api.get(
        API_ENDPOINTS.TOUR_INSTANCE.GET_MANIFEST(tourInstanceId)
      );
      return extractResult<TourGuideManifestDto>(response.data);
    } catch (error) {
      const apiError = handleApiError(error);
      if (apiError.code === "403" || apiError.code === "404" || apiError.code === "TourGuide.Unauthorized") {
        throw new ManifestForbiddenError(apiError.message);
      }
      throw apiError;
    }
  },
};
