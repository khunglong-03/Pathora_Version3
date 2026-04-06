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

    it("returns null when response has no result or data", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {},
      } as never);

      const result = await adminService.getOverview();

      expect(result).toBeNull();
    });

    it("returns null when response is null", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: null,
      } as never);

      const result = await adminService.getOverview();

      expect(result).toBeNull();
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

    it("returns dashboard data extracted from data field", async () => {
      const mockDashboard = {
        revenueByDay: [],
        bookingsByStatus: {},
        topTours: [],
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockDashboard },
      } as never);

      const result = await adminService.getDashboard();

      expect(result).toEqual(mockDashboard);
    });

    it("returns null when response has no result or data", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: false },
      } as never);

      const result = await adminService.getDashboard();

      expect(result).toBeNull();
    });
  });

  describe("getBookings", () => {
    it("returns bookings extracted from items.items", async () => {
      const mockBookings: AdminBooking[] = [
        { id: "bk-1", customerName: "John Doe", tourName: "Ha Long Bay", departureDate: "2026-04-01", amount: 1500000, status: "Confirmed" },
        { id: "bk-2", customerName: "Jane Doe", tourName: "Sapa Adventure", departureDate: "2026-04-10", amount: 2000000, status: "Pending" },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { items: mockBookings },
      } as never);

      const result = await adminService.getBookings();

      expect(result).toEqual(mockBookings);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.BOOKING.GET_LIST);
    });

    it("returns bookings using customer and tour fields", async () => {
      const mockBookings: AdminBooking[] = [
        { id: "bk-3", customer: "Alice", tour: "Mekong Delta", departure: "2026-05-01", amount: 1200000, status: "Confirmed" },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { items: mockBookings },
      } as never);

      const result = await adminService.getBookings();

      expect(result).toEqual(mockBookings);
    });

    it("returns empty array when items is missing", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {},
      } as never);

      const result = await adminService.getBookings();

      expect(result).toEqual([]);
    });

    it("returns empty array when items is not an array", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { items: "not an array" },
      } as never);

      const result = await adminService.getBookings();

      expect(result).toEqual([]);
    });

    it("returns empty array when items is null", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { items: null },
      } as never);

      const result = await adminService.getBookings();

      expect(result).toEqual([]);
    });
  });

  // ─── Admin methods ──────────────────────────────────────────────────

  describe("getAllUsers", () => {
    it("returns paginated user list with default pagination", async () => {
      const mockData = {
        items: [
          { id: "1", fullName: "Nguyen Van A", email: "a@test.com", role: "Admin", status: "Active" },
          { id: "2", fullName: "Tran Thi B", email: "b@test.com", role: "Manager", status: "Active" },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: mockData },
      } as never);

      const result = await adminService.getAllUsers({});

      expect(result).toEqual(mockData);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.GET_ALL_USERS, {
        params: { page: 1, limit: 10 },
      });
    });

    it("passes role, status, and search filters", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: { items: [], total: 0, page: 2, limit: 20, totalPages: 0 } },
      } as never);

      await adminService.getAllUsers({ page: 2, limit: 20, role: "Admin", status: "Active", search: "john" });

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.GET_ALL_USERS, {
        params: { page: 2, limit: 20, role: "Admin", status: "Active", search: "john" },
      });
    });

    it("returns null on error response", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: false },
      } as never);

      const result = await adminService.getAllUsers({});

      expect(result).toBeNull();
    });
  });

  describe("getUserDetail", () => {
    it("returns user detail for given id", async () => {
      const mockDetail = {
        id: "1",
        fullName: "Nguyen Van A",
        email: "a@test.com",
        phone: "0909123456",
        status: "Active",
        roles: ["Admin"],
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: mockDetail },
      } as never);

      const result = await adminService.getUserDetail("1");

      expect(result).toEqual(mockDetail);
      expect(api.get).toHaveBeenCalledWith("/api/admin/users/1");
    });

    it("returns null when user not found", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: false },
      } as never);

      const result = await adminService.getUserDetail("999");

      expect(result).toBeNull();
    });
  });

  describe("getTransportProviders", () => {
    it("returns paginated transport provider list", async () => {
      const mockData = {
        items: [
          { id: "tp1", name: "Vietransport", email: "info@vietransport.com", status: "Active", bookingCount: 50 },
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
        params: { page: 1, limit: 10 },
      });
    });

    it("passes status filter", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 } },
      } as never);

      await adminService.getTransportProviders({ status: "Active" });

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.GET_TRANSPORT_PROVIDERS, {
        params: { page: 1, limit: 10, status: "Active" },
      });
    });
  });

  describe("getHotelProviders", () => {
    it("returns paginated hotel provider list", async () => {
      const mockData = {
        items: [
          { id: "hp1", name: "Grand Hotel", email: "contact@grand.vn", status: "Active", accommodationCount: 3 },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: mockData },
      } as never);

      const result = await adminService.getHotelProviders({ page: 1, limit: 10 });

      expect(result).toEqual(mockData);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.GET_HOTEL_PROVIDERS, {
        params: { page: 1, limit: 10 },
      });
    });
  });

  describe("getTourManagerStaff", () => {
    it("returns staff list for a manager", async () => {
      const mockData = [
        { id: "s1", fullName: "Designer One", email: "d1@test.com", role: "TourDesigner", status: "Active" },
        { id: "s2", fullName: "Guide One", email: "g1@test.com", role: "TourGuide", status: "Active" },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: mockData },
      } as never);

      const result = await adminService.getTourManagerStaff("mgr1");

      expect(result).toEqual(mockData);
      expect(api.get).toHaveBeenCalledWith("/api/admin/tour-managers/mgr1/staff");
    });

    it("returns null on error", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: false },
      } as never);

      const result = await adminService.getTourManagerStaff("bad");

      expect(result).toBeNull();
    });
  });

  describe("reassignStaff", () => {
    it("posts reassign request with targetManagerId", async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, result: { success: true } },
      } as never);

      const result = await adminService.reassignStaff("mgr1", "staff1", "mgr2");

      expect(result).toEqual({ success: true });
      expect(api.post).toHaveBeenCalledWith(
        "/api/admin/tour-managers/mgr1/staff/staff1/reassign",
        { targetManagerId: "mgr2" },
      );
    });

    it("returns null on reassign failure", async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: false },
      } as never);

      const result = await adminService.reassignStaff("mgr1", "bad", "mgr2");

      expect(result).toBeNull();
    });
  });

  describe("getDashboardOverview", () => {
    it("returns dashboard overview with KPIs and activity", async () => {
      const mockData = {
        totalUsers: 150,
        activeUsers: 120,
        totalManagers: 10,
        totalTourDesigners: 25,
        totalTourGuides: 30,
        totalTransportProviders: 8,
        activeTransportProviders: 7,
        transportBookingCount: 200,
        totalHotelProviders: 5,
        activeHotelProviders: 5,
        hotelRoomCount: 250,
        recentActivities: [
          { id: "act1", actor: "Admin", action: "Added new user", timestamp: "2026-04-01T10:00:00Z" },
        ],
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, result: mockData },
      } as never);

      const result = await adminService.getDashboardOverview();

      expect(result).toEqual(mockData);
      expect(api.get).toHaveBeenCalledWith("/api/admin/dashboard/overview");
    });

    it("returns null on error", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: false },
      } as never);

      const result = await adminService.getDashboardOverview();

      expect(result).toBeNull();
    });
  });
});
