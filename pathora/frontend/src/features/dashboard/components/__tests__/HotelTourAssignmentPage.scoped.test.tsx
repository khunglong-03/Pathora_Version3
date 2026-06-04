import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import HotelTourAssignmentPage from "../HotelTourAssignmentPage";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { bookingService } from "@/api/services/bookingService";
import { supplierService } from "@/api/services/supplierService";

// Mocks
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "tour-id-123" }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getInstanceDetail: vi.fn(),
    getMyAssignedInstanceDetail: vi.fn(),
  },
}));

vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getBookingsByTourInstance: vi.fn(),
  },
}));

vi.mock("@/api/services/supplierService", () => ({
  supplierService: {
    getSuppliers: vi.fn(),
    getSupplierAccommodations: vi.fn(() => Promise.resolve([])),
  },
}));

describe("HotelTourAssignmentPage Scoped Mode", () => {
  const mockTour = {
    id: "tour-id-123",
    title: "Test Hotel Tour",
    tourInstanceCode: "TI-123",
    tourName: "Test Hotel Tour",
    startDate: "2026-05-01",
    endDate: "2026-05-02",
    continent: "Asia",
    days: [
      {
        title: "Day 1",
        actualDate: "2026-05-01",
        instanceDayNumber: 1,
        activities: [
          {
            id: "activity-1",
            title: "Check-in Hotel",
            activityType: "Accommodation",
            accommodation: {
              supplierId: "sup-1",
              supplierApprovalStatus: "Pending",
              roomType: "DELUXE",
              quantity: 2,
              roomBlocksTotal: 2,
            },
          },
        ],
      },
    ],
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
    vi.mocked(supplierService.getSuppliers).mockResolvedValue([]);

    render(
      <HotelTourAssignmentPage
        instanceId="tour-id-123"
        scopedBookingId="booking-1"
        backUrl="/back-url"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/TI-123/)).toBeInTheDocument();
    });

    // Verify scoped header badge text (which is rendered using translation key with ref)
    expect(screen.getByText(/Đang gán cho Booking #B-REF-1/)).toBeInTheDocument();

    // Verify scoped view all link
    const viewAllLink = screen.getByRole("link", { name: "Xem tất cả bookings của tour" });
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink.getAttribute("href")).toBe("/tour-operator/tour-instances/public/tour-id-123");
  });

  it("renders with scopedBookingId not matching a booking, displays error screen", async () => {
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(mockTour as any);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue(mockBookings as any);
    vi.mocked(supplierService.getSuppliers).mockResolvedValue([]);

    render(
      <HotelTourAssignmentPage
        instanceId="tour-id-123"
        scopedBookingId="booking-missing"
        backUrl="/back-url"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Booking không thuộc tour này.")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Back to list/ })).toBeInTheDocument();
  });

  it("renders without scopedBookingId, behaves backward compatible and does not display badge", async () => {
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(mockTour as any);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue(mockBookings as any);
    vi.mocked(supplierService.getSuppliers).mockResolvedValue([]);

    render(
      <HotelTourAssignmentPage
        instanceId="tour-id-123"
        backUrl="/back-url"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/TI-123/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Đang gán cho Booking/)).not.toBeInTheDocument();
    expect(screen.queryByText(/B-REF-1/)).not.toBeInTheDocument();
  });
});
