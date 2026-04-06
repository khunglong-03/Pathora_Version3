import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour discovery page layout contract", () => {
  it("keeps tour discovery paginated to six items with a two-column grid", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");
    const twoColumnGrids = discovery.match(/grid grid-cols-1 md:grid-cols-2 gap-6/g) ?? [];

    expect(discovery.includes("const PAGE_SIZE = 6")).toBe(true);
    expect(twoColumnGrids).toHaveLength(3);
    expect(discovery.includes("xl:grid-cols-3")).toBe(false);
  });

  it("sets explicit compact typography for tour cards", () => {
    const tourCard = readFile("src/features/tours/components/TourCard.tsx");
    const tourInstanceCard = readFile("src/features/tours/components/TourInstanceCard.tsx");

    expect(tourCard.includes('<h3 className="text-xl font-semibold text-gray-900')).toBe(true);
    expect(tourInstanceCard.includes('<h3 className="text-xl font-semibold text-gray-900')).toBe(true);
  });
});
