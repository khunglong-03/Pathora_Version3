import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookingOverviewTab } from "../BookingOverviewTab";
import type { BookingDetail } from "../BookingDetailData";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

const mockBooking: BookingDetail = {
  id: "booking-1",
  tourName: "Da Nang Adventure",
  reference: "PATH-1234",
  tier: "standard",
  status: "confirmed",
  paymentStatus: "unpaid",
  paymentMethod: "bank_transfer",
  location: "Da Nang",
  duration: "3 Days",
  bookingDate: "2026-05-26T00:00:00Z",
  departureDate: "2026-06-01T00:00:00Z",
  returnDate: "2026-06-04T00:00:00Z",
  adults: 2,
  children: 0,
  infants: 0,
  pricePerPerson: 1000000,
  totalAmount: 2000000,
  paidAmount: 0,
  remainingBalance: 2000000,
  image: "",
  description: "Test description",
  highlights: ["Highlight 1", "Highlight 2"],
  importantInfo: [],
  tickets: [],
  roomAssignments: [],
  dayStatuses: [],
  ticketImages: [],
};

const mockTourInstance = {
  id: "instance-1",
  tourId: "tour-1",
  days: [
    {
      id: "day-1",
      title: "Day 1 Title",
      description: "Day 1 Description",
      activities: [
        {
          id: "activity-1",
          title: "Flight to Da Nang",
          activityType: "Transportation",
          transportationType: "Flight",
          transportationName: "VN-123",
        },
      ],
    },
  ],
};

describe("BookingOverviewTab - Tickets Tab Visibility", () => {
  it("does not show tickets tab when paymentStatus is unpaid", () => {
    const booking = { ...mockBooking, paymentStatus: "unpaid" as const };
    render(
      <BookingOverviewTab
        booking={booking}
        tourInstance={mockTourInstance as any}
        totalGuests={2}
        getTierLabel={(tier) => tier}
      />
    );
    expect(screen.queryByText("Vé & Trạng thái")).not.toBeInTheDocument();
  });

  it("shows tickets tab when paymentStatus is paid", () => {
    const booking = { ...mockBooking, paymentStatus: "paid" as const };
    render(
      <BookingOverviewTab
        booking={booking}
        tourInstance={mockTourInstance as any}
        totalGuests={2}
        getTierLabel={(tier) => tier}
      />
    );
    expect(screen.getByText("Vé & Trạng thái")).toBeInTheDocument();
  });

  it("shows tickets tab when paymentStatus is partial (deposited)", () => {
    const booking = { ...mockBooking, paymentStatus: "partial" as const };
    render(
      <BookingOverviewTab
        booking={booking}
        tourInstance={mockTourInstance as any}
        totalGuests={2}
        getTierLabel={(tier) => tier}
      />
    );
    expect(screen.getByText("Vé & Trạng thái")).toBeInTheDocument();
  });
});
