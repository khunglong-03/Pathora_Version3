// Tax Config Types

export interface TaxConfig {
  id: string;
  taxName: string;
  taxCode?: string;
  taxRate: number;
  description?: string;
  isActive: boolean;
  effectiveDate: string;
  createdBy?: string;
  lastModifiedBy?: string;
  createdOnUtc: string;
  lastModifiedOnUtc: string | null;
}

export interface CreateTaxConfigRequest {
  taxName: string;
  taxRate: number;
  description?: string;
  effectiveDate: string;
}

export interface UpdateTaxConfigRequest {
  id: string;
  taxName: string;
  taxRate: number;
  description?: string;
  effectiveDate: string;
  isActive: boolean;
}
