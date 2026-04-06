import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { siteContentAdminService } from "../siteContentAdminService";

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

describe("siteContentAdminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getList", () => {
    it("returns success with list items on 200", async () => {
      const mockItems = [
        { id: "sc-1", key: "home_hero_title", content: "Welcome to Pathora" },
        { id: "sc-2", key: "about_intro", content: "About us content" },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { items: mockItems },
      } as never);

      const result = await siteContentAdminService.getList();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockItems);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.SITE_CONTENT.ADMIN_LIST(undefined, undefined));
    });

    it("passes pageKey and search params to the endpoint", async () => {
      const mockItems = [{ id: "sc-1", key: "home_hero_title", content: "Welcome" }];
      vi.mocked(api.get).mockResolvedValue({
        data: { items: mockItems },
      } as never);

      const result = await siteContentAdminService.getList("page-2", "hero");

      expect(result.success).toBe(true);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.SITE_CONTENT.ADMIN_LIST("page-2", "hero"));
    });

    it("returns success with empty array when items is missing", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {},
      } as never);

      const result = await siteContentAdminService.getList();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it("returns success with empty array when items is not an array", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { items: "not an array" },
      } as never);

      const result = await siteContentAdminService.getList();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
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

      const result = await siteContentAdminService.getList();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getById", () => {
    it("returns success with detail item on 200", async () => {
      const mockDetail = { id: "sc-1", key: "home_hero_title", content: "Welcome to Pathora", metadata: {} };
      vi.mocked(api.get).mockResolvedValue({
        data: mockDetail,
      } as never);

      const result = await siteContentAdminService.getById("sc-1");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDetail);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.SITE_CONTENT.ADMIN_DETAIL("sc-1"));
    });

    it("returns success with null when payload is null", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: null,
      } as never);

      const result = await siteContentAdminService.getById("sc-1");

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it("returns error on API failure", async () => {
      vi.mocked(api.get).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "content not found" }],
          },
        },
      } as never);

      const result = await siteContentAdminService.getById("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateById", () => {
    it("returns success with response data on 200", async () => {
      const payload = { key: "home_hero_title", content: "Updated Content" };
      const mockResponse = { success: true, data: { id: "sc-1", updated: true } };
      vi.mocked(api.put).mockResolvedValue({
        data: mockResponse,
      } as never);

      const result = await siteContentAdminService.updateById("sc-1", payload);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(api.put).toHaveBeenCalledWith(API_ENDPOINTS.SITE_CONTENT.ADMIN_UPSERT("sc-1"), payload);
    });

    it("returns error on validation failure", async () => {
      const payload = { key: "", content: "" };
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [{ code: "VALIDATION_ERROR", errorMessage: "VALIDATION_ERROR", details: "invalid payload" }],
          },
        },
      } as never);

      const result = await siteContentAdminService.updateById("sc-1", payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("returns error on 404", async () => {
      const payload = { key: "home_hero_title", content: "Updated Content" };
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "content not found" }],
          },
        },
      } as never);

      const result = await siteContentAdminService.updateById("invalid-id", payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
