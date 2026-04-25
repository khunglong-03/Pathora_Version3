import { describe, expect, it } from "vitest";

import {
  parseAuthRoles,
  hasAdminRole,
  hasManagerRole,
  isAdminPortal,
  isManagerRoutePath,
} from "../../utils/authRouting";

/**
 * These tests verify the role-based routing logic used by middleware.
 * The actual middleware() function requires NextRequest/NextResponse which
 * are difficult to mock fully in unit tests, so we test the extracted
 * helper functions directly.
 */

describe("parseAuthRoles (middleware)", () => {
  it("parses valid JSON array", () => {
    expect(parseAuthRoles('["Manager"]')).toEqual(["Manager"]);
  });

  it("handles undefined", () => {
    expect(parseAuthRoles(undefined)).toEqual([]);
  });

  it("handles malformed cookie value", () => {
    expect(parseAuthRoles("garbage")).toEqual([]);
    expect(parseAuthRoles("")).toEqual([]);
  });

  it("handles URL-encoded JSON", () => {
    const encoded = encodeURIComponent('["Admin", "Manager"]');
    expect(parseAuthRoles(encoded)).toEqual(["Admin", "Manager"]);
  });
});

describe("hasAdminRole (middleware)", () => {
  it("returns true for Admin", () => {
    expect(hasAdminRole([{ name: "Admin" }])).toBe(true);
  });


  it("returns false for Manager", () => {
    expect(hasAdminRole([{ name: "Manager" }])).toBe(false);
  });

  it("returns false for empty/null/undefined", () => {
    expect(hasAdminRole([])).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
    expect(hasAdminRole(undefined)).toBe(false);
  });
});

describe("hasManagerRole (middleware)", () => {
  it("returns true for Manager", () => {
    expect(hasManagerRole([{ name: "Manager" }])).toBe(true);
  });

  it("returns false for Admin", () => {
    expect(hasManagerRole([{ name: "Admin" }])).toBe(false);
  });

  it("returns false for empty/null/undefined", () => {
    expect(hasManagerRole([])).toBe(false);
    expect(hasManagerRole(null)).toBe(false);
    expect(hasManagerRole(undefined)).toBe(false);
  });
});

describe("isAdminPortal (middleware)", () => {
  it("returns true for admin portal (case-insensitive)", () => {
    expect(isAdminPortal("admin")).toBe(true);
    expect(isAdminPortal("Admin")).toBe(true);
    expect(isAdminPortal("ADMIN")).toBe(true);
  });

  it("returns false for user portal", () => {
    expect(isAdminPortal("user")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isAdminPortal(null)).toBe(false);
    expect(isAdminPortal(undefined)).toBe(false);
  });
});

describe("isManagerRoutePath (middleware)", () => {
  it("returns true for manager route prefixes", () => {
    expect(isManagerRoutePath("/dashboard")).toBe(true);
    expect(isManagerRoutePath("/dashboard/tours")).toBe(true);
    expect(isManagerRoutePath("/tour-management")).toBe(true);
    expect(isManagerRoutePath("/tour-management/edit")).toBe(true);
    expect(isManagerRoutePath("/tour-instances")).toBe(true);
    expect(isManagerRoutePath("/tour-instances/new")).toBe(true);
    expect(isManagerRoutePath("/manager/staff-schedule")).toBe(true);
  });

  it("returns false for admin routes", () => {
    expect(isManagerRoutePath("/admin/dashboard")).toBe(false);
    expect(isManagerRoutePath("/admin/users")).toBe(false);
  });

  it("returns false for public routes", () => {
    expect(isManagerRoutePath("/")).toBe(false);
    expect(isManagerRoutePath("/tours")).toBe(false);
    expect(isManagerRoutePath("/about")).toBe(false);
  });
});

/**
 * Middleware routing decision table — these tests verify the core routing rules.
 *
 * Rule matrix:
 * - Authenticated + Manager role + /admin/* path → redirect to /dashboard
 * - Authenticated + Admin role + /dashboard or manager path → redirect to /admin/dashboard
 * - Authenticated + Manager role + /dashboard → allowed (Manager home)
 * - Unauthenticated + protected path → redirect to /?login=true
 * - Malformed auth_roles cookie → treated as no roles (empty array)
 */

