import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { logApiError, resolveErrorToast } from "./errorHandling";
import {
  createRetryConfig,
  getRetryDelayMs,
  shouldRetryError,
} from "./retryPolicy";
import { refreshAccessToken } from "./tokenRefreshCoordinator";

export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
  __isAuthRequest?: boolean;
}

export interface ResponseErrorDependencies {
  request: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;
  wait: (delayMs: number) => Promise<void>;
  showError: (key: string, details?: string) => void;
  onUnauthorized: () => void;
}

export const waitForRetry = (delayMs: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
};

/**
 * On 401, rotate access token via tokenRefreshCoordinator (shared with RTK Query) and retry once.
 * refresh_token is mirrored on a non-HttpOnly cookie on the frontend domain; the browser sends it with withCredentials: true.
 * Backend returns the new access_token in the response body.
 */
export const handleResponseError = async (
  error: AxiosError,
  deps: ResponseErrorDependencies,
): Promise<AxiosResponse> => {
  logApiError(error);

  const originalConfig = error.config as RetryableRequestConfig | undefined;

  const isAuthChallenge = error.response?.status === 401;
  const isRefreshRequest = originalConfig?.url?.includes("/auth/refresh");
  const isAlreadyRefreshing = originalConfig?.__isAuthRequest;

  if (isAuthChallenge && !isRefreshRequest && !isAlreadyRefreshing) {
    try {
      const newAccessToken = await refreshAccessToken();

      if (originalConfig) {
        originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
        originalConfig.__isAuthRequest = true;
      }

      return await deps.request(originalConfig!);
    } catch {
      deps.onUnauthorized();
      return Promise.reject(error);
    }
  }

  const retryConfig = createRetryConfig();
  const retryCount = originalConfig?.__retryCount ?? 0;

  if (originalConfig && shouldRetryError(error, retryCount, retryConfig)) {
    const nextRetryCount = retryCount + 1;
    originalConfig.__retryCount = nextRetryCount;
    await deps.wait(getRetryDelayMs(nextRetryCount, retryConfig.baseDelayMs));
    return deps.request(originalConfig);
  }

  const errorToast = resolveErrorToast(error);
  deps.showError(errorToast.key, errorToast.details);

  if (error.response?.status === 401) {
    deps.onUnauthorized();
  }

  return Promise.reject(error);
};
