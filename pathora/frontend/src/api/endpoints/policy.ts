// Policy Endpoints (Pricing, Visa, Deposit, Cancellation, Tax)

export type EndpointWithId = (id: string) => string;

export interface PricingPolicyEndpoints {
  GET_ALL: string;
  GET_DETAIL: EndpointWithId;
  CREATE: string;
  UPDATE: string;
  DELETE: EndpointWithId;
  SET_DEFAULT: EndpointWithId;
}

export interface VisaPolicyEndpoints {
  GET_ALL: string;
  GET_DETAIL: EndpointWithId;
  CREATE: string;
  UPDATE: string;
  DELETE: EndpointWithId;
}

export interface DepositPolicyEndpoints {
  GET_ALL: string;
  GET_DETAIL: EndpointWithId;
  CREATE: string;
  UPDATE: string;
  DELETE: EndpointWithId;
}

export interface CancellationPolicyEndpoints {
  GET_ALL: string;
  GET_DETAIL: EndpointWithId;
  CREATE: string;
  UPDATE: string;
  DELETE: EndpointWithId;
}

export interface TaxConfigEndpoints {
  GET_ALL: string;
  GET_DETAIL: EndpointWithId;
  CREATE: string;
  UPDATE: string;
  DELETE: EndpointWithId;
}

export const PRICING_POLICY: PricingPolicyEndpoints = {
  GET_ALL: "/api/pricing-policies",
  GET_DETAIL: (id: string): string => `/api/pricing-policies/${id}`,
  CREATE: "/api/pricing-policies",
  UPDATE: "/api/pricing-policies",
  DELETE: (id: string): string => `/api/pricing-policies/${id}`,
  SET_DEFAULT: (id: string): string => `/api/pricing-policies/${id}/set-default`,
};

export const VISA_POLICY: VisaPolicyEndpoints = {
  GET_ALL: "/api/visa-policy",
  GET_DETAIL: (id: string): string => `/api/visa-policy/${id}`,
  CREATE: "/api/visa-policy",
  UPDATE: "/api/visa-policy",
  DELETE: (id: string): string => `/api/visa-policy/${id}`,
};

export const DEPOSIT_POLICY: DepositPolicyEndpoints = {
  GET_ALL: "/api/deposit-policies",
  GET_DETAIL: (id: string): string => `/api/deposit-policies/${id}`,
  CREATE: "/api/deposit-policies",
  UPDATE: "/api/deposit-policies",
  DELETE: (id: string): string => `/api/deposit-policies/${id}`,
};

export const CANCELLATION_POLICY: CancellationPolicyEndpoints = {
  GET_ALL: "/api/cancellation-policies",
  GET_DETAIL: (id: string): string => `/api/cancellation-policies/${id}`,
  CREATE: "/api/cancellation-policies",
  UPDATE: "/api/cancellation-policies",
  DELETE: (id: string): string => `/api/cancellation-policies/${id}`,
};

export const TAX_CONFIG: TaxConfigEndpoints = {
  GET_ALL: "/api/tax-configs",
  GET_DETAIL: (id: string): string => `/api/tax-configs/${id}`,
  CREATE: "/api/tax-configs",
  UPDATE: "/api/tax-configs",
  DELETE: (id: string): string => `/api/tax-configs/${id}`,
};
