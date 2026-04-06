import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/services/adminService", () => {
  return {
    adminService: {
      getOverview: vi.fn(),
    },
  };
});

import { adminService } from "@/api/services/adminService";
import type { AdminCustomer, AdminOverview } from "@/types/admin";

import {
  calculateCustomerMetrics,
  filterCustomers,
  loadCustomersFromAdminService,
  normalizeCustomer,
  normalizeCustomers,
} from "../customersPageLogic";

const createCustomer = (overrides: Partial<AdminCustomer> = {}): AdminCustomer => {
  return {
    id: "CUS-001",
    name: "Nguyen Van A",
    email: "nguyenvana@email.com",
    phone: "+84 123 456 789",
    nationality: "Vietnam",
    totalBookings: 4,
    totalSpent: 6000,
    status: "active",
    lastBooking: "Mar 10, 2026",
    ...overrides,
  };
};

const createOverview = (customers: unknown): AdminOverview => {
  return {
    stats: {
      totalRevenue: 0,
      totalBookings: 0,
      activeTours: 0,
      totalCustomers: 0,
      cancellationRate: 0,
      visaApprovalRate: 0,
    },
    customers: customers as AdminCustomer[],
    payments: [],
    insurances: [],
    visaApplications: [],
  };
};

describe("customersPageLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes missing customer fields with safe defaults", () => {
    const normalized = normalizeCustomer({}, 0);

    expect(normalized.id).toBe("UNKNOWN-1");
    expect(normalized.name).toBe("Unknown customer");
    expect(normalized.status).toBe("inactive");
    expect(normalized.totalBookings).toBe(0);
    expect(normalized.totalSpent).toBe(0);
  });

  it("normalizes customer array and guards malformed values", () => {
    const normalized = normalizeCustomers([
      {
        id: "  CUS-123  ",
        name: "  Alice Nguyen  ",
        email: "",
        phone: "",
        nationality: "",
        totalBookings: 3.7,
        totalSpent: Number.NaN,
        status: "unknown",
        lastBooking: "",
      },
      null,
    ]);

    expect(normalized).toHaveLength(2);
    expect(normalized[0]).toMatchObject({
      id: "CUS-123",
      name: "Alice Nguyen",
      email: "unknown@example.com",
      phone: "N/A",
      nationality: "Unknown",
      totalBookings: 3,
      totalSpent: 0,
      status: "inactive",
      lastBooking: "N/A",
    });
    expect(normalized[1].id).toBe("UNKNOWN-2");
  });

  it("filters by status and search query together", () => {
    const customers = [
      createCustomer({ id: "CUS-001", name: "An Nguyen", email: "an@email.com", status: "active" }),
      createCustomer({ id: "CUS-002", name: "Binh Tran", email: "binh@email.com", status: "inactive" }),
      createCustomer({ id: "CUS-003", name: "Chris Lee", email: "chris@email.com", status: "active" }),
    ];

    expect(filterCustomers(customers, "active", "")).toHaveLength(2);
    expect(filterCustomers(customers, "all", "binh")).toHaveLength(1);
    expect(filterCustomers(customers, "inactive", "cus-002")).toHaveLength(1);
    expect(filterCustomers(customers, "active", "binh")).toHaveLength(0);
  });

  it("calculates safe metrics for empty dataset without NaN or Infinity", () => {
    const metrics = calculateCustomerMetrics([]);

    expect(metrics).toEqual({
      totalCustomers: 0,
      activeCustomers: 0,
      activePercentage: 0,
      averageSpent: 0,
      vipCustomers: 0,
    });
    expect(Number.isFinite(metrics.activePercentage)).toBe(true);
    expect(Number.isFinite(metrics.averageSpent)).toBe(true);
  });

  it("computes metrics from normalized customer values", () => {
    const customers = [
      createCustomer({ status: "active", totalSpent: 7000 }),
      createCustomer({ id: "CUS-002", status: "inactive", totalSpent: 3000 }),
    ];

    const metrics = calculateCustomerMetrics(customers);

    expect(metrics.totalCustomers).toBe(2);
    expect(metrics.activeCustomers).toBe(1);
    expect(metrics.activePercentage).toBe(50);
    expect(metrics.averageSpent).toBe(5000);
    expect(metrics.vipCustomers).toBe(1);
  });
});

describe("customersPageLogic service behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ready state when admin overview contains customers", async () => {
    vi.mocked(adminService.getOverview).mockResolvedValue(
      createOverview([createCustomer()]),
    );

    const result = await loadCustomersFromAdminService();

    expect(result.state).toBe("ready");
    expect(result.errorMessage).toBeNull();
    expect(result.customers).toHaveLength(1);
  });

  it("returns empty state when API returns no customers", async () => {
    vi.mocked(adminService.getOverview).mockResolvedValue(createOverview([]));

    const result = await loadCustomersFromAdminService();

    expect(result.state).toBe("empty");
    expect(result.errorMessage).toBeNull();

    const metrics = calculateCustomerMetrics(result.customers);
    expect(Number.isFinite(metrics.averageSpent)).toBe(true);
    expect(Number.isFinite(metrics.activePercentage)).toBe(true);
  });

  it("returns error state when API request fails", async () => {
    vi.mocked(adminService.getOverview).mockRejectedValue(new Error("network"));

    const result = await loadCustomersFromAdminService();

    expect(result.state).toBe("error");
    expect(result.customers).toEqual([]);
    expect(result.errorMessage).toContain("Unable to load customer data");
  });

  it("returns error state for malformed overview payload", async () => {
    vi.mocked(adminService.getOverview).mockResolvedValue(
      {
        stats: {
          totalRevenue: 0,
          totalBookings: 0,
          activeTours: 0,
          totalCustomers: 0,
          cancellationRate: 0,
          visaApprovalRate: 0,
        },
      } as AdminOverview,
    );

    const result = await loadCustomersFromAdminService();

    expect(result.state).toBe("error");

    const metrics = calculateCustomerMetrics(result.customers);
    expect(Number.isFinite(metrics.averageSpent)).toBe(true);
    expect(Number.isFinite(metrics.activePercentage)).toBe(true);
  });
});
