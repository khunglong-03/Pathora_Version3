import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { visaPolicyService } from "../visaPolicyService";

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

describe("visaPolicyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns success with visa policies on 200", async () => {
      const mockPolicies = [
        { id: "vp-1", country: "USA", visaType: "Tourist", processingDays: 10 },
        { id: "vp-2", country: "Japan", visaType: "Business", processingDays: 5 },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockPolicies },
      } as never);

      const result = await visaPolicyService.getAll();

      expect(result).toEqual({ success: true, data: mockPolicies });
      expect(api.get).toHaveBeenCalledWith("/api/visa-policy");
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

      const result = await visaPolicyService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getById", () => {
    it("returns success with visa policy on 200", async () => {
      const mockPolicy = { id: "vp-1", country: "USA", visaType: "Tourist", processingDays: 10 };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockPolicy },
      } as never);

      const result = await visaPolicyService.getById("vp-1");

      expect(result).toEqual({ success: true, data: mockPolicy });
      expect(api.get).toHaveBeenCalledWith("/api/visa-policy/vp-1");
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

      const result = await visaPolicyService.getById("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("create", () => {
    it("returns success with created policy id on 201", async () => {
      const payload = { country: "Vietnam", visaType: "E-Visa", processingDays: 3 };
      const createdId = "vp-new";
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: createdId },
      } as never);

      const result = await visaPolicyService.create(payload);

      expect(result).toEqual({ success: true, data: createdId });
      expect(api.post).toHaveBeenCalledWith("/api/visa-policy", payload);
    });

    it("returns error on validation failure", async () => {
      const payload = { country: "", visaType: "Tourist", processingDays: 0 };
      vi.mocked(api.post).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [{ code: "VALIDATION_ERROR", errorMessage: "VALIDATION_ERROR", details: "invalid payload" }],
          },
        },
      } as never);

      const result = await visaPolicyService.create(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("update", () => {
    it("returns success on 200", async () => {
      const payload = { id: "vp-1", country: "USA", visaType: "Tourist", processingDays: 14 };
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await visaPolicyService.update(payload);

      expect(result.success).toBe(true);
      expect(api.put).toHaveBeenCalledWith("/api/visa-policy", payload);
    });

    it("returns error on 404", async () => {
      const payload = { id: "invalid", country: "USA", visaType: "Tourist", processingDays: 14 };
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "policy not found" }],
          },
        },
      } as never);

      const result = await visaPolicyService.update(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("delete", () => {
    it("returns success on 204", async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await visaPolicyService.delete("vp-1");

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/api/visa-policy/vp-1");
    });

    it("returns error on 404", async () => {
      vi.mocked(api.delete).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "policy not found" }],
          },
        },
      } as never);

      const result = await visaPolicyService.delete("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
