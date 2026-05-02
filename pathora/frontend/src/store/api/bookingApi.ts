import { apiSlice } from "./apiSlice";
import { API_ENDPOINTS } from "@/api/endpoints";


export interface MyBookingDto {
  id: string;
  tourName: string;
  tourInstanceId: string;
  reference: string;
  status: string;
  tourStatus: string;
  paymentStatus: string;
  totalPrice: number;
  paidAmount: number;
  startDate: string;
  endDate: string;
  location: string;
  thumbnailUrl: string | null;
  adults: number;
  children: number;
  infants: number;
  createdAt: string;
}

export const bookingApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMyBookings: builder.query<
      { items: MyBookingDto[]; totalCount: number },
      { page?: number; pageSize?: number; status?: string }
    >({
      query: (params) => ({
        url: API_ENDPOINTS.BOOKING.GET_MY_BOOKINGS,
        params,
      }),
      transformResponse: (response: any) => {
        // The backend wraps results in { data: { items, totalCount }, isError, ... }
        return response?.data || { items: [], totalCount: 0 };
      },
      providesTags: ["Orders"],
    }),
  }),
});

export const { useGetMyBookingsQuery } = bookingApi;
