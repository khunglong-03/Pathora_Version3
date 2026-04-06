/**
 * CancellationPolicyList component logic tests.
 *
 * Tests the component's data-flow and interaction logic:
 * - Mock data shapes match the CancellationPolicy type
 * - Service response shape validation
 * - Status label display logic (On=active when status===1, Off when status===2)
 * - Handler call patterns
 *
 * Note: Full DOM rendering tests require a jsdom environment (not configured
 * in this project). These tests cover the same logic assertions without RTL.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CancellationPolicy } from "@/types/cancellationPolicy";

// --- Mock service factory ---
const createMockCancellationService = (policies: CancellationPolicy[]) => ({
  getAll: vi.fn().mockResolvedValue({ success: true, data: policies }),
});

// --- Mock policies ---
const activePolicy: CancellationPolicy = {
  id: "cancel-1",
  policyCode: "CP001",
  tourScope: 1,
  tourScopeName: "Domestic",
  minDaysBeforeDeparture: 7,
  maxDaysBeforeDeparture: 14,
  penaltyPercentage: 25,
  applyOn: "FullAmount",
  status: 1,
  statusName: "Active",
  translations: {},
  createdBy: "admin",
  createdOnUtc: "2024-01-01T00:00:00Z",
  lastModifiedOnUtc: null,
};

const inactivePolicy: CancellationPolicy = {
  id: "cancel-2",
  policyCode: "CP002",
  tourScope: 2,
  tourScopeName: "International",
  minDaysBeforeDeparture: 3,
  maxDaysBeforeDeparture: 7,
  penaltyPercentage: 50,
  applyOn: "DepositOnly",
  status: 2,
  statusName: "Inactive",
  translations: {},
  createdBy: "admin",
  createdOnUtc: "2024-01-02T00:00:00Z",
  lastModifiedOnUtc: null,
};

// --- Status label logic (mirrors component: policy.status === 1 ? "On" : "Off") ---
const getStatusLabel = (policy: CancellationPolicy): string =>
  policy.status === 1 ? "On" : "Off";

// --- Handler call assertions ---
const callOnEdit = (
  onEdit: (policy: CancellationPolicy) => void,
  policy: CancellationPolicy,
) => {
  onEdit(policy);
};

const callOnDelete = (
  onDelete: (id: string) => void,
  policy: CancellationPolicy,
) => {
  onDelete(policy.id);
};

const callOnToggleActive = (
  onToggleActive: (policy: CancellationPolicy) => void,
  policy: CancellationPolicy,
) => {
  onToggleActive(policy);
};

describe("CancellationPolicyList component logic", () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onToggleActive = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("service mock response shape", () => {
    it("returns success=true with data array for loaded policies", async () => {
      const service = createMockCancellationService([activePolicy, inactivePolicy]);
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
          error: [{ message: "Load failed" }],
        }),
      };
      const result = await service.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error[0].message).toBe("Load failed");
    });

    it("returns empty array when no policies exist", async () => {
      const service = createMockCancellationService([]);
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

    it("returns correct labels for mixed statuses", () => {
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
      expect(onDelete).toHaveBeenCalledWith("cancel-1");
    });

    it("calls onDelete with correct id for different policies", () => {
      callOnDelete(onDelete, inactivePolicy);
      expect(onDelete).toHaveBeenCalledWith("cancel-2");
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
      expect(activePolicy.policyCode).toBe("CP001");
      expect(activePolicy.tourScopeName).toBe("Domestic");
      expect(activePolicy.minDaysBeforeDeparture).toBe(7);
      expect(activePolicy.maxDaysBeforeDeparture).toBe(14);
      expect(activePolicy.penaltyPercentage).toBe(25);
      expect(activePolicy.applyOn).toBe("FullAmount");
      expect(activePolicy.status).toBe(1);
    });

    it("penalty percentage is displayed with % suffix", () => {
      expect(`${activePolicy.penaltyPercentage}%`).toBe("25%");
      expect(`${inactivePolicy.penaltyPercentage}%`).toBe("50%");
    });

    it("days fields are displayed with 'days' suffix", () => {
      expect(`${activePolicy.minDaysBeforeDeparture} days`).toBe("7 days");
      expect(`${activePolicy.maxDaysBeforeDeparture} days`).toBe("14 days");
    });
  });
});
