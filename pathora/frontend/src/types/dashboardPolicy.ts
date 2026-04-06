export type DashboardPolicyType = "pricing" | "deposit" | "cancellation" | "visa";

export type DashboardPolicyStatus = "active" | "inactive";

export type DashboardPolicyStatusFilter = "all" | DashboardPolicyStatus;

export type DashboardPoliciesDataState = "loading" | "ready" | "empty" | "error";

export interface PolicyTypeCounts {
  pricing: number;
  deposit: number;
  cancellation: number;
  visa: number;
}

export interface DashboardPolicyMetrics {
  totalPolicies: number;
  activePolicies: number;
  inactivePolicies: number;
  typeCounts: PolicyTypeCounts;
}

export interface DashboardPolicyListItem {
  rowKey: string;
  sourceId: string;
  type: DashboardPolicyType;
  typeLabel: string;
  title: string;
  subtitle: string;
  scope: string;
  status: DashboardPolicyStatus;
  statusLabel: string;
  updatedAt: string | null;
  manageHref: string;
  viewHref: string;
  editHref: string;
  canEdit: boolean;
  canToggleStatus: boolean;
  toggleBlockedReason: string | null;
  togglePayload:
    | {
        id: string;
        tourScope: number;
        tiers: { minDaysBeforeDeparture: number; maxDaysBeforeDeparture: number; penaltyPercentage: number }[];
        status: number;
      }
    | null;
}

export interface DashboardPoliciesLoadResult {
  state: DashboardPoliciesDataState;
  policies: DashboardPolicyListItem[];
  errorMessage: string | null;
}
