export interface FeaturedTour {
  id: string;
  tourName: string;
  thumbnail: string | null;
  location: string | null;
  rating: number | null;
  durationDays: number;
  basePrice: number;
  classificationName: string | null;
}

export interface LatestTour {
  id: string;
  tourName: string;
  thumbnail: string | null;
  shortDescription: string | null;
  createdAt: string;
}

export interface TrendingDestination {
  city: string;
  country: string;
  imageUrl: string | null;
  toursCount: number;
}

export interface TopAttraction {
  name: string;
  location: string | null;
  imageUrl: string | null;
  city: string;
  country: string;
}

export interface HomeStats {
  totalTravelers: number;
  totalTours: number;
  totalDistanceKm: number;
}

export interface TopReview {
  userName: string;
  userAvatar: string | null;
  tourName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface SearchTour {
  id: string;
  tourName: string;
  thumbnail: string | null;
  shortDescription: string | null;
  location: string | null;
  durationDays: number;
  basePrice: number;
  classificationName: string | null;
  rating: number | null;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  errors: Array<{ errorMessage: string; details: string | null }> | null;
}

export type FeaturedTourResponse = ApiResponse<FeaturedTour[]>;
export type LatestTourResponse = ApiResponse<LatestTour[]>;
export type TrendingDestinationResponse = ApiResponse<TrendingDestination[]>;
export type TopAttractionResponse = ApiResponse<TopAttraction[]>;
export type HomeStatsResponse = ApiResponse<HomeStats>;
export type TopReviewResponse = ApiResponse<TopReview[]>;
export type SearchTourResponse = ApiResponse<{
  total: number;
  data: SearchTour[];
}>;
