import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  it("invokes unauthorized callback on 401 errors", async () => {
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
