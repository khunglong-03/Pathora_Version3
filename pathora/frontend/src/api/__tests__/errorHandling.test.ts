import type { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildErrorLogPayload,
  logApiError,
  resolveErrorToast,
} from "../errorHandling";

const toAxiosError = (partial: Partial<AxiosError>): AxiosError => {
  return partial as AxiosError;
};

describe("errorHandling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers API error message for 4xx responses", () => {
    const error = toAxiosError({
      response: {
        status: 400,
        data: {
          message: "BAD_REQUEST",
        },
      } as never,
    });

    const result = resolveErrorToast(error);

    expect(result).toEqual({ key: "BAD_REQUEST", details: undefined });
  });

  it("maps 5xx responses to generic server error key", () => {
    const error = toAxiosError({
      response: {
        status: 500,
      } as never,
    });

    const result = resolveErrorToast(error);
    expect(result).toEqual({ key: "SERVER_ERROR", details: undefined });
  });

  it("maps network errors to generic network key", () => {
    const error = toAxiosError({
      request: {},
    });

    const result = resolveErrorToast(error);
    expect(result).toEqual({ key: "NETWORK_ERROR", details: undefined });
  });

  it("maps timeout errors to dedicated timeout key", () => {
    const error = toAxiosError({
      code: "ECONNABORTED",
    });

    const result = resolveErrorToast(error);
    expect(result).toEqual({ key: "TIMEOUT_ERROR", details: undefined });
  });

  it("sanitizes sensitive request headers in log payload", () => {
    const error = toAxiosError({
      config: {
        url: "/api/orders",
        method: "get",
        headers: {
          Authorization: "Bearer secret",
          Cookie: "a=1",
          "x-request-id": "request-1",
        },
      } as never,
      response: {
        status: 500,
      } as never,
    });

    const payload = buildErrorLogPayload(error, "2026-03-02T00:00:00.000Z");

    expect(payload.endpoint).toBe("/api/orders");
    expect(payload.method).toBe("GET");
    expect(payload.statusCode).toBe(500);
    expect(payload.timestamp).toBe("2026-03-02T00:00:00.000Z");
    expect(payload.headers).toEqual({
      "x-request-id": "request-1",
    });
  });

  it("logs handled API failures without triggering error-level console noise", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return;
    });
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      return;
    });
    const consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {
      return;
    });

    const error = toAxiosError({
      config: {
        url: "/api/orders",
        method: "post",
      } as never,
      response: {
        status: 500,
      } as never,
    });

    vi.stubEnv("NODE_ENV", "development");
    logApiError(error, "2026-03-02T00:00:00.000Z");

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[API_ERROR]",
      expect.objectContaining({
        endpoint: "/api/orders",
        method: "POST",
      }),
    );
    expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    expect(consoleDebugSpy).toHaveBeenCalledWith("[API_ERROR_FULL]", error);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
