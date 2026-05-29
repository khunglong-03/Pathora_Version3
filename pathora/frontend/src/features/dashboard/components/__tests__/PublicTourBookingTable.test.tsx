import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { tourInstanceService } from "@/api/services/tourInstanceService";
import PublicTourBookingTable from "../PublicTourBookingTable";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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
    getBookingRoomAssignments: vi.fn().mockResolvedValue([]),
    getBookingTickets: vi.fn().mockResolvedValue([]),
  },
}));

const bookings = [
  {
    id: "booking-1",
    customerName: "Nguyen An",
    tourName: "Heritage Tour",
    departureDate: "2026-06-01",
    totalPrice: 5000000,
    status: "Confirmed",
    numberAdult: 2,
    numberChild: 0,
    numberInfant: 0,
  },
];

describe("PublicTourBookingTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders booking list table with correct columns and booking details", () => {
    render(
      <PublicTourBookingTable
        instanceId="instance-1"
        bookings={bookings}
        loading={false}
        hasAccommodationActivities={true}
        externalActivities={[{ activityId: "act-1", title: "Flight", confirmed: false }]}
      />,
    );

    expect(screen.getByText("Nguyen An")).toBeInTheDocument();
    expect(screen.getByText("Danh sách booking")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // guests count
  });

  it("triggers router push when clicking a row", () => {
    render(
      <PublicTourBookingTable
        instanceId="instance-1"
        bookings={bookings}
        loading={false}
        hasAccommodationActivities={true}
        externalActivities={[]}
      />,
    );

    const row = screen.getByRole("link", { name: "Xem chi tiết booking {{customerName}}" });
    fireEvent.click(row);

    expect(mockPush).toHaveBeenCalledWith(
      "/tour-operator/tour-instances/public/instance-1/bookings/booking-1",
    );
  });

  it("triggers router push when pressing Enter on a row", () => {
    render(
      <PublicTourBookingTable
        instanceId="instance-1"
        bookings={bookings}
        loading={false}
        hasAccommodationActivities={true}
        externalActivities={[]}
      />,
    );

    const row = screen.getByRole("link", { name: "Xem chi tiết booking {{customerName}}" });
    fireEvent.keyDown(row, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith(
      "/tour-operator/tour-instances/public/instance-1/bookings/booking-1",
    );
  });

  it("renders empty state when there are no bookings", () => {
    render(
      <PublicTourBookingTable
        instanceId="instance-1"
        bookings={[]}
        loading={false}
        hasAccommodationActivities={true}
        externalActivities={[]}
      />,
    );

    expect(screen.getByText("Chưa có booking")).toBeInTheDocument();
  });
});
