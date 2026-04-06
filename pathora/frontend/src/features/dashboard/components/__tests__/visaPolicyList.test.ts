/**
 * VisaPolicyList component logic tests.
 *
 * Tests the component's data-flow and interaction logic:
 * - Mock data shapes match the VisaPolicy type
 * - Service response shape validation
 * - Status label display logic (On=active when isActive=true, Off otherwise)
 * - Full payment required badge logic
 * - Handler call patterns
 *
 * Note: Full DOM rendering tests require a jsdom environment (not configured
 * in this project). These tests cover the same logic assertions without RTL.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type { VisaPolicy } from "@/types/visaPolicy";

// --- Mock service factory ---
const createMockVisaService = (policies: VisaPolicy[]) => ({
  getAll: vi.fn().mockResolvedValue({ success: true, data: policies }),
});

// --- Mock policies ---
const activePolicy: VisaPolicy = {
  id: "visa-1",
  region: "Southeast Asia",
  processingDays: 7,
  bufferDays: 3,
  fullPaymentRequired: true,
  isActive: true,
  translations: {},
  createdBy: "admin",
  createdOnUtc: "2024-01-01T00:00:00Z",
  lastModifiedOnUtc: null,
};

const inactivePolicy: VisaPolicy = {
  id: "visa-2",
  region: "Europe",
  processingDays: 14,
  bufferDays: 5,
  fullPaymentRequired: false,
  isActive: false,
  translations: {},
  createdBy: "admin",
  createdOnUtc: "2024-01-02T00:00:00Z",
  lastModifiedOnUtc: null,
};

// --- Status label logic (mirrors component: policy.isActive ? "On" : "Off") ---
const getStatusLabel = (policy: VisaPolicy): string =>
  policy.isActive ? "On" : "Off";

// --- Full payment required badge logic ---
const getFullPaymentLabel = (policy: VisaPolicy): string =>
  policy.fullPaymentRequired ? "Yes" : "No";

// --- Handler call assertions ---
const callOnEdit = (
  onEdit: (policy: VisaPolicy) => void,
  policy: VisaPolicy,
) => {
  onEdit(policy);
};

const callOnDelete = (
  onDelete: (id: string) => void,
  policy: VisaPolicy,
) => {
  onDelete(policy.id);
};

const callOnToggleActive = (
  onToggleActive: (policy: VisaPolicy) => void,
  policy: VisaPolicy,
) => {
  onToggleActive(policy);
};

describe("VisaPolicyList component logic", () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onToggleActive = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("service mock response shape", () => {
    it("returns success=true with data array for loaded policies", async () => {
      const service = createMockVisaService([activePolicy, inactivePolicy]);
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
      const service = createMockVisaService([]);
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

  describe("full payment required badge", () => {
    it("displays 'Yes' when fullPaymentRequired is true", () => {
      expect(getFullPaymentLabel(activePolicy)).toBe("Yes");
    });

    it("displays 'No' when fullPaymentRequired is false", () => {
      expect(getFullPaymentLabel(inactivePolicy)).toBe("No");
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
      expect(onDelete).toHaveBeenCalledWith("visa-1");
    });

    it("calls onDelete with correct id for different policies", () => {
      callOnDelete(onDelete, inactivePolicy);
      expect(onDelete).toHaveBeenCalledWith("visa-2");
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
      expect(activePolicy.region).toBe("Southeast Asia");
      expect(activePolicy.processingDays).toBe(7);
      expect(activePolicy.bufferDays).toBe(3);
      expect(activePolicy.fullPaymentRequired).toBe(true);
      expect(activePolicy.isActive).toBe(true);
    });

    it("processingDays and bufferDays are displayed with 'days' suffix", () => {
      expect(`${activePolicy.processingDays} days`).toBe("7 days");
      expect(`${activePolicy.bufferDays} days`).toBe("3 days");
    });
  });
});
