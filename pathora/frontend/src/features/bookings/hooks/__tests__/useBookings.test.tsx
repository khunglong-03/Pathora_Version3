import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useBookings } from "../useBookings";
import * as bookingApi from "@/store/api/bookingApi";

// Mock the API module
vi.mock("@/store/api/bookingApi", () => ({
  useGetMyBookingsQuery: vi.fn(),
}));

describe("useBookings hook", () => {
  const mockUseGetMyBookingsQuery = vi.mocked(bookingApi.useGetMyBookingsQuery);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty bookings array when no data is provided", () => {
    mockUseGetMyBookingsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn()
    } as any);

    const { result } = renderHook(() => useBookings("all", 1, 10));

    expect(result.current.bookings).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("should format backend DTOs correctly into frontend Booking type", () => {
    const mockApiData = {
      items: [
        {
          id: "bk-123",
          tourName: "Mock Tour Name",
          reference: "REF123",
          status: "pending",
          paymentStatus: "unpaid",
          location: "Hanoi",
          startDate: "2026-05-10T00:00:00Z",
          endDate: "2026-05-12T00:00:00Z",
          adults: 2,
          children: 1,
          infants: 0,
          totalPrice: 1500000,
          paidAmount: 500000,
          thumbnailUrl: "/test-image.jpg"
        }
      ],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1
    };

    mockUseGetMyBookingsQuery.mockReturnValue({
      data: mockApiData,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn()
    } as any);

    const { result } = renderHook(() => useBookings("all", 1, 10));

    expect(result.current.bookings).toHaveLength(1);
    
    const formattedBooking = result.current.bookings[0];
    expect(formattedBooking.id).toBe("bk-123");
    expect(formattedBooking.tourName).toBe("Mock Tour Name");
    expect(formattedBooking.duration).toBe("2 Days"); // Math.ceil((12-10))
    expect(formattedBooking.guests).toBe(3); // 2 adults + 1 child
    expect(formattedBooking.totalAmount).toBe(1500000);
    expect(formattedBooking.remainingAmount).toBe(1000000); // 1500000 - 500000
    expect(formattedBooking.image).toBe("/test-image.jpg");
    expect(result.current.totalCount).toBe(1);
  });

  it("should pass the correct query status to the API hook", () => {
    mockUseGetMyBookingsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn()
    } as any);

    renderHook(() => useBookings("completed", 2, 20));

    expect(mockUseGetMyBookingsQuery).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      status: "completed",
    });
  });

  it("should set query status to undefined when 'all' is selected", () => {
    mockUseGetMyBookingsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn()
    } as any);

    renderHook(() => useBookings("all", 1, 10));

    expect(mockUseGetMyBookingsQuery).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      status: undefined,
    });
  });

  it("should filter out paid bookings whose tour dates have passed, but retain unpaid or future bookings", () => {
    const mockApiData = {
      items: [
        {
          id: "bk-past-paid",
          tourName: "Past Paid Tour",
          reference: "REF1",
          status: "confirmed",
          paymentStatus: "paid",
          startDate: "2020-01-01T00:00:00Z",
          endDate: "2020-01-05T00:00:00Z",
          adults: 2,
          totalPrice: 1000000,
          paidAmount: 1000000,
        },
        {
          id: "bk-past-unpaid",
          tourName: "Past Unpaid Tour",
          reference: "REF2",
          status: "confirmed",
          paymentStatus: "unpaid",
          startDate: "2020-01-01T00:00:00Z",
          endDate: "2020-01-05T00:00:00Z",
          adults: 2,
          totalPrice: 1000000,
          paidAmount: 0,
        },
        {
          id: "bk-future-paid",
          tourName: "Future Paid Tour",
          reference: "REF3",
          status: "confirmed",
          paymentStatus: "paid",
          startDate: "2030-01-01T00:00:00Z",
          endDate: "2030-01-05T00:00:00Z",
          adults: 2,
          totalPrice: 1000000,
          paidAmount: 1000000,
        }
      ],
      totalCount: 3,
      page: 1,
      pageSize: 10,
      totalPages: 1
    };

    mockUseGetMyBookingsQuery.mockReturnValue({
      data: mockApiData,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn()
    } as any);

    const { result } = renderHook(() => useBookings("all", 1, 10));

    // bk-past-paid is filtered out, leaving the other 2
    expect(result.current.bookings).toHaveLength(2);
    expect(result.current.bookings.map(b => b.id)).toEqual(["bk-past-unpaid", "bk-future-paid"]);
  });
});
