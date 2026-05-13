import { useGetCancellationEstimateQuery } from "@/store/api/bookingCancellationApi";

/**
 * Task 7.2: Hook để lấy phí ước tính hủy booking.
 * Tự động fetch khi bookingId thay đổi. Skip khi không có ID.
 */
export function useCancellationEstimate(bookingId: string | null | undefined) {
  const {
    data: estimate,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetCancellationEstimateQuery(bookingId!, {
    skip: !bookingId,
  });

  return {
    estimate,
    isLoading: isLoading || isFetching,
    isError,
    error,
  };
}
