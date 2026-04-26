import { describe, it, expect, vi, beforeEach } from "vitest";
import { transportProviderService } from "@/api/services/transportProviderService";
import axiosInstance from "@/api/axiosInstance";

vi.mock("@/api/axiosInstance", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("@/utils/apiResponse", () => ({
  extractData: vi.fn((res: any) => res?.data?.data),
  extractItems: vi.fn(),
  extractResult: vi.fn(),
  handleApiError: vi.fn(() => ({ message: "test-error" })),
}));

const mockGet = vi.mocked(axiosInstance.get);

describe("transportProviderService — availability methods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAvailableVehicles", () => {
    it("sends correct query params with date only", async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });

      await transportProviderService.getAvailableVehicles("2026-05-01");

      expect(mockGet).toHaveBeenCalledWith(
        "/transport-provider/vehicles/available",
        { params: { date: "2026-05-01" } },
      );
    });

    it("sends vehicleType as number", async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });

      await transportProviderService.getAvailableVehicles("2026-05-01", 3);

      expect(mockGet).toHaveBeenCalledWith(
        "/transport-provider/vehicles/available",
        { params: { date: "2026-05-01", vehicleType: 3 } },
      );
    });

    it("sends excludeActivityId when provided", async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });

      await transportProviderService.getAvailableVehicles(
        "2026-05-01",
        undefined,
        "act-123",
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/transport-provider/vehicles/available",
        { params: { date: "2026-05-01", excludeActivityId: "act-123" } },
      );
    });

    it("returns AvailableVehicle[] from response data", async () => {
      const mockData = [
        {
          id: "v1",
          vehicleType: "Car",
          brand: "Toyota",
          model: "Camry",
          seatCapacity: 4,
          quantity: 3,
          availableQuantity: 2,
          notes: null,
        },
      ];
      mockGet.mockResolvedValue({ data: { data: mockData } });

      const result = await transportProviderService.getAvailableVehicles("2026-05-01");
      expect(result).toEqual(mockData);
    });
  });

  describe("getVehicleSchedule", () => {
    it("sends correct query params for date range", async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });

      await transportProviderService.getVehicleSchedule("2026-05-01", "2026-05-31");

      expect(mockGet).toHaveBeenCalledWith(
        "/transport-provider/vehicles/schedule",
        { params: { fromDate: "2026-05-01", toDate: "2026-05-31" } },
      );
    });

    it("sends vehicleId when provided", async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });

      await transportProviderService.getVehicleSchedule(
        "2026-05-01",
        "2026-05-31",
        "v-abc",
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/transport-provider/vehicles/schedule",
        {
          params: {
            fromDate: "2026-05-01",
            toDate: "2026-05-31",
            vehicleId: "v-abc",
          },
        },
      );
    });

    it("returns VehicleScheduleItem[] from response data", async () => {
      const mockData = [
        {
          blockId: "b1",
          vehicleId: "v1",
          vehicleType: "Car",
          blockedDate: "2026-05-15",
          holdStatus: "Hard",
          seatCapacity: 4,
        },
      ];
      mockGet.mockResolvedValue({ data: { data: mockData } });

      const result = await transportProviderService.getVehicleSchedule(
        "2026-05-01",
        "2026-05-31",
      );
      expect(result).toEqual(mockData);
    });
  });
});
