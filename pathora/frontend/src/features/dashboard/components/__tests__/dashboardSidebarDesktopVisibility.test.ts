import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const DASHBOARD_SIDEBAR_FILES = [
  "src/features/dashboard/components/AdminDashboardPage.tsx",
  "src/features/dashboard/components/BookingsPage.tsx",
  "src/features/dashboard/components/CreateTourInstancePage.tsx",
  "src/features/dashboard/components/CustomersPage.tsx",
  "src/features/dashboard/components/InsurancePage.tsx",
  "src/features/dashboard/components/PaymentsPage.tsx",
  "src/features/dashboard/components/SettingsPage.tsx",
  "src/features/dashboard/components/TourDetailPage.tsx",
  "src/features/dashboard/components/TourInstanceDetailPage.tsx",
  "src/features/dashboard/components/TourInstanceListPage.tsx",
  "src/features/dashboard/components/TourListPage.tsx",
  "src/features/dashboard/components/VisaApplicationsPage.tsx",
  "src/app/(dashboard)/tour-management/create/page.tsx",
];

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("dashboard sidebar desktop visibility", () => {
  it("keeps sidebar visible on desktop and only hides it on mobile when closed", () => {
    DASHBOARD_SIDEBAR_FILES.forEach((filePath) => {
      const source = readFile(filePath);

      expect(
        source.includes('open ? "translate-x-0" : "max-lg:-translate-x-full"'),
      ).toBe(true);
      expect(source.includes('open ? "translate-x-0" : "-translate-x-full"')).toBe(false);
    });
  });
});
