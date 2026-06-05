import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TourOperatorBookTransport } from "../TourOperatorBookTransport";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { bookingService } from "@/api/services/bookingService";

// Mocks
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "tour-id-123" }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

const stableT = (_key: string, fallback?: any, options?: any) => {
  let result = typeof fallback === "string"
    ? fallback
    : typeof fallback?.defaultValue === "string"
      ? fallback.defaultValue
      : _key;

  const opt = typeof fallback === "object" && fallback !== null ? fallback : options;
  if (opt && typeof opt === "object") {
    Object.entries(opt).forEach(([k, v]) => {
      result = result.replace(new RegExp(`{{${k}}}`, "g"), String(v));
    });
  }
  return result;
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: stableT }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

vi.mock("@/components/ui", () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getInstanceDetail: vi.fn(),
  },
}));

vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getBookingsByTourInstance: vi.fn(),
  },
}));

vi.mock("@phosphor-icons/react", () => ({
  ArrowLeft: () => <span data-testid="ArrowLeft" />,
  Bus: () => <span data-testid="Bus" />,
  MapPin: () => <span data-testid="MapPin" />,
  Clock: () => <span data-testid="Clock" />,
  Users: () => <span data-testid="Users" />,
  Star: () => <span data-testid="Star" />,
  Ticket: () => <span data-testid="Ticket" />,
  WarningCircle: () => <span data-testid="WarningCircle" />,
  ShieldCheck: () => <span data-testid="ShieldCheck" />,
}));

vi.mock("../utils/fulfillmentHelpers", () => ({
  isQualifiedBooking: vi.fn((b) => b.status !== "Cancelled"),
  calculateBookingPax: vi.fn(() => 3),
  getFulfillmentActivities: vi.fn(() => ({
    transportActivities: [
      {
        id: "act-transport-1",
        title: "Flight Activity",
        activityType: "Transportation",
        transportationType: "Flight",
      }
    ],
    groundTransports: []
  })),
  isActivityExternalTransport: vi.fn(() => true),
}));

vi.mock("@/features/dashboard/components/ExternalTicketAssignmentPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="ExternalTicketAssignmentPanel" />
}));

vi.mock("@/features/dashboard/components/SupplierReassignmentModal", () => ({
  __esModule: true,
  default: () => <div data-testid="SupplierReassignmentModal" />
}));

vi.mock("@/components/ui/SkeletonCard", () => ({
  SkeletonCard: () => <div data-testid="SkeletonCard" />
}));

describe("TourOperatorBookTransport Scoped Mode", () => {
  const mockTour = {
    id: "tour-id-123",
    tourName: "Ultimate Adventure Tour",
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-06-02T00:00:00.000Z",
  };

  const mockBookings = [
    { id: "booking-1", bookingReference: "B-REF-1", status: "Confirmed" },
    { id: "booking-2", bookingReference: "B-REF-2", status: "Confirmed" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with scopedBookingId matching a booking, displays header badge and view all link", async () => {
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(mockTour as any);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue(mockBookings as any);

    render(
      <TourOperatorBookTransport
        instanceId="tour-id-123"
        scopedBookingId="booking-1"
        backUrl="/back-url"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/tour_label/)).toBeInTheDocument();
    });

    // Verify scoped header badge text
    expect(screen.getByText(/Đang gán cho Booking #B-REF-1/)).toBeInTheDocument();

    // Verify scoped view all link
    const viewAllLink = screen.getByRole("link", { name: "Xem tất cả bookings của tour" });
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink.getAttribute("href")).toBe("/tour-operator/tour-instances/public/tour-id-123");
  });

  it("renders with scopedBookingId not matching a booking, displays error screen", async () => {
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(mockTour as any);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue(mockBookings as any);

    render(
      <TourOperatorBookTransport
        instanceId="tour-id-123"
        scopedBookingId="booking-missing"
        backUrl="/back-url"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Booking không thuộc tour này.")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Back to Tour Details/ })).toBeInTheDocument();
  });

  it("renders without scopedBookingId, behaves backward compatible and does not display badge", async () => {
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(mockTour as any);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue(mockBookings as any);

    render(
      <TourOperatorBookTransport
        instanceId="tour-id-123"
        backUrl="/back-url"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/tour_label/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Đang gán cho Booking/)).not.toBeInTheDocument();
    expect(screen.queryByText(/B-REF-1/)).not.toBeInTheDocument();
  });
});
