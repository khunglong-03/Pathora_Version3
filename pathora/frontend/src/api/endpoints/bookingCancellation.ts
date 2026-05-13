// Booking Cancellation API endpoints

export interface BookingCancellationEndpoints {
  /** Customer: get fee estimate before cancelling */
  GET_ESTIMATE: (bookingId: string) => string;
  /** Customer: submit cancellation request */
  REQUEST: string;
  /** Customer: list my cancellation requests */
  MY_REQUESTS: string;
  /** Manager: list all requests */
  MANAGER_LIST: string;
  /** Manager: approve a request */
  APPROVE: (requestId: string) => string;
  /** Manager: reject a request */
  REJECT: (requestId: string) => string;
  /** Manager: confirm refund issued */
  CONFIRM_REFUND: (requestId: string) => string;
}

export const BOOKING_CANCELLATION: BookingCancellationEndpoints = {
  GET_ESTIMATE: (bookingId: string) =>
    `/api/booking-cancellations/estimate/${bookingId}`,
  REQUEST: "/api/booking-cancellations/request",
  MY_REQUESTS: "/api/booking-cancellations/my-requests",
  MANAGER_LIST: "/api/booking-cancellations/manager/list",
  APPROVE: (requestId: string) =>
    `/api/booking-cancellations/${requestId}/approve`,
  REJECT: (requestId: string) =>
    `/api/booking-cancellations/${requestId}/reject`,
  CONFIRM_REFUND: (requestId: string) =>
    `/api/booking-cancellations/${requestId}/confirm-refund`,
};
