import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bookingService } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import FlightTicketAssignmentPage from "../FlightTicketAssignmentPage";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "instance-1" }),
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string | Record<string, unknown>) =>
      typeof fallback === "string"
        ? fallback
        : typeof fallback?.defaultValue === "string"
          ? fallback.defaultValue
          : _key,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/components/ui", () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getInstanceDetail: vi.fn(),
    saveBookingTicket: vi.fn(),
    confirmExternalTransport: vi.fn(),
  },
}));

vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getBookingsByTourInstance: vi.fn(),
  },
}));

vi.mock("../ExternalTicketAssignmentPanel", () => ({
  default: ({
    bookings,
    onSave,
  }: {
    bookings: Array<{ id: string; customerName: string }>;
    onSave: (entry: {
      bookingId: string;
      flightNumber: string;
      seatClass: string;
      departureAt: string;
      arrivalAt: string;
      tickets: Array<{ seatNumber: string; eTicketNumber: string }>;
      note: string;
    }) => Promise<void>;
  }) => (
    <div data-testid="ticket-panel">
      <p>{bookings.map((booking) => booking.customerName).join(", ")}</p>
      <button
        type="button"
        onClick={() =>
          onSave({
            bookingId: bookings[0].id,
            flightNumber: "VN123",
            seatClass: "Economy",
            departureAt: "2026-06-01T08:00",
            arrivalAt: "2026-06-01T10:00",
            tickets: [{ seatNumber: "12A", eTicketNumber: "ET-1" }],
            note: "window seat",
          })
        }
      >
        Save ticket
      </button>
    </div>
  ),
}));

const instance = {
  id: "instance-1",
  tourName: "Northern Heritage",
  days: [
    {
      actualDate: "2026-06-01T00:00:00.000Z",
      instanceDayNumber: 1,
      activities: [
        {
          id: "flight-1",
          activityType: "Transportation",
          title: "Flight to Da Nang",
          transportationType: "Flight",
          startTime: "08:00",
          endTime: "10:00",
          externalTransportConfirmed: false,
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
    numberAdult: 1,
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
    numberChild: 0,
    numberInfant: 0,
  },
];

describe("FlightTicketAssignmentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerPush.mockReset();
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(instance as any);
    vi.mocked(tourInstanceService.saveBookingTicket).mockResolvedValue({});
    vi.mocked(tourInstanceService.confirmExternalTransport).mockResolvedValue({});
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue(bookings);
  });

  it("filters to the route booking and saves the ticket with that booking id", async () => {
    render(
      <FlightTicketAssignmentPage
        instanceId="instance-1"
        filterBookingId="booking-2"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("ticket-panel")).toBeInTheDocument();
    });

    expect(screen.queryByText("Lan Nguyen")).not.toBeInTheDocument();
    expect(screen.getByText("Minh Pham")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save ticket" }));

    await waitFor(() => {
      expect(tourInstanceService.saveBookingTicket).toHaveBeenCalledWith(
        "instance-1",
        "flight-1",
        {
          bookingId: "booking-2",
          flightNumber: "VN123",
          seatClass: "Economy",
          departureAt: "2026-06-01T08:00",
          arrivalAt: "2026-06-01T10:00",
          seatNumbers: "12A",
          eTicketNumbers: "ET-1",
          note: "window seat",
        },
      );
    });
  });

  it("shows an error when the booking does not belong to the instance", async () => {
    render(
      <FlightTicketAssignmentPage
        instanceId="instance-1"
        filterBookingId="missing-booking"
      />,
    );

    expect(
      await screen.findByText("Booking does not belong to this tour instance."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("ticket-panel")).not.toBeInTheDocument();
  });
});
