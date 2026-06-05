import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let cookieStore: Record<string, string> = {};

vi.mock("@/utils/cookie", () => ({
  getCookie: (name: string) => cookieStore[name] ?? null,
}));

vi.mock("@/configs/apiGateway", () => ({
  API_GATEWAY_BASE_URL: "http://localhost:5000",
}));

describe("tokenRefreshCoordinator — 404 race tolerance", () => {
  beforeEach(() => {
    cookieStore = {};
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.resetModules();
    cookieStore = {};
  });

  it("resolves with new cookie value when POST returns 404 but another tab already rotated the token", async () => {
    cookieStore["access_token"] = "OLD_TOKEN";

    const axiosError = Object.assign(new Error("Not Found"), {
      isAxiosError: true,
      response: { status: 404 },
    });

    vi.spyOn(axios, "post").mockRejectedValue(axiosError);
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    const { refreshAccessToken } = await import("../tokenRefreshCoordinator");

    // Start refresh — it will hit the 404 path and wait 100ms
    const refreshPromise = refreshAccessToken();

    // After 50ms we simulate the other tab's Set-Cookie arriving
    await vi.advanceTimersByTimeAsync(50);
    cookieStore["access_token"] = "NEW_TOKEN";

    // Advance past the 100ms wait
    await vi.advanceTimersByTimeAsync(60);

    const result = await refreshPromise;
    expect(result).toBe("NEW_TOKEN");
  });

  it("throws when POST returns 404 and cookie has not changed (genuine NotFound)", async () => {
    cookieStore["access_token"] = "STALE_TOKEN";

    const axiosError = Object.assign(new Error("Not Found"), {
      isAxiosError: true,
      response: { status: 404 },
    });

    vi.spyOn(axios, "post").mockRejectedValue(axiosError);
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    const { refreshAccessToken } = await import("../tokenRefreshCoordinator");

    const refreshPromise = refreshAccessToken();
    // Attach rejection handler before advancing timers to avoid unhandled-rejection warning
    const assertion = expect(refreshPromise).rejects.toThrow("Not Found");

    // Advance past the 100ms wait; async variant flushes microtasks too
    await vi.advanceTimersByTimeAsync(150);

    await assertion;
  });
});
