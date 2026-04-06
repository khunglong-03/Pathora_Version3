import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { pricingPolicyService } from "../pricingPolicyService";

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

describe("pricingPolicyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns success with pricing policies on 200", async () => {
      const mockPolicies = [
        { id: "pp-1", name: "Standard Pricing", percentage: 10 },
        { id: "pp-2", name: "Discount Pricing", percentage: 20 },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockPolicies },
      } as never);

      const result = await pricingPolicyService.getAll();

      expect(result).toEqual({ success: true, data: mockPolicies });
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PRICING_POLICY.GET_ALL);
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

      const result = await pricingPolicyService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getById", () => {
    it("returns success with pricing policy on 200", async () => {
      const mockPolicy = { id: "pp-1", name: "Standard Pricing", percentage: 10 };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockPolicy },
      } as never);

      const result = await pricingPolicyService.getById("pp-1");

      expect(result).toEqual({ success: true, data: mockPolicy });
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PRICING_POLICY.GET_DETAIL("pp-1"));
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

      const result = await pricingPolicyService.getById("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("create", () => {
    it("returns success with created policy id on 201", async () => {
      const payload = { name: "New Pricing", percentage: 15 };
      const createdId = "pp-new";
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: createdId },
      } as never);

      const result = await pricingPolicyService.create(payload);

      expect(result).toEqual({ success: true, data: createdId });
      expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.PRICING_POLICY.CREATE, payload);
    });

    it("returns error on validation failure", async () => {
      const payload = { name: "Invalid", percentage: -1 };
      vi.mocked(api.post).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [{ code: "VALIDATION_ERROR", errorMessage: "VALIDATION_ERROR", details: "invalid payload" }],
          },
        },
      } as never);

      const result = await pricingPolicyService.create(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("update", () => {
    it("returns success on 200", async () => {
      const payload = { id: "pp-1", name: "Updated Pricing", percentage: 25 };
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await pricingPolicyService.update(payload);

      expect(result.success).toBe(true);
      expect(api.put).toHaveBeenCalledWith(API_ENDPOINTS.PRICING_POLICY.UPDATE, payload);
    });

    it("returns error on 404", async () => {
      const payload = { id: "invalid", name: "Updated", percentage: 25 };
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "policy not found" }],
          },
        },
      } as never);

      const result = await pricingPolicyService.update(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("delete", () => {
    it("returns success on 204", async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await pricingPolicyService.delete("pp-1");

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith(API_ENDPOINTS.PRICING_POLICY.DELETE("pp-1"));
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

      const result = await pricingPolicyService.delete("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("setAsDefault", () => {
    it("returns success on 200", async () => {
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await pricingPolicyService.setAsDefault("pp-1");

      expect(result.success).toBe(true);
      expect(api.put).toHaveBeenCalledWith(API_ENDPOINTS.PRICING_POLICY.SET_DEFAULT("pp-1"));
    });

    it("returns error on 404", async () => {
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "policy not found" }],
          },
        },
      } as never);

      const result = await pricingPolicyService.setAsDefault("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
