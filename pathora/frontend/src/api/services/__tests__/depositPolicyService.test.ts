import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { depositPolicyService } from "../depositPolicyService";

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

describe("depositPolicyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns success with deposit policies on 200", async () => {
      const mockPolicies = [
        { id: "dp-1", name: "Full Deposit", amount: 100 },
        { id: "dp-2", name: "Partial Deposit", percentage: 30 },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockPolicies },
      } as never);

      const result = await depositPolicyService.getAll();

      expect(result).toEqual({ success: true, data: mockPolicies });
      expect(api.get).toHaveBeenCalledWith("/api/deposit-policies");
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

      const result = await depositPolicyService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getById", () => {
    it("returns success with deposit policy on 200", async () => {
      const mockPolicy = { id: "dp-1", name: "Full Deposit", amount: 100 };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockPolicy },
      } as never);

      const result = await depositPolicyService.getById("dp-1");

      expect(result).toEqual({ success: true, data: mockPolicy });
      expect(api.get).toHaveBeenCalledWith("/api/deposit-policies/dp-1");
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

      const result = await depositPolicyService.getById("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("create", () => {
    it("returns success with created policy id on 201", async () => {
      const payload = { name: "New Deposit Policy", percentage: 50 };
      const createdId = "dp-new";
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: createdId },
      } as never);

      const result = await depositPolicyService.create(payload);

      expect(result).toEqual({ success: true, data: createdId });
      expect(api.post).toHaveBeenCalledWith("/api/deposit-policies", payload);
    });

    it("returns error on validation failure", async () => {
      const payload = { name: "", percentage: -10 };
      vi.mocked(api.post).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [{ code: "VALIDATION_ERROR", errorMessage: "VALIDATION_ERROR", details: "invalid payload" }],
          },
        },
      } as never);

      const result = await depositPolicyService.create(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("update", () => {
    it("returns success on 200", async () => {
      const payload = { id: "dp-1", name: "Updated Policy", percentage: 75 };
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await depositPolicyService.update(payload);

      expect(result.success).toBe(true);
      expect(api.put).toHaveBeenCalledWith("/api/deposit-policies", payload);
    });

    it("returns error on 404", async () => {
      const payload = { id: "invalid", name: "Updated", percentage: 75 };
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "policy not found" }],
          },
        },
      } as never);

      const result = await depositPolicyService.update(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("delete", () => {
    it("returns success on 204", async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await depositPolicyService.delete("dp-1");

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/api/deposit-policies/dp-1");
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

      const result = await depositPolicyService.delete("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
