import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bookingService } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { userService } from "@/api/services/userService";
import TourInstanceDetailPage from "../TourInstanceDetailPage";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "instance-1" }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
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
  TourStatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock("@/components/ui/SkeletonCard", () => ({
  SkeletonCard: () => <div data-testid="skeleton-card" />,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "operator-1",
      roles: [{ name: "TourOperator" }],
    },
  }),
}));

vi.mock("../SupplierReassignmentModal", () => ({
  default: () => <div data-testid="supplier-reassignment-modal" />,
}));

vi.mock("../TicketImageUpload", () => ({
  default: () => <div data-testid="ticket-image-upload" />,
}));

vi.mock("../PublicTourBookingTable", () => ({
  default: () => <div data-testid="public-tour-booking-table" />,
}));

vi.mock("../PublicTourBookingAssignmentPanel", () => ({
  default: () => <div data-testid="public-tour-booking-assignment-panel" />,
}));

vi.mock("@/features/private-co-design/PrivateTourCoDesignOperatorSection", () => ({
  PrivateTourCoDesignOperatorSection: () => <div data-testid="private-co-design" />,
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getInstanceDetail: vi.fn(),
    updateInstance: vi.fn(),
    updateInstanceDay: vi.fn(),
    updateInstanceActivity: vi.fn(),
    addCustomDay: vi.fn(),
    createInstanceActivity: vi.fn(),
    deleteInstanceActivity: vi.fn(),
    saveBookingTicket: vi.fn(),
    confirmExternalTransport: vi.fn(),
    saveBookingRoomAssignment: vi.fn(),
    getBookingRoomAssignments: vi.fn(),
  },
}));

vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getBookingsByTourInstance: vi.fn(),
  },
}));

vi.mock("@/api/services/userService", () => ({
  userService: {
    getAll: vi.fn(),
  },
}));

const baseInstance = {
  id: "instance-1",
  title: "Northern Heritage",
  tourInstanceCode: "TI-001",
  tourName: "Northern Heritage",
  classificationName: "Cultural",
  thumbnail: null,
  images: [],
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-03T00:00:00.000Z",
  durationDays: 3,
  currentParticipation: 8,
  maxParticipation: 20,
  basePrice: 12000000,
  originalBasePrice: 12000000,
  status: "Available",
  instanceType: "Public",
  location: "Ha Noi",
  confirmationDeadline: "2026-05-25T00:00:00.000Z",
  includedServices: [],
  totalBookings: 1,
  revenue: 0,
  managers: [],
  days: [
    {
      id: "day-1",
      instanceDayNumber: 1,
      actualDate: "2026-06-01T00:00:00.000Z",
      title: "Day 1",
      description: null,
      startTime: null,
      endTime: null,
      note: null,
      activities: [
        {
          id: "transport-1",
          order: 1,
          activityType: "Transportation",
          title: "Airport transfer",
          description: null,
          startTime: "08:00",
          endTime: "10:00",
          isOptional: false,
          note: null,
          accommodation: null,
          transportationType: "Bus",
          transportationName: "Bus",
          requestedVehicleType: "Coach",
          requestedSeatCount: 20,
          transportSupplierId: "supplier-1",
          transportSupplierName: "Atlas Coach",
          transportationApprovalStatus: "Approved",
          vehicleType: "Bus",
          vehicleBrand: "Thaco",
          vehicleModel: "Universe",
          seatCapacity: 29,
          driverName: "Minh Tran",
          driverPhone: "0901002003",
          pickupLocation: "Noi Bai",
          dropoffLocation: "Old Quarter",
          departureTime: "2026-06-01T08:00:00.000Z",
          arrivalTime: "2026-06-01T10:00:00.000Z",
          transportAssignments: [
            {
              id: "assignment-1",
              vehicleId: "vehicle-1",
              driverId: "driver-1",
              vehicleType: "Bus",
              vehicleBrand: "Thaco",
              vehicleModel: "Universe",
              vehicleSeatCapacity: 29,
              driverName: "Minh Tran",
              driverPhone: "0901002003",
            },
          ],
        },
        {
          id: "accom-1",
          order: 2,
          activityType: "Accommodation",
          title: "Hotel check-in",
          description: null,
          startTime: null,
          endTime: null,
          isOptional: false,
          note: null,
          accommodation: {
            id: "accommodation-1",
            roomType: "Double",
            quantity: 4,
            supplierId: "hotel-1",
            supplierName: "Lakeview Hotel",
            supplierApprovalStatus: "Approved",
            supplierApprovalNote: null,
            roomBlocksTotal: 4,
          },
        },
      ],
    },
  ],
};

const renderReadyPage = async (variant?: "public" | "private") => {
  render(<TourInstanceDetailPage variant={variant} />);

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Northern Heritage", level: 1 }),
    ).toBeInTheDocument();
  });
};

describe("TourInstanceDetailPage variant gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(baseInstance as any);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue([]);
    vi.mocked(userService.getAll).mockResolvedValue([]);
  });

  it("hides private transport approval UI and shows read-only assigned vehicle details in public mode", async () => {
    await renderReadyPage("public");

    expect(screen.queryByTestId("approval-overview-transport")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transport-approval-block")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reassign-transport-btn")).not.toBeInTheDocument();
    expect(screen.getByText("Atlas Coach")).toBeInTheDocument();
  });

  it("shows the transport approval UI in private mode", async () => {
    await renderReadyPage("private");

    expect(screen.getByTestId("approval-overview-transport")).toBeInTheDocument();
    expect(screen.getByTestId("transport-approval-block")).toBeInTheDocument();
    expect(screen.getByTestId("reassign-transport-btn")).toBeInTheDocument();
  });

  it("infers the public variant from instanceType when variant is omitted", async () => {
    await renderReadyPage();

    expect(screen.queryByTestId("approval-overview-transport")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transport-approval-block")).not.toBeInTheDocument();
    expect(screen.getByText("Atlas Coach")).toBeInTheDocument();
  });
});
