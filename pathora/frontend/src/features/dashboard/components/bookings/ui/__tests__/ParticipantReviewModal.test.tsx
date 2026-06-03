import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ParticipantReviewModal from "../ParticipantReviewModal";
import { bookingService } from "@/api/services/bookingService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

// Mock i18next translation function
const mockT = vi.fn((key: string) => key);
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// Mock react-toastify
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Redux useSelector
vi.mock("react-redux", () => ({
  useSelector: vi.fn(),
  useDispatch: vi.fn(),
}));

// Mock bookingService
vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getParticipants: vi.fn(),
    reviewParticipantInfo: vi.fn(),
    bulkApproveParticipantInfo: vi.fn(),
  },
}));

describe("ParticipantReviewModal", () => {
  const bookingId = "b1-test";
  const mockClose = vi.fn();
  const mockReviewed = vi.fn();

  const sampleParticipants = [
    {
      participantId: "p1",
      bookingId: bookingId,
      fullName: "Passenger Approved",
      participantType: "Adult",
      dateOfBirth: "1990-01-01T00:00:00Z",
      gender: "Male",
      nationality: "VNM",
      status: "Confirmed",
      passport: {
        passportNumber: "A123",
        nationality: "VNM",
        issuedAt: null,
        expiresAt: null,
        fileUrl: "http://example.com/scan1.jpg",
      },
      visaApplications: [],
      infoReviewStatus: "Approved",
      infoRejectionReason: null,
      infoReviewedAt: "2026-06-01T12:00:00Z",
      infoReviewedBy: "u1",
      infoReviewedByName: "Reviewer A",
    },
    {
      participantId: "p2",
      bookingId: bookingId,
      fullName: "Passenger Pending",
      participantType: "Adult",
      dateOfBirth: "1995-02-02T00:00:00Z",
      gender: "Female",
      nationality: "VNM",
      status: "Confirmed",
      passport: null,
      visaApplications: [],
      infoReviewStatus: "NotReviewed",
      infoRejectionReason: null,
      infoReviewedAt: null,
      infoReviewedBy: null,
      infoReviewedByName: null,
    },
    {
      participantId: "p3",
      bookingId: bookingId,
      fullName: "Passenger Rejected",
      participantType: "Adult",
      dateOfBirth: "1985-03-03T00:00:00Z",
      gender: "Male",
      nationality: "VNM",
      status: "Confirmed",
      passport: null,
      visaApplications: [],
      infoReviewStatus: "Rejected",
      infoRejectionReason: "Photo blurry",
      infoReviewedAt: "2026-06-02T12:00:00Z",
      infoReviewedBy: "u1",
      infoReviewedByName: "Reviewer A",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default selector return is TourOperator role
    vi.mocked(useSelector).mockImplementation((selectorFn: any) =>
      selectorFn({
        auth: {
          user: {
            roles: [{ name: "TourOperator" }],
          },
        },
      })
    );

    // Default getParticipants response
    vi.mocked(bookingService.getParticipants).mockResolvedValue(sampleParticipants as any);
  });

  it("renders loader skeleton when loading", () => {
    vi.mocked(bookingService.getParticipants).mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <ParticipantReviewModal
        bookingId={bookingId}
        isOpen={true}
        onClose={mockClose}
        onReviewed={mockReviewed}
      />
    );

    expect(screen.queryByText("Passenger Pending")).not.toBeInTheDocument();
  });

  it("renders sorting order: Rejected -> NotReviewed -> Approved", async () => {
    render(
      <ParticipantReviewModal
        bookingId={bookingId}
        isOpen={true}
        onClose={mockClose}
        onReviewed={mockReviewed}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Passenger Pending")).toBeInTheDocument();
    });

    const headings = screen.getAllByText(/Passenger/);
    expect(headings[0]).toHaveTextContent("Passenger Rejected");
    expect(headings[1]).toHaveTextContent("Passenger Pending");
    expect(headings[2]).toHaveTextContent("Passenger Approved");
  });

  it("calls approve endpoint when approve button is clicked", async () => {
    vi.mocked(bookingService.reviewParticipantInfo).mockResolvedValue({} as any);

    render(
      <ParticipantReviewModal
        bookingId={bookingId}
        isOpen={true}
        onClose={mockClose}
        onReviewed={mockReviewed}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Passenger Pending")).toBeInTheDocument();
    });

    const approveBtns = screen.getAllByRole("button", { name: "participantReview.modal.approve" });
    // p2 and p3 both show approve/reject buttons since they are not approved
    expect(approveBtns.length).toBe(2);

    fireEvent.click(approveBtns[0]);

    await waitFor(() => {
      expect(bookingService.reviewParticipantInfo).toHaveBeenCalledWith(bookingId, "p3", {
        isApproved: true,
        rejectionReason: null,
      });
      expect(toast.success).toHaveBeenCalledWith("participantReview.toast.success.approved");
      expect(mockReviewed).toHaveBeenCalled();
    });
  });

  it("requires rejection reason when rejecting", async () => {
    vi.mocked(bookingService.reviewParticipantInfo).mockResolvedValue({} as any);

    render(
      <ParticipantReviewModal
        bookingId={bookingId}
        isOpen={true}
        onClose={mockClose}
        onReviewed={mockReviewed}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Passenger Pending")).toBeInTheDocument();
    });

    const rejectBtn = screen.getAllByRole("button", { name: "participantReview.modal.reject" })[0];
    fireEvent.click(rejectBtn);

    // Rejection reason form should expand
    const submitBtn = screen.getByRole("button", { name: "participantReview.modal.submitReject" });
    
    // Clicking submit with empty reason should show error toast
    fireEvent.click(submitBtn);
    expect(toast.error).toHaveBeenCalledWith("participantReview.modal.reasonRequired");
    expect(bookingService.reviewParticipantInfo).not.toHaveBeenCalled();

    // Type a reason and submit
    const textarea = screen.getByPlaceholderText("participantReview.modal.reasonPlaceholder");
    fireEvent.change(textarea, { target: { value: "Blurry passport image" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(bookingService.reviewParticipantInfo).toHaveBeenCalledWith(bookingId, "p3", {
        isApproved: false,
        rejectionReason: "Blurry passport image",
      });
      expect(toast.success).toHaveBeenCalledWith("participantReview.toast.success.rejected");
    });
  });

  it("handles 409 conflict and refetches list", async () => {
    const errorResponse = {
      response: {
        status: 409,
      },
    };
    vi.mocked(bookingService.reviewParticipantInfo).mockRejectedValue(errorResponse);

    render(
      <ParticipantReviewModal
        bookingId={bookingId}
        isOpen={true}
        onClose={mockClose}
        onReviewed={mockReviewed}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Passenger Pending")).toBeInTheDocument();
    });

    const approveBtn = screen.getAllByRole("button", { name: "participantReview.modal.approve" })[0];
    
    // Reset call counts on getParticipants
    vi.mocked(bookingService.getParticipants).mockClear();
    
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("participantReview.toast.error.conflict");
      expect(bookingService.getParticipants).toHaveBeenCalledTimes(1); // Auto-refetches
    });
  });

  it("renders empty state correctly", async () => {
    vi.mocked(bookingService.getParticipants).mockResolvedValue([]);

    render(
      <ParticipantReviewModal
        bookingId={bookingId}
        isOpen={true}
        onClose={mockClose}
        onReviewed={mockReviewed}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("participantReview.state.empty")).toBeInTheDocument();
    });
  });

  it("hides action buttons if user is not TourOperator", async () => {
    // Mock user role as Guest/Customer
    vi.mocked(useSelector).mockImplementation((selectorFn: any) =>
      selectorFn({
        auth: {
          user: {
            roles: [{ name: "Customer" }],
          },
        },
      })
    );

    render(
      <ParticipantReviewModal
        bookingId={bookingId}
        isOpen={true}
        onClose={mockClose}
        onReviewed={mockReviewed}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Passenger Pending")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "participantReview.modal.approve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "participantReview.modal.reject" })).not.toBeInTheDocument();
  });
});
