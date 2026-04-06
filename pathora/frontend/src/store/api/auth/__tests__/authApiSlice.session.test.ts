import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applySuccessfulAuthSession,
  clearSessionAndLogout,
} from "../authApiSlice";
import { getCookie } from "../../../../utils/cookie";

type CookieStore = Record<string, string>;

const createDocumentCookieMock = () => {
  const store: CookieStore = {};

  const documentMock = {} as { cookie: string };
  Object.defineProperty(documentMock, "cookie", {
    get() {
      return Object.entries(store)
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    },
    set(nextValue: string) {
      const [cookiePair, ...attributes] = nextValue.split(";");
      const pairIndex = cookiePair.indexOf("=");
      if (pairIndex === -1) return;

      const name = cookiePair.slice(0, pairIndex).trim();
      const value = cookiePair.slice(pairIndex + 1).trim();
      const maxAgeAttribute = attributes.find((attribute) =>
        attribute.trim().toLowerCase().startsWith("max-age="),
      );
      const maxAgeValue = maxAgeAttribute
        ? Number(maxAgeAttribute.split("=")[1])
        : Number.NaN;

      if (!value || Number.isFinite(maxAgeValue) && maxAgeValue <= 0) {
        delete store[name];
        return;
      }

      store[name] = value;
    },
    configurable: true,
  });

  return {
    documentMock,
    store,
  };
};

describe("authApiSlice session side effects", () => {
  beforeEach(() => {
    const { documentMock } = createDocumentCookieMock();
    vi.stubGlobal("document", documentMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sets access_token, refresh_token, auth_status and auth_portal on successful auth", () => {
    const dispatch = vi.fn();

    applySuccessfulAuthSession(
      {
        accessToken: "access-token-1",
        refreshToken: "refresh-token-1",
        portal: "admin",
      },
      dispatch,
    );

    expect(getCookie("access_token")).toBe("access-token-1");
    expect(getCookie("refresh_token")).toBe("refresh-token-1");
    expect(getCookie("auth_status")).toBe("1");
    expect(getCookie("auth_portal")).toBe("admin");
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe("auth/setToken");
  });

  it("infers auth_portal from defaultPath when metadata portal is absent", () => {
    const dispatch = vi.fn();

    applySuccessfulAuthSession(
      {
        accessToken: "access-token-11",
        refreshToken: "refresh-token-11",
        defaultPath: "/dashboard",
      },
      dispatch,
    );

    expect(getCookie("auth_portal")).toBe("admin");
  });

  it("clears all auth cookies and dispatches logout action", () => {
    const dispatch = vi.fn();

    applySuccessfulAuthSession(
      {
        accessToken: "access-token-2",
        refreshToken: "refresh-token-2",
      },
      dispatch,
    );

    clearSessionAndLogout(dispatch);

    expect(getCookie("access_token")).toBeNull();
    expect(getCookie("refresh_token")).toBeNull();
    expect(getCookie("auth_status")).toBeNull();
    expect(getCookie("auth_portal")).toBeNull();
    expect(
      dispatch.mock.calls.some(([action]) => action.type === "auth/logOut"),
    ).toBe(true);
  });
});
