// Tour & Tour Instance Endpoints

export type EndpointWithId = (id: string) => string;

export interface TourEndpoints {
  GET_ALL: string;
  GET_ALL_ADMIN: string;
  GET_ALL_ADMIN_TOUR_MANAGEMENT: string;
  GET_DETAIL: EndpointWithId;
  GET_CLASSIFICATION_PRICING_TIERS: EndpointWithId;
  CREATE: string;
  UPDATE: string;
  DELETE: EndpointWithId;
  UPDATE_STATUS: EndpointWithId;
  REVIEW: EndpointWithId;
  UPSERT_CLASSIFICATION_PRICING_TIERS: EndpointWithId;
}

export interface TourInstanceEndpoints {
  GET_ALL: string;
  GET_DETAIL: EndpointWithId;
  GET_STATS: string;
  GET_PRICING_TIERS: EndpointWithId;
  CREATE: string;
  UPDATE: string;
  DELETE: EndpointWithId;
  CHANGE_STATUS: EndpointWithId;
  UPSERT_PRICING_TIERS: EndpointWithId;
  CLEAR_PRICING_TIERS: EndpointWithId;
  RESOLVE_PRICING: (id: string, participants: number) => string;
  CHECK_DUPLICATE: string;
  UPDATE_INSTANCE_DAY: (instanceId: string, dayId: string) => string;
  UPDATE_INSTANCE_ACTIVITY: (instanceId: string, dayId: string, activityId: string) => string;
}

export interface PublicTourInstanceEndpoints {
  GET_AVAILABLE: string;
  GET_DETAIL: EndpointWithId;
  RESOLVE_PRICING: (id: string, participants: number) => string;
}

export const TOUR: TourEndpoints = {
  GET_ALL: "/api/tour",
  GET_ALL_ADMIN: "/api/tour",
  GET_ALL_ADMIN_TOUR_MANAGEMENT: "/api/admin/tour-management",
  GET_DETAIL: (id: string): string => `/api/tour/${id}`,
  GET_CLASSIFICATION_PRICING_TIERS: (classificationId: string): string =>
    `/api/tour/classifications/${classificationId}/pricing-tiers`,
  CREATE: "/api/tour",
  UPDATE: "/api/tour",
  DELETE: (id: string): string => `/api/tour/${id}`,
  UPDATE_STATUS: (id: string): string => `/api/tour/${id}/status`,
  REVIEW: (id: string): string => `/api/tour/${id}/review`,
  UPSERT_CLASSIFICATION_PRICING_TIERS: (classificationId: string): string =>
    `/api/tour/classifications/${classificationId}/pricing-tiers`,
};

export const TOUR_INSTANCE: TourInstanceEndpoints = {
  GET_ALL: "/api/tour-instance",
  GET_DETAIL: (id: string): string => `/api/tour-instance/${id}`,
  GET_STATS: "/api/tour-instance/stats",
  GET_PRICING_TIERS: (id: string): string => `/api/tour-instance/${id}/pricing-tiers`,
  CREATE: "/api/tour-instance",
  UPDATE: "/api/tour-instance",
  DELETE: (id: string): string => `/api/tour-instance/${id}`,
  CHANGE_STATUS: (id: string): string => `/api/tour-instance/${id}/status`,
  UPSERT_PRICING_TIERS: (id: string): string => `/api/tour-instance/${id}/pricing-tiers`,
  CLEAR_PRICING_TIERS: (id: string): string => `/api/tour-instance/${id}/pricing-tiers/clear`,
  RESOLVE_PRICING: (id: string, participants: number): string =>
    `/api/tour-instance/${id}/pricing/resolve?participants=${participants}`,
  CHECK_DUPLICATE: "/api/tour-instance/check-duplicate",
  UPDATE_INSTANCE_DAY: (instanceId: string, dayId: string): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}`,
  UPDATE_INSTANCE_ACTIVITY: (instanceId: string, dayId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/activities/${activityId}`,
};

export const PUBLIC_TOUR_INSTANCE: PublicTourInstanceEndpoints = {
  GET_AVAILABLE: "/api/public/tour-instances/available",
  GET_DETAIL: (id: string): string => `/api/public/tour-instances/${id}`,
  RESOLVE_PRICING: (id: string, participants: number): string =>
    `/api/public/tour-instances/${id}/pricing/resolve?participants=${participants}`,
};
