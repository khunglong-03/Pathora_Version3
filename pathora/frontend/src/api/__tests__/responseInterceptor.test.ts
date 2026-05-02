import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refreshAccessTokenMock = vi.hoisted(() =>
  vi.fn<[], Promise<string>>(),
);

vi.mock("../tokenRefreshCoordinator", () => ({
  refreshAccessToken: () => refreshAccessTokenMock(),
}));

import { handleResponseError } from "../responseInterceptor";

const toAxiosError = (partial: Partial<AxiosError>): AxiosError => {
  return partial as AxiosError;
};

const toConfig = (
  config: Partial<InternalAxiosRequestConfig>,
): InternalAxiosRequestConfig => {
  return config as InternalAxiosRequestConfig;
};

describe("responseInterceptor", () => {
  beforeEach(() => {
    refreshAccessTokenMock.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {
      return;
    });
    vi.spyOn(console, "debug").mockImplementation(() => {
      return;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries timeout errors with exponential delay", async () => {
    const request = vi
      .fn<[InternalAxiosRequestConfig], Promise<AxiosResponse>>()
      .mockResolvedValue({ data: { ok: true } } as AxiosResponse);
    const wait = vi.fn().mockResolvedValue(undefined);
    const showError = vi.fn();
    const onUnauthorized = vi.fn();

    const error = toAxiosError({
      code: "ECONNABORTED",
      config: toConfig({
        url: "/api/orders",
        method: "get",
      }),
    });

    await handleResponseError(error, {
      request,
      wait,
      showError,
      onUnauthorized,
    });

    expect(wait).toHaveBeenCalledWith(1000);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].__retryCount).toBe(1);
    expect(showError).not.toHaveBeenCalled();
  });

  it("does not retry 4xx responses and shows API message immediately", async () => {
    const request = vi
      .fn<[InternalAxiosRequestConfig], Promise<AxiosResponse>>()
      .mockResolvedValue({ data: { ok: true } } as AxiosResponse);
    const showError = vi.fn();
    const onUnauthorized = vi.fn();

    const error = toAxiosError({
      config: toConfig({
        url: "/api/orders",
        method: "get",
      }),
      response: {
        status: 400,
        data: {
          message: "BAD_REQUEST",
        },
      } as never,
    });

    await expect(
      handleResponseError(error, {
        request,
        wait: vi.fn().mockResolvedValue(undefined),
        showError,
        onUnauthorized,
      }),
    ).rejects.toBe(error);

    expect(request).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith("BAD_REQUEST", undefined);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("invokes unauthorized callback on 401 when token refresh fails", async () => {
    refreshAccessTokenMock.mockRejectedValue(new Error("refresh failed"));

    const request = vi
      .fn<[InternalAxiosRequestConfig], Promise<AxiosResponse>>()
      .mockResolvedValue({ data: { ok: true } } as AxiosResponse);
    const showError = vi.fn();
    const onUnauthorized = vi.fn();

    const error = toAxiosError({
      config: toConfig({
        url: "/api/orders",
        method: "get",
      }),
      response: {
        status: 401,
        data: {},
      } as never,
    });

    await expect(
      handleResponseError(error, {
        request,
        wait: vi.fn().mockResolvedValue(undefined),
        showError,
        onUnauthorized,
      }),
    ).rejects.toBe(error);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(request).not.toHaveBeenCalled();
  });

  it("retries request with new bearer token after refresh succeeds on 401", async () => {
    refreshAccessTokenMock.mockResolvedValue("fresh-token");

    const okResponse = { data: { ok: true } } as AxiosResponse;
    const request = vi
      .fn<[InternalAxiosRequestConfig], Promise<AxiosResponse>>()
      .mockResolvedValue(okResponse);
    const showError = vi.fn();
    const onUnauthorized = vi.fn();

    const error = toAxiosError({
      config: toConfig({
        url: "/api/orders",
        method: "get",
        headers: {},
      }),
      response: {
        status: 401,
        data: {},
      } as never,
    });

    const result = await handleResponseError(error, {
      request,
      wait: vi.fn().mockResolvedValue(undefined),
      showError,
      onUnauthorized,
    });

    expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].headers.Authorization).toBe("Bearer fresh-token");
    expect(request.mock.calls[0][0].__isAuthRequest).toBe(true);
    expect(result).toBe(okResponse);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("stops retrying after max attempts and emits server error toast", async () => {
    const request = vi
      .fn<[InternalAxiosRequestConfig], Promise<AxiosResponse>>()
      .mockResolvedValue({ data: { ok: true } } as AxiosResponse);
    const showError = vi.fn();

    const error = toAxiosError({
      config: toConfig({
        url: "/api/orders",
        method: "get",
        __retryCount: 3,
      }),
      response: {
        status: 503,
        data: {},
      } as never,
    });

    await expect(
      handleResponseError(error, {
        request,
        wait: vi.fn().mockResolvedValue(undefined),
        showError,
        onUnauthorized: vi.fn(),
      }),
    ).rejects.toBe(error);

    expect(request).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith("SERVER_ERROR", undefined);
  });
});
