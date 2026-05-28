import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bookingService } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import BookingAccommodationAssignmentPage from "../BookingAccommodationAssignmentPage";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const t = (_key: string, fallback?: string) => fallback ?? _key;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t }),
}));

vi.mock("@/components/ui", () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getInstanceDetail: vi.fn(),
    saveBookingRoomAssignment: vi.fn(),
    getBookingRoomAssignments: vi.fn(),
  },
}));

vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getBookingsByTourInstance: vi.fn(),
  },
}));

vi.mock("../PublicTourBookingAssignmentPanel", () => ({
  default: ({
    bookings,
    onSaveRoomAssignment,
  }: {
    bookings: Array<{ id: string; customerName: string }>;
    onSaveRoomAssignment: (
      activityId: string,
      payload: {
        bookingId: string;
        roomType: string;
        roomCount: number;
      },
    ) => Promise<void>;
  }) => (
    <div data-testid="room-assignment-panel">
      <p>{bookings.map((booking) => booking.customerName).join(", ")}</p>
      <button
        type="button"
        onClick={() =>
          onSaveRoomAssignment("activity-1", {
            bookingId: bookings[0].id,
            roomType: "Double",
            roomCount: 1,
          })
        }
      >
        Save room
      </button>
    </div>
  ),
}));

const instance = {
  id: "instance-1",
  tourName: "Northern Heritage",
  days: [
    {
      id: "day-1",
      instanceDayNumber: 1,
      actualDate: "2026-06-01T00:00:00.000Z",
      activities: [
        {
          id: "activity-1",
          activityType: "Accommodation",
          title: "Hotel check-in",
          accommodation: {
            roomBlocksTotal: 2,
            quantity: 2,
            roomType: "Double",
            supplierName: "Lakeview Hotel",
            supplierApprovalStatus: "Approved",
          },
        },
      ],
    },
  ],
};

const bookings = [
  {
    id: "booking-1",
    customerName: "Lan Nguyen",
    tourName: "Northern Heritage",
    departureDate: "2026-06-01",
    totalPrice: 100,
    status: "Confirmed",
    numberAdult: 2,
    numberChild: 0,
    numberInfant: 0,
  },
  {
    id: "booking-2",
    customerName: "Minh Pham",
    tourName: "Northern Heritage",
    departureDate: "2026-06-01",
    totalPrice: 100,
    status: "Confirmed",
    numberAdult: 1,
    numberChild: 1,
    numberInfant: 0,
  },
];

describe("BookingAccommodationAssignmentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(instance as any);
    vi.mocked(tourInstanceService.saveBookingRoomAssignment).mockResolvedValue({});
    vi.mocked(tourInstanceService.getBookingRoomAssignments).mockResolvedValue([]);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue(bookings);
  });

  it("filters to the route booking and saves room assignment with that booking id", async () => {
    render(
      <BookingAccommodationAssignmentPage
        instanceId="instance-1"
        bookingId="booking-2"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("room-assignment-panel")).toBeInTheDocument();
    });

    expect(screen.queryByText("Lan Nguyen")).not.toBeInTheDocument();
    expect(screen.getByText("Minh Pham")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save room" }));

    await waitFor(() => {
      expect(tourInstanceService.saveBookingRoomAssignment).toHaveBeenCalledWith(
        "instance-1",
        "activity-1",
        {
          bookingId: "booking-2",
          roomType: "Double",
          roomCount: 1,
        },
      );
    });
  });

  it("shows an error when the route booking does not belong to the instance", async () => {
    render(
      <BookingAccommodationAssignmentPage
        instanceId="instance-1"
        bookingId="missing-booking"
      />,
    );

    expect(
      await screen.findByText("Booking does not belong to this tour instance."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("room-assignment-panel")).not.toBeInTheDocument();
  });

  it("does not fetch or crash when instanceId is empty", async () => {
    render(
      <BookingAccommodationAssignmentPage
        instanceId=""
        bookingId="booking-1"
      />,
    );

    expect(tourInstanceService.getInstanceDetail).not.toHaveBeenCalled();
  });
});
