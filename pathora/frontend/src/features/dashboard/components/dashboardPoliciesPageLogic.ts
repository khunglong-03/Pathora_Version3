import { dashboardPoliciesService } from "@/api/services/dashboardPoliciesService";
import type { CancellationPolicy } from "@/types/cancellationPolicy";
import type {
  DashboardPolicyListItem,
  DashboardPolicyMetrics,
  DashboardPolicyStatus,
  DashboardPolicyStatusFilter,
  DashboardPolicyType,
  DashboardPoliciesLoadResult,
} from "@/types/dashboardPolicy";
import type { DepositPolicy } from "@/types/depositPolicy";
import type { PricingPolicy } from "@/types/pricingPolicy";
import type { VisaPolicy } from "@/types/visaPolicy";

export interface DashboardPolicyFilters {
  searchQuery: string;
  statusFilter: DashboardPolicyStatusFilter;
}

export const POLICY_MANAGE_ROUTE: Record<DashboardPolicyType, string> = {
  pricing: "/pricing-policies",
  deposit: "/deposit-policies",
  cancellation: "/cancellation-policies",
  visa: "/visa-policies",
};

const POLICY_TYPE_LABEL: Record<DashboardPolicyType, string> = {
  pricing: "Pricing",
  deposit: "Deposit",
  cancellation: "Cancellation",
  visa: "Visa",
};

const POLICY_TOGGLE_REASON: Record<DashboardPolicyType, string | null> = {
  pricing: "Status changes are managed inside pricing policy details.",
  deposit: "Status changes are managed inside deposit policy details.",
  cancellation: null,
  visa: "Status changes are managed inside visa policy details.",
};

const DEFAULT_ERROR_MESSAGE = "Unable to load policy data. Please try again.";

const toDateOrNull = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) {
    return null;
  }

  return value;
};

const normalizeStatus = (
  status: DashboardPolicyStatus,
  fallbackLabel: string,
): { status: DashboardPolicyStatus; statusLabel: string } => {
  if (fallbackLabel.trim().length > 0) {
    return {
      status,
      statusLabel: fallbackLabel,
    };
  }

  return {
    status,
    statusLabel: status === "active" ? "Active" : "Inactive",
  };
};

const buildViewHref = (type: DashboardPolicyType, sourceId: string): string => {
  return `${POLICY_MANAGE_ROUTE[type]}?policyId=${encodeURIComponent(sourceId)}&mode=view`;
};

const buildEditHref = (type: DashboardPolicyType, sourceId: string): string => {
  return `${POLICY_MANAGE_ROUTE[type]}?policyId=${encodeURIComponent(sourceId)}&mode=edit`;
};

const mapPricingPolicy = (policy: PricingPolicy): DashboardPolicyListItem => {
  const status = policy.status === 1 ? "active" : "inactive";
  const normalized = normalizeStatus(status, policy.statusName ?? "");
  return {
    rowKey: `pricing-${policy.id}`,
    sourceId: policy.id,
    type: "pricing",
    typeLabel: POLICY_TYPE_LABEL.pricing,
    title: policy.name,
    subtitle: policy.policyCode,
    scope: policy.tourTypeName || "N/A",
    status: normalized.status,
    statusLabel: normalized.statusLabel,
    updatedAt: toDateOrNull(policy.lastModifiedOnUtc) ?? toDateOrNull(policy.createdOnUtc),
    manageHref: POLICY_MANAGE_ROUTE.pricing,
    viewHref: buildViewHref("pricing", policy.id),
    editHref: buildEditHref("pricing", policy.id),
    canEdit: true,
    canToggleStatus: false,
    toggleBlockedReason: POLICY_TOGGLE_REASON.pricing,
    togglePayload: null,
  };
};

const mapDepositPolicy = (policy: DepositPolicy): DashboardPolicyListItem => {
  const status = policy.isActive ? "active" : "inactive";
  const normalized = normalizeStatus(status, "");
  return {
    rowKey: `deposit-${policy.id}`,
    sourceId: policy.id,
    type: "deposit",
    typeLabel: POLICY_TYPE_LABEL.deposit,
    title: `${policy.depositTypeName} deposit`,
    subtitle: `${policy.depositValue}${policy.depositType === 1 ? "%" : ""}`,
    scope: policy.tourScopeName || "N/A",
    status: normalized.status,
    statusLabel: normalized.statusLabel,
    updatedAt: toDateOrNull(policy.lastModifiedOnUtc) ?? toDateOrNull(policy.createdOnUtc),
    manageHref: POLICY_MANAGE_ROUTE.deposit,
    viewHref: buildViewHref("deposit", policy.id),
    editHref: buildEditHref("deposit", policy.id),
    canEdit: true,
    canToggleStatus: false,
    toggleBlockedReason: POLICY_TOGGLE_REASON.deposit,
    togglePayload: null,
  };
};

