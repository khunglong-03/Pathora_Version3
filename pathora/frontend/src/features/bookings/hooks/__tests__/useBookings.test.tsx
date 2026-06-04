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
      refetch: vi.fn(),
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
          tourInstanceId: "ti-456",
          reference: "REF123",
          status: "Pending",
          tourStatus: "Active",
          paymentStatus: "Unpaid",
          location: "Hanoi",
          startDate: "2026-05-10T00:00:00Z",
          endDate: "2026-05-12T00:00:00Z",
          adults: 2,
          children: 1,
          infants: 0,
          totalPrice: 1500000,
          totalAmount: 1500000,
          paidAmount: 500000,
          thumbnailUrl: "/test-image.jpg",
        },
      ],
      totalCount: 1,
    };

    mockUseGetMyBookingsQuery.mockReturnValue({
      data: mockApiData,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useBookings("all", 1, 10));

    expect(result.current.bookings).toHaveLength(1);

    const b = result.current.bookings[0];
    expect(b.id).toBe("bk-123");
    expect(b.tourName).toBe("Mock Tour Name");
    expect(b.status).toBe("pending");
    expect(b.paymentStatus).toBe("unpaid");
    expect(b.duration).toBe("2 Days");
    expect(b.guests).toBe(3); // 2 adults + 1 child
    expect(b.totalAmount).toBe(1500000);
    // remainingBalance not provided → computed from total - paid
    expect(b.remainingAmount).toBe(1000000);
    expect(b.image).toBe("/test-image.jpg");
    expect(result.current.totalCount).toBe(1);
  });

  it("should map PendingCustomerApproval tourStatus → pending_approval", () => {
    const mockApiData = {
      items: [
        {
          id: "bk-approval",
          tourName: "Custom Tour",
          tourInstanceId: "ti-789",
          reference: "REF789",
          status: "Pending",
          tourStatus: "PendingCustomerApproval",
          paymentStatus: "Unpaid",
          location: "Da Nang",
          startDate: "2026-08-01T00:00:00Z",
          endDate: "2026-08-05T00:00:00Z",
          adults: 2,
          children: 0,
          infants: 0,
          totalPrice: 3000000,
          totalAmount: 3000000,
          paidAmount: 0,
          thumbnailUrl: null,
        },
      ],
      totalCount: 1,
    };

    mockUseGetMyBookingsQuery.mockReturnValue({
      data: mockApiData,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useBookings("all", 1, 10));

    expect(result.current.bookings[0].status).toBe("pending_approval");
    expect(result.current.bookings[0].tourStatus).toBe("PendingCustomerApproval");
  });

  it("should pass the correct query status to the API hook", () => {
    mockUseGetMyBookingsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
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
      refetch: vi.fn(),
    } as any);

    renderHook(() => useBookings("all", 1, 10));

    expect(mockUseGetMyBookingsQuery).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      status: undefined,
    });
  });

  it("should retain ALL bookings including past completed ones (no client-side date filtering)", () => {
    const mockApiData = {
      items: [
        {
          id: "bk-past-paid",
          tourName: "Past Completed Tour",
          tourInstanceId: "ti-1",
          reference: "REF1",
          status: "Completed",
          tourStatus: "Completed",
          paymentStatus: "Paid",
          startDate: "2020-01-01T00:00:00Z",
          endDate: "2020-01-05T00:00:00Z",
          adults: 2,
          totalPrice: 1000000,
          totalAmount: 1000000,
          paidAmount: 1000000,
          thumbnailUrl: null,
        },
        {
          id: "bk-future",
          tourName: "Future Tour",
          tourInstanceId: "ti-2",
          reference: "REF2",
          status: "Confirmed",
          tourStatus: "Active",
          paymentStatus: "Partial",
          startDate: "2030-01-01T00:00:00Z",
          endDate: "2030-01-05T00:00:00Z",
          adults: 2,
          totalPrice: 2000000,
          totalAmount: 2000000,
          paidAmount: 500000,
          thumbnailUrl: null,
        },
      ],
      totalCount: 2,
    };

    mockUseGetMyBookingsQuery.mockReturnValue({
      data: mockApiData,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useBookings("all", 1, 10));

    // Both bookings should appear — no client-side date filtering
    expect(result.current.bookings).toHaveLength(2);
    expect(result.current.bookings.map((b) => b.id)).toEqual([
      "bk-past-paid",
      "bk-future",
    ]);
  });

  it("should use remainingBalance from backend when provided", () => {
    const mockApiData = {
      items: [
        {
          id: "bk-balance",
          tourName: "Tour With Balance",
          tourInstanceId: "ti-3",
          reference: "REF3",
          status: "Confirmed",
          tourStatus: "Active",
          paymentStatus: "Partial",
          startDate: "2027-03-01T00:00:00Z",
          endDate: "2027-03-07T00:00:00Z",
          adults: 1,
          totalPrice: 5000000,
          totalAmount: 5500000, // includes tax
          paidAmount: 2000000,
          remainingBalance: 3500000, // backend-provided
          thumbnailUrl: null,
        },
      ],
      totalCount: 1,
    };

    mockUseGetMyBookingsQuery.mockReturnValue({
      data: mockApiData,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useBookings("all", 1, 10));

    const b = result.current.bookings[0];
    expect(b.totalAmount).toBe(5500000);
    // Should prefer remainingBalance from backend over computed
    expect(b.remainingAmount).toBe(3500000);
  });

  it("should handle missing dates gracefully", () => {
    const mockApiData = {
      items: [
        {
          id: "bk-nodates",
          tourName: "Tour No Dates",
          tourInstanceId: "ti-4",
          reference: "REF4",
          status: "Pending",
          tourStatus: "Draft",
          paymentStatus: "Unpaid",
          // MinValue from backend
          startDate: "0001-01-01T00:00:00Z",
          endDate: "0001-01-01T00:00:00Z",
          adults: 1,
          totalPrice: 0,
          totalAmount: 0,
          paidAmount: 0,
          thumbnailUrl: null,
        },
      ],
      totalCount: 1,
    };

    mockUseGetMyBookingsQuery.mockReturnValue({
      data: mockApiData,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useBookings("all", 1, 10));

    const b = result.current.bookings[0];
    expect(b.duration).toBe("N/A");
    expect(b.departure).toBe("TBD");
  });
});
