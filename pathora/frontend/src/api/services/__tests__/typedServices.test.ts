import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { catalogService } from "../catalogService";
import { discountService } from "../discountService";
import { inventoryService } from "../inventoryService";
import { notificationService } from "../notificationService";
import { orderService } from "../orderService";
import { reportService } from "../reportService";

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

describe("typed services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("catalogService returns typed ApiResponse data", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, data: [{ id: "p-1" }] },
    } as never);

    const result = await catalogService.getProducts<Array<{ id: string }>>();

    expect(result).toEqual({
      success: true,
      data: [{ id: "p-1" }],
    });
  });

  it("orderService returns typed ApiResponse data", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { result: [{ id: "o-1" }] },
    } as never);

    const result = await orderService.getOrders<Array<{ id: string }>>();

    expect(result).toEqual({
      success: true,
      data: [{ id: "o-1" }],
    });
  });

  it("remaining services return typed ApiResponse data", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [{ id: "item-1" }],
    } as never);

    const inventoryResult =
      await inventoryService.getInventoryItems<Array<{ id: string }>>();
    const discountResult =
      await discountService.getCoupons<Array<{ id: string }>>();
    const notificationResult =
      await notificationService.getNotifications<Array<{ id: string }>>();
    const reportResult =
      await reportService.getDashboardStatistics<Array<{ id: string }>>();

    expect(inventoryResult.success).toBe(true);
    expect(discountResult.success).toBe(true);
    expect(notificationResult.success).toBe(true);
    expect(reportResult.success).toBe(true);
  });

  it("services normalize thrown API errors", async () => {
    vi.mocked(api.get).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 500,
        data: {
          errors: [
            {
              code: "SERVER_ERROR",
              errorMessage: "SERVER_ERROR",
              details: "boom",
            },
          ],
        },
      },
    });

    const result = await catalogService.getProducts<Array<{ id: string }>>();

    expect(result).toEqual({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "SERVER_ERROR",
        details: "boom",
      },
    });
  });
});
