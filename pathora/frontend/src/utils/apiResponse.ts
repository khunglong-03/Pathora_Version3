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
  code?: string;
  message?: string;
  errors?: BackendErrorItem[];
}

/**
 * Canonical list of backend error codes for the per-activity transport
 * request & approval flow (ER-15). Must stay in sync with:
 * `panthora_be/src/Application/Common/Constant/ErrorConstants.TourInstanceTransport.cs`
 */
export const TOUR_INSTANCE_TRANSPORT_ERROR_CODES = [
  "TourInstanceActivity.SeatCountBelowCapacity",
  "TourInstanceActivity.DuplicateVehicle",
  "TourInstanceActivity.TransportFleetInsufficientCapacity",
  "TourInstanceActivity.VehicleCountMismatch",
  "TourInstanceActivity.VehicleCountExceedsFleet",
  "TourInstanceActivity.RoomCountExceedsInventory",
  "TourInstanceActivity.SupplierNotApplicable",
  "Vehicle.WrongType",
  "Vehicle.InsufficientCapacity",
  "Vehicle.WrongSupplier",
  "Vehicle.Unavailable",
  "RoomBlock.InsufficientInventory",
  "TourInstance.ProviderNotAssigned",
  "TourInstance.BulkApproveFailed",
  "TourInstance.CapacityExceeded",
  // Vehicle availability & schedule
  "VehicleAvailability.NoSupplier",
  "VehicleAvailability.ActivityNotOwned",
] as const;

export const TICKET_IMAGE_ERROR_CODES = [
  "TicketImage.NotFound",
  "TicketImage.ActivityNotExternal",
  "TicketImage.NoBookings",
  "TicketImage.InvalidFileType",
  "TicketImage.FileTooLarge",
  "TicketImage.EmptyFile",
  "TicketImage.CrossActivityDelete",
  "TicketImage.DeleteForbidden",
] as const;

/**
 * Maps a transport error code to its i18n translation key.
 * Returns null if the code is not in the allowlist.
 */
const TRANSPORT_ERROR_CODE_MAP: Record<string, string> = {
  "TourInstanceActivity.SeatCountBelowCapacity": "tourInstance.transport.errors.seatCountBelowCapacity",
  "TourInstanceActivity.DuplicateVehicle": "tourInstance.transport.errors.duplicateVehicleInActivity",
  "TourInstanceActivity.TransportFleetInsufficientCapacity":
    "tourInstance.transport.errors.transportFleetInsufficientCapacity",
  "Vehicle.WrongType": "tourInstance.transport.errors.vehicleWrongType",
  "Vehicle.InsufficientCapacity": "tourInstance.transport.errors.vehicleInsufficientCapacity",
  "Vehicle.WrongSupplier": "tourInstance.transport.errors.vehicleWrongSupplier",
  "Vehicle.Unavailable": "tourInstance.transport.errors.vehicleUnavailable",
  "RoomBlock.InsufficientInventory": "tourInstance.transport.errors.roomBlockInsufficientInventory",
  "TourInstance.ProviderNotAssigned": "tourInstance.transport.errors.providerNotAssigned",
  "TourInstance.BulkApproveFailed": "tourInstance.transport.errors.bulkApproveFailed",
  "TourInstance.CapacityExceeded": "tourInstance.transport.errors.capacityExceeded",
  "TourInstanceActivity.VehicleCountMismatch": "tourInstance.transport.errors.vehicleCountMismatch",
  "TourInstanceActivity.VehicleCountExceedsFleet": "tourInstance.transport.errors.vehicleCountExceedsFleet",
  "TourInstanceActivity.RoomCountExceedsInventory": "tourInstance.transport.errors.roomCountExceedsInventory",
  "TourInstanceActivity.SupplierNotApplicable": "tourInstance.transport.errors.supplierNotApplicable",
  "TourInstance.CreateFailed": "tourInstance.errors.createFailed",
  "TourInstance.UpdateFailed": "tourInstance.errors.updateFailed",
  "TourInstance.DeleteFailed": "tourInstance.errors.deleteFailed",
  "TourInstance.NotFound": "tourInstance.errors.notFound",
  // Vehicle availability & schedule
  "VehicleAvailability.NoSupplier": "tourInstance.transport.errors.vehicleAvailabilityNoSupplier",
  "VehicleAvailability.ActivityNotOwned": "tourInstance.transport.errors.vehicleAvailabilityActivityNotOwned",
  "TicketImage.NotFound": "tourInstance.transport.ticketImages.errors.notFound",
  "TicketImage.ActivityNotExternal": "tourInstance.transport.ticketImages.errors.activityNotExternal",
  "TicketImage.NoBookings": "tourInstance.transport.ticketImages.errors.noBookings",
  "TicketImage.InvalidFileType": "tourInstance.transport.ticketImages.errors.invalidFileType",
  "TicketImage.FileTooLarge": "tourInstance.transport.ticketImages.errors.fileTooLarge",
  "TicketImage.EmptyFile": "tourInstance.transport.ticketImages.errors.emptyFile",
  "TicketImage.CrossActivityDelete": "tourInstance.transport.ticketImages.errors.crossActivityDelete",
  "TicketImage.DeleteForbidden": "tourInstance.transport.ticketImages.errors.deleteForbidden",
};

const AUTH_ERROR_CODE_MAP: Record<string, string> = {
  TOKEN_MISSING: "error_response.UNAUTHORIZED",
  TOKEN_INVALID: "error_response.UNAUTHORIZED",
  TOKEN_EXPIRED: "error_response.UNAUTHORIZED",
  ACCESS_DENIED: "error_response.ACCESS_DENIED",
};

