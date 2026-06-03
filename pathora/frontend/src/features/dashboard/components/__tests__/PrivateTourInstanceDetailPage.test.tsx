import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bookingService } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import PrivateTourInstanceDetailPage from "../PrivateTourInstanceDetailPage";

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
            { id: "p1", fullName: "Nguyen An", infoReviewStatus: "Approved", status: "Active" },
            { id: "p2", fullName: "Tran Binh", infoReviewStatus: "Approved", status: "Active" }
          ])} 
          data-testid="mock-modal-review-btn"
        >
          Review All Approved
        </button>
      </div>
    ) : null
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "private-instance-1" }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
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
  TourStatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock("@/components/ui/SkeletonCard", () => ({
  SkeletonCard: () => <div data-testid="skeleton-card" />,
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getInstanceDetail: vi.fn(),
    updateInstanceDay: vi.fn(),
    addCustomDay: vi.fn(),
    updateInstanceActivity: vi.fn(),
    createInstanceActivity: vi.fn(),
    deleteInstanceActivity: vi.fn(),
  },
}));

vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getBookingsByTourInstance: vi.fn(),
    getParticipants: vi.fn(),
  },
}));

const mockInstanceDetail = {
  id: "private-instance-1",
  title: "Private Heritage Tour",
  tourInstanceCode: "TI-PVT-001",
  tourName: "Private Heritage Tour",
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-03T00:00:00.000Z",
  durationDays: 3,
  currentParticipation: 2,
  maxParticipation: 10,
  basePrice: 15000000,
  status: "Available",
  days: [
    {
      id: "day-1",
      title: "Day 1 Title",
      actualDate: "2026-06-01T00:00:00.000Z",
      activities: []
    }
  ]
};

const mockBookingsList = [
  {
    id: "booking-pv-1",
    customerName: "Nguyen An",
    customerPhone: "0909123456",
    tourName: "Private Heritage Tour",
    status: "Confirmed",
    numberAdult: 2,
    numberChild: 0,
    numberInfant: 0,
    totalAmount: 30000000,
    totalPrice: 30000000,
  }
];

const mockParticipantsList = [
  {
    id: "p1",
    fullName: "Nguyen An",
    infoReviewStatus: "NotReviewed",
    status: "Active"
  },
  {
    id: "p2",
    fullName: "Tran Binh",
    infoReviewStatus: "NotReviewed",
    status: "Active"
  }
];

describe("PrivateTourInstanceDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: { roles: [{ id: "r1", name: "TourOperator", type: 1 }] },
      isLoading: false,
    });
    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(mockInstanceDetail as any);
    vi.mocked(bookingService.getBookingsByTourInstance).mockResolvedValue(mockBookingsList as any);
    vi.mocked(bookingService.getParticipants).mockResolvedValue(mockParticipantsList as any);
  });

  it("gaters display: hides passenger review details if user is not a TourOperator", async () => {
    useAuthMock.mockReturnValue({
      user: { roles: [{ id: "r2", name: "Manager", type: 1 }] },
      isLoading: false,
    });

    render(<PrivateTourInstanceDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Private Heritage Tour").length).toBeGreaterThan(0);
    });

    expect(screen.queryByText("Thông tin Đặt chỗ & Hành khách")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Duyệt hành khách/i })).not.toBeInTheDocument();
  });

  it("gaters display: shows passenger review details and counts if user is a TourOperator", async () => {
    render(<PrivateTourInstanceDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Thông tin Đặt chỗ & Hành khách")).toBeInTheDocument();
    });

    expect(screen.getByText("Nguyen An")).toBeInTheDocument();
    expect(screen.getByText(/0909123456/)).toBeInTheDocument();
    expect(screen.getByText("0/2 đã duyệt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Duyệt hành khách/i })).toBeInTheDocument();
  });

  it("allows opening and closing the review modal and triggers local state update on review", async () => {
    render(<PrivateTourInstanceDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Duyệt hành khách/i })).toBeInTheDocument();
    });

    const triggerBtn = screen.getByRole("button", { name: /Duyệt hành khách/i });
    
    // Focus and click trigger
    triggerBtn.focus();
    fireEvent.click(triggerBtn);

    // Verify modal is open
    expect(screen.getByTestId("mock-participant-review-modal")).toBeInTheDocument();
    expect(screen.getByText("Mock Participant Review Modal for booking-pv-1")).toBeInTheDocument();

    // Click Close
    const closeBtn = screen.getByTestId("mock-modal-close-btn");
    fireEvent.click(closeBtn);

    // Verify modal is closed
    expect(screen.queryByTestId("mock-participant-review-modal")).not.toBeInTheDocument();

    // Reopen modal and perform review
    fireEvent.click(triggerBtn);
    const reviewBtn = screen.getByTestId("mock-modal-review-btn");
    fireEvent.click(reviewBtn);

    // Check that state updated and badge exhibits correct updated counts
    await waitFor(() => {
      expect(screen.queryByTestId("mock-participant-review-modal")).not.toBeInTheDocument();
    });
    expect(screen.getByText("2/2 đã duyệt")).toBeInTheDocument();
  });
});
