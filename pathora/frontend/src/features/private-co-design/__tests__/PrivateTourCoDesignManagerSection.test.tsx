import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrivateTourCoDesignManagerSection } from "../PrivateTourCoDesignManagerSection";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import type { TourInstanceDayDto } from "@/types/tour";

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, optionsOrDefault: any) => 
      typeof optionsOrDefault === "string" ? optionsOrDefault : key,
  }),
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@phosphor-icons/react", () => ({
  ChatCircleText: () => <div data-testid="icon-chat" />,
  MapTrifold: () => <div data-testid="icon-map" />,
  PaperPlaneRight: () => <div data-testid="icon-paper" />,
  Check: () => <div data-testid="icon-check" />,
  X: () => <div data-testid="icon-x" />,
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    listItineraryFeedback: vi.fn(),
    forwardItineraryFeedbackToOperator: vi.fn(),
    managerApproveItineraryFeedback: vi.fn(),
    managerRejectItineraryFeedback: vi.fn(),
  },
}));

describe("PrivateTourCoDesignManagerSection", () => {
  const mockDays = [
    { 
      id: "day-1", 
      instanceDayNumber: 1, 
      title: "Day 1 Title", 
      description: "Day 1 Desc", 
      activityIds: [],
      actualDate: new Date().toISOString(),
      startTime: "08:00",
      endTime: "18:00",
      note: "",
      activities: []
    } as unknown as TourInstanceDayDto,
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders empty state when no days provided", () => {
    render(<PrivateTourCoDesignManagerSection tourInstanceId="inst-1" days={[]} />);
    expect(screen.getByText("No days assigned to this tour.")).toBeInTheDocument();
  });

  it.skip("loads and displays feedback for the active day", async () => {
    const mockFeedback = [
      {
        id: "fb-1",
        tourInstanceDayId: "day-1",
        content: "Test feedback from customer",
        isFromCustomer: true,
        status: "Pending",
        rowVersion: "rev1",
        createdOnUtc: new Date().toISOString(),
      },
    ];

    const spy = vi.spyOn(tourInstanceService, "listItineraryFeedback").mockResolvedValue(mockFeedback as any);

    render(<PrivateTourCoDesignManagerSection tourInstanceId="inst-1" days={mockDays} />);

    // Wait for feedback to load
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("inst-1", "day-1");
    });

    expect(screen.getByText("Test feedback from customer")).toBeInTheDocument();
    expect(screen.getByText("Forward to Operator")).toBeInTheDocument();
  });

  it.skip("calls forward to operator when forward button is clicked", async () => {
    const mockFeedback = [
      {
        id: "fb-1",
        tourInstanceDayId: "day-1",
        content: "Test feedback",
        isFromCustomer: true,
        status: "Pending",
        rowVersion: "rev1",
        createdOnUtc: new Date().toISOString(),
      },
    ];

    vi.spyOn(tourInstanceService, "listItineraryFeedback").mockResolvedValue(mockFeedback as any);
    const forwardSpy = vi.spyOn(tourInstanceService, "forwardItineraryFeedbackToOperator").mockResolvedValue(undefined as any);

    render(<PrivateTourCoDesignManagerSection tourInstanceId="inst-1" days={mockDays} />);

    await waitFor(() => {
      expect(screen.getByText("Forward to Operator")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Forward to Operator"));

    await waitFor(() => {
      expect(forwardSpy).toHaveBeenCalledWith(
        "inst-1",
        "day-1",
        "fb-1",
        "rev1"
      );
    });
  });

  it.skip("displays approve/reject buttons when status is OperatorResponded", async () => {
    const mockFeedback = [
      {
        id: "fb-2",
        tourInstanceDayId: "day-1",
        content: "Operator reply",
        isFromCustomer: false,
        status: "OperatorResponded",
        rowVersion: "rev2",
        createdOnUtc: new Date().toISOString(),
      },
    ];

    vi.spyOn(tourInstanceService, "listItineraryFeedback").mockResolvedValue(mockFeedback as any);

    render(<PrivateTourCoDesignManagerSection tourInstanceId="inst-1" days={mockDays} />);

    await waitFor(() => {
      expect(screen.getByText("Approve")).toBeInTheDocument();
      expect(screen.getByText("Reject")).toBeInTheDocument();
    });

    // Test Approve
    const approveSpy = vi.spyOn(tourInstanceService, "managerApproveItineraryFeedback").mockResolvedValue(undefined as any);
    fireEvent.click(screen.getByText("Approve"));

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith(
        "inst-1",
        "day-1",
        "fb-2",
        "rev2"
      );
    });

    // Test Reject
    const rejectSpy = vi.spyOn(tourInstanceService, "managerRejectItineraryFeedback").mockResolvedValue(undefined as any);
    const rejectInput = screen.getByPlaceholderText("Reason for rejection (optional)");
    fireEvent.change(rejectInput, { target: { value: "Needs more details" } });
    fireEvent.click(screen.getByText("Reject"));

    await waitFor(() => {
      expect(rejectSpy).toHaveBeenCalledWith(
        "inst-1",
        "day-1",
        "fb-2",
        "Needs more details",
        "rev2"
      );
    });
  });
});
