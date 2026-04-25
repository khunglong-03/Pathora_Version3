import { afterEach, describe, expect, it, vi } from "vitest";

import {
  extractData,
  extractItems,
  extractResult,
  handleApiError,
  TOUR_INSTANCE_TRANSPORT_ERROR_CODES,
  mapToTranslationKey,
} from "../apiResponse";
import viLocale from "../../i18n/locales/vi.json";
import enLocale from "../../i18n/locales/en.json";

describe("apiResponse helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("extracts items from nested result.items", () => {
    const items = extractItems<{ id: number }>({
      result: {
        items: [{ id: 1 }, { id: 2 }],
      },
    });

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("extracts typed data from ApiResponse payload", () => {
    const data = extractData<{ id: string }>({
      success: true,
      data: { id: "abc" },
    });

    expect(data).toEqual({ id: "abc" });
  });

  it("normalizes axios-like API errors into ApiError", () => {
    const normalized = handleApiError({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          errors: [
            {
              code: "BAD_REQUEST",
              errorMessage: "BAD_REQUEST",
              details: "invalid payload",
            },
          ],
        },
      },
    });

    expect(normalized).toEqual({
      code: "BAD_REQUEST",
      message: "BAD_REQUEST",
      details: "invalid payload",
    });
  });

  it("normalizes top-level auth challenge payloads without unmapped-code noise", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      return;
    });
    vi.stubEnv("NODE_ENV", "development");

    const normalized = handleApiError({
      isAxiosError: true,
      response: {
        status: 401,
        data: {
          code: "TOKEN_MISSING",
          message: "Authentication required. Please provide a valid token.",
          statusCode: 401,
        },
      },
    });

    expect(normalized).toEqual({
      code: "TOKEN_MISSING",
      message: "error_response.UNAUTHORIZED",
      details: undefined,
    });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("normalizes axios network failures to NETWORK_ERROR", () => {
    const normalized = handleApiError({
      isAxiosError: true,
      code: "ERR_NETWORK",
      request: {},
    });

    expect(normalized).toEqual({
      code: "ERR_NETWORK",
      message: "error_response.NETWORK_ERROR",
    });
  });

  it("normalizes axios timeouts to TIMEOUT_ERROR", () => {
    const normalized = handleApiError({
      isAxiosError: true,
      code: "ECONNABORTED",
      request: {},
    });

    expect(normalized).toEqual({
      code: "ECONNABORTED",
      message: "error_response.TIMEOUT_ERROR",
    });
  });

  it("keeps extractResult backward-compatible", () => {
    const result = extractResult<string>({ result: "ok" });
    expect(result).toBe("ok");
  });

  it("maps all TOUR_INSTANCE_TRANSPORT_ERROR_CODES to valid i18n keys", () => {
    for (const code of TOUR_INSTANCE_TRANSPORT_ERROR_CODES) {
      const key = mapToTranslationKey(code);
      expect(key, `Expected code ${code} to map to a translation key`).not.toBe("error_response.UNEXPECTED");
      expect(key, `Expected code ${code} to map to a translation key`).toBeTruthy();
      
      const keyParts = key.split(".");
      let viPointer: any = viLocale;
      let enPointer: any = enLocale;
      
      for (const part of keyParts) {
        viPointer = viPointer?.[part];
        enPointer = enPointer?.[part];
      }
      
      expect(viPointer, `Missing Vietnamese translation for ${code} (key: ${key})`).toBeDefined();
      expect(enPointer, `Missing English translation for ${code} (key: ${key})`).toBeDefined();
    }
  });
});
