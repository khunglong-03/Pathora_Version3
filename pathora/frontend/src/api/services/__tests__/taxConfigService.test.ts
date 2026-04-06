import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { taxConfigService } from "../taxConfigService";

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

describe("taxConfigService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns success with tax configs on 200", async () => {
      const mockConfigs = [
        { id: "tc-1", name: "VAT", rate: 10, isActive: true },
        { id: "tc-2", name: "Service Tax", rate: 5, isActive: false },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockConfigs },
      } as never);

      const result = await taxConfigService.getAll();

      expect(result).toEqual({ success: true, data: mockConfigs });
      expect(api.get).toHaveBeenCalledWith("/api/tax-configs");
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

      const result = await taxConfigService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getById", () => {
    it("returns success with tax config on 200", async () => {
      const mockConfig = { id: "tc-1", name: "VAT", rate: 10, isActive: true };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockConfig },
      } as never);

      const result = await taxConfigService.getById("tc-1");

      expect(result).toEqual({ success: true, data: mockConfig });
      expect(api.get).toHaveBeenCalledWith("/api/tax-configs/tc-1");
    });

    it("returns error on 404", async () => {
      vi.mocked(api.get).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "not found" }],
          },
        },
      } as never);

      const result = await taxConfigService.getById("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("create", () => {
    it("returns success with created config id on 201", async () => {
      const payload = { name: "New Tax", rate: 8, isActive: true };
      const createdId = "tc-new";
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: createdId },
      } as never);

      const result = await taxConfigService.create(payload);

      expect(result).toEqual({ success: true, data: createdId });
      expect(api.post).toHaveBeenCalledWith("/api/tax-configs", payload);
    });

    it("returns error on validation failure", async () => {
      const payload = { name: "", rate: -5, isActive: true };
      vi.mocked(api.post).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [{ code: "VALIDATION_ERROR", errorMessage: "VALIDATION_ERROR", details: "invalid payload" }],
          },
        },
      } as never);

      const result = await taxConfigService.create(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("update", () => {
    it("returns success on 200", async () => {
      const payload = { id: "tc-1", name: "Updated Tax", rate: 12, isActive: true };
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await taxConfigService.update(payload);

      expect(result.success).toBe(true);
      expect(api.put).toHaveBeenCalledWith("/api/tax-configs", payload);
    });

    it("returns error on 404", async () => {
      const payload = { id: "invalid", name: "Updated", rate: 12, isActive: true };
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "tax config not found" }],
          },
        },
      } as never);

      const result = await taxConfigService.update(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("delete", () => {
    it("returns success on 204", async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await taxConfigService.delete("tc-1");

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/api/tax-configs/tc-1");
    });

    it("returns error on 404", async () => {
      vi.mocked(api.delete).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "tax config not found" }],
          },
        },
      } as never);

      const result = await taxConfigService.delete("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
