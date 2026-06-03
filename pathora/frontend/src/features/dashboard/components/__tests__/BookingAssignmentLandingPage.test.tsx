import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bookingService } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import BookingAssignmentLandingPage from "../BookingAssignmentLandingPage";

const useAuthMock = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../bookings/ui/ParticipantReviewModal", () => ({
  __esModule: true,
  default: ({ bookingId, isOpen, onClose, onReviewed }: any) => 
    isOpen ? (
      <div data-testid="mock-participant-review-modal">
        Mock Participant Review Modal for {bookingId}
        <button onClick={onClose} data-testid="mock-modal-close-btn">Close</button>
        <button 
          onClick={() => onReviewed?.([
            { participantId: "p1", fullName: "Test Guest Approved", infoReviewStatus: "Approved", status: "Active" }
          ])} 
          data-testid="mock-modal-review-btn"
        >
          Review
        </button>
      </div>
    ) : null
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
}));

const stableT = (_key: string, fallback?: string | Record<string, unknown>) => {
  let result = typeof fallback === "string"
    ? fallback
    : typeof fallback?.defaultValue === "string"
      ? fallback.defaultValue
      : _key;

  if (typeof fallback === "object" && fallback !== null) {
    Object.entries(fallback).forEach(([k, v]) => {
      result = result.replace(new RegExp(`{{${k}}}`, "g"), String(v));
    });
  }
  return result;
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: stableT }),
}));

vi.mock("@/components/ui", () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getInstanceDetail: vi.fn(),
    getBookingRoomAssignments: vi.fn(),
    getBookingTickets: vi.fn(),
  },
}));

vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getBookingsByTourInstance: vi.fn(),
    getParticipants: vi.fn(),
  },
}));

const mockInstance = {
  id: "instance-1",
  tourName: "Ultimate Adventure Tour",
  days: [
    {
      id: "day-1",
      instanceDayNumber: 1,
      actualDate: "2026-06-01T00:00:00.000Z",
      activities: [
        {
          id: "activity-hotel",
          activityType: "Accommodation",
          title: "Hilton Premium Stay",
          accommodation: {
            roomBlocksTotal: 10,
            quantity: 2,
            roomType: "Deluxe Twin",
            supplierName: "Hilton Hanoi",
            supplierApprovalStatus: "Approved",
          },
        },
      ],
    },
    {
      id: "day-2",
      instanceDayNumber: 2,
      actualDate: "2026-06-02T00:00:00.000Z",
      activities: [
        {
          id: "activity-flight",
          activityType: "Transportation",
          title: "Flight from Hanoi to Danang",
          transportationType: "Flight",
          externalTransportConfirmed: true,
        },
      ],
    },
  ],
};

const mockBookings = [
  {
    id: "booking-1",
    customerName: "Minh Anh",
    tourName: "Ultimate Adventure Tour",
    departureDate: "2026-06-01",
    totalPrice: 12000000,
    totalAmount: 12000000,
    status: "Confirmed",
    numberAdult: 2,
    numberChild: 1,
    numberInfant: 0,
  },
];

