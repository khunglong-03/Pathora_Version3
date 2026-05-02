// Booking, Tour Request & Payment Endpoints

export interface PublicBookingEndpoints {
  CREATE: string;
  /** CustomerOnly: fetch booking detail for the authenticated customer. */
  GET_DETAIL: (id: string) => string;
  /** Anonymous: private custom tour pending booking + draft instance only. */
  GET_CHECKOUT_PRICE: (id: string) => string;
  GET_VISA_REQUIREMENTS: (id: string) => string;
  UPSERT_PARTICIPANT_PASSPORT: (bookingId: string, participantId: string) => string;
  SUBMIT_VISA_APPLICATION: (id: string) => string;
  UPDATE_VISA_APPLICATION: (bookingId: string, applicationId: string) => string;
  REQUEST_VISA_SUPPORT: (bookingId: string, participantId: string) => string;
  GET_PARTICIPANTS: (id: string) => string;
  CREATE_PARTICIPANT: (id: string) => string;
  UPDATE_PARTICIPANT: (id: string, participantId: string) => string;
}

export interface BookingEndpoints {
  GET_LIST: string;
  GET_DETAIL: (id: string) => string;
  GET_BY_TOUR_INSTANCE: (tourInstanceId: string) => string;
  GET_CHECKOUT_PRICE: (id: string) => string;
  GET_CUSTOMER_CHECKOUT_PRICE: (id: string) => string;
  GET_ACTIVITIES: (id: string) => string;
  GET_ACTIVITY_DETAIL: (id: string, activityId: string) => string;
  GET_TRANSPORT_DETAILS: (id: string) => string;
  GET_ACCOMMODATION_DETAILS: (id: string) => string;
  GET_PARTICIPANTS: (id: string) => string;
  UPDATE_PARTICIPANT: (id: string, participantId: string) => string;
  GET_PAYABLES: (id: string) => string;
  GET_ACTIVITY_STATUSES: (id: string) => string;
  GET_ACTIVITY_STATUS_DETAIL: (id: string, tourDayId: string) => string;
  START_ACTIVITY: (id: string, tourDayId: string) => string;
  COMPLETE_ACTIVITY: (id: string, tourDayId: string) => string;
  CANCEL_ACTIVITY: (id: string, tourDayId: string) => string;
  GET_TEAM: (id: string) => string;
  ADD_TEAM_MEMBER: (id: string) => string;
  CONFIRM_TEAM_MEMBER: (id: string, userId: string) => string;
  SET_TOUR_MANAGER: (id: string) => string;
  SET_TOUR_OPERATORS: (id: string) => string;
  SET_TOUR_GUIDES: (id: string) => string;
  GET_MY_RECENT: string;
  GET_MY_BOOKINGS: string;
}

export interface TourRequestEndpoints {
  CREATE: string;
  MY: string;
  DETAIL: (id: string) => string;
  ADMIN_LIST: string;
  ADMIN_DETAIL: (id: string) => string;
  REVIEW: (id: string) => string;
}

export interface PaymentEndpoints {
  GET_QR: string;
  CREATE_TRANSACTION: string;
  /** Server creates Sepay/VietQR for 100% private custom base payment. */
  CREATE_PRIVATE_CUSTOM_INITIAL: string;
  GET_TRANSACTION: (code: string) => string;
  GET_TRANSACTION_STATUS: (code: string) => string;
  CHECK_PAYMENT: (code: string) => string;
  EXPIRE_TRANSACTION: (code: string) => string;
  RECONCILE_RETURN: string;
  RECONCILE_CANCEL: string;
}

export const PUBLIC_BOOKING: PublicBookingEndpoints = {
  CREATE: "/api/public/bookings",
  GET_DETAIL: (id: string): string => `/api/public/bookings/${id}`,
  GET_CHECKOUT_PRICE: (id: string): string => `/api/public/bookings/${id}/checkout-price`,
  GET_VISA_REQUIREMENTS: (id: string): string => `/api/public/bookings/${id}/visa-requirements`,
  UPSERT_PARTICIPANT_PASSPORT: (bookingId: string, participantId: string): string => `/api/public/bookings/${bookingId}/participants/${participantId}/passport`,
  SUBMIT_VISA_APPLICATION: (id: string): string => `/api/public/bookings/${id}/visa-applications`,
  UPDATE_VISA_APPLICATION: (bookingId: string, applicationId: string): string => `/api/public/bookings/${bookingId}/visa-applications/${applicationId}`,
  REQUEST_VISA_SUPPORT: (bookingId: string, participantId: string): string => `/api/public/bookings/${bookingId}/visa-applications/${participantId}/request-support`,
  GET_PARTICIPANTS: (id: string): string => `/api/public/bookings/${id}/participants`,
  CREATE_PARTICIPANT: (id: string): string => `/api/public/bookings/${id}/participants`,
  UPDATE_PARTICIPANT: (id: string, participantId: string): string => `/api/public/bookings/${id}/participants/${participantId}`
};

