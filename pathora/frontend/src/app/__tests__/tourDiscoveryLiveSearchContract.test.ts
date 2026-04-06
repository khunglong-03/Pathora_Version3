import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour discovery live search contract", () => {
  it("keeps search wired to auto-refetch on input changes", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    expect(discovery.includes('import { useDebounce } from "@/hooks/useDebounce";')).toBe(true);
    expect(discovery.includes("const debouncedSearchText = useDebounce(searchText, 400);")).toBe(true);
    expect(discovery.includes("destination: debouncedSearchText.trim(),")).toBe(true);
    expect(discovery.includes("}, [debouncedSearchText, submittedSearchText, syncFilters]);")).toBe(true);
  });
});
