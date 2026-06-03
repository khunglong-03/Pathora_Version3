import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { extractItems, extractResult } from "@/utils/apiResponse";
import type { ServiceResponse } from "@/types/api";
import type { CheckoutPriceResponse } from "./paymentService";
import type { 
  VisaRequirementResponse, 
  CustomerPassportPayload, 
  SubmitVisaApplicationPayload, 
  UpdateVisaApplicationPayload, 
  RequestVisaSupportResponse,
  BookingDetailResponse,
  RefundStatusString
} from "@/types/booking";

// Tour Day Activity Status (for guide portal)
export interface TourDayActivityStatus {
  id: string;
  bookingId: string;
  tourDayId: string;
  activityStatus: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  completedAt: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  note: string | null;
  guides: Array<{
    id: string;
    tourDayActivityStatusId: string;
    userId: string;
    role: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    note: string | null;
  }>;
}

export interface UpdateActivityStatusDto {
  actualTime?: string;
  reason?: string;
}

export interface RecentBooking {
  bookingId: string;
  tourName: string;
  departureDate: string;
  status: string;
  totalPrice: number;
  totalParticipants: number;
}

// Create booking request payload (matching backend CreatePublicBookingCommand)
export interface CreateBookingPayload {
  tourInstanceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  numberAdult: number;
  numberChild: number;
  numberInfant: number;
  paymentMethod: number; // 1=Cash, 2=BankTransfer, 3=Card, 4=Momo, 5=VnPay
  isFullPay: boolean;
}

// Admin booking list response (matching backend AdminBookingListResponse)
export interface AdminBookingListResponse {
  id: string;
  customerName: string;
  tourName: string;
  departureDate: string;
  totalPrice: number; // @deprecated — use totalAmount
  status: string;
  /** Người lớn — mỗi người cần 1 ghế */
  numberAdult: number;
  /** Trẻ em — mỗi người cần 1 ghế */
  numberChild: number;
  /** Em bé (< 2 tuổi) — KHÔNG cần ghế riêng */
  numberInfant: number;
  /** Refund tracking fields */
  refundStatus?: RefundStatusString;
  refundOutstandingAmount?: number | null;
  refundContactedAt?: string | null;
  refundCompletedAt?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  cancelledAt?: string | null;
  // Breakdown fields (task 6.2)
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  remainingBalance?: number;
  totalParticipants?: number;
  approvedParticipants?: number;
  hasRejectedParticipants?: boolean;
}

