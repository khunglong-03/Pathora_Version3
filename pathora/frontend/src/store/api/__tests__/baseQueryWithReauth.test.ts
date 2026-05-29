import type { BaseQueryApi } from "@reduxjs/toolkit/query/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const refreshAccessTokenMock = vi.hoisted(() => vi.fn<[], Promise<string>>());
const clearAuthSessionMock = vi.hoisted(() => vi.fn());
const getCookieMock = vi.hoisted(() => vi.fn());

vi.mock("@/api/tokenRefreshCoordinator", () => ({
  refreshAccessToken: () => refreshAccessTokenMock(),
}));

vi.mock("@/utils/authSession", () => ({
  clearAuthSession: () => clearAuthSessionMock(),
}));

vi.mock("@/utils/cookie", () => ({
  getCookie: (name: string) => getCookieMock(name),
  setCookie: vi.fn(),
  removeCookie: vi.fn(),
}));

import { createBaseQueryWithReauth, rawBaseQuery } from "../apiSlice";

const noopApi = {} as BaseQueryApi;
const noopExtra = {};

describe("createBaseQueryWithReauth", () => {
  let originalLocation: any;

  beforeEach(() => {
    refreshAccessTokenMock.mockReset();
    clearAuthSessionMock.mockReset();
    getCookieMock.mockReset();
    refreshAccessTokenMock.mockResolvedValue("tok");
    getCookieMock.mockImplementation((name) => name === "auth_status" ? "1" : null);

    if (typeof window !== "undefined") {
      originalLocation = window.location;
      delete (window as any).location;
      window.location = {
        href: "http://localhost/x",
        pathname: "/x",
        origin: "http://localhost",
        search: "",
        assign: vi.fn(),
        replace: vi.fn(),
      } as any;
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined" && originalLocation) {
      window.location = originalLocation;
    }
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

  it("on refresh failure redirects to login", async () => {
    refreshAccessTokenMock.mockRejectedValue(new Error("bad"));

    const base = vi.fn().mockResolvedValue({ error: { status: 401, data: {} } });
    const wrapped = createBaseQueryWithReauth(base as unknown as typeof rawBaseQuery);

    const out = await wrapped("/x", noopApi, noopExtra);

    expect(window.location.href).toBe("http://localhost/?login=true&next=%2Fx");
    expect(out.error?.status).toBe(401);
  });

  it("on 401 runs refresh and retries base query even on bypass paths", async () => {
    if (typeof window !== "undefined") {
      window.location = {
        ...window.location,
        href: "http://localhost/bookings/123",
        pathname: "/bookings/123",
      } as any;
    }

    const base = vi
      .fn()
      .mockResolvedValueOnce({ error: { status: 401, data: {} } })
      .mockResolvedValueOnce({ data: { ok: true } });
    const wrapped = createBaseQueryWithReauth(base as unknown as typeof rawBaseQuery);

    const out = await wrapped("/bookings/123", noopApi, noopExtra);

    expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(base).toHaveBeenCalledTimes(2);
    expect(out).toEqual({ data: { ok: true } });
  });

  it("on refresh failure on bypass paths, bypasses redirect and returns 401", async () => {
    if (typeof window !== "undefined") {
      window.location = {
        ...window.location,
        href: "http://localhost/bookings/123",
        pathname: "/bookings/123",
      } as any;
    }

    refreshAccessTokenMock.mockRejectedValue(new Error("bad"));

    const base = vi.fn().mockResolvedValue({ error: { status: 401, data: {} } });
    const wrapped = createBaseQueryWithReauth(base as unknown as typeof rawBaseQuery);

    const out = await wrapped("/bookings/123", noopApi, noopExtra);

    expect(window.location.href).toBe("http://localhost/bookings/123");
    expect(out.error?.status).toBe(401);
  });
});
