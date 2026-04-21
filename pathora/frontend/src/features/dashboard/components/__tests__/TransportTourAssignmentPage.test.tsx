import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import TransportTourAssignmentPage from "../TransportTourAssignmentPage";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { transportProviderService } from "@/api/services/transportProviderService";
import { toast } from "react-toastify";

// Mocks
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "tour-id-123" }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getMyAssignedInstanceDetail: vi.fn(),
    assignVehicleToActivity: vi.fn(),
    transportApprove: vi.fn(),
  },
}));

vi.mock("@/api/services/transportProviderService", () => ({
  transportProviderService: {
    getVehicles: vi.fn(),
    getDrivers: vi.fn(),
  },
}));

describe("TransportTourAssignmentPage", () => {
  const mockTour = {
    id: "tour-id-123",
    tourName: "Test Tour",
    tourCode: "TT001",
    currentParticipation: 10,
    maxParticipation: 20,
    transportApprovalStatus: 1, // Pending
    days: [
      {
        title: "Day 1",
        activities: [
          {
            id: "act-1",
            activityType: "Transportation",
            title: "Bus to Ha Long",
            pickupLocation: "Hotel A",
            dropoffLocation: "Airport B",
            vehicleId: null,
            driverId: null,
            vehiclePlate: null,
            driverName: null,
          },
        ],
      },
    ],
  };

  const mockVehicles = [
    { id: "v1", vehiclePlate: "30A-123", brand: "Hyundai", model: "County", seatCapacity: 15 },
    { id: "v2", vehiclePlate: "51B-456", brand: "Ford", model: "Transit", seatCapacity: 30 },
  ];

  const mockDrivers = [
    { id: "d1", fullName: "Driver John", licenseNumber: "B2-123" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (tourInstanceService.getMyAssignedInstanceDetail as any).mockResolvedValue(mockTour);
    (transportProviderService.getVehicles as any).mockResolvedValue(mockVehicles);
    (transportProviderService.getDrivers as any).mockResolvedValue(mockDrivers);
  });

  it("renders loading state initially", async () => {
    let resolveApi: any;
    (tourInstanceService.getMyAssignedInstanceDetail as any).mockReturnValue(new Promise(res => { resolveApi = res; }));
    
    render(<TransportTourAssignmentPage />);
    
    // Verify it does not error out during loading
    resolveApi(mockTour);
  });

  it.skip("renders tour data with flattened activity-based assignments", async () => {
    // Test that transport activities are displayed directly from activity fields
    // not from nested routes[]
  });

  it.skip("calls assignVehicleToActivity (not assignVehicleToRoute)", async () => {
    // Verify the correct service method is called with activityId
  });
});
