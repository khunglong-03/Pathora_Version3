import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour instance list hydration safety", () => {
  it("keeps dashboard tour instance labels deterministic before mount", () => {
    const source = readFile("src/features/dashboard/components/TourInstanceListPage.tsx");

    expect(source.includes("useSyncExternalStore")).toBe(true);
    expect(source.includes("const safeT = (key: string, fallback: string) =>")).toBe(true);
    expect(source.includes('safeT("tourInstance.title", "Tour Instances")')).toBe(true);
    expect(
      source.includes(
        'safeT("tourInstance.description", "Manage scheduled tour instances and track departures")',
      ),
    ).toBe(true);
    expect(source.includes('safeT("tourInstance.createInstance", "Create Instance")')).toBe(true);
    expect(
      source.includes(
        'placeholder={safeT("placeholder.searchByTitleLocationCountry", "Search by title, location, or country...")}',
      ),
    ).toBe(true);
  });
});
