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
    getOperatorParticipants: vi.fn(),
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
    vi.mocked(bookingService.getOperatorParticipants).mockResolvedValue(mockParticipantsList as any);
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
    expect(screen.queryByRole("button", { name: /Xem chi tiết/i })).not.toBeInTheDocument();
  });

  it("gaters display: shows passenger review details and counts if user is a TourOperator", async () => {
    render(<PrivateTourInstanceDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Thông tin Đặt chỗ & Hành khách")).toBeInTheDocument();
    });

    expect(screen.getByText("Nguyen An")).toBeInTheDocument();
    expect(screen.getByText(/0909123456/)).toBeInTheDocument();
    expect(screen.getByText("0/2 đã duyệt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xem chi tiết/i })).toBeInTheDocument();
  });

  it("allows opening and closing the review modal and triggers local state update on review", async () => {
    render(<PrivateTourInstanceDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Xem chi tiết/i })).toBeInTheDocument();
    });

    const triggerBtn = screen.getByRole("button", { name: /Xem chi tiết/i });
    
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

  it("filters activities to show only transportation and accommodation, hiding others and showing empty state if none exist", async () => {
    const mockDetailWithMixedActivities = {
      ...mockInstanceDetail,
      days: [
        {
          id: "day-1",
          title: "Day 1 Title",
          actualDate: "2026-06-01T00:00:00.000Z",
          activities: [
            {
              id: "act-1",
              title: "Sightseeing Activity",
              activityType: 0,
              startTime: "08:00",
              endTime: "10:00"
            },
            {
              id: "act-2",
              title: "Transportation Activity",
              activityType: 7,
              startTime: "10:00",
              endTime: "11:00",
              transportSupplierName: "Mock Airlines",
              transportationApprovalStatus: "Approved"
            },
            {
              id: "act-3",
              title: "Accommodation Activity",
              activityType: 8,
              startTime: "14:00",
              endTime: "15:00",
              accommodation: {
                supplierName: "Mock Hotel",
                supplierApprovalStatus: "Pending"
              }
            },
            {
              id: "act-4",
              title: "Free Time Activity",
              activityType: 9,
              startTime: "16:00",
              endTime: "18:00"
            }
          ]
        },
        {
          id: "day-2",
          title: "Day 2 Title",
          actualDate: "2026-06-02T00:00:00.000Z",
          activities: [
            {
              id: "act-5",
              title: "Dining Activity",
              activityType: 1,
              startTime: "19:00",
              endTime: "21:00"
            }
          ]
        }
      ]
    };

    vi.mocked(tourInstanceService.getInstanceDetail).mockResolvedValue(mockDetailWithMixedActivities as any);

    render(<PrivateTourInstanceDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Day 1 Title")).toBeInTheDocument();
    });

    expect(screen.getByText("Transportation Activity")).toBeInTheDocument();
    expect(screen.getByText("Accommodation Activity")).toBeInTheDocument();
    expect(screen.getByText("NCC: Mock Airlines")).toBeInTheDocument();
    expect(screen.getByText("NCC: Mock Hotel")).toBeInTheDocument();

    expect(screen.queryByText("Sightseeing Activity")).not.toBeInTheDocument();
    expect(screen.queryByText("Free Time Activity")).not.toBeInTheDocument();

    expect(screen.getByText("Day 2 Title")).toBeInTheDocument();
    expect(screen.queryByText("Dining Activity")).not.toBeInTheDocument();
    expect(screen.getAllByText("Chưa có hoạt động").length).toBeGreaterThan(0);
  });
});
