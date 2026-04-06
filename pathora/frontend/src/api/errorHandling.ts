import type {
  AxiosError,
  AxiosRequestHeaders,
  RawAxiosRequestHeaders,
} from "axios";

interface ErrorDetail {
  errorMessage?: string;
  message?: string;
  details?: string;
}

interface ErrorResponsePayload {
  errors?: ErrorDetail[];
  message?: string;
}

interface ErrorToastPayload {
  key: string;
  details?: string;
}

interface ErrorLogPayload {
  message: string;
  code: string;
  endpoint: string;
  baseUrl: string;
  requestUrl: string;
  origin: string;
  method: string;
  statusCode: number | null;
  timestamp: string;
  headers: Record<string, string>;
}

const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
]);

const toHeaderRecord = (
  headers: AxiosRequestHeaders | RawAxiosRequestHeaders | undefined,
): Record<string, string> => {
  if (!headers) {
    return {};
  }

  const result: Record<string, string> = {};
  Object.entries(headers).forEach(([name, value]) => {
    if (value == null) {
      return;
    }
    result[name] = String(value);
  });

  return result;
};

const sanitizeHeaders = (
  headers: AxiosRequestHeaders | RawAxiosRequestHeaders | undefined,
): Record<string, string> => {
  const sanitized: Record<string, string> = {};

  Object.entries(toHeaderRecord(headers)).forEach(([name, value]) => {
    if (SENSITIVE_HEADER_NAMES.has(name.toLowerCase())) {
      return;
    }
    sanitized[name] = value;
  });

  return sanitized;
};

const getStatusErrorKey = (status: number): string => {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    default:
      return status >= 500 ? "SERVER_ERROR" : "DEFAULT_ERROR";
  }
};

// Map backend error codes to frontend translation keys for login-specific errors
const mapBackendErrorCode = (errorMessage: string): string => {
  // Map backend error codes to translation keys
  if (errorMessage === "User.NotFound" || errorMessage === "User.InvalidPassword") {
    return "INVALID_CREDENTIALS";
  }
  if (errorMessage === "User.Disabled" || errorMessage === "User.IsDisabled") {
    return "USER_DISABLED";
  }
  // Return original if no mapping found
  return errorMessage;
};

export const resolveErrorToast = (
  error: AxiosError<ErrorResponsePayload>,
): ErrorToastPayload => {
  if (error.code === "ECONNABORTED") {
    return { key: "TIMEOUT_ERROR" };
  }

  const response = error.response;
  if (response) {
    const data = response.data;
    const firstError = data?.errors?.[0];

    if (firstError?.errorMessage || firstError?.message) {
      const rawKey = firstError.errorMessage ?? firstError.message ?? "DEFAULT_ERROR";
      const mappedKey = mapBackendErrorCode(rawKey);
      return {
        key: mappedKey,
        details: firstError.details,
      };
    }

    if (data?.message) {
      const mappedKey = mapBackendErrorCode(data.message);
      return { key: mappedKey };
    }

    // For 401 on login endpoints, check if it's invalid credentials vs session expired
    if (response.status === 401) {
      return { key: "INVALID_CREDENTIALS" };
    }

    return { key: getStatusErrorKey(response.status) };
  }

  if (error.request) {
    return { key: "NETWORK_ERROR" };
  }

  return { key: "DEFAULT_ERROR" };
};

export const buildErrorLogPayload = (
  error: AxiosError,
  timestamp = new Date().toISOString(),
): ErrorLogPayload => {
  const message = error.message ?? "Unknown error";
  const code = error.code ?? "UNKNOWN";
  const method = (error.config?.method ?? "GET").toUpperCase();
  const requestUrl = error.config?.url ?? "unknown";
  const baseUrl = error.config?.baseURL ?? "unknown";
  const endpoint =
    /^https?:\/\//i.test(requestUrl) || baseUrl === "unknown"
      ? requestUrl
      : `${baseUrl.replace(/\/$/, "")}/${requestUrl.replace(/^\//, "")}`;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "server";
  const statusCode = error.response?.status ?? null;
  const headers = sanitizeHeaders(error.config?.headers);

  return {
    message,
    code,
    endpoint,
    baseUrl,
    requestUrl,
    origin,
    method,
    statusCode,
    timestamp,
    headers,
  };
};

export const logApiError = (
  error: AxiosError,
  timestamp = new Date().toISOString(),
): void => {
  console.warn("[API_ERROR]", buildErrorLogPayload(error, timestamp));

  if (process.env.NODE_ENV === "development") {
    console.debug("[API_ERROR_FULL]", error);
  }
};
