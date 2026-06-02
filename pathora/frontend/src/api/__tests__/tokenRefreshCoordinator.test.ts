import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setCookieMock = vi.fn();
const getCookieMock = vi.fn(() => null);

vi.mock("@/utils/cookie", () => ({
  setCookie: (...args: unknown[]) => setCookieMock(...args),
  getCookie: (...args: unknown[]) => getCookieMock(...args),
}));

vi.mock("@/configs/apiGateway", () => ({
  API_GATEWAY_BASE_URL: "http://localhost:5000",
}));

describe("tokenRefreshCoordinator", () => {
  beforeEach(() => {
    vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { accessToken: "new-access-token" } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setCookieMock.mockReset();
    getCookieMock.mockReset();
  });

  it("returns the access token from backend response and does NOT write cookies", async () => {
    const { refreshAccessToken } = await import("../tokenRefreshCoordinator");

    const token = await refreshAccessToken();

    expect(token).toBe("new-access-token");
    // Backend is sole cookie owner — JS must not write access_token or refresh_token
    expect(setCookieMock).not.toHaveBeenCalled();
  });
});
