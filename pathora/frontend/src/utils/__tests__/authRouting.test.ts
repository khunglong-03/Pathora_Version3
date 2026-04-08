import { describe, expect, it } from "vitest";

import {
  ADMIN_ROLE_DEFAULT_PATH,
  hasAdminRole,
  hasManagerRole,
  isAdminPortal,
  isAdminRoutePath,
  isLoginEntryPath,
  isManagerRoutePath,
  isSafeNextPath,
  MANAGER_ROLE_DEFAULT_PATH,
  normalizePortal,
  parseAuthRoles,
  resolveAuthPortal,
  resolveLoginDestination,
  resolvePostLoginPath,
  resolveRoleDefaultPath,
  USER_DEFAULT_PATH,
} from "../authRouting";

describe("resolveRoleDefaultPath", () => {
  it("returns user default for empty roles", () => {
    expect(resolveRoleDefaultPath([])).toBe(USER_DEFAULT_PATH);
    expect(resolveRoleDefaultPath(null)).toBe(USER_DEFAULT_PATH);
    expect(resolveRoleDefaultPath(undefined)).toBe(USER_DEFAULT_PATH);
  });

  it("returns admin path for Admin role", () => {
    expect(resolveRoleDefaultPath([{ name: "Admin" }])).toBe(
      ADMIN_ROLE_DEFAULT_PATH,
    );
  });

  it("returns manager path for Manager role", () => {
    expect(resolveRoleDefaultPath([{ name: "Manager" }])).toBe(
      MANAGER_ROLE_DEFAULT_PATH,
    );
  });

  it("returns admin path when both Admin and Manager present (Admin wins)", () => {
    expect(
      resolveRoleDefaultPath([{ name: "Admin" }, { name: "Manager" }]),
    ).toBe(ADMIN_ROLE_DEFAULT_PATH);
  });

  it("returns user default for unknown roles", () => {
    expect(resolveRoleDefaultPath([{ name: "User" }])).toBe(USER_DEFAULT_PATH);
    expect(resolveRoleDefaultPath([{ name: "Guest" }])).toBe(USER_DEFAULT_PATH);
  });

  it("returns admin default when portal is admin but roles are empty", () => {
    expect(resolveRoleDefaultPath([], "admin")).toBe(ADMIN_ROLE_DEFAULT_PATH);
    expect(resolveRoleDefaultPath(null, "admin")).toBe(ADMIN_ROLE_DEFAULT_PATH);
    expect(resolveRoleDefaultPath(undefined, "admin")).toBe(
      ADMIN_ROLE_DEFAULT_PATH,
    );
  });

  it("returns manager path for admin portal with only Manager role", () => {
    expect(resolveRoleDefaultPath([{ name: "Manager" }], "admin")).toBe(
      MANAGER_ROLE_DEFAULT_PATH,
    );
  });

  it("returns admin path for admin portal with Admin role", () => {
    expect(resolveRoleDefaultPath([{ name: "Admin" }], "admin")).toBe(
      ADMIN_ROLE_DEFAULT_PATH,
    );
  });
});

describe("parseAuthRoles", () => {
  it("parses valid JSON array", () => {
    expect(parseAuthRoles('["Manager"]')).toEqual(["Manager"]);
    expect(parseAuthRoles('["Admin", "Manager"]')).toEqual([
      "Admin",
      "Manager",
    ]);
  });

  it("handles undefined", () => {
    expect(parseAuthRoles(undefined)).toEqual([]);
  });

  it("handles malformed JSON", () => {
    expect(parseAuthRoles("garbage")).toEqual([]);
    expect(parseAuthRoles("[")).toEqual([]);
    expect(parseAuthRoles("{invalid}")).toEqual([]);
  });

  it("handles URL-encoded JSON", () => {
    const encoded = encodeURIComponent('["Manager","Admin"]');
    expect(parseAuthRoles(encoded)).toEqual(["Manager", "Admin"]);
  });

  it("handles empty string", () => {
    expect(parseAuthRoles("")).toEqual([]);
  });
});

describe("hasAdminRole", () => {
  it("returns true for Admin", () => {
    expect(hasAdminRole([{ name: "Admin" }])).toBe(true);
  });

  it("returns false for Manager", () => {
    expect(hasAdminRole([{ name: "Manager" }])).toBe(false);
  });

  it("returns false for null/undefined/empty", () => {
    expect(hasAdminRole(null)).toBe(false);
    expect(hasAdminRole(undefined)).toBe(false);
    expect(hasAdminRole([])).toBe(false);
  });
});

