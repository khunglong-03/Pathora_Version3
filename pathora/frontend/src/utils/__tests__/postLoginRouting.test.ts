import { describe, expect, it } from "vitest";

import {
  resolveAuthPortal,
  resolvePostLoginPath,
} from "../postLoginRouting";

describe("post-login routing contract", () => {
  it("uses backend defaultPath when provided", () => {
    expect(resolvePostLoginPath("/dashboard", "admin")).toBe("/dashboard");
    expect(resolvePostLoginPath("/home", "user")).toBe("/home");
  });

  it("falls back safely when metadata is absent", () => {
    // admin portal without roles defaults to admin dashboard
    expect(resolvePostLoginPath(null, "admin")).toBe("/admin/dashboard");
    expect(resolvePostLoginPath(undefined, "user")).toBe("/home");
    expect(resolvePostLoginPath(undefined, undefined)).toBe("/home");
  });

  it("normalizes portal from metadata or default path", () => {
    expect(resolveAuthPortal("admin", null)).toBe("admin");
    expect(resolveAuthPortal(null, "/dashboard")).toBe("admin");
    expect(resolveAuthPortal(null, "/my-custom-tour-requests")).toBe("user");
  });

  it("resolves admin role types to admin path", () => {
    expect(
      resolvePostLoginPath(undefined, "admin", [{ name: "Admin" }]),
    ).toBe("/admin/dashboard");
  });

  it("resolves manager role types to manager path", () => {
    expect(
      resolvePostLoginPath(undefined, "admin", [{ name: "Manager" }]),
    ).toBe("/dashboard");
  });
});
