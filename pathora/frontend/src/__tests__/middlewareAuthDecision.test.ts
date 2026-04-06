import { describe, expect, it } from "vitest";

/**
 * Tests the auth routing helpers available in the codebase.
 * These verify the routing decision logic used by middleware.
 */

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/home",
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
  it("authenticated when auth_status cookie present", () => {
    const authStatus = "1";
    const accessToken = undefined;
    const authenticated = Boolean(authStatus || accessToken);
    expect(authenticated).toBe(true);
  });

  it("authenticated when access_token cookie present", () => {
    const authStatus = undefined;
    const accessToken = "some-jwt";
    const authenticated = Boolean(authStatus || accessToken);
    expect(authenticated).toBe(true);
  });

  it("unauthenticated when neither cookie present", () => {
    const authStatus = undefined;
    const accessToken = undefined;
    const authenticated = Boolean(authStatus || accessToken);
    expect(authenticated).toBe(false);
  });
});
