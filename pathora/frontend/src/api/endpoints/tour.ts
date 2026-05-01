// Tour & Tour Instance Endpoints

export type EndpointWithId = (id: string) => string;

export interface TourEndpoints {
  GET_ALL: string;
  GET_MY_TOURS: string;
  GET_ALL_ADMIN_TOUR_MANAGEMENT: string;
  GET_ALL_MANAGER_TOUR_MANAGEMENT_STATS: string;
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
  GET_MY_ASSIGNMENTS: string;
  GET_MY_ASSIGNMENT_DETAIL: EndpointWithId;
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
  CHECK_GUIDE_AVAILABILITY: string;
  UPDATE_INSTANCE_DAY: (instanceId: string, dayId: string) => string;
  CREATE_INSTANCE_ACTIVITY: (instanceId: string, dayId: string) => string;
  UPDATE_INSTANCE_ACTIVITY: (instanceId: string, dayId: string, activityId: string) => string;
  DELETE_INSTANCE_ACTIVITY: (instanceId: string, dayId: string, activityId: string) => string;
  GET_PROVIDER_ASSIGNED: string;
  APPROVE: (id: string) => string;
  ASSIGN_ACTIVITY_VEHICLE: (instanceId: string, activityId: string) => string;
  ASSIGN_ACCOMMODATION_SUPPLIER: (instanceId: string, activityId: string) => string;
  ASSIGN_ROOM_TO_ACCOMMODATION: (instanceId: string, activityId: string) => string;
  ASSIGN_TRANSPORT_SUPPLIER: (instanceId: string, activityId: string) => string;
  APPROVE_TRANSPORTATION: (instanceId: string, activityId: string) => string;
  REJECT_TRANSPORTATION: (instanceId: string, activityId: string) => string;
  CONFIRM_EXTERNAL_TRANSPORT: (instanceId: string, activityId: string) => string;
  TICKET_IMAGES: (instanceId: string, activityId: string) => string;
  TICKET_IMAGE_BY_ID: (instanceId: string, activityId: string, imageId: string) => string;
  LIST_ITINERARY_FEEDBACK: (instanceId: string, dayId: string) => string;
  CREATE_ITINERARY_FEEDBACK: (instanceId: string, dayId: string) => string;
  UPDATE_ITINERARY_FEEDBACK: (instanceId: string, dayId: string, feedbackId: string) => string;
  DELETE_ITINERARY_FEEDBACK: (instanceId: string, dayId: string, feedbackId: string) => string;
  FORWARD_ITINERARY_FEEDBACK_TO_OPERATOR: (instanceId: string, dayId: string, feedbackId: string) => string;
  MANAGER_APPROVE_ITINERARY_FEEDBACK: (instanceId: string, dayId: string, feedbackId: string) => string;
  MANAGER_REJECT_ITINERARY_FEEDBACK: (instanceId: string, dayId: string, feedbackId: string) => string;
  SET_FINAL_SELL_PRICE: (instanceId: string) => string;
  APPLY_PRIVATE_SETTLEMENT: (instanceId: string) => string;
  BOOKING_TICKETS: (instanceId: string, activityId: string) => string;
  BOOKING_ROOM_ASSIGNMENTS: (instanceId: string, activityId: string) => string;
}

export interface PublicTourInstanceEndpoints {
  GET_AVAILABLE: string;
  GET_DETAIL: EndpointWithId;
  RESOLVE_PRICING: (id: string, participants: number) => string;
}

/** Anonymous public tour catalog actions */
export interface PublicTourEndpoints {
  REQUEST_PRIVATE: EndpointWithId;
}

