import type { AxiosError } from "axios";

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRYABLE_STATUS_CODES = [500, 501, 502, 503, 504, 505];

export const createRetryConfig = (
  overrides: Partial<RetryConfig> = {},
): RetryConfig => {
  return {
    maxRetries: overrides.maxRetries ?? 3,
    baseDelayMs: overrides.baseDelayMs ?? 1000,
    retryableStatusCodes:
      overrides.retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES,
  };
};

export const getRetryDelayMs = (
  retryAttempt: number,
  baseDelayMs = 1000,
): number => {
  const normalizedAttempt = Math.max(retryAttempt, 1);
  return baseDelayMs * 2 ** (normalizedAttempt - 1);
};

export const shouldRetryError = (
  error: AxiosError,
  retryCount: number,
  config: RetryConfig = createRetryConfig(),
): boolean => {
  if (retryCount >= config.maxRetries) {
    return false;
  }

  if (error.code === "ECONNABORTED") {
    return true;
  }

  const status = error.response?.status;
  if (status == null) {
    return false;
  }

  return config.retryableStatusCodes.includes(status);
};
