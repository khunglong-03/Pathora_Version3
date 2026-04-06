import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/services/dashboardPoliciesService", () => ({
  dashboardPoliciesService: {
    getAll: vi.fn(),
  },
}));

import { dashboardPoliciesService } from "@/api/services/dashboardPoliciesService";

import {
  calculateDashboardPolicyMetrics,
  filterDashboardPolicies,
  getPrimaryPolicyCreateHref,
  getToggleActionLabel,
  loadDashboardPoliciesData,
  normalizeDashboardPolicies,
} from "../dashboardPoliciesPageLogic";

const buildPayload = () => ({
  pricing: [
    {
      id: "pricing-1",
      policyCode: "PRC-001",
      name: "Public Tour Pricing",
      tourType: 2,
      tourTypeName: "Public",
      status: 1,
      statusName: "Active",
      isDefault: false,
      tiers: [],
      createdOnUtc: "2026-03-01T08:00:00.000Z",
      lastModifiedOnUtc: "2026-03-05T08:00:00.000Z",
    },
  ],
  deposit: [
    {
      id: "deposit-1",
      tourScope: 1,
      tourScopeName: "Domestic",
      depositType: 1,
      depositTypeName: "Percentage",
      depositValue: 30,
      minDaysBeforeDeparture: 10,
      isActive: true,
      createdOnUtc: "2026-03-01T08:00:00.000Z",
      lastModifiedOnUtc: null,
    },
  ],
  cancellation: [
    {
      id: "cancel-1",
      policyCode: "CAN-001",
      tourScope: 2,
      tourScopeName: "International",
      minDaysBeforeDeparture: 5,
      maxDaysBeforeDeparture: 9,
      penaltyPercentage: 20,
      applyOn: "FullAmount",
      status: 1,
      statusName: "Active",
      createdOnUtc: "2026-03-01T08:00:00.000Z",
      lastModifiedOnUtc: "2026-03-06T08:00:00.000Z",
    },
  ],
  visa: [
    {
      id: "visa-1",
      region: "Korea",
      processingDays: 7,
      bufferDays: 2,
      fullPaymentRequired: false,
      isActive: false,
      createdOnUtc: "2026-03-02T08:00:00.000Z",
      lastModifiedOnUtc: null,
    },
  ],
});

describe("dashboardPoliciesPageLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes multi-source policy payload into unified rows", () => {
    const rows = normalizeDashboardPolicies(buildPayload());

    expect(rows).toHaveLength(4);
    expect(rows[0].type).toBe("cancellation");
    expect(rows.find((row) => row.type === "pricing")?.status).toBe("active");
    expect(rows.find((row) => row.type === "visa")?.status).toBe("inactive");
  });

  it("supports status and keyword filters together", () => {
    const rows = normalizeDashboardPolicies(buildPayload());

    const activeRows = filterDashboardPolicies(rows, {
      searchQuery: "",
      statusFilter: "active",
    });
    const cancellationRows = filterDashboardPolicies(rows, {
      searchQuery: "international",
      statusFilter: "all",
    });

    expect(activeRows).toHaveLength(3);
    expect(cancellationRows).toHaveLength(1);
    expect(cancellationRows[0].type).toBe("cancellation");
  });

  it("calculates dashboard metrics safely", () => {
    const metrics = calculateDashboardPolicyMetrics(normalizeDashboardPolicies(buildPayload()));

    expect(metrics).toEqual({
      totalPolicies: 4,
      activePolicies: 3,
      inactivePolicies: 1,
      typeCounts: {
        pricing: 1,
        deposit: 1,
        cancellation: 1,
        visa: 1,
      },
    });
  });

  it("marks unsupported status toggle actions as unavailable", () => {
    const rows = normalizeDashboardPolicies(buildPayload());
    const pricingRow = rows.find((row) => row.type === "pricing");
    const cancellationRow = rows.find((row) => row.type === "cancellation");

    expect(pricingRow?.canToggleStatus).toBe(false);
    expect(cancellationRow?.canToggleStatus).toBe(true);
    expect(getToggleActionLabel(cancellationRow!)).toBe("Deactivate");
  });

  it("resolves primary create action route", () => {
    expect(getPrimaryPolicyCreateHref()).toBe("/pricing-policies");
  });
});

describe("dashboardPoliciesPageLogic service behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ready state when service responds with policies", async () => {
    vi.mocked(dashboardPoliciesService.getAll).mockResolvedValue({
      success: true,
      data: buildPayload(),
    });

    const result = await loadDashboardPoliciesData();

    expect(result.state).toBe("ready");
    expect(result.policies).toHaveLength(4);
    expect(result.errorMessage).toBeNull();
  });

  it("returns empty state when service responds with no policies", async () => {
    vi.mocked(dashboardPoliciesService.getAll).mockResolvedValue({
      success: true,
      data: {
        pricing: [],
        deposit: [],
        cancellation: [],
        visa: [],
      },
    });

    const result = await loadDashboardPoliciesData();

    expect(result.state).toBe("empty");
    expect(result.policies).toEqual([]);
  });

  it("returns error state when service request fails", async () => {
    vi.mocked(dashboardPoliciesService.getAll).mockResolvedValue({
      success: false,
      error: {
        code: "500",
        message: "Server error",
      },
    });

    const result = await loadDashboardPoliciesData();

    expect(result.state).toBe("error");
    expect(result.policies).toEqual([]);
    expect(result.errorMessage).toBe("Server error");
  });
});
