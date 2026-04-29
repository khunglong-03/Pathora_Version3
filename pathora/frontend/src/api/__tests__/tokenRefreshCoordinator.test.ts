import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setCookieMock = vi.fn();

vi.mock("@/utils/cookie", () => ({
  setCookie: (...args: unknown[]) => setCookieMock(...args),
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
  });

  it("persists access_token via setCookie with DAY_SECONDS (86400)", async () => {
    const { refreshAccessToken } = await import("../tokenRefreshCoordinator");

    const token = await refreshAccessToken();

    expect(token).toBe("new-access-token");
    expect(setCookieMock).toHaveBeenCalledWith("access_token", "new-access-token", 86400);
  });
});
