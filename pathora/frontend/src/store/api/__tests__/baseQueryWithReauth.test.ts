import type { BaseQueryApi } from "@reduxjs/toolkit/query/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refreshAccessTokenMock = vi.hoisted(() => vi.fn<[], Promise<string>>());
const clearAuthSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/api/tokenRefreshCoordinator", () => ({
  refreshAccessToken: () => refreshAccessTokenMock(),
}));

vi.mock("@/utils/authSession", () => ({
  clearAuthSession: () => clearAuthSessionMock(),
}));

import { createBaseQueryWithReauth, rawBaseQuery } from "../apiSlice";

const noopApi = {} as BaseQueryApi;
const noopExtra = {};

describe("createBaseQueryWithReauth", () => {
  beforeEach(() => {
    refreshAccessTokenMock.mockReset();
    clearAuthSessionMock.mockReset();
    refreshAccessTokenMock.mockResolvedValue("tok");
  });

  it("on 401 runs refresh then retries base query", async () => {
    const base = vi
      .fn()
      .mockResolvedValueOnce({ error: { status: 401, data: {} } })
      .mockResolvedValueOnce({ data: { ok: true } });
    const wrapped = createBaseQueryWithReauth(base as unknown as typeof rawBaseQuery);

    const out = await wrapped("/customers", noopApi, noopExtra);

    expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(base).toHaveBeenCalledTimes(2);
    expect(out).toEqual({ data: { ok: true } });
    expect(clearAuthSessionMock).not.toHaveBeenCalled();
  });

  it("skips refresh when request URL is auth refresh", async () => {
    const base = vi.fn().mockResolvedValue({ error: { status: 401, data: {} } });
    const wrapped = createBaseQueryWithReauth(base as unknown as typeof rawBaseQuery);

    await wrapped({ url: "api/auth/refresh", method: "POST" }, noopApi, noopExtra);

    expect(refreshAccessTokenMock).not.toHaveBeenCalled();
    expect(base).toHaveBeenCalledTimes(1);
  });

  it("on refresh failure clears session", async () => {
    refreshAccessTokenMock.mockRejectedValue(new Error("bad"));

    const base = vi.fn().mockResolvedValue({ error: { status: 401, data: {} } });
    const wrapped = createBaseQueryWithReauth(base as unknown as typeof rawBaseQuery);

    const out = await wrapped("/x", noopApi, noopExtra);

    expect(clearAuthSessionMock).toHaveBeenCalledTimes(1);
    expect(out.error?.status).toBe(401);
  });
});
