import { apiSlice } from "./apiSlice";
import { BOOKING_CANCELLATION } from "@/api/endpoints/bookingCancellation";

// ─── DTOs ──────────────────────────────────────────────────────────────────

export interface CancellationEstimateDto {
  bookingId: string;
  policyId: string | null;
  tourScope: string;
  daysBeforeDeparture: number;
  feePercent: number;
  paidAmount: number;
  refundAmount: number;
}

export interface CancellationRequestDto {
  requestId: string;
  bookingId: string;
  status: string; // PendingManagerReview | Approved | Rejected
  feePercent: number;
  paidAmountSnapshot: number;
  refundAmount: number;
  customerReason: string;
  managerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  refundConfirmedAt: string | null;
  customerName: string;
  customerPhone: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── Request payloads ──────────────────────────────────────────────────────

export interface RequestCancellationBody {
  bookingId: string;
  reason: string;
}

export interface ManagerApproveBody {
  managerNote?: string;
}

export interface ManagerRejectBody {
  managerNote: string;
}

export interface ConfirmRefundBody {
  refundProofNote?: string;
}

// ─── RTK Query slice ───────────────────────────────────────────────────────

export const bookingCancellationApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // 7.2 — Customer: get fee estimate
    getCancellationEstimate: builder.query<CancellationEstimateDto, string>({
      query: (bookingId) => ({
        url: BOOKING_CANCELLATION.GET_ESTIMATE(bookingId),
        method: "GET",
      }),
      transformResponse: (response: any) => response?.data ?? response?.value ?? response,
      providesTags: (_result, _error, bookingId) => [
        { type: "BookingCancellation" as const, id: `estimate-${bookingId}` },
      ],
    }),

    // 7.4 — Customer: submit cancellation request
    requestCancellation: builder.mutation<
      { requestId: string; type: string },
      RequestCancellationBody
    >({
      query: (body) => ({
        url: BOOKING_CANCELLATION.REQUEST,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "BookingDetail" as const, id: arg.bookingId },
        { type: "BookingCancellation" as const, id: "MY_LIST" },
      ],
    }),

    // 7.8 — Customer: list my cancellation requests
    getMyCancellationRequests: builder.query<
      PagedResult<CancellationRequestDto>,
      { page?: number; pageSize?: number; status?: string }
    >({
      query: ({ page = 1, pageSize = 10, status } = {}) => ({
        url: BOOKING_CANCELLATION.MY_REQUESTS,
        method: "GET",
        params: { page, pageSize, ...(status ? { status } : {}) },
      }),
      transformResponse: (response: any) => response?.data ?? response?.value ?? response,
      providesTags: [{ type: "BookingCancellation" as const, id: "MY_LIST" }],
    }),

    // 8.2 — Manager: list cancellation requests
    getManagerCancellationRequests: builder.query<
      PagedResult<CancellationRequestDto>,
      { page?: number; pageSize?: number; status?: string; search?: string }
    >({
      query: ({ page = 1, pageSize = 10, status, search } = {}) => ({
        url: BOOKING_CANCELLATION.MANAGER_LIST,
        method: "GET",
        params: {
          page,
          pageSize,
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: (response: any) => response?.data ?? response?.value ?? response,
      providesTags: [
        { type: "BookingCancellation" as const, id: "MANAGER_LIST" },
      ],
    }),

    // 8.4 — Manager: approve request
    approveCancellationRequest: builder.mutation<
      void,
      { requestId: string; body: ManagerApproveBody }
    >({
      query: ({ requestId, body }) => ({
        url: BOOKING_CANCELLATION.APPROVE(requestId),
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "BookingCancellation" as const, id: "MANAGER_LIST" },
      ],
    }),

    // 8.4 — Manager: reject request
    rejectCancellationRequest: builder.mutation<
      void,
      { requestId: string; body: ManagerRejectBody }
    >({
      query: ({ requestId, body }) => ({
        url: BOOKING_CANCELLATION.REJECT(requestId),
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "BookingCancellation" as const, id: "MANAGER_LIST" },
      ],
    }),

    // 8.4 — Manager: confirm refund
    confirmRefundPaid: builder.mutation<
      void,
      { requestId: string; body: ConfirmRefundBody }
    >({
      query: ({ requestId, body }) => ({
        url: BOOKING_CANCELLATION.CONFIRM_REFUND(requestId),
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "BookingCancellation" as const, id: "MANAGER_LIST" },
      ],
    }),
  }),
});

export const {
  useGetCancellationEstimateQuery,
  useRequestCancellationMutation,
  useGetMyCancellationRequestsQuery,
  useGetManagerCancellationRequestsQuery,
  useApproveCancellationRequestMutation,
  useRejectCancellationRequestMutation,
  useConfirmRefundPaidMutation,
} = bookingCancellationApi;
