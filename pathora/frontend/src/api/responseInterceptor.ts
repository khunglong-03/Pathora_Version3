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
import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";
import { getCookie } from "@/utils/cookie";

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

/** Tracks whether a refresh is already in-flight to avoid concurrent refresh calls */
let isRefreshing = false;
/** Queue of pending requests to retry after refresh succeeds */
let refreshQueue: Array<() => void> = [];

const processRefreshQueue = (error?: Error | null) => {
  refreshQueue.forEach((cb) => cb());
  refreshQueue = [];
  if (error) {
    // Refresh failed — redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }
};

/**
 * Calls POST /api/auth/refresh to rotate token pair.
 * Refresh token is sent as HttpOnly cookie automatically by the browser.
 * Backend returns the new access token in the response body (since the cookie is HttpOnly).
 * Returns the new access token on success, throws on failure.
 */
const callRefreshEndpoint = async (): Promise<string> => {
  // Use withCredentials so the browser sends the HttpOnly refresh_token cookie
  const response = await axios.post<{ data: { accessToken: string } }>(
    "/api/auth/refresh",
    {},
    {
      baseURL: API_GATEWAY_BASE_URL,
      withCredentials: true,
    },
  );
  return response.data.data.accessToken;
};

export const handleResponseError = async (
  error: AxiosError,
  deps: ResponseErrorDependencies,
): Promise<AxiosResponse> => {
  logApiError(error);

  const originalConfig = error.config as RetryableRequestConfig | undefined;

  // ── Attempt automatic token refresh on 401 ──────────────────────
  const isAuthChallenge = error.response?.status === 401;
  const isRefreshRequest = originalConfig?.url?.includes("/auth/refresh");
  const isAlreadyRefreshing = originalConfig?.__isAuthRequest;

  if (isAuthChallenge && !isRefreshRequest && !isAlreadyRefreshing) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        // Call refresh — browser auto-sends HttpOnly refresh_token cookie
        const newAccessToken = await callRefreshEndpoint();

        // Update access_token cookie (non-HttpOnly, JS-readable)
        if (typeof document !== "undefined") {
          const isSecure = window.location.protocol === "https:";
          const sameSite = isSecure ? "None" : "Lax";
          document.cookie = `access_token=${newAccessToken}; path=/; SameSite=${sameSite}${isSecure ? "; Secure" : ""}`;
        }

        // Retry the original request with the new token
        if (originalConfig) {
          originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
          originalConfig.__isAuthRequest = true;
        }

        const retryResponse = await deps.request(originalConfig!);
        isRefreshing = false;
        processRefreshQueue();
        return retryResponse;
      } catch (refreshError) {
        isRefreshing = false;
        processRefreshQueue(refreshError as Error);
        // Clear cookies and redirect
        deps.onUnauthorized();
        return Promise.reject(error);
      }
    } else {
      // Refresh already in progress — queue this request
      return new Promise((resolve, reject) => {
        refreshQueue.push(() => {
          if (originalConfig) {
            // Re-read token from cookie (set by the in-flight refresh)
            const newToken = getCookie("access_token");
            if (newToken) {
              originalConfig.headers.Authorization = `Bearer ${newToken}`;
            }
            originalConfig.__isAuthRequest = true;
          }
          deps
            .request(originalConfig!)
            .then(resolve)
            .catch(reject);
        });
      });
    }
  }

  // ── Retry logic for network/server errors ───────────────────────
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
