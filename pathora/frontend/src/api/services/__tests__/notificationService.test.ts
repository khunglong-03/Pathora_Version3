import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { notificationService } from "../notificationService";

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

describe("notificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("returns success with notifications on 200", async () => {
      const mockNotifications = [
        { id: "n-1", title: "New Booking", message: "You have a new booking", read: false },
        { id: "n-2", title: "Payment Received", message: "Payment confirmed", read: true },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockNotifications },
      } as never);

      const result = await notificationService.getNotifications<typeof mockNotifications>();

      expect(result).toEqual({ success: true, data: mockNotifications });
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.NOTIFICATION.GET_LIST);
    });

    it("returns success with empty array when no notifications", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: [] },
      } as never);

      const result = await notificationService.getNotifications();

      expect(result).toEqual({ success: true, data: [] });
    });

    it("returns error on API failure", async () => {
      vi.mocked(api.get).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            errors: [{ code: "SERVER_ERROR", errorMessage: "SERVER_ERROR", details: "boom" }],
          },
        },
      } as never);

      const result = await notificationService.getNotifications();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getUnreadCount", () => {
    it("returns success with unread count on 200", async () => {
      const mockCount = { count: 5 };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockCount },
      } as never);

      const result = await notificationService.getUnreadCount<typeof mockCount>();

      expect(result).toEqual({ success: true, data: mockCount });
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.NOTIFICATION.GET_COUNT_UNREAD);
    });

    it("returns error on API failure", async () => {
      vi.mocked(api.get).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            errors: [{ code: "SERVER_ERROR", errorMessage: "SERVER_ERROR", details: "boom" }],
          },
        },
      } as never);

      const result = await notificationService.getUnreadCount();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("markAsRead", () => {
    it("returns success on 200", async () => {
      const payload = { notificationIds: ["n-1", "n-2"] };
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await notificationService.markAsRead<null>(payload);

      expect(result.success).toBe(true);
      expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.NOTIFICATION.MARK_AS_READ, payload);
    });

    it("returns error on API failure", async () => {
      const payload = { notificationIds: ["n-1"] };
      vi.mocked(api.post).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [{ code: "BAD_REQUEST", errorMessage: "BAD_REQUEST", details: "invalid ids" }],
          },
        },
      } as never);

      const result = await notificationService.markAsRead(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