const mapCancellationPolicy = (policy: CancellationPolicy): DashboardPolicyListItem => {
  const status = policy.status === 1 ? "active" : "inactive";
  const normalized = normalizeStatus(status, policy.statusName ?? "");
  const nextStatus = status === "active" ? 2 : 1;

  return {
    rowKey: `cancellation-${policy.id}`,
    sourceId: policy.id,
    type: "cancellation",
    typeLabel: POLICY_TYPE_LABEL.cancellation,
    title: policy.policyCode,
    subtitle: `${policy.tiers.length} tier${policy.tiers.length !== 1 ? "s" : ""}`,
    scope: policy.tourScopeName || "N/A",
    status: normalized.status,
    statusLabel: normalized.statusLabel,
    updatedAt: toDateOrNull(policy.lastModifiedOnUtc) ?? toDateOrNull(policy.createdOnUtc),
    manageHref: POLICY_MANAGE_ROUTE.cancellation,
    viewHref: buildViewHref("cancellation", policy.id),
    editHref: buildEditHref("cancellation", policy.id),
    canEdit: true,
    canToggleStatus: true,
    toggleBlockedReason: null,
    togglePayload: {
      id: policy.id,
      tourScope: policy.tourScope,
      tiers: policy.tiers,
      status: nextStatus,
    },
  };
};

const mapVisaPolicy = (policy: VisaPolicy): DashboardPolicyListItem => {
  const status = policy.isActive ? "active" : "inactive";
  const normalized = normalizeStatus(status, "");

  return {
    rowKey: `visa-${policy.id}`,
    sourceId: policy.id,
    type: "visa",
    typeLabel: POLICY_TYPE_LABEL.visa,
    title: policy.region,
    subtitle: `${policy.processingDays} days processing`,
    scope: policy.fullPaymentRequired ? "Full payment required" : "Deposit allowed",
    status: normalized.status,
    statusLabel: normalized.statusLabel,
    updatedAt: toDateOrNull(policy.lastModifiedOnUtc) ?? toDateOrNull(policy.createdOnUtc),
    manageHref: POLICY_MANAGE_ROUTE.visa,
    viewHref: buildViewHref("visa", policy.id),
    editHref: buildEditHref("visa", policy.id),
    canEdit: true,
    canToggleStatus: false,
    toggleBlockedReason: POLICY_TOGGLE_REASON.visa,
    togglePayload: null,
  };
};

export const normalizeDashboardPolicies = (payload: {
  pricing: PricingPolicy[];
  deposit: DepositPolicy[];
  cancellation: CancellationPolicy[];
  visa: VisaPolicy[];
}): DashboardPolicyListItem[] => {
  const all = [
    ...payload.pricing.map(mapPricingPolicy),
    ...payload.deposit.map(mapDepositPolicy),
    ...payload.cancellation.map(mapCancellationPolicy),
    ...payload.visa.map(mapVisaPolicy),
  ];

  return all.sort((left, right) => {
    if (!left.updatedAt && !right.updatedAt) {
      return left.title.localeCompare(right.title);
    }

    if (!left.updatedAt) {
      return 1;
    }

    if (!right.updatedAt) {
      return -1;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
};

export const filterDashboardPolicies = (
  policies: DashboardPolicyListItem[],
  filters: DashboardPolicyFilters,
): DashboardPolicyListItem[] => {
  const normalizedQuery = filters.searchQuery.trim().toLowerCase();

  return policies.filter((policy) => {
    if (filters.statusFilter !== "all" && policy.status !== filters.statusFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchText = `${policy.title} ${policy.subtitle} ${policy.scope} ${policy.typeLabel}`
      .toLowerCase();

    return searchText.includes(normalizedQuery);
  });
};

export const calculateDashboardPolicyMetrics = (
  policies: DashboardPolicyListItem[],
): DashboardPolicyMetrics => {
  const typeCounts = {
    pricing: 0,
    deposit: 0,
    cancellation: 0,
    visa: 0,
  };

  let activePolicies = 0;
  let inactivePolicies = 0;

  policies.forEach((policy) => {
    typeCounts[policy.type] += 1;

    if (policy.status === "active") {
      activePolicies += 1;
    } else {
      inactivePolicies += 1;
    }
  });

  return {
    totalPolicies: policies.length,
    activePolicies,
    inactivePolicies,
    typeCounts,
  };
};

export const getStatusVariant = (status: DashboardPolicyStatus): string => {
  return status === "active"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-100 text-slate-600";
};

export const getPrimaryPolicyCreateHref = (): string => {
  return POLICY_MANAGE_ROUTE.pricing;
};

export const getToggleActionLabel = (policy: DashboardPolicyListItem): string => {
  if (policy.status === "active") {
    return "Deactivate";
  }

  return "Activate";
};

export const loadDashboardPoliciesData = async (): Promise<DashboardPoliciesLoadResult> => {
  const response = await dashboardPoliciesService.getAll();

  if (!response.success || !response.data) {
    return {
      state: "error",
      policies: [],
      errorMessage: response.error?.message || DEFAULT_ERROR_MESSAGE,
    };
  }

  const policies = normalizeDashboardPolicies(response.data);

  if (policies.length === 0) {
    return {
      state: "empty",
      policies,
      errorMessage: null,
    };
  }

  return {
    state: "ready",
    policies,
    errorMessage: null,
  };
};