export const BOOKING: BookingEndpoints = {
  GET_LIST: "/api/bookings",
  GET_BY_TOUR_INSTANCE: (tourInstanceId: string): string => `/api/bookings/by-tour-instance/${tourInstanceId}`,
  GET_MY_RECENT: "/api/public/bookings/my-recent-bookings",
  GET_MY_BOOKINGS: "/api/public/bookings/my-bookings",
  GET_DETAIL: (id: string): string => `/api/bookings/${id}`,
  GET_CHECKOUT_PRICE: (id: string): string => `/api/bookings/${id}/checkout-price`,
  GET_CUSTOMER_CHECKOUT_PRICE: (id: string): string => `/api/public/bookings/${id}/customer-checkout-price`,
  GET_ACTIVITIES: (id: string): string => `/api/bookings/${id}/activities`,
  GET_ACTIVITY_DETAIL: (id: string, activityId: string): string =>
    `/api/bookings/${id}/activities/${activityId}`,
  GET_TRANSPORT_DETAILS: (id: string): string => `/api/bookings/${id}/transport-details`,
  GET_ACCOMMODATION_DETAILS: (id: string): string => `/api/bookings/${id}/accommodation-details`,
  GET_PARTICIPANTS: (id: string): string => `/api/bookings/${id}/participants`,
  UPDATE_PARTICIPANT: (id: string, participantId: string): string => `/api/bookings/${id}/participants/${participantId}`,
  GET_PAYABLES: (id: string): string => `/api/bookings/${id}/payables`,
  GET_ACTIVITY_STATUSES: (id: string): string => `/api/bookings/${id}/activity-statuses`,
  GET_ACTIVITY_STATUS_DETAIL: (id: string, tourDayId: string): string =>
    `/api/bookings/${id}/activity-statuses/${tourDayId}`,
  START_ACTIVITY: (id: string, tourDayId: string): string =>
    `/api/bookings/${id}/activity-statuses/${tourDayId}/start`,
  COMPLETE_ACTIVITY: (id: string, tourDayId: string): string =>
    `/api/bookings/${id}/activity-statuses/${tourDayId}/complete`,
  CANCEL_ACTIVITY: (id: string, tourDayId: string): string =>
    `/api/bookings/${id}/activity-statuses/${tourDayId}/cancel`,
  GET_TEAM: (id: string): string => `/api/bookings/${id}/team`,
  ADD_TEAM_MEMBER: (id: string): string => `/api/bookings/${id}/team`,
  CONFIRM_TEAM_MEMBER: (id: string, userId: string): string =>
    `/api/bookings/${id}/team/${userId}/confirm`,
  SET_TOUR_MANAGER: (id: string): string => `/api/bookings/${id}/team/tour-manager`,
  SET_TOUR_OPERATORS: (id: string): string => `/api/bookings/${id}/team/tour-operators`,
  SET_TOUR_GUIDES: (id: string): string => `/api/bookings/${id}/team/tour-guides`,
};

export const TOUR_REQUESTS: TourRequestEndpoints = {
  CREATE: "/api/public/tour-requests",
  MY: "/api/public/tour-requests/my",
  DETAIL: (id: string): string => `/api/public/tour-requests/${id}`,
  ADMIN_LIST: "/api/tour-requests",
  ADMIN_DETAIL: (id: string): string => `/api/tour-requests/${id}`,
  REVIEW: (id: string): string => `/api/tour-requests/${id}/review`,
};

export const PAYMENT: PaymentEndpoints = {
  GET_QR: "/api/payment/getQR",
  CREATE_TRANSACTION: "/api/payment/create-transaction",
  CREATE_PRIVATE_CUSTOM_INITIAL: "/api/payment/create-transaction/private-custom-initial",
  GET_TRANSACTION: (code: string): string => `/api/payment/transaction/${code}`,
  GET_TRANSACTION_STATUS: (code: string): string =>
    `/api/payment/transaction/${code}/status`,
  CHECK_PAYMENT: (code: string): string => `/api/payment/transaction/${code}/check`,
  EXPIRE_TRANSACTION: (code: string): string => `/api/payment/transaction/${code}/expire`,
  RECONCILE_RETURN: "/api/payment/return",
  RECONCILE_CANCEL: "/api/payment/cancel",
};
