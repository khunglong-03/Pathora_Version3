// Visa Policy Types

export interface VisaPolicyTranslation {
  region?: string;
  note?: string;
}

export type VisaPolicyTranslations = Record<string, VisaPolicyTranslation>;

export interface VisaPolicy {
  id: string;
  region: string;
  processingDays: number;
  bufferDays: number;
  fullPaymentRequired: boolean;
  isActive: boolean;
  translations?: VisaPolicyTranslations;
  createdBy?: string;
  lastModifiedBy?: string;
  createdOnUtc: string;
  lastModifiedOnUtc: string | null;
}

export interface CreateVisaPolicyRequest {
  region: string;
  processingDays: number;
  bufferDays: number;
  fullPaymentRequired: boolean;
  translations?: VisaPolicyTranslations;
}

export interface UpdateVisaPolicyRequest {
  id: string;
  region: string;
  processingDays: number;
  bufferDays: number;
  fullPaymentRequired: boolean;
  isActive?: boolean;
  translations?: VisaPolicyTranslations;
}
