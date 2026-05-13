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

export type PricingPolicyStatusValue = "Active" | "Inactive";
export type TourTypeValue = "Private" | "Public" | "Group";

export interface PricingPolicy {
  id: string;
  policyCode: string;
  name: string;
  tourType: TourTypeValue;
  tourTypeName: string;
  status: PricingPolicyStatusValue;
  statusName: string;
  isDefault: boolean;
  tiers: PricingPolicyTier[];
  translations?: PricingPolicyTranslations;
  createdOnUtc: string;
  lastModifiedOnUtc: string | null;
}

export interface CreatePricingPolicyRequest {
  name: string;
  tourType: TourTypeValue;
  tiers: PricingPolicyTier[];
  isDefault?: boolean;
  translations?: PricingPolicyTranslations;
}

export interface UpdatePricingPolicyRequest {
  id: string;
  name: string;
  tourType: TourTypeValue;
  tiers: PricingPolicyTier[];
  status?: PricingPolicyStatusValue;
  translations?: PricingPolicyTranslations;
}

export const PricingPolicyStatusMap: Record<PricingPolicyStatusValue, string> = {
  Active: "Active",
  Inactive: "Inactive",
};

export const TourTypeMap: Record<TourTypeValue, string> = {
  Private: "Private",
  Public: "Public",
  Group: "Group",
};
