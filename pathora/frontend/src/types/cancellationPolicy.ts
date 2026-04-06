// Cancellation Policy Types

export interface CancellationPolicyTier {
  minDaysBeforeDeparture: number;
  maxDaysBeforeDeparture: number;
  penaltyPercentage: number;
}

export interface CancellationPolicyTranslation {
  description?: string;
}

export type CancellationPolicyTranslations = Record<string, CancellationPolicyTranslation>;

export interface CancellationPolicy {
  id: string;
  policyCode: string;
  tourScope: number;
  tourScopeName: string;
  tiers: CancellationPolicyTier[];
  status: number;
  statusName: string;
  translations?: CancellationPolicyTranslations;
  createdBy?: string;
  lastModifiedBy?: string;
  createdOnUtc: string;
  lastModifiedOnUtc: string | null;
}

export interface CreateCancellationPolicyRequest {
  tourScope: number;
  tiers: CancellationPolicyTier[];
  translations?: CancellationPolicyTranslations;
}

export interface UpdateCancellationPolicyRequest {
  id: string;
  tourScope: number;
  tiers: CancellationPolicyTier[];
  status?: number;
  translations?: CancellationPolicyTranslations;
}

export const TourScopeMap: Record<number, string> = {
  1: "Domestic",
  2: "International",
};

export const CancellationPolicyStatusMap: Record<number, string> = {
  1: "Active",
  2: "Inactive",
};
