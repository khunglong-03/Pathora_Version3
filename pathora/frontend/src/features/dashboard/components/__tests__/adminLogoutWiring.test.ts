import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

const SIDEBAR_PAGES_WITH_LOGOUT = [
  "src/features/dashboard/components/AdminDashboardPage.tsx",
  "src/features/dashboard/components/BookingsPage.tsx",
  "src/features/dashboard/components/CustomersPage.tsx",
  "src/features/dashboard/components/CreateTourInstancePage.tsx",
  "src/features/dashboard/components/InsurancePage.tsx",
  "src/features/dashboard/components/PaymentsPage.tsx",
  "src/features/dashboard/components/SettingsPage.tsx",
  "src/features/dashboard/components/TourDetailPage.tsx",
  "src/features/dashboard/components/TourInstanceDetailPage.tsx",
  "src/features/dashboard/components/TourInstanceListPage.tsx",
  "src/features/dashboard/components/TourListPage.tsx",
  "src/features/dashboard/components/VisaApplicationsPage.tsx",
];

describe("admin sidebar logout wiring", () => {
  it("uses the shared AdminLogoutButton on every admin sidebar", () => {
    SIDEBAR_PAGES_WITH_LOGOUT.forEach((filePath) => {
      const source = readFile(filePath);

      expect(source.includes("import { AdminLogoutButton }")).toBe(true);
      expect(source.includes("<AdminLogoutButton")).toBe(true);
    });
  });
});
