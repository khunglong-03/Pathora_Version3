import type { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import {
  createRetryConfig,
  getRetryDelayMs,
  shouldRetryError,
} from "../retryPolicy";

const toAxiosError = (partial: Partial<AxiosError>): AxiosError => {
  return partial as AxiosError;
};

describe("retryPolicy", () => {
  it("builds default retry config with max 3 attempts", () => {
    const config = createRetryConfig();

    expect(config.maxRetries).toBe(3);
    expect(config.baseDelayMs).toBe(1000);
  });

  it("uses exponential backoff delays (1s, 2s, 4s)", () => {
    expect(getRetryDelayMs(1)).toBe(1000);
    expect(getRetryDelayMs(2)).toBe(2000);
    expect(getRetryDelayMs(3)).toBe(4000);
  });

  it("retries timeout errors up to max retries", () => {
    const timeoutError = toAxiosError({ code: "ECONNABORTED" });

    expect(shouldRetryError(timeoutError, 0)).toBe(true);
    expect(shouldRetryError(timeoutError, 2)).toBe(true);
    expect(shouldRetryError(timeoutError, 3)).toBe(false);
  });

  it("retries 5xx responses and skips 4xx responses", () => {
    const serverError = toAxiosError({ response: { status: 503 } as never });
    const clientError = toAxiosError({ response: { status: 400 } as never });

    expect(shouldRetryError(serverError, 0)).toBe(true);
    expect(shouldRetryError(clientError, 0)).toBe(false);
  });
});
