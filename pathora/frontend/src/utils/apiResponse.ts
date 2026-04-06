import { isAxiosError } from "axios";

import type { ApiError, ServiceResponse } from "../types/api";

export const extractItems = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as {
    result?: unknown;
    data?: unknown;
  };

  if (data.result && typeof data.result === "object") {
    const resultObj = data.result as { items?: unknown };
    if (Array.isArray(resultObj.items)) {
      return resultObj.items as T[];
    }
    if (Array.isArray(data.result)) {
      return data.result as T[];
    }
  }

  if (data.data && typeof data.data === "object") {
    const dataObj = data.data as { items?: unknown };
    if (Array.isArray(dataObj.items)) {
      return dataObj.items as T[];
    }
    if (Array.isArray(data.data)) {
      return data.data as T[];
    }
  }

  return [];
};

export const extractResult = <T>(payload: unknown): T | null => {
  if (payload == null) {
    return null;
  }

  if (typeof payload !== "object") {
    return payload as T;
  }

  const data = payload as {
    result?: unknown;
    data?: unknown;
    value?: unknown;
  };

  if (data.result !== undefined) {
    return data.result as T;
  }

  if (data.data !== undefined) {
    return data.data as T;
  }

  if (data.value !== undefined) {
    return data.value as T;
  }

  return null;
};

export const extractData = <T>(payload: unknown): T | null => {
  if (payload == null) {
    return null;
  }

  if (typeof payload === "object" && "success" in payload) {
    const response = payload as ServiceResponse<T>;
    if (!response.success) {
      return null;
    }
    return response.data ?? null;
  }

  return extractResult<T>(payload);
};

interface BackendErrorItem {
  code?: string;
  errorMessage?: string;
  message?: string;
  details?: string;
}

interface BackendErrorPayload {
  message?: string;
  errors?: BackendErrorItem[];
}

// Map backend error codes/messages to translation keys
const mapToTranslationKey = (errorMessage: string): string => {
  // Map backend error codes to translation keys for login-specific errors
  if (errorMessage === "User.NotFound" || errorMessage === "User.InvalidPassword") {
    return "error_response.INVALID_CREDENTIALS";
  }
  if (errorMessage === "User.Disabled" || errorMessage === "User.IsDisabled") {
    return "error_response.USER_DISABLED";
  }
  // Map FluentValidation messages for password change
  if (errorMessage === "Old password is required.") {
    return "error_response.PASSWORD_OLD_REQUIRED";
  }
  if (errorMessage === "New password is required.") {
    return "error_response.PASSWORD_IS_REQUIRED";
  }
  if (
    errorMessage ===
    "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one digit, and one special character."
  ) {
    return "error_response.PASSWORD_COMPLEXITY";
  }
  if (errorMessage === "New password must not be the same as the old password.") {
    return "error_response.PASSWORD_MUST_DIFFER";
  }
  if (errorMessage === "Current password is incorrect.") {
    return "error_response.INVALID_CREDENTIALS";
  }
  // Return original to allow fallback to error_response lookup
  return errorMessage;
};

const shouldUseDetailsAsErrorCode = (details: string | undefined): boolean => {
  if (!details) {
    return false;
  }

  return (
    details === "User.NotFound" ||
    details === "User.InvalidPassword" ||
    details === "User.Disabled" ||
    details === "User.IsDisabled"
  );
};

const extractBackendErrorPayload = (
  payload: unknown,
): { rawMessage: string; rawCode: string; rawDetails?: string } => {
  if (!payload || typeof payload !== "object") {
    return {
      rawMessage: "DEFAULT_ERROR",
      rawCode: "UNKNOWN_ERROR",
    };
  }

  const body = payload as BackendErrorPayload;
  const firstError = body.errors?.[0];

  return {
    rawMessage:
      firstError?.errorMessage ??
      firstError?.message ??
      body.message ??
      "DEFAULT_ERROR",
    rawCode: firstError?.code ?? "UNKNOWN_ERROR",
    rawDetails: firstError?.details,
  };
};

export const handleApiError = (error: unknown): ApiError => {
  if (isAxiosError(error)) {
    const { rawMessage, rawCode, rawDetails } = extractBackendErrorPayload(error.response?.data);
    const rawMappingCandidate = shouldUseDetailsAsErrorCode(rawDetails)
      ? rawDetails
      : rawMessage;

    // Map to translation key for specific error types
    const translationKey = mapToTranslationKey(rawMappingCandidate);

    return {
      code: rawCode !== "UNKNOWN_ERROR" ? rawCode : String(error.response?.status ?? "UNKNOWN_ERROR"),
      message: translationKey,
      details: rawDetails,
    };
  }

  if (error && typeof error === "object" && "status" in error) {
    const rtkError = error as {
      status?: number | string;
      data?: unknown;
      error?: string;
    };
    const { rawMessage, rawCode, rawDetails } = extractBackendErrorPayload(rtkError.data);
    const rawMappingCandidate = shouldUseDetailsAsErrorCode(rawDetails)
      ? rawDetails
      : rawMessage !== "DEFAULT_ERROR"
        ? rawMessage
        : (rtkError.error ?? rawMessage);

    if (process.env.NODE_ENV === "development") {
      console.warn("[handleApiError][rtk]", {
        status: rtkError.status,
        rawMessage,
        rawDetails,
      });
    }

    return {
      code: rawCode !== "UNKNOWN_ERROR" ? rawCode : String(rtkError.status ?? "UNKNOWN_ERROR"),
      message: mapToTranslationKey(rawMappingCandidate),
      details: rawDetails,
    };
  }

  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      message: error.message || "DEFAULT_ERROR",
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "DEFAULT_ERROR",
  };
};
