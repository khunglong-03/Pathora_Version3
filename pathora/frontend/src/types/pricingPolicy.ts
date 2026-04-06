// Pricing Policy Types

export interface PricingPolicyTier {
  id?: string;
  label: string;
  ageFrom: number;
  ageTo: number | null;
  pricePercentage: number;
}

export interface PricingPolicyTranslation {
  name?: string;
  description?: string;
}

export type PricingPolicyTranslations = Record<string, PricingPolicyTranslation>;

export interface PricingPolicy {
  id: string;
  policyCode: string;
  name: string;
  tourType: number;
  tourTypeName: string;
  status: number;
  statusName: string;
  isDefault: boolean;
  tiers: PricingPolicyTier[];
  translations?: PricingPolicyTranslations;
  createdOnUtc: string;
  lastModifiedOnUtc: string | null;
}

export interface CreatePricingPolicyRequest {
  name: string;
  tourType: number;
  tiers: PricingPolicyTier[];
  isDefault?: boolean;
  translations?: PricingPolicyTranslations;
}

export interface UpdatePricingPolicyRequest {
  id: string;
  name: string;
  tourType: number;
  tiers: PricingPolicyTier[];
  status?: number;
  translations?: PricingPolicyTranslations;
}

export const PricingPolicyStatusMap: Record<number, string> = {
  1: "Active",
  2: "Inactive",
};

export const TourTypeMap: Record<number, string> = {
  1: "Private",
  2: "Public",
  3: "Group",
};
