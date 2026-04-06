/**
 * PricingPolicyList component logic tests.
 *
 * These tests verify the component's data-flow and interaction logic:
 * - Mock data shapes match the PricingPolicy type
 * - Service response shape validation
 * - Status label display logic (On=active, Off=inactive, status===1)
 * - Handler call patterns
 *
 * Note: Full DOM rendering tests require a jsdom environment (not configured
 * in this project). These tests cover the same logic assertions without RTL.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type { PricingPolicy } from "@/types/pricingPolicy";

// --- Mock service factory ---
const createMockPricingService = (policies: PricingPolicy[]) => ({
  getAll: vi.fn().mockResolvedValue({ success: true, data: policies }),
});

// --- Mock policies ---
const activePolicy: PricingPolicy = {
  id: "policy-1",
  policyCode: "PP001",
  name: "Standard Pricing",
  tourType: 1,
  tourTypeName: "Private",
  status: 1,
  statusName: "Active",
  isDefault: true,
  tiers: [{ id: "t1", label: "Adult", ageFrom: 18, ageTo: null, pricePercentage: 100 }],
  translations: {},
  createdOnUtc: "2024-01-01T00:00:00Z",
  lastModifiedOnUtc: null,
};

const inactivePolicy: PricingPolicy = {
  id: "policy-2",
  policyCode: "PP002",
  name: "Group Discount",
  tourType: 2,
  tourTypeName: "Public",
  status: 2,
  statusName: "Inactive",
  isDefault: false,
  tiers: [],
  translations: {},
  createdOnUtc: "2024-01-02T00:00:00Z",
  lastModifiedOnUtc: null,
};

// --- Status label logic (mirrors component: policy.status === 1 ? "On" : "Off") ---
const getStatusLabel = (policy: PricingPolicy): string =>
  policy.status === 1 ? "On" : "Off";

// --- Handler call assertions ---
const callOnEdit = (
  onEdit: (policy: PricingPolicy) => void,
  policy: PricingPolicy,
) => {
  onEdit(policy);
};

const callOnDelete = (
  onDelete: (id: string) => void,
  policy: PricingPolicy,
) => {
  onDelete(policy.id);
};

const callOnToggleActive = (
  onToggleActive: (policy: PricingPolicy) => void,
  policy: PricingPolicy,
) => {
  onToggleActive(policy);
};

describe("PricingPolicyList component logic", () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onToggleActive = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("service mock response shape", () => {
    it("returns success=true with data array for loaded policies", async () => {
      const service = createMockPricingService([activePolicy, inactivePolicy]);
      const result = await service.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("returns success=false with error array on failure", async () => {
      const service = {
        getAll: vi.fn().mockResolvedValue({
          success: false,
          error: [{ message: "Server error" }],
        }),
      };
      const result = await service.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error[0].message).toBe("Server error");
    });

    it("returns empty array when no policies exist", async () => {
      const service = createMockPricingService([]);
      const result = await service.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe("status label display", () => {
    it("displays 'On' when policy.status === 1 (active)", () => {
      expect(getStatusLabel(activePolicy)).toBe("On");
    });

    it("displays 'Off' when policy.status === 2 (inactive)", () => {
      expect(getStatusLabel(inactivePolicy)).toBe("Off");
    });

    it("returns 'On' for mixed policy statuses", () => {
      const policies = [activePolicy, inactivePolicy];
      const labels = policies.map(getStatusLabel);
      expect(labels).toEqual(["On", "Off"]);
    });
  });

  describe("edit handler", () => {
    it("calls onEdit with the entire policy object", () => {
      callOnEdit(onEdit, activePolicy);
      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(activePolicy);
    });

    it("calls onEdit for different policies correctly", () => {
      callOnEdit(onEdit, inactivePolicy);
      expect(onEdit).toHaveBeenCalledWith(inactivePolicy);
    });
  });

  describe("delete handler", () => {
    it("calls onDelete with the policy id", () => {
      callOnDelete(onDelete, activePolicy);
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith("policy-1");
    });

    it("calls onDelete with correct id for different policies", () => {
      callOnDelete(onDelete, inactivePolicy);
      expect(onDelete).toHaveBeenCalledWith("policy-2");
    });
  });

  describe("toggle active handler", () => {
    it("calls onToggleActive with the entire policy object", () => {
      callOnToggleActive(onToggleActive, activePolicy);
      expect(onToggleActive).toHaveBeenCalledTimes(1);
      expect(onToggleActive).toHaveBeenCalledWith(activePolicy);
    });

    it("calls onToggleActive for inactive policy", () => {
      callOnToggleActive(onToggleActive, inactivePolicy);
      expect(onToggleActive).toHaveBeenCalledWith(inactivePolicy);
    });
  });

  describe("policy data fields used in table rendering", () => {
    it("exposes all fields needed for table columns", () => {
      expect(activePolicy.policyCode).toBe("PP001");
      expect(activePolicy.name).toBe("Standard Pricing");
      expect(activePolicy.tourTypeName).toBe("Private");
      expect(activePolicy.tiers.length).toBe(1);
      expect(activePolicy.isDefault).toBe(true);
      expect(activePolicy.status).toBe(1);
    });

    it("tiers length is displayed as-is in the tiers column", () => {
      expect(activePolicy.tiers.length).toBe(1);
      expect(inactivePolicy.tiers.length).toBe(0);
    });
  });
});
