import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { bookingService } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { userService } from "@/api/services/userService";
import { toast } from "react-toastify";
import TourInstanceDetailPage from "../TourInstanceDetailPage";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "instance-1" }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

const { stableT } = vi.hoisted(() => ({
  stableT: (_key: string, fallback?: string) => fallback ?? _key,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: stableT }),
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
    user: { id: "manager-1", roles: [{ name: "Manager" }] },
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
    changeStatus: vi.fn(),
  },
}));
vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getBookingsByTourInstance: vi.fn(),
  },
}));
vi.mock("@/api/services/userService", () => ({
  userService: { getAll: vi.fn() },
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
  managers: [{ role: "Manager" }, { role: "Manager" }],
  days: [],
};

describe("TourInstanceDetailPage — Manager cancel UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(baseInstance as any);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue([]);
    vi.mocked(userService.getAll).mockResolvedValue([]);
  });

  it("opens confirmation modal with deposit warning and requires reason before submit", async () => {
    render(<TourInstanceDetailPage variant="public" />);
    await waitFor(() => screen.getByRole("heading", { name: "Northern Heritage", level: 1 }));

    fireEvent.click(screen.getByRole("button", { name: /Cancel Tour/i }));
    expect(
      await screen.findByText(/30% cọc/i),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Huỷ tour/i });
    expect(confirmBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/Không đủ khách|đối tác/i);
    fireEvent.change(textarea, { target: { value: "Đối tác rút lui" } });
    expect(confirmBtn).not.toBeDisabled();
  });

  it("translates CannotCancelAfterStart error code into Vietnamese toast", async () => {
    vi.mocked(tourInstanceService.changeStatus).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          errors: [{ code: "TourInstance.CannotCancelAfterStart" }],
          errorMessage: "TourInstance.CannotCancelAfterStart",
        },
      },
    });
    render(<TourInstanceDetailPage variant="public" />);
    await waitFor(() => screen.getByRole("heading", { name: "Northern Heritage", level: 1 }));

    fireEvent.click(screen.getByRole("button", { name: /Cancel Tour/i }));
    const textarea = await screen.findByPlaceholderText(/Không đủ khách|đối tác/i);
    fireEvent.change(textarea, { target: { value: "Test" } });
    fireEvent.click(screen.getByRole("button", { name: /Huỷ tour/i }));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalled();
    });
    expect(vi.mocked(tourInstanceService.changeStatus)).toHaveBeenCalledWith(
      "instance-1",
      "Cancelled",
    );
  });
});
