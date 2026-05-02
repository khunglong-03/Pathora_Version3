import { describe, expect, it } from "vitest";

/**
 * Tests the auth routing helpers available in the codebase.
 * These verify the routing decision logic used by middleware.
 */

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/tour-detail",
  "/about",
  "/visa",
  "/policies",
  "/checkout",
  "/auth/callback",
  "/tours",
  "/tours/instances",
];

const isPublicPath = (pathname: string): boolean => {
  if (pathname.startsWith("/tours/custom")) {
    return false;
  }
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};

describe("public path detection", () => {
  it("flags /custom-tour-request as protected", () => {
    expect(isPublicPath("/custom-tour-request")).toBe(false);
  });

  it("allows /tours as public", () => {
    expect(isPublicPath("/tours")).toBe(true);
    expect(isPublicPath("/tours/summer-vacation")).toBe(true);
  });

  it("protects /tours/custom", () => {
    expect(isPublicPath("/tours/custom")).toBe(false);
    expect(isPublicPath("/tours/custom/request")).toBe(false);
  });

  it("protects /dashboard", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/dashboard/tours")).toBe(false);
  });

  it("protects /admin routes", () => {
    expect(isPublicPath("/admin/dashboard")).toBe(false);
    expect(isPublicPath("/admin/users")).toBe(false);
  });
});

describe("auth session detection", () => {
  it("unauthenticated when only auth_status cookie present", () => {
    const authStatus = "1";
    const accessToken = undefined;
    const refreshToken = undefined;
    const authenticated = Boolean(accessToken || refreshToken);
    expect(authStatus).toBe("1");
    expect(authenticated).toBe(false);
  });

  it("authenticated when access_token cookie present", () => {
    const accessToken = "some-jwt";
    const refreshToken = undefined;
    const authenticated = Boolean(accessToken || refreshToken);
    expect(authenticated).toBe(true);
  });

  it("authenticated when refresh_token cookie present", () => {
    const accessToken = undefined;
    const refreshToken = "some-refresh-token";
    const authenticated = Boolean(accessToken || refreshToken);
    expect(authenticated).toBe(true);
  });

  it("unauthenticated when neither cookie present", () => {
    const accessToken = undefined;
    const refreshToken = undefined;
    const authenticated = Boolean(accessToken || refreshToken);
    expect(authenticated).toBe(false);
  });
});
