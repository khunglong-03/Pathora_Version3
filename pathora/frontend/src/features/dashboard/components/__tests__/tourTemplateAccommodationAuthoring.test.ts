import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour template accommodation authoring", () => {
  it("keeps room type as legacy read-only context instead of an editable selector", () => {
    const tourFormSource = readFile(
      "src/features/dashboard/components/TourForm.tsx",
    );
    const itineraryBuilderSource = readFile(
      "src/features/dashboard/components/tour/builders/TourItineraryBuilder.tsx",
    );

    [tourFormSource, itineraryBuilderSource].forEach((source) => {
      expect(source.includes('Room Type")} (Legacy)')).toBe(true);
      expect(source.includes("cursor-not-allowed")).toBe(true);
      expect(source.includes("updateActivity(ci, di, ai, \"roomType\"")).toBe(
        false,
      );
      expect(
        source.includes("onUpdateActivity(ci, di, ai, \"roomType\""),
      ).toBe(false);
      expect(source.includes("roomTypeOptions")).toBe(false);
    });
  });
});
