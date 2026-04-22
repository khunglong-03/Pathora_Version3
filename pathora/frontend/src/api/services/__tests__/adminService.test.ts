import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { adminService, AdminBooking } from "../adminService";

vi.mock("@/api/axiosInstance", () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe("adminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOverview", () => {
    it("returns overview extracted from result", async () => {
      const mockOverview = {
        totalBookings: 150,
        totalRevenue: 50000000,
        pendingBookings: 12,
        confirmedBookings: 138,
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: mockOverview },
      } as never);

      const result = await adminService.getOverview();

      expect(result).toEqual(mockOverview);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.GET_OVERVIEW);
    });

    it("returns overview extracted from data field", async () => {
      const mockOverview = {
        totalBookings: 150,
        totalRevenue: 50000000,
        pendingBookings: 12,
        confirmedBookings: 138,
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockOverview },
      } as never);

      const result = await adminService.getOverview();

      expect(result).toEqual(mockOverview);
    });
  });

  describe("getDashboard", () => {
    it("returns dashboard data extracted from result", async () => {
      const mockDashboard = {
        revenueByDay: [{ date: "2026-03-01", amount: 5000000 }],
        bookingsByStatus: { Confirmed: 50, Pending: 10, Cancelled: 5 },
        topTours: [{ tourName: "Ha Long Bay", count: 25 }],
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: mockDashboard },
      } as never);

      const result = await adminService.getDashboard();

      expect(result).toEqual(mockDashboard);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.GET_DASHBOARD);
    });
  });

  describe("getTransportProviders", () => {
    it("returns paginated transport provider list", async () => {
      const mockData = {
        items: [
          { id: "tp1", fullName: "Vietransport", email: "info@vietransport.com", status: "Active", bookingCount: 50 },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: mockData },
      } as never);

      const result = await adminService.getTransportProviders({ page: 1, limit: 10 });

      expect(result).toEqual(mockData);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.GET_TRANSPORT_PROVIDERS, {
        params: expect.any(URLSearchParams),
      });
    });

    it("passes status filter", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 } },
      } as never);

      await adminService.getTransportProviders({ status: "Active" });

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.GET_TRANSPORT_PROVIDERS, {
        params: expect.any(URLSearchParams),
      });
      const params = vi.mocked(api.get).mock.calls[0][1]?.params as URLSearchParams;
      expect(params.get("status")).toBe("Active");
    });
  });

  describe("getTransportProviderStats", () => {
    it("returns transport provider stats", async () => {
      const mockStats = { total: 10, active: 8, inactive: 1, pending: 1 };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: mockStats },
      } as never);

      const result = await adminService.getTransportProviderStats("taxi");

      expect(result).toEqual(mockStats);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.GET_TRANSPORT_PROVIDER_STATS, {
        params: { search: "taxi" },
      });
    });
  });

  describe("Admin Transport Vehicle Management", () => {
    const providerId = "prov-1";
    const plate = "51A-12345";

    it("creates vehicle for provider", async () => {
      const mockVehicle = { id: "v1", vehiclePlate: plate };
      const data = { vehiclePlate: plate, vehicleType: 1, seatCapacity: 16 };
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, result: mockVehicle },
      } as never);

      const result = await adminService.createAdminTransportVehicle(providerId, data as any);

      expect(result).toEqual(mockVehicle);
      expect(api.post).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.CREATE_TRANSPORT_PROVIDER_VEHICLE(providerId),
        data
      );
    });

    it("updates vehicle for provider", async () => {
      const mockVehicle = { id: "v1", vehiclePlate: plate };
      const data = { vehicleType: 2 };
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, result: mockVehicle },
      } as never);

      const result = await adminService.updateAdminTransportVehicle(providerId, plate, data as any);

      expect(result).toEqual(mockVehicle);
      expect(api.put).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.UPDATE_TRANSPORT_PROVIDER_VEHICLE(providerId, plate),
        data
      );
    });

    it("deletes vehicle for provider", async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: true, result: null },
      } as never);

      const result = await adminService.deleteAdminTransportVehicle(providerId, plate);

      expect(result).toBeNull();
      expect(api.delete).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.DELETE_TRANSPORT_PROVIDER_VEHICLE(providerId, plate)
      );
    });
  });

  describe("getDriverActivities", () => {
    it("fetches and returns driver activities", async () => {
      const providerId = "provider-1";
      const driverId = "driver-1";
      const mockActivities = {
        items: [{ id: "act-1", activityTitle: "Test Activity" }],
        total: 1,
        page: 1,
        limit: 50,
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: mockActivities },
      } as never);

      const result = await adminService.getDriverActivities(providerId, driverId, { page: 1, limit: 50 });

      expect(result).toEqual(mockActivities);
      expect(api.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.GET_DRIVER_ACTIVITIES(providerId, driverId),
        expect.objectContaining({
          params: { pageNumber: 1, pageSize: 50 },
        })
      );
    });
  });
});
