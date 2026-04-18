import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import HotelTourAssignmentPage from "../HotelTourAssignmentPage";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { hotelProviderService } from "@/api/services/hotelProviderService";

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

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getMyAssignedInstanceDetail: vi.fn(),
    assignRoomToAccommodation: vi.fn(),
    hotelApprove: vi.fn(),
  },
}));

vi.mock("@/api/services/hotelProviderService", () => ({
  hotelProviderService: {
    getAccommodations: vi.fn(),
    getRoomAvailability: vi.fn(),
  },
}));

describe("HotelTourAssignmentPage", () => {
  const mockTour = {
    id: "tour-id-123",
    title: "Test Hotel Tour",
    tourInstanceCode: "TI-123",
    tourName: "Test Hotel Tour",
    startDate: "2026-05-01",
    endDate: "2026-05-02",
    currentParticipation: 4,
    maxParticipation: 10,
    durationDays: 2,
    hotelApprovalStatus: 1, // Pending
    days: [
      {
        title: "Day 1",
        actualDate: "2026-05-01",
        instanceDayNumber: 1,
        activities: [
          {
            id: "activity-1",
            title: "Check-in Hotel",
            activityType: "8", // Accommodation
            accommodation: {
              roomType: "DELUXE",
              quantity: 2,
              roomBlocksTotal: 0,
            },
          },
        ],
      },
      {
        title: "Day 2",
        actualDate: "2026-05-02",
        instanceDayNumber: 2,
        activities: [
          {
            id: "activity-2",
            title: "Check-out Hotel",
            activityType: "8", // Accommodation
            accommodation: {
              roomType: "STANDARD",
              quantity: 3,
              roomBlocksTotal: 3,
            },
          },
        ],
      },
    ],
  };

  const mockInventory = [
    { id: "room-1", name: "Deluxe Room", roomType: "DELUXE", totalRooms: 10 },
    { id: "room-2", name: "Standard Room", roomType: "STANDARD", totalRooms: 10 },
    { id: "room-3", name: "Suite Room", roomType: "SUITE", totalRooms: 4 },
    { id: "room-4", name: "Villa Room", roomType: "VILLA", totalRooms: 2 },
  ];

  const mockAvailability = [
    { date: "2026-05-01", roomType: "DELUXE", availableRooms: 5, totalRooms: 10 },
    { date: "2026-05-01", roomType: "STANDARD", availableRooms: 0, totalRooms: 10 }, // Out of bounds
    { date: "2026-05-02", roomType: "STANDARD", availableRooms: 1, totalRooms: 10 }, // Low availability
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (tourInstanceService.getMyAssignedInstanceDetail as any).mockImplementation((id: string) => {
      console.log("TEST LOG: getMyAssignedInstanceDetail called with", id);
      return Promise.resolve(mockTour);
    });
    (hotelProviderService.getAccommodations as any).mockResolvedValue(mockInventory);
    (hotelProviderService.getRoomAvailability as any).mockResolvedValue(mockAvailability);
  });

  it("renders inventory summary table populated correctly", async () => {
    render(<HotelTourAssignmentPage />);

    await waitFor(() => {
      expect(screen.getByText("inventory_summary")).toBeInTheDocument();
    });

    // Check headers
    expect(screen.getByText("Total")).toBeInTheDocument();

    // Check values for Deluxe Room
    expect(screen.getAllByText("DELUXE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("STANDARD").length).toBeGreaterThan(0);
  });

  it("displays progress bar correctly", async () => {
    render(<HotelTourAssignmentPage />);

    await waitFor(() => {
      // 1 out of 2 is assigned
      expect(screen.getByText(/1.*\/.*2.*assigned/i)).toBeInTheDocument();
    });
  });

  it("reloads availability and updates progress after a successful save", async () => {
    (tourInstanceService.assignRoomToAccommodation as any).mockResolvedValue({ success: true });
    
    // Initial fetch + 1 reload
    let getRoomAvailabilityMock = (hotelProviderService.getRoomAvailability as any);
    
    render(<HotelTourAssignmentPage />);

    await waitFor(() => {
      expect(screen.getByText(/1.*\/.*2.*assigned/i)).toBeInTheDocument();
    });

    // Save deluxe room activity (first save button)
    (tourInstanceService.assignRoomToAccommodation as any).mockImplementation(() => Promise.resolve({ success: true }));
    const saveButtons = screen.getAllByText(/Update/);
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(tourInstanceService.assignRoomToAccommodation).toHaveBeenCalledWith(mockTour.id, "activity-1", expect.any(Object));
    });

    await waitFor(() => {
      expect(getRoomAvailabilityMock).toHaveBeenCalledTimes(2); // Inital + after save
    });
  });

  it("shows availability badges with correct colors and text based on inventory", async () => {
    render(<HotelTourAssignmentPage />);

    await waitFor(() => {
      // Deluxe day 1, available = 5, required = 2. It should be green (Còn 5 phòng)
      expect(screen.getByText(/Còn 5\/10 phòng/)).toBeInTheDocument();

      // Standard day 2, available = 1, required = 3. It should be orange/low (Còn 1 phòng)
      expect(screen.getByText(/⚠️ Chỉ còn 1\/10/)).toBeInTheDocument();
    });
  });

  it("renders provider-backed room types outside the old frontend map", async () => {
    render(<HotelTourAssignmentPage />);

    await waitFor(() => {
      expect(screen.getAllByText("VILLA").length).toBeGreaterThan(0);
    });
  });
});
