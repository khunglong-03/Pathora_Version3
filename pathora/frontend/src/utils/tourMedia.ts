import type { ImageDto } from "../types/tour";

const HTTP_URL_PATTERN = /^https?:\/\//i;

export const resolveTourThumbnailUrl = (
  thumbnail: ImageDto | null | undefined,
): string | null => {
  const url = thumbnail?.publicURL?.trim();
  if (!url) {
    return null;
  }

  return HTTP_URL_PATTERN.test(url) ? url : null;
};
