import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { extractItems, extractResult } from "@/utils/apiResponse";
import type { CheckoutPriceResponse } from "./paymentService";

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

export const bookingService = {
  getRecentBookings: async (count = 3): Promise<RecentBooking[]> => {
    const response = await api.get(API_ENDPOINTS.BOOKING.GET_MY_RECENT, {
      params: { count },
    });
    return extractItems<RecentBooking>(response.data);
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
};
