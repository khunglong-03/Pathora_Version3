import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bookingService } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import BookingAssignmentLandingPage from "../BookingAssignmentLandingPage";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
}));

const stableT = (_key: string, fallback?: string | Record<string, unknown>) =>
  typeof fallback === "string"
    ? fallback
    : typeof fallback?.defaultValue === "string"
      ? fallback.defaultValue
      : _key;

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
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(mockInstance as any);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue(mockBookings);
    vi.mocked(tourInstanceService.getBookingRoomAssignments).mockResolvedValue([]);
    vi.mocked(tourInstanceService.getBookingTickets).mockResolvedValue([]);
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
});
