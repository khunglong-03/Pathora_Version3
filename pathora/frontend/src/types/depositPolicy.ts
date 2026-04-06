// Deposit Policy Types

export interface DepositPolicyTranslation {
  description?: string;
}

export type DepositPolicyTranslations = Record<string, DepositPolicyTranslation>;

export interface DepositPolicy {
  id: string;
  tourScope: number;
  tourScopeName: string;
  depositType: number;
  depositTypeName: string;
  depositValue: number;
  minDaysBeforeDeparture: number;
  isActive: boolean;
  translations?: DepositPolicyTranslations;
  createdBy?: string;
  lastModifiedBy?: string;
  createdOnUtc: string;
  lastModifiedOnUtc: string | null;
}

export interface CreateDepositPolicyRequest {
  tourScope: number;
  depositType: number;
  depositValue: number;
  minDaysBeforeDeparture: number;
  translations?: DepositPolicyTranslations;
}

export interface UpdateDepositPolicyRequest {
  id: string;
  tourScope: number;
  depositType: number;
  depositValue: number;
  minDaysBeforeDeparture: number;
  isActive: boolean;
  translations?: DepositPolicyTranslations;
}

export const TourScopeMap: Record<number, string> = {
  1: "Domestic",
  2: "International",
};

export const DepositTypeMap: Record<number, string> = {
  1: "Percentage",
  2: "Fixed Amount",
};