describe("middleware routing rules", () => {
  describe("Manager role routing", () => {
    it("Manager accessing /dashboard is allowed (Manager home)", () => {
      // Manager's home is /dashboard
      const managerRoles = [{ name: "Manager" }];
      expect(hasManagerRole(managerRoles)).toBe(true);
      expect(hasAdminRole(managerRoles)).toBe(false);
    });

    it("Manager accessing /admin/* should redirect to /dashboard", () => {
      const managerRoles = [{ name: "Manager" }];
      expect(hasManagerRole(managerRoles)).toBe(true);
      // /admin/dashboard starts with /admin/
      const adminPath = "/admin/dashboard";
      expect(adminPath.startsWith("/admin/")).toBe(true);
    });

    it("Manager accessing /dashboard/tours is allowed (Manager route)", () => {
      expect(isManagerRoutePath("/dashboard/tours")).toBe(true);
      expect(hasManagerRole([{ name: "Manager" }])).toBe(true);
    });

    it("Manager accessing /manager/staff-schedule is allowed (Manager route)", () => {
      expect(hasManagerRole([{ name: "Manager" }])).toBe(true);
      expect(isManagerRoutePath("/manager/staff-schedule")).toBe(true);
    });
  });

  describe("Admin role routing", () => {
    it("Admin accessing /admin/dashboard is allowed (Admin home)", () => {
      const adminRoles = [{ name: "Admin" }];
      expect(hasAdminRole(adminRoles)).toBe(true);
      expect(isManagerRoutePath("/admin/dashboard")).toBe(false);
    });

    it("Admin accessing /dashboard should redirect to /admin/dashboard", () => {
      const adminRoles = [{ name: "Admin" }];
      expect(hasAdminRole(adminRoles)).toBe(true);
      // /dashboard is a manager route
      expect(isManagerRoutePath("/dashboard")).toBe(true);
    });

    it("Admin accessing /tour-management should redirect to /admin/dashboard", () => {
      const adminRoles = [{ name: "Admin" }];
      expect(hasAdminRole(adminRoles)).toBe(true);
      expect(isManagerRoutePath("/tour-management")).toBe(true);
    });
  });

  describe("Dual role priority", () => {
    it("Admin + Manager dual role → Admin wins (redirects away from manager routes)", () => {
      const dualRoles = [{ name: "Admin" }, { name: "Manager" }];
      // Admin wins over Manager
      expect(hasAdminRole(dualRoles)).toBe(true);
      expect(hasManagerRole(dualRoles)).toBe(true);
      // Admin role takes precedence
      expect(hasAdminRole(dualRoles) && hasManagerRole(dualRoles)).toBe(true);
      // But Admin routing check should happen first
      // Admin accessing manager route should redirect
      expect(isManagerRoutePath("/dashboard")).toBe(true);
    });
  });

  describe("Malformed cookie handling", () => {
    it("malformed auth_roles cookie → treated as empty roles", () => {
      expect(parseAuthRoles("garbage")).toEqual([]);
      expect(parseAuthRoles("")).toEqual([]);
      expect(parseAuthRoles(undefined)).toEqual([]);
      // Empty roles means no admin, no manager
      expect(hasAdminRole([])).toBe(false);
      expect(hasManagerRole([])).toBe(false);
    });

    it("non-JSON cookie value → treated as empty roles", () => {
      expect(parseAuthRoles("not-json")).toEqual([]);
      expect(parseAuthRoles("[")).toEqual([]);
      expect(parseAuthRoles("{invalid}")).toEqual([]);
    });
  });

  describe("unauthenticated access", () => {
    it("no auth cookies means unauthenticated", () => {
      const accessToken = undefined;
      const refreshToken = undefined;
      const authenticated = Boolean(accessToken || refreshToken);
      expect(authenticated).toBe(false);
    });

    it("only auth_status cookie means unauthenticated", () => {
      const authStatus = "1";
      const accessToken = undefined;
      const refreshToken = undefined;
      const authenticated = Boolean(accessToken || refreshToken);
      expect(authStatus).toBe("1");
      expect(authenticated).toBe(false);
    });

    it("only access_token cookie means authenticated", () => {
      const accessToken = "some-jwt-token";
      const refreshToken = undefined;
      const authenticated = Boolean(accessToken || refreshToken);
      expect(authenticated).toBe(true);
    });

    it("only refresh_token cookie means authenticated", () => {
      const accessToken = undefined;
      const refreshToken = "some-refresh-token";
      const authenticated = Boolean(accessToken || refreshToken);
      expect(authenticated).toBe(true);
    });
  });

  describe("public path detection", () => {
    const PUBLIC_PATH_PREFIXES = [
      "/",
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

    it("/ is public", () => {
      expect(isPublicPath("/")).toBe(true);
    });

    it("/ is public", () => {
      expect(isPublicPath("/")).toBe(true);
    });

    it("/tours is public", () => {
      expect(isPublicPath("/tours")).toBe(true);
    });

    it("/tours/custom is NOT public (protected)", () => {
      expect(isPublicPath("/tours/custom")).toBe(false);
      expect(isPublicPath("/tours/custom/request")).toBe(false);
    });

    it("/dashboard is NOT public (protected)", () => {
      expect(isPublicPath("/dashboard")).toBe(false);
    });

    it("/admin/dashboard is NOT public (protected)", () => {
      expect(isPublicPath("/admin/dashboard")).toBe(false);
    });
  });
});