describe("hasManagerRole", () => {
  it("returns true for Manager", () => {
    expect(hasManagerRole([{ name: "Manager" }])).toBe(true);
  });

  it("returns false for Admin", () => {
    expect(hasManagerRole([{ name: "Admin" }])).toBe(false);
  });

  it("returns false for null/undefined/empty", () => {
    expect(hasManagerRole(null)).toBe(false);
    expect(hasManagerRole(undefined)).toBe(false);
    expect(hasManagerRole([])).toBe(false);
  });
});

describe("isAdminPortal", () => {
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

describe("resolvePostLoginPath", () => {
  it("uses backend defaultPath when available", () => {
    expect(
      resolvePostLoginPath({ defaultPath: "/dashboard/tour-management" }),
    ).toBe("/dashboard/tour-management");
  });

  it("routes admin portal to admin default path", () => {
    expect(resolvePostLoginPath({ portal: "admin" })).toBe(
      ADMIN_ROLE_DEFAULT_PATH,
    );
  });

  it("routes admin role types to admin path", () => {
    expect(
      resolvePostLoginPath({ roles: [{ name: "Admin" }] }),
    ).toBe(ADMIN_ROLE_DEFAULT_PATH);
  });

  it("routes manager role to manager path", () => {
    expect(
      resolvePostLoginPath({ roles: [{ name: "Manager" }] }),
    ).toBe(MANAGER_ROLE_DEFAULT_PATH);
  });

  it("falls back to user default path", () => {
    expect(resolvePostLoginPath({ portal: "user" })).toBe(USER_DEFAULT_PATH);
  });

  it("falls back safely when metadata is absent", () => {
    expect(resolvePostLoginPath({})).toBe(USER_DEFAULT_PATH);
    expect(resolvePostLoginPath({ portal: null })).toBe(USER_DEFAULT_PATH);
  });

  it("prioritizes defaultPath over portal resolution", () => {
    expect(
      resolvePostLoginPath({
        defaultPath: "/custom/path",
        portal: "admin",
      }),
    ).toBe("/custom/path");
  });
});

describe("isAdminRoutePath", () => {
  it("identifies admin route prefixes", () => {
    expect(isAdminRoutePath("/dashboard")).toBe(true);
    expect(isAdminRoutePath("/dashboard/tours")).toBe(true);
    expect(isAdminRoutePath("/tour-management")).toBe(true);
    expect(isAdminRoutePath("/tour-management/edit/123")).toBe(true);
    expect(isAdminRoutePath("/tour-instances")).toBe(true);
    expect(isAdminRoutePath("/tour-instances/new")).toBe(true);
    expect(isAdminRoutePath("/pricing-policies")).toBe(true);
    expect(isAdminRoutePath("/tax-configs")).toBe(true);
  });

  it("returns false for non-admin routes", () => {
    expect(isAdminRoutePath("/home")).toBe(false);
    expect(isAdminRoutePath("/tours")).toBe(false);
    expect(isAdminRoutePath("/about")).toBe(false);
    expect(isAdminRoutePath("/admin/something")).toBe(false);
  });
});

describe("isManagerRoutePath", () => {
  it("identifies manager route prefixes", () => {
    expect(isManagerRoutePath("/dashboard")).toBe(true);
    expect(isManagerRoutePath("/dashboard/tours")).toBe(true);
    expect(isManagerRoutePath("/tour-management")).toBe(true);
    expect(isManagerRoutePath("/tour-management/edit/123")).toBe(true);
    expect(isManagerRoutePath("/tour-instances")).toBe(true);
    expect(isManagerRoutePath("/tour-instances/new")).toBe(true);
  });

  it("returns false for non-manager routes", () => {
    expect(isManagerRoutePath("/home")).toBe(false);
    expect(isManagerRoutePath("/tour-requests")).toBe(false);
    expect(isManagerRoutePath("/pricing-policies")).toBe(false);
    expect(isManagerRoutePath("/admin/dashboard")).toBe(false);
  });
});

describe("isSafeNextPath", () => {
  it("returns true for valid internal paths", () => {
    expect(isSafeNextPath("/tours/custom")).toBe(true);
    expect(isSafeNextPath("/dashboard")).toBe(true);
    expect(isSafeNextPath("/home?foo=bar")).toBe(true);
    expect(isSafeNextPath("/a")).toBe(true);
  });

  it("returns false for null or undefined", () => {
    expect(isSafeNextPath(null)).toBe(false);
    expect(isSafeNextPath(undefined)).toBe(false);
  });

  it("returns false for paths not starting with /", () => {
    expect(isSafeNextPath("tours/custom")).toBe(false);
    expect(isSafeNextPath("")).toBe(false);
    expect(isSafeNextPath(" /home")).toBe(false);
  });

  it("returns false for external URLs", () => {
    expect(isSafeNextPath("https://evil.com")).toBe(false);
    expect(isSafeNextPath("http://evil.com/path")).toBe(false);
  });

  it("returns false for paths with dangerous characters", () => {
    expect(isSafeNextPath("/tours/custom\nalert(1)")).toBe(false);
    expect(isSafeNextPath("/tours/custom\0")).toBe(false);
  });
});

describe("isLoginEntryPath", () => {
  it("returns true for root path", () => {
    expect(isLoginEntryPath("/", new URLSearchParams())).toBe(true);
  });

  it("returns true for /home with login=true", () => {
    expect(
      isLoginEntryPath("/home", new URLSearchParams("login=true")),
    ).toBe(true);
  });

  it("returns false for /home without login param", () => {
    expect(isLoginEntryPath("/home", new URLSearchParams())).toBe(false);
    const params = new URLSearchParams("foo=bar");
    expect(isLoginEntryPath("/home", params)).toBe(false);
  });

  it("returns false for other paths", () => {
    expect(isLoginEntryPath("/dashboard", new URLSearchParams())).toBe(
      false,
    );
    expect(isLoginEntryPath("/about", new URLSearchParams())).toBe(false);
  });
});

describe("resolveLoginDestination", () => {
  it("prioritizes valid next for non-admin users", () => {
    expect(
      resolveLoginDestination({ next: "/tours/custom", portal: "user" }),
    ).toBe("/tours/custom");
  });

  it("falls back to defaultPath when next is invalid", () => {
    expect(
      resolveLoginDestination({
        next: "https://evil.com",
        defaultPath: "/home",
        portal: "user",
      }),
    ).toBe("/home");
  });

  it("ignores next for admin portal", () => {
    expect(
      resolveLoginDestination({ next: "/tours/custom", portal: "admin" }),
    ).toBe(ADMIN_ROLE_DEFAULT_PATH);
  });

  it("ignores next for admin roles", () => {
    expect(
      resolveLoginDestination({
        next: "/tours/custom",
        roles: [{ name: "Admin" }],
      }),
    ).toBe(ADMIN_ROLE_DEFAULT_PATH);
  });

  it("falls back to user default when no next or defaultPath", () => {
    expect(resolveLoginDestination({ portal: "user" })).toBe(
      USER_DEFAULT_PATH,
    );
  });
});

describe("normalizePortal", () => {
  it("returns admin for admin portal (case-insensitive)", () => {
    expect(normalizePortal("admin")).toBe("admin");
    expect(normalizePortal("Admin")).toBe("admin");
    expect(normalizePortal("ADMIN")).toBe("admin");
  });

  it("returns user for user portal (case-insensitive)", () => {
    expect(normalizePortal("user")).toBe("user");
    expect(normalizePortal("User")).toBe("user");
  });

  it("returns null for unknown portal", () => {
    expect(normalizePortal(null)).toBe(null);
    expect(normalizePortal(undefined)).toBe(null);
    expect(normalizePortal("")).toBe(null);
    expect(normalizePortal("unknown")).toBe(null);
  });
});

describe("resolveAuthPortal", () => {
  it("returns admin portal when explicit", () => {
    expect(resolveAuthPortal("admin")).toBe("admin");
    expect(resolveAuthPortal("Admin")).toBe("admin");
  });

  it("returns user portal when explicit", () => {
    expect(resolveAuthPortal("user")).toBe("user");
  });

  it("infers admin portal from admin default path", () => {
    // /dashboard is in ADMIN_ROUTE_PREFIXES, so it infers admin portal
    expect(resolveAuthPortal(undefined, "/dashboard")).toBe("admin");
  });

  it("infers user portal from user default path", () => {
    expect(resolveAuthPortal(null, "/home")).toBe("user");
    expect(resolveAuthPortal(undefined, "/my-custom-tour-requests")).toBe("user");
  });

  it("returns null when portal and defaultPath are absent", () => {
    expect(resolveAuthPortal(null, null)).toBe(null);
    expect(resolveAuthPortal(undefined, undefined)).toBe(null);
  });

  it("prefers explicit portal over inferred from defaultPath", () => {
    expect(resolveAuthPortal("admin", "/home")).toBe("admin");
    expect(resolveAuthPortal("user", "/admin/dashboard")).toBe("user");
  });
});
