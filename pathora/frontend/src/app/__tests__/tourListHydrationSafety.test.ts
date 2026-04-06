import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour list hydration safety", () => {
  it("keeps dashboard tour management labels deterministic before mount", () => {
    const source = readFile("src/features/dashboard/components/TourListPage.tsx");

    expect(source.includes("useSyncExternalStore")).toBe(true);
    expect(source.includes("const safeT = (key: string, fallback: string) =>")).toBe(true);
    expect(source.includes('safeT("tourList.pageTitle", "Tours")')).toBe(true);
    expect(
      source.includes(
        'safeT("tourList.pageSubtitle", "Manage your tour packages and itineraries")',
      ),
    ).toBe(true);
    expect(source.includes('safeT("tourList.addNewTour", "Add New Tour")')).toBe(true);
    expect(
      source.includes(
        'placeholder={safeT("tourList.searchPlaceholder", "Search by name or code...")}',
      ),
    ).toBe(true);
  });
});
