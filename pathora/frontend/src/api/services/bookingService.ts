import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { extractItems, extractResult } from "@/utils/apiResponse";
import type { ServiceResponse } from "@/types/api";
import type { CheckoutPriceResponse } from "./paymentService";

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
  totalPrice: number;
  status: string;
  /** Người lớn — mỗi người cần 1 ghế */
  numberAdult: number;
  /** Trẻ em — mỗi người cần 1 ghế */
  numberChild: number;
  /** Em bé (< 2 tuổi) — KHÔNG cần ghế riêng */
  numberInfant: number;
}

export const bookingService = {
  getRecentBookings: async (count = 3): Promise<RecentBooking[]> => {
    const response = await api.get(API_ENDPOINTS.BOOKING.GET_MY_RECENT, {
      params: { count },
    });
    return extractItems<RecentBooking>(response.data);
  },

  getBookingsByTourInstance: async (tourInstanceId: string) => {
    const response = await api.get<ServiceResponse<AdminBookingListResponse[]>>(
      API_ENDPOINTS.BOOKING.GET_BY_TOUR_INSTANCE(tourInstanceId),
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
    const response = await api.get<ServiceResponse<any>>(
      `/api/public/bookings/${bookingId}`,
    );
    return extractResult<any>(response.data);
  },
};