export const bookingService = {
  getRecentBookings: async (count = 3): Promise<RecentBooking[]> => {
    const response = await api.get(API_ENDPOINTS.BOOKING.GET_MY_RECENT, {
      params: { count },
    });
    return extractItems<RecentBooking>(response.data);
  },

  getBookingsByTourInstance: async (tourInstanceId: string, refundStatus?: RefundStatusString) => {
    const response = await api.get<ServiceResponse<AdminBookingListResponse[]>>(
      API_ENDPOINTS.BOOKING.GET_BY_TOUR_INSTANCE(tourInstanceId),
      refundStatus ? { params: { refundStatus } } : undefined,
    );
    return extractItems<AdminBookingListResponse>(response.data);
  },

  getActivityStatuses: async (bookingId: string) => {
    const response = await api.get<ServiceResponse<TourDayActivityStatus[]>>(
      API_ENDPOINTS.BOOKING.GET_ACTIVITY_STATUSES(bookingId),
    );
    return extractItems<TourDayActivityStatus>(response.data);
  },

  startActivity: async (bookingId: string, tourDayId: string, actualTime?: string) => {
    const response = await api.post<ServiceResponse<unknown>>(
      API_ENDPOINTS.BOOKING.START_ACTIVITY(bookingId, tourDayId),
      { actualTime },
    );
    return extractResult<unknown>(response.data);
  },

  completeActivity: async (bookingId: string, tourDayId: string, actualTime?: string) => {
    const response = await api.post<ServiceResponse<unknown>>(
      API_ENDPOINTS.BOOKING.COMPLETE_ACTIVITY(bookingId, tourDayId),
      { actualTime },
    );
    return extractResult<unknown>(response.data);
  },

  cancelActivity: async (bookingId: string, tourDayId: string, reason?: string) => {
    const response = await api.post<ServiceResponse<unknown>>(
      API_ENDPOINTS.BOOKING.CANCEL_ACTIVITY(bookingId, tourDayId),
      { reason },
    );
    return extractResult<unknown>(response.data);
  },

  createBooking: async (
    payload: CreateBookingPayload,
  ): Promise<CheckoutPriceResponse> => {
    const response = await api.post(
      API_ENDPOINTS.PUBLIC_BOOKING.CREATE,
      payload,
    );
    return extractResult<CheckoutPriceResponse>(response.data);
  },

  getBookingDetail: async (bookingId: string) => {
    // Use the CustomerBookingController endpoint (CustomerOnly policy).
    // NOT BOOKING.GET_DETAIL (/api/bookings/{id}) — that's BookingInfoController
    // which only allows Admin/Manager/TourOperator/TourGuide (403 for customers).
    const response = await api.get<ServiceResponse<BookingDetailResponse>>(
      API_ENDPOINTS.PUBLIC_BOOKING.GET_DETAIL(bookingId),
    );
    const raw = extractResult<BookingDetailResponse & { bookingId?: string }>(
      response.data,
    );
    if (!raw) return null;

    const resolvedId = String(raw.id ?? raw.bookingId ?? bookingId);
    return { ...raw, id: resolvedId, bookingId: resolvedId };
  },

  getVisaRequirements: async (bookingId: string) => {
    const response = await api.get<ServiceResponse<VisaRequirementResponse>>(
      API_ENDPOINTS.PUBLIC_BOOKING.GET_VISA_REQUIREMENTS(bookingId),
    );
    return extractResult<VisaRequirementResponse>(response.data);
  },

  upsertParticipantPassport: async (bookingId: string, participantId: string, payload: CustomerPassportPayload) => {
    const response = await api.put<ServiceResponse<string>>(
      API_ENDPOINTS.PUBLIC_BOOKING.UPSERT_PARTICIPANT_PASSPORT(bookingId, participantId),
      payload
    );
    return extractResult<string>(response.data);
  },

  submitVisaApplication: async (bookingId: string, payload: SubmitVisaApplicationPayload) => {
    const response = await api.post<ServiceResponse<string>>(
      API_ENDPOINTS.PUBLIC_BOOKING.SUBMIT_VISA_APPLICATION(bookingId),
      payload
    );
    return extractResult<string>(response.data);
  },

  updateVisaApplication: async (bookingId: string, applicationId: string, payload: UpdateVisaApplicationPayload) => {
    const response = await api.put<ServiceResponse<unknown>>(
      API_ENDPOINTS.PUBLIC_BOOKING.UPDATE_VISA_APPLICATION(bookingId, applicationId),
      payload
    );
    return extractResult<unknown>(response.data);
  },

  requestVisaSupport: async (bookingId: string, participantId: string) => {
    const response = await api.post<ServiceResponse<RequestVisaSupportResponse>>(
      API_ENDPOINTS.PUBLIC_BOOKING.REQUEST_VISA_SUPPORT(bookingId, participantId)
    );
    return extractResult<RequestVisaSupportResponse>(response.data);
  },

  getParticipants: async (bookingId: string) => {
    const response = await api.get<ServiceResponse<any[]>>(
      API_ENDPOINTS.PUBLIC_BOOKING.GET_PARTICIPANTS(bookingId)
    );
    return extractResult<any[]>(response.data);
  },

  getOperatorParticipants: async (bookingId: string) => {
    const response = await api.get<ServiceResponse<any[]>>(
      API_ENDPOINTS.BOOKING.GET_PARTICIPANTS(bookingId)
    );
    return extractResult<any[]>(response.data);
  },

  createParticipant: async (bookingId: string, payload: any) => {
    const response = await api.post<ServiceResponse<string>>(
      API_ENDPOINTS.PUBLIC_BOOKING.CREATE_PARTICIPANT(bookingId),
      payload
    );
    return extractResult<string>(response.data);
  },

  updateParticipant: async (bookingId: string, participantId: string, payload: any) => {
    const response = await api.put<ServiceResponse<unknown>>(
      API_ENDPOINTS.PUBLIC_BOOKING.UPDATE_PARTICIPANT(bookingId, participantId),
      payload
    );
    return extractResult<unknown>(response.data);
  },

  updateRefundStatus: async (bookingId: string, newStatus: "Contacted" | "Refunded") => {
    const response = await api.patch<ServiceResponse<unknown>>(
      API_ENDPOINTS.BOOKING.UPDATE_REFUND_STATUS(bookingId),
      { bookingId, newStatus }
    );
    return extractResult<unknown>(response.data);
  },

  getAllBookings: async (params: { page?: number; pageSize?: number; refundStatus?: RefundStatusString } = {}) => {
    const { page = 1, pageSize = 20, refundStatus } = params;
    const queryParams: Record<string, string | number> = { page, pageSize };
    if (refundStatus) queryParams.refundStatus = refundStatus;
    const response = await api.get<ServiceResponse<AdminBookingListResponse[]>>(
      API_ENDPOINTS.BOOKING.GET_LIST,
      { params: queryParams }
    );
    return response.data;
  },

  reviewParticipantInfo: async (
    bookingId: string,
    participantId: string,
    payload: { isApproved: boolean; rejectionReason?: string | null }
  ) => {
    const response = await api.post<ServiceResponse<unknown>>(
      API_ENDPOINTS.BOOKING.REVIEW_PARTICIPANT_INFO(bookingId, participantId),
      payload
    );
    return extractResult<unknown>(response.data);
  },

  bulkApproveParticipantInfo: async (
    bookingId: string,
    participantIds: string[]
  ) => {
    const response = await api.post<ServiceResponse<any>>(
      API_ENDPOINTS.BOOKING.REVIEW_PARTICIPANT_INFO_BULK(bookingId),
      { participantIds }
    );
    return extractResult<any>(response.data);
  },

  getRejectedParticipantCount: async () => {
    const response = await api.get<ServiceResponse<number>>(
      API_ENDPOINTS.BOOKING.GET_REJECTED_PARTICIPANT_COUNT
    );
    return extractResult<number>(response.data);
  },
};