/**
 * Accept any dotted `Domain.Code` token (no spaces, at least one dot, all
 * chars are word/dot). This lets handlers prefer the structured `details`
 * field over the raw English `errorMessage` so the user sees a translated
 * toast for codes like `TourInstance.CreateFailed`.
 */
const DOTTED_ERROR_CODE_PATTERN = /^[\w]+(\.[\w]+)+$/;

/**
 * Structured error metadata for API error codes.
 * `remediation` is undefined today but the signature lets future PRs
 * add deep-link actions per code without a breaking change.
 */
export interface ApiErrorMeta {
  i18nKey: string | null;
  remediation?: { kind: "navigate" | "contact" | "retry"; payload: string };
}

/**
 * Returns structured metadata for a backend error code.
 * Useful for UI components that need more than just a translated string.
 */
export const getApiErrorMeta = (code: string | undefined): ApiErrorMeta => {
  if (!code) return { i18nKey: null };
  const key = TRANSPORT_ERROR_CODE_MAP[code] ?? null;
  return { i18nKey: key };
};

// Map backend error codes/messages to translation keys
export const mapToTranslationKey = (errorMessage: string): string => {
  // Check transport error codes first (most specific)
  const transportKey = TRANSPORT_ERROR_CODE_MAP[errorMessage];
  if (transportKey) {
    return transportKey;
  }

  const authKey = AUTH_ERROR_CODE_MAP[errorMessage];
  if (authKey) {
    return authKey;
  }

  // Map backend error codes to translation keys for login-specific errors
  if (errorMessage === "User.NotFound" || errorMessage === "User.InvalidPassword") {
    return "error_response.INVALID_CREDENTIALS";
  }
  if (errorMessage === "User.Unauthorized") {
    return "error_response.UNAUTHORIZED";
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

  // Unknown-code safety: never echo a raw backend code as a translation key lookup
  // to prevent translation-key injection (security finding S-3)
  if (errorMessage === "DEFAULT_ERROR") {
    return "error_response.UNEXPECTED";
  }

  // Dev-mode drift warning for unmapped backend codes
  if (process.env.NODE_ENV === "development" && DOTTED_ERROR_CODE_PATTERN.test(errorMessage)) {
    console.warn(`[handleApiError] Unmapped backend code: ${errorMessage}`);
  }

  // Return original to allow fallback to error_response lookup
  return errorMessage;
};

const shouldUseDetailsAsErrorCode = (details: string | undefined): boolean => {
  if (!details) {
    return false;
  }

  return DOTTED_ERROR_CODE_PATTERN.test(details);
};

const extractBackendErrorPayload = (
  payload: unknown,
): { rawMessage: string; rawCode: string; rawDetails?: string; rawValidationErrors?: Record<string, string[]> } => {
  if (!payload || typeof payload !== "object") {
    return {
      rawMessage: "DEFAULT_ERROR",
      rawCode: "UNKNOWN_ERROR",
    };
  }

  const body = payload as any; // Using any to handle both array and object 'errors' formats
  
  let validationErrors: Record<string, string[]> | undefined;
  let firstError: any = undefined;

  // Handle ASP.NET Core ValidationProblemDetails format where errors is an object: { "Field": ["Error 1"] }
  if (body.errors && typeof body.errors === "object" && !Array.isArray(body.errors)) {
    validationErrors = body.errors;
  } else if (Array.isArray(body.errors)) {
    firstError = body.errors[0];
  }

  const topLevelCode = typeof body.code === "string" ? body.code : undefined;

  return {
    rawMessage:
      firstError?.errorMessage ??
      firstError?.message ??
      body.message ??
      (validationErrors ? Object.values(validationErrors)[0]?.[0] : null) ??
      "DEFAULT_ERROR",
    rawCode: firstError?.code ?? topLevelCode ?? "UNKNOWN_ERROR",
    rawDetails: firstError?.details,
    rawValidationErrors: validationErrors,
  };
};

const resolveErrorMappingCandidate = (
  rawMessage: string,
  rawCode: string,
  rawDetails: string | undefined,
): string => {
  if (shouldUseDetailsAsErrorCode(rawDetails)) {
    return rawDetails;
  }

  if (AUTH_ERROR_CODE_MAP[rawCode]) {
    return rawCode;
  }

  return rawMessage;
};

export const handleApiError = (error: unknown): ApiError => {
  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return {
        code: error.code,
        message: "error_response.TIMEOUT_ERROR",
      };
    }

    if (!error.response) {
      return {
        code: error.code ?? "NETWORK_ERROR",
        message: "error_response.NETWORK_ERROR",
      };
    }

    const { rawMessage, rawCode, rawDetails, rawValidationErrors } = extractBackendErrorPayload(error.response?.data);
    const rawMappingCandidate = resolveErrorMappingCandidate(rawMessage, rawCode, rawDetails);

    // Map to translation key for specific error types
    const translationKey = mapToTranslationKey(rawMappingCandidate);

    return {
      code: rawCode !== "UNKNOWN_ERROR" ? rawCode : String(error.response?.status ?? "UNKNOWN_ERROR"),
      message: translationKey,
      details: rawDetails,
      validationErrors: rawValidationErrors,
    };
  }

  if (error && typeof error === "object" && "status" in error) {
    const rtkError = error as {
      status?: number | string;
      data?: unknown;
      error?: string;
    };
    const { rawMessage, rawCode, rawDetails, rawValidationErrors } = extractBackendErrorPayload(rtkError.data);
    const rawMappingCandidate =
      rawMessage !== "DEFAULT_ERROR"
        ? resolveErrorMappingCandidate(rawMessage, rawCode, rawDetails)
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
      validationErrors: rawValidationErrors,
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
