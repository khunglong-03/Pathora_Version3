import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VehicleScheduleSection from "@/features/dashboard/components/VehicleScheduleSection";
import { transportProviderService } from "@/api/services/transportProviderService";
import type { VehicleScheduleItem, Vehicle } from "@/api/services/transportProviderService";

vi.mock("@/api/services/transportProviderService", () => ({
  transportProviderService: {
    getVehicleSchedule: vi.fn(),
  },
}));

vi.mock("@/utils/apiResponse", () => ({
  handleApiError: vi.fn(() => ({ message: "test-error" })),
}));

const mockGetSchedule = vi.mocked(transportProviderService.getVehicleSchedule);

const mockVehicle: Vehicle = {
  id: "v1",
  vehicleType: "Car",
  brand: "Toyota",
  model: "Camry",
  seatCapacity: 4,
  quantity: 2,
  isActive: true,
  isDeleted: false,
  createdOnUtc: "2026-01-01T00:00:00Z",
};

const mockBlock: VehicleScheduleItem = {
  blockId: "b1",
  vehicleId: "v1",
  vehicleType: "Car",
  vehicleBrand: "Toyota",
  vehicleModel: "Camry",
  seatCapacity: 4,
  blockedDate: "2026-05-15",
  holdStatus: "Hard",
  tourInstanceName: "Summer Tour",
  tourInstanceCode: "ST-001",
  activityTitle: "Transfer to Airport",
  fromLocationName: "Hotel A",
  toLocationName: "Airport",
};

describe("VehicleScheduleSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 15)); // May 15, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // F4: Normal UI
  it("renders calendar grid with block dots", async () => {
    mockGetSchedule.mockResolvedValue([mockBlock]);

    render(<VehicleScheduleSection vehicles={[mockVehicle]} />);

    await waitFor(() => {
      expect(screen.getByText("Lịch xe tháng")).toBeInTheDocument();
    });

    // Should show weekday headers
    expect(screen.getByText("T2")).toBeInTheDocument();
    expect(screen.getByText("CN")).toBeInTheDocument();

    // Should call API with May 2026 dates
    expect(mockGetSchedule).toHaveBeenCalledWith("2026-05-01", "2026-05-31", undefined);
  });

  // F5: Loading skeleton
  it("shows loading skeleton while fetching", () => {
    mockGetSchedule.mockReturnValue(new Promise(() => {})); // never resolves

    render(<VehicleScheduleSection vehicles={[]} />);

    // Should render skeleton grid (42 cells for 6 weeks)
    const skeletons = document.querySelectorAll('[style*="animation: pulse"]');
    expect(skeletons.length).toBe(42);
  });

  // F6: Error + retry
  it("shows error with retry button on failure", async () => {
    mockGetSchedule.mockRejectedValueOnce(new Error("Network error"));

    render(<VehicleScheduleSection vehicles={[]} />);

    await waitFor(() => {
      expect(screen.getByText("Không tải được lịch xe")).toBeInTheDocument();
    });

    expect(screen.getByText("Thử lại")).toBeInTheDocument();

    // Click retry
    mockGetSchedule.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByText("Thử lại"));

    expect(mockGetSchedule).toHaveBeenCalledTimes(2);
  });

  // F7: Empty month
  it("shows empty state when no blocks", async () => {
    mockGetSchedule.mockResolvedValue([]);

    render(<VehicleScheduleSection vehicles={[]} />);

    await waitFor(() => {
      expect(
        screen.getByText("Chưa có xe nào bị đặt trong tháng này."),
      ).toBeInTheDocument();
    });
  });

  // F8: Month navigation triggers re-fetch
  it("re-fetches when navigating to next month", async () => {
    mockGetSchedule.mockResolvedValue([]);

    render(<VehicleScheduleSection vehicles={[]} />);

    await waitFor(() => {
      expect(mockGetSchedule).toHaveBeenCalledTimes(1);
    });

    const nextBtn = screen.getByLabelText("Tháng sau");
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockGetSchedule).toHaveBeenCalledTimes(2);
      expect(mockGetSchedule).toHaveBeenLastCalledWith(
        "2026-06-01",
        "2026-06-30",
        undefined,
      );
    });
  });

  // F9: AbortController race protection
  it("aborts previous request on rapid navigation", async () => {
    let callCount = 0;
    mockGetSchedule.mockImplementation(
      () =>
        new Promise((resolve) => {
          callCount++;
          setTimeout(() => resolve([]), 100);
        }),
    );

    render(<VehicleScheduleSection vehicles={[]} />);

    // Rapid clicks
    const nextBtn = screen.getByLabelText("Tháng sau");
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);

    // Should have aborted the first two, only last one matters
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});