export const TOUR: TourEndpoints = {
  GET_ALL: "/api/tour",
  GET_MY_TOURS: "/api/tour",
  GET_ALL_ADMIN_TOUR_MANAGEMENT: "/api/manager/tour-management",
  GET_ALL_MANAGER_TOUR_MANAGEMENT_STATS: "/api/manager/tour-management/stats",
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
  GET_MY_ASSIGNMENTS: "/api/tour-instance/my-assignments",
  GET_MY_ASSIGNMENT_DETAIL: (id: string): string => `/api/tour-instance/my-assignments/${id}`,
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
  CHECK_GUIDE_AVAILABILITY: "/api/tour-instance/check-guide-availability",
  UPDATE_INSTANCE_DAY: (instanceId: string, dayId: string): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}`,
  CREATE_INSTANCE_ACTIVITY: (instanceId: string, dayId: string): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/activities`,
  UPDATE_INSTANCE_ACTIVITY: (instanceId: string, dayId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/activities/${activityId}`,
  DELETE_INSTANCE_ACTIVITY: (instanceId: string, dayId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/activities/${activityId}`,
  GET_PROVIDER_ASSIGNED: "/api/tour-instance/provider-assigned",
  APPROVE: (id: string): string => `/api/tour-instance/${id}/approve`,
  ASSIGN_ACTIVITY_VEHICLE: (instanceId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/activities/${activityId}/assign`,
  ASSIGN_ACCOMMODATION_SUPPLIER: (instanceId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/accommodations/${activityId}/assign-supplier`,
  ASSIGN_ROOM_TO_ACCOMMODATION: (instanceId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/accommodations/${activityId}/assign-rooms`,
  ASSIGN_TRANSPORT_SUPPLIER: (instanceId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/transportation/${activityId}/assign-supplier`,
  APPROVE_TRANSPORTATION: (instanceId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/transportation/${activityId}/approve`,
  REJECT_TRANSPORTATION: (instanceId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/transportation/${activityId}/reject`,
  CONFIRM_EXTERNAL_TRANSPORT: (instanceId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/transportation/${activityId}/confirm-external`,
  TICKET_IMAGES: (instanceId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/activities/${activityId}/ticket-images`,
  TICKET_IMAGE_BY_ID: (instanceId: string, activityId: string, imageId: string): string =>
    `/api/tour-instance/${instanceId}/activities/${activityId}/ticket-images/${imageId}`,
  LIST_ITINERARY_FEEDBACK: (instanceId: string, dayId: string): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/itinerary-feedback`,
  CREATE_ITINERARY_FEEDBACK: (instanceId: string, dayId: string): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/itinerary-feedback`,
  UPDATE_ITINERARY_FEEDBACK: (
    instanceId: string,
    dayId: string,
    feedbackId: string,
  ): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/itinerary-feedback/${feedbackId}`,
  DELETE_ITINERARY_FEEDBACK: (
    instanceId: string,
    dayId: string,
    feedbackId: string,
  ): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/itinerary-feedback/${feedbackId}`,
  FORWARD_ITINERARY_FEEDBACK_TO_OPERATOR: (
    instanceId: string,
    dayId: string,
    feedbackId: string,
  ): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/itinerary-feedback/${feedbackId}/forward-to-operator`,
  MANAGER_APPROVE_ITINERARY_FEEDBACK: (
    instanceId: string,
    dayId: string,
    feedbackId: string,
  ): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/itinerary-feedback/${feedbackId}/manager-approve`,
  MANAGER_REJECT_ITINERARY_FEEDBACK: (
    instanceId: string,
    dayId: string,
    feedbackId: string,
  ): string =>
    `/api/tour-instance/${instanceId}/days/${dayId}/itinerary-feedback/${feedbackId}/manager-reject`,
  SET_FINAL_SELL_PRICE: (instanceId: string): string =>
    `/api/tour-instance/${instanceId}/final-sell-price`,
  APPLY_PRIVATE_SETTLEMENT: (instanceId: string): string =>
    `/api/tour-instance/${instanceId}/private-settlement`,
  BOOKING_TICKETS: (instanceId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/activities/${activityId}/booking-tickets`,
  BOOKING_ROOM_ASSIGNMENTS: (instanceId: string, activityId: string): string =>
    `/api/tour-instance/${instanceId}/activities/${activityId}/booking-room-assignments`,
};

export const PUBLIC_TOUR_INSTANCE: PublicTourInstanceEndpoints = {
  GET_AVAILABLE: "/api/public/tour-instances/available",
  GET_DETAIL: (id: string): string => `/api/public/tour-instances/${id}`,
  RESOLVE_PRICING: (id: string, participants: number): string =>
    `/api/public/tour-instances/${id}/pricing/resolve?participants=${participants}`,
};

export const PUBLIC_TOUR: PublicTourEndpoints = {
  REQUEST_PRIVATE: (id: string): string => `/api/public/tours/${id}/request-private`,
};
