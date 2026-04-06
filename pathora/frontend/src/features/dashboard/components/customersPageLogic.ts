import { adminService } from "@/api/services/adminService";
import type { AdminCustomer, AdminOverview } from "@/types/admin";

export type CustomerStatusFilter = "all" | "active" | "inactive";
export type CustomersDataState = "loading" | "ready" | "empty" | "error";

export interface CustomersDataResult {
  state: CustomersDataState;
  customers: AdminCustomer[];
  errorMessage: string | null;
}

export interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  activePercentage: number;
  averageSpent: number;
  vipCustomers: number;
}

const DEFAULT_ERROR_MESSAGE =
  "Unable to load customer data. Please try again.";
const UNKNOWN_CUSTOMER_NAME = "Unknown customer";
const UNKNOWN_CUSTOMER_EMAIL = "unknown@example.com";
const UNKNOWN_CUSTOMER_PHONE = "N/A";
const UNKNOWN_NATIONALITY = "Unknown";
const UNKNOWN_LAST_BOOKING = "N/A";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const toNonEmptyString = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const toFiniteNumber = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return value;
};

const toCustomerStatus = (value: unknown): string => {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "inactive";
};

export const normalizeCustomer = (
  value: unknown,
  index: number,
): AdminCustomer => {
  const fallbackId = `UNKNOWN-${index + 1}`;

  if (!isRecord(value)) {
    return {
      id: fallbackId,
      name: UNKNOWN_CUSTOMER_NAME,
      email: UNKNOWN_CUSTOMER_EMAIL,
      phone: UNKNOWN_CUSTOMER_PHONE,
      nationality: UNKNOWN_NATIONALITY,
      totalBookings: 0,
      totalSpent: 0,
      status: "inactive",
      lastBooking: UNKNOWN_LAST_BOOKING,
    };
  }

  return {
    id: toNonEmptyString(value.id, fallbackId),
    name: toNonEmptyString(value.name, UNKNOWN_CUSTOMER_NAME),
    email: toNonEmptyString(value.email, UNKNOWN_CUSTOMER_EMAIL),
    phone: toNonEmptyString(value.phone, UNKNOWN_CUSTOMER_PHONE),
    nationality: toNonEmptyString(value.nationality, UNKNOWN_NATIONALITY),
    totalBookings: Math.max(0, Math.floor(toFiniteNumber(value.totalBookings))),
    totalSpent: Math.max(0, toFiniteNumber(value.totalSpent)),
    status: toCustomerStatus(value.status),
    lastBooking: toNonEmptyString(value.lastBooking, UNKNOWN_LAST_BOOKING),
  };
};

export const normalizeCustomers = (value: unknown): AdminCustomer[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => normalizeCustomer(item, index));
};

export const filterCustomers = (
  customers: AdminCustomer[],
  statusFilter: CustomerStatusFilter,
  searchQuery: string,
): AdminCustomer[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return customers.filter((customer) => {
    const statusMatches =
      statusFilter === "all" || customer.status === statusFilter;

    if (!statusMatches) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = `${customer.id} ${customer.name} ${customer.email}`
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
};

export const calculateCustomerMetrics = (
  customers: AdminCustomer[],
): CustomerMetrics => {
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((customer) => {
    return customer.status === "active";
  }).length;

  const totalSpent = customers.reduce((sum, customer) => {
    return sum + toFiniteNumber(customer.totalSpent);
  }, 0);

  const vipCustomers = customers.filter((customer) => {
    return toFiniteNumber(customer.totalSpent) >= 5000;
  }).length;

  const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
  const activePercentage =
    totalCustomers > 0
      ? Math.round((activeCustomers / totalCustomers) * 100)
      : 0;

  return {
    totalCustomers,
    activeCustomers,
    activePercentage,
    averageSpent,
    vipCustomers,
  };
};

const resolveCustomersFromOverview = (
  overview: AdminOverview | null | undefined,
): { customers: AdminCustomer[]; isInvalid: boolean } => {
  if (!overview || !isRecord(overview)) {
    return { customers: [], isInvalid: true };
  }

  const rawCustomers = (overview as { customers?: unknown }).customers;

  if (!Array.isArray(rawCustomers)) {
    return { customers: [], isInvalid: true };
  }

  return {
    customers: normalizeCustomers(rawCustomers),
    isInvalid: false,
  };
};

export const loadCustomersOverview = async (
  getOverview: () => Promise<AdminOverview | null | undefined>,
): Promise<CustomersDataResult> => {
  try {
    const overview = await getOverview();
    const { customers, isInvalid } = resolveCustomersFromOverview(overview);

    if (isInvalid) {
      return {
        state: "error",
        customers: [],
        errorMessage: DEFAULT_ERROR_MESSAGE,
      };
    }

    if (customers.length === 0) {
      return {
        state: "empty",
        customers,
        errorMessage: null,
      };
    }

    return {
      state: "ready",
      customers,
      errorMessage: null,
    };
  } catch {
    return {
      state: "error",
      customers: [],
      errorMessage: DEFAULT_ERROR_MESSAGE,
    };
  }
};

export const loadCustomersFromAdminService =
  async (): Promise<CustomersDataResult> => {
    return loadCustomersOverview(() => adminService.getOverview());
  };
