import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

const dashboardNavFiles = [
  "src/features/dashboard/components/AdminDashboardPage.tsx",
  "src/features/dashboard/components/VisaApplicationsPage.tsx",
  "src/features/dashboard/components/SettingsPage.tsx",
  "src/features/dashboard/components/InsurancePage.tsx",
  "src/features/dashboard/components/PaymentsPage.tsx",
  "src/features/dashboard/components/CustomersPage.tsx",
  "src/features/dashboard/components/TourListPage.tsx",
  "src/features/dashboard/components/TourDetailPage.tsx",
  "src/features/dashboard/components/TourInstanceDetailPage.tsx",
  "src/features/dashboard/components/TourInstanceListPage.tsx",
  "src/features/dashboard/components/CreateTourInstancePage.tsx",
  "src/app/(dashboard)/tour-management/create/page.tsx",
];

describe("dashboard bookings navigation", () => {
  it("keeps booking navigation inside dashboard routes", () => {
    dashboardNavFiles.forEach((filePath) => {
      const source = readFile(filePath);

      expect(source.includes('href: "/dashboard/bookings"')).toBe(true);
      expect(source.includes('href: "/bookings"')).toBe(false);
    });
  });

  it("has a dedicated dashboard bookings route", () => {
    const source = readFile("src/app/(dashboard)/dashboard/bookings/page.tsx");

    expect(source.includes("DashboardBookingsPage")).toBe(true);
    expect(
      source.includes("@/features/dashboard/components/BookingsPage"),
    ).toBe(true);
  });
});
