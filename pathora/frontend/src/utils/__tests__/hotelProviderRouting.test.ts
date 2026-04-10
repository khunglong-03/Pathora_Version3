import { describe, expect, it } from "vitest";

import {
  resolveRoleDefaultPath,
  HOTELSERVICEPROVIDER_ROLE_DEFAULT_PATH,
  isProviderRoutePath,
} from "../authRouting";

describe("HotelServiceProvider routing", () => {
  describe("resolveRoleDefaultPath", () => {
    it("returns /hotel for HotelServiceProvider role", () => {
      expect(
        resolveRoleDefaultPath([{ name: "HotelServiceProvider" }]),
      ).toBe(HOTELSERVICEPROVIDER_ROLE_DEFAULT_PATH);
    });

    it("returns /admin/dashboard for HotelServiceProvider in admin portal (admin portal overrides role routing)", () => {
      // When portal is admin, the admin portal path wins regardless of role
      expect(
        resolveRoleDefaultPath([{ name: "HotelServiceProvider" }], "admin"),
      ).toBe("/admin/dashboard");
    });

    it("returns /hotel when HotelServiceProvider is first in role list", () => {
      expect(
        resolveRoleDefaultPath([
          { name: "HotelServiceProvider" },
          { name: "Customer" },
        ]),
      ).toBe(HOTELSERVICEPROVIDER_ROLE_DEFAULT_PATH);
    });

    it("HotelServiceProvider does NOT get admin path", () => {
      // HotelServiceProvider is NOT in ADMIN_ROLE_NAMES, so it should NOT route to /admin/dashboard
      const result = resolveRoleDefaultPath([{ name: "HotelServiceProvider" }]);
      expect(result).not.toBe("/admin/dashboard");
    });

    it("HotelServiceProvider does NOT get manager path", () => {
      const result = resolveRoleDefaultPath([{ name: "HotelServiceProvider" }]);
      expect(result).not.toBe("/manager");
    });

    it("HotelServiceProvider does NOT get transport path", () => {
      const result = resolveRoleDefaultPath([{ name: "HotelServiceProvider" }]);
      expect(result).not.toBe("/transport");
    });

    it("falls back to / when no roles", () => {
      expect(resolveRoleDefaultPath(null)).toBe("/");
      expect(resolveRoleDefaultPath([])).toBe("/");
    });
  });

  describe("isProviderRoutePath", () => {
    it("returns true for /hotel routes", () => {
      expect(isProviderRoutePath("/hotel")).toBe(true);
      expect(isProviderRoutePath("/hotel/arrivals")).toBe(true);
      expect(isProviderRoutePath("/hotel/rooms")).toBe(true);
      expect(isProviderRoutePath("/hotel/profile")).toBe(true);
      expect(isProviderRoutePath("/hotel/rooms/availability")).toBe(true);
    });

    it("returns true for /transport routes", () => {
      expect(isProviderRoutePath("/transport")).toBe(true);
      expect(isProviderRoutePath("/transport/drivers")).toBe(true);
      expect(isProviderRoutePath("/transport/vehicles")).toBe(true);
    });

    it("returns false for admin routes", () => {
      expect(isProviderRoutePath("/admin/dashboard")).toBe(false);
      expect(isProviderRoutePath("/dashboard")).toBe(false);
    });

    it("returns false for user routes", () => {
      expect(isProviderRoutePath("/")).toBe(false);
      expect(isProviderRoutePath("/bookings")).toBe(false);
    });

    it("returns false for manager routes", () => {
      expect(isProviderRoutePath("/manager")).toBe(false);
      expect(isProviderRoutePath("/manager/tours")).toBe(false);
    });
  });
});
