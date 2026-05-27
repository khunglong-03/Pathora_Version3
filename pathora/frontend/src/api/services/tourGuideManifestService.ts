import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { TourGuideManifestDto } from "@/types/tour";
import { extractResult } from "@/utils/apiResponse";

export const tourGuideManifestService = {
  getManifest: async (tourInstanceId: string): Promise<TourGuideManifestDto | null> => {
    const response = await api.get(
      API_ENDPOINTS.TOUR_INSTANCE.GET_MANIFEST(tourInstanceId)
    );
    return extractResult<TourGuideManifestDto>(response.data);
  },
};
