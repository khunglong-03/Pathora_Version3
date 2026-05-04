import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCancellationEstimate } from "../hooks/useCancellationEstimate";

// Mock the RTK Query hook
vi.mock("@/store/api/bookingCancellationApi", () => ({
  useGetCancellationEstimateQuery: vi.fn(),
}));

import { useGetCancellationEstimateQuery } from "@/store/api/bookingCancellationApi";
const mockQuery = vi.mocked(useGetCancellationEstimateQuery);

describe("useCancellationEstimate", () => {
  it("returns loading state initially", () => {
    mockQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      isError: false,
      error: undefined,
    } as unknown as ReturnType<typeof useGetCancellationEstimateQuery>);

    const { result } = renderHook(() =>
      useCancellationEstimate("booking-id-123")
    );
    expect(result.current.isLoading).toBe(true);
    expect(result.current.estimate).toBeUndefined();
  });

  it("returns estimate data on success", async () => {
    const mockEstimate = {
      bookingId: "booking-id-123",
      policyId: "policy-456",
      tourScope: "Domestic",
      daysBeforeDeparture: 10,
      feePercent: 30,
      paidAmount: 3000000,
      refundAmount: 2100000,
    };
    mockQuery.mockReturnValue({
      data: mockEstimate,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
    } as unknown as ReturnType<typeof useGetCancellationEstimateQuery>);

    const { result } = renderHook(() =>
      useCancellationEstimate("booking-id-123")
    );

    await waitFor(() => {
      expect(result.current.estimate?.feePercent).toBe(30);
      expect(result.current.estimate?.refundAmount).toBe(2100000);
    });
  });

  it("skips fetch when bookingId is null", () => {
    mockQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
    } as unknown as ReturnType<typeof useGetCancellationEstimateQuery>);

    renderHook(() => useCancellationEstimate(null));

    // The hook is called with null due to skip logic
    expect(mockQuery).toHaveBeenCalledWith(null as any, { skip: true });
  });

  it("returns error state on fetch failure", () => {
    mockQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { status: 404, data: "Not found" },
    } as unknown as ReturnType<typeof useGetCancellationEstimateQuery>);

    const { result } = renderHook(() =>
      useCancellationEstimate("booking-id-999")
    );

    expect(result.current.isError).toBe(true);
    expect(result.current.estimate).toBeUndefined();
  });
});
