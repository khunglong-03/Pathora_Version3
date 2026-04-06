import type { ImageDto, PaginatedResponse, TourVm } from "@/types/tour";
import type { SearchTour } from "@/types/home";
import { resolveTourThumbnailUrl } from "@/utils/tourMedia";

const KNOWN_STATUSES = new Set(["active", "inactive", "pending", "rejected", "draft"]);

const normalizeThumbnail = (thumbnail: ImageDto | null | undefined): ImageDto | null => {
  const publicURL = resolveTourThumbnailUrl(thumbnail);
  if (!thumbnail && !publicURL) {
    return null;
  }

  return {
    fileId: thumbnail?.fileId ?? null,
    originalFileName: thumbnail?.originalFileName ?? null,
    fileName: thumbnail?.fileName ?? null,
    publicURL,
  };
};

export const normalizeTourStatus = (status: string | null | undefined): string => {
  const normalized = status?.trim().toLowerCase();
  if (!normalized || !KNOWN_STATUSES.has(normalized)) {
    return "Unknown";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const normalizeTourListItem = (tour: Partial<TourVm>): TourVm => {
  return {
    id: tour.id ?? "",
    tourCode: tour.tourCode ?? "",
    tourName: tour.tourName ?? "",
    shortDescription: tour.shortDescription ?? "",
    status: normalizeTourStatus(tour.status),
    thumbnail: normalizeThumbnail(tour.thumbnail),
    createdOnUtc: tour.createdOnUtc ?? "",
  };
};

export const normalizeTourListResponse = (
  response: PaginatedResponse<TourVm> | null,
): PaginatedResponse<TourVm> => {
  if (!response) {
    return { total: 0, data: [] };
  }

  return {
    total: response.total ?? 0,
    data: (response.data ?? []).map((tour) => normalizeTourListItem(tour)),
  };
};

// Map TourVm (admin list view) to SearchTour (public discovery)
export const mapTourVmToSearchTour = (tour: TourVm): SearchTour => {
  return {
    id: tour.id,
    tourName: tour.tourName,
    thumbnail: tour.thumbnail?.publicURL ?? null,
    shortDescription: tour.shortDescription,
    location: null, // Not available in TourVm
    durationDays: 0, // Not available in TourVm
    basePrice: 0, // Not available in TourVm
    classificationName: null, // Not available in TourVm
    rating: null, // Not available in TourVm
  };
};
