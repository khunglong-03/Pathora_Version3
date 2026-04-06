import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { cancellationPolicyService } from "../cancellationPolicyService";

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

describe("cancellationPolicyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns success with cancellation policies on 200", async () => {
      const mockPolicies = [
        { id: "cp-1", name: "Flexible", refundPercentage: 100 },
        { id: "cp-2", name: "Moderate", refundPercentage: 50 },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockPolicies },
      } as never);

      const result = await cancellationPolicyService.getAll();

      expect(result).toEqual({ success: true, data: mockPolicies });
      expect(api.get).toHaveBeenCalledWith("/api/cancellation-policies");
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

      const result = await cancellationPolicyService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getById", () => {
    it("returns success with cancellation policy on 200", async () => {
      const mockPolicy = { id: "cp-1", name: "Flexible", refundPercentage: 100 };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockPolicy },
      } as never);

      const result = await cancellationPolicyService.getById("cp-1");

      expect(result).toEqual({ success: true, data: mockPolicy });
      expect(api.get).toHaveBeenCalledWith("/api/cancellation-policies/cp-1");
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

      const result = await cancellationPolicyService.getById("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("create", () => {
    it("returns success with created policy id on 201", async () => {
      const payload = { name: "New Policy", refundPercentage: 75 };
      const createdId = "cp-new";
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: createdId },
      } as never);

      const result = await cancellationPolicyService.create(payload);

      expect(result).toEqual({ success: true, data: createdId });
      expect(api.post).toHaveBeenCalledWith("/api/cancellation-policies", payload);
    });

    it("returns error on validation failure", async () => {
      const payload = { name: "", refundPercentage: 150 };
      vi.mocked(api.post).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [{ code: "VALIDATION_ERROR", errorMessage: "VALIDATION_ERROR", details: "invalid payload" }],
          },
        },
      } as never);

      const result = await cancellationPolicyService.create(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("update", () => {
    it("returns success on 200", async () => {
      const payload = { id: "cp-1", name: "Updated Policy", refundPercentage: 80 };
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await cancellationPolicyService.update(payload);

      expect(result.success).toBe(true);
      expect(api.put).toHaveBeenCalledWith("/api/cancellation-policies", payload);
    });

    it("returns error on 404", async () => {
      const payload = { id: "invalid", name: "Updated", refundPercentage: 80 };
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "policy not found" }],
          },
        },
      } as never);

      const result = await cancellationPolicyService.update(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("delete", () => {
    it("returns success on 204", async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await cancellationPolicyService.delete("cp-1");

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/api/cancellation-policies/cp-1");
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

      const result = await cancellationPolicyService.delete("invalid-id");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
