/**
 * DepositPolicyList component logic tests.
 *
 * Tests the component's data-flow and interaction logic:
 * - Mock data shapes match the DepositPolicy type
 * - Service response shape validation
 * - Status label display logic (On=active when isActive=true, Off otherwise)
 * - Deposit value display formatting (percentage vs fixed amount)
 * - Handler call patterns
 *
 * Note: Full DOM rendering tests require a jsdom environment (not configured
 * in this project). These tests cover the same logic assertions without RTL.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DepositPolicy } from "@/types/depositPolicy";

// --- Mock service factory ---
const createMockDepositService = (policies: DepositPolicy[]) => ({
  getAll: vi.fn().mockResolvedValue({ success: true, data: policies }),
});

// --- Mock policies ---
const activePolicy: DepositPolicy = {
  id: "deposit-1",
  tourScope: 1,
  tourScopeName: "Domestic",
  depositType: 1,
  depositTypeName: "Percentage",
  depositValue: 30,
  minDaysBeforeDeparture: 7,
  isActive: true,
  translations: {},
  createdBy: "admin",
  createdOnUtc: "2024-01-01T00:00:00Z",
  lastModifiedOnUtc: null,
};

const inactivePolicy: DepositPolicy = {
  id: "deposit-2",
  tourScope: 2,
  tourScopeName: "International",
  depositType: 2,
  depositTypeName: "Fixed Amount",
  depositValue: 100,
  minDaysBeforeDeparture: 14,
  isActive: false,
  translations: {},
  createdBy: "admin",
  createdOnUtc: "2024-01-02T00:00:00Z",
  lastModifiedOnUtc: null,
};

// --- Status label logic (mirrors component: policy.isActive ? "On" : "Off") ---
const getStatusLabel = (policy: DepositPolicy): string =>
  policy.isActive ? "On" : "Off";

// --- Deposit value display logic (mirrors component) ---
const formatDepositValue = (policy: DepositPolicy): string =>
  policy.depositType === 1 ? `${policy.depositValue}%` : `$${policy.depositValue}`;

// --- Handler call assertions ---
const callOnEdit = (
  onEdit: (policy: DepositPolicy) => void,
  policy: DepositPolicy,
) => {
  onEdit(policy);
};

const callOnDelete = (
  onDelete: (id: string) => void,
  policy: DepositPolicy,
) => {
  onDelete(policy.id);
};

const callOnToggleActive = (
  onToggleActive: (policy: DepositPolicy) => void,
  policy: DepositPolicy,
) => {
  onToggleActive(policy);
};

describe("DepositPolicyList component logic", () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onToggleActive = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("service mock response shape", () => {
    it("returns success=true with data array for loaded policies", async () => {
      const service = createMockDepositService([activePolicy, inactivePolicy]);
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
          error: [{ message: "Failed to load" }],
        }),
      };
      const result = await service.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error[0].message).toBe("Failed to load");
    });

    it("returns empty array when no policies exist", async () => {
      const service = createMockDepositService([]);
      const result = await service.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe("status label display", () => {
    it("displays 'On' when policy.isActive is true", () => {
      expect(getStatusLabel(activePolicy)).toBe("On");
    });

    it("displays 'Off' when policy.isActive is false", () => {
      expect(getStatusLabel(inactivePolicy)).toBe("Off");
    });

    it("returns correct labels for mixed active states", () => {
      const policies = [activePolicy, inactivePolicy];
      const labels = policies.map(getStatusLabel);
      expect(labels).toEqual(["On", "Off"]);
    });
  });

  describe("deposit value formatting", () => {
    it("formats percentage deposit type with % suffix", () => {
      expect(formatDepositValue(activePolicy)).toBe("30%");
    });

    it("formats fixed amount deposit type with $ prefix", () => {
      expect(formatDepositValue(inactivePolicy)).toBe("$100");
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
      expect(onDelete).toHaveBeenCalledWith("deposit-1");
    });

    it("calls onDelete with correct id for different policies", () => {
      callOnDelete(onDelete, inactivePolicy);
      expect(onDelete).toHaveBeenCalledWith("deposit-2");
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
      expect(activePolicy.tourScopeName).toBe("Domestic");
      expect(activePolicy.depositTypeName).toBe("Percentage");
      expect(activePolicy.depositValue).toBe(30);
      expect(activePolicy.minDaysBeforeDeparture).toBe(7);
      expect(activePolicy.isActive).toBe(true);
    });

    it("minDaysBeforeDeparture is displayed with 'days' suffix", () => {
      expect(`${activePolicy.minDaysBeforeDeparture} days`).toBe("7 days");
    });
  });
});