describe("BookingAssignmentLandingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: { roles: [{ id: "r1", name: "Manager", type: 1 }] },
      isLoading: false,
    });
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(mockInstance as any);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue(mockBookings);
    vi.mocked(tourInstanceService.getBookingRoomAssignments).mockResolvedValue([]);
    vi.mocked(tourInstanceService.getBookingTickets).mockResolvedValue([]);
    vi.mocked(bookingService.getParticipants).mockResolvedValue([]);
  });

  it("renders loading skeleton initially", () => {
    render(
      <BookingAssignmentLandingPage
        instanceId="instance-1"
        bookingId="booking-1"
        backUrl="/back-to-tour"
      />,
    );
    expect(screen.queryByText("Ultimate Adventure Tour")).not.toBeInTheDocument();
  });

  it("renders booking summary header and activity list successfully", async () => {
    render(
      <BookingAssignmentLandingPage
        instanceId="instance-1"
        bookingId="booking-1"
        backUrl="/back-to-tour"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Minh Anh")).toBeInTheDocument();
    });

    expect(screen.getByText("3 khách")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Hilton Premium Stay")).toBeInTheDocument();
    expect(screen.getByText("Flight from Hanoi to Danang")).toBeInTheDocument();
  });

  it("renders assigned details when activities have active assignments", async () => {
    vi.mocked(tourInstanceService.getBookingRoomAssignments).mockResolvedValue([
      { bookingId: "booking-1", roomType: "Deluxe Twin", roomCount: 2 } as any,
    ]);
    vi.mocked(tourInstanceService.getBookingTickets).mockResolvedValue([
      { bookingId: "booking-1", flightNumber: "VN123", seatNumbers: "12A 12B" } as any,
    ]);

    render(
      <BookingAssignmentLandingPage
        instanceId="instance-1"
        bookingId="booking-1"
        backUrl="/back-to-tour"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Deluxe Twin × 2")).toBeInTheDocument();
    });
    expect(screen.getByText("VN123")).toBeInTheDocument();
  });

  it("renders empty state when there are no activities in the tour instance", async () => {
    const emptyInstance = { ...mockInstance, days: [] };
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(emptyInstance as any);

    render(
      <BookingAssignmentLandingPage
        instanceId="instance-1"
        bookingId="booking-1"
        backUrl="/back-to-tour"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Booking này không có hoạt động nào cần gán.")).toBeInTheDocument();
    });
  });

  it("renders booking not found error screen when booking is missing", async () => {
    render(
      <BookingAssignmentLandingPage
        instanceId="instance-1"
        bookingId="booking-missing"
        backUrl="/back-to-tour"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Không tìm thấy booking hoặc booking đã bị hủy.")).toBeInTheDocument();
    });
  });

  describe("TourOperator Passenger Review Entry Point", () => {
    it("hides review button and does not fetch participants for Manager/Admin role", async () => {
      useAuthMock.mockReturnValue({
        user: { roles: [{ id: "r1", name: "Manager", type: 1 }] },
        isLoading: false,
      });

      render(
        <BookingAssignmentLandingPage
          instanceId="instance-1"
          bookingId="booking-1"
          backUrl="/back-to-tour"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Minh Anh")).toBeInTheDocument();
      });

      expect(screen.queryByText("Duyệt hành khách")).not.toBeInTheDocument();
      expect(bookingService.getParticipants).not.toHaveBeenCalled();
    });

    it("hides button/badge when isAuthLoading is true", async () => {
      useAuthMock.mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(
        <BookingAssignmentLandingPage
          instanceId="instance-1"
          bookingId="booking-1"
          backUrl="/back-to-tour"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Minh Anh")).toBeInTheDocument();
      });

      expect(screen.queryByText("Duyệt hành khách")).not.toBeInTheDocument();
    });

    it("renders review button and fetches participants for TourOperator", async () => {
      useAuthMock.mockReturnValue({
        user: { roles: [{ id: "r2", name: "TourOperator", type: 2 }] },
        isLoading: false,
      });
      vi.mocked(bookingService.getParticipants).mockResolvedValue([
        { participantId: "p1", fullName: "Guest 1", infoReviewStatus: "NotReviewed", status: "Active" },
        { participantId: "p2", fullName: "Guest 2", infoReviewStatus: "Approved", status: "Active" },
      ]);

      render(
        <BookingAssignmentLandingPage
          instanceId="instance-1"
          bookingId="booking-1"
          backUrl="/back-to-tour"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Duyệt hành khách")).toBeInTheDocument();
      });

      expect(bookingService.getParticipants).toHaveBeenCalledWith("booking-1");
      expect(screen.getByText("1/2 đã duyệt")).toBeInTheDocument();
    });

    it("renders mix/rejected badge formatting correctly", async () => {
      useAuthMock.mockReturnValue({
        user: { roles: [{ id: "r2", name: "TourOperator", type: 2 }] },
        isLoading: false,
      });
      vi.mocked(bookingService.getParticipants).mockResolvedValue([
        { participantId: "p1", fullName: "Guest 1", infoReviewStatus: "NotReviewed", status: "Active" },
        { participantId: "p2", fullName: "Guest 2", infoReviewStatus: "Approved", status: "Active" },
        { participantId: "p3", fullName: "Guest 3", infoReviewStatus: "Rejected", status: "Active" },
      ]);

      render(
        <BookingAssignmentLandingPage
          instanceId="instance-1"
          bookingId="booking-1"
          backUrl="/back-to-tour"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("1/3 đã duyệt", { exact: false })).toBeInTheDocument();
      });
      expect(screen.getByText("1 từ chối", { exact: false })).toBeInTheDocument();
    });

    it("renders empty passengers state with disabled review button", async () => {
      useAuthMock.mockReturnValue({
        user: { roles: [{ id: "r2", name: "TourOperator", type: 2 }] },
        isLoading: false,
      });
      vi.mocked(bookingService.getParticipants).mockResolvedValue([]);

      render(
        <BookingAssignmentLandingPage
          instanceId="instance-1"
          bookingId="booking-1"
          backUrl="/back-to-tour"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Chưa có hành khách")).toBeInTheDocument();
      });
      const btn = screen.getByRole("button", { name: /Duyệt hành khách/ });
      expect(btn).toBeDisabled();
    });

    it("opens ParticipantReviewModal on click and updates badge with payload on handleReviewed", async () => {
      useAuthMock.mockReturnValue({
        user: { roles: [{ id: "r2", name: "TourOperator", type: 2 }] },
        isLoading: false,
      });
      vi.mocked(bookingService.getParticipants).mockResolvedValue([
        { participantId: "p1", fullName: "Guest 1", infoReviewStatus: "NotReviewed", status: "Active" }
      ]);

      render(
        <BookingAssignmentLandingPage
          instanceId="instance-1"
          bookingId="booking-1"
          backUrl="/back-to-tour"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("0/1 đã duyệt")).toBeInTheDocument();
      });

      const btn = screen.getByRole("button", { name: /Duyệt hành khách/ });
      fireEvent.click(btn);

      expect(screen.getByTestId("mock-participant-review-modal")).toBeInTheDocument();

      // Trigger review which calls handleReviewed with new payload
      const reviewBtn = screen.getByTestId("mock-modal-review-btn");
      fireEvent.click(reviewBtn);

      // Modal should close and badge should update to Approved count
      expect(screen.queryByTestId("mock-participant-review-modal")).not.toBeInTheDocument();
      expect(screen.getByText("1/1 đã duyệt")).toBeInTheDocument();
    });

    it("closes modal on handleClose without fetching participants again", async () => {
      useAuthMock.mockReturnValue({
        user: { roles: [{ id: "r2", name: "TourOperator", type: 2 }] },
        isLoading: false,
      });
      vi.mocked(bookingService.getParticipants).mockResolvedValue([
        { participantId: "p1", fullName: "Guest 1", infoReviewStatus: "NotReviewed", status: "Active" }
      ]);

      render(
        <BookingAssignmentLandingPage
          instanceId="instance-1"
          bookingId="booking-1"
          backUrl="/back-to-tour"
        />,
      );

      await waitFor(() => {
        expect(bookingService.getParticipants).toHaveBeenCalledTimes(1);
      });

      const btn = screen.getByRole("button", { name: /Duyệt hành khách/ });
      fireEvent.click(btn);

      const closeBtn = screen.getByTestId("mock-modal-close-btn");
      fireEvent.click(closeBtn);

      expect(screen.queryByTestId("mock-participant-review-modal")).not.toBeInTheDocument();
      // Should not refetch on close
      expect(bookingService.getParticipants).toHaveBeenCalledTimes(1);
    });

    it("displays error state when api returns 500 error", async () => {
      useAuthMock.mockReturnValue({
        user: { roles: [{ id: "r2", name: "TourOperator", type: 2 }] },
        isLoading: false,
      });
      vi.mocked(bookingService.getParticipants).mockRejectedValue(new Error("Internal Server Error"));

      render(
        <BookingAssignmentLandingPage
          instanceId="instance-1"
          bookingId="booking-1"
          backUrl="/back-to-tour"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Tải lỗi")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: /Duyệt hành khách/ })).toBeInTheDocument();
    });
  });
});
