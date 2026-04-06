import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour detail package pricing contract", () => {
  it("normalizes public tour detail classifications before UI consumption", () => {
    const source = readFile("src/api/services/tourService.ts");

    expect(source.includes("return result ? normalizeTourDetail(result) : null;")).toBe(true);
  });

  it("keeps departure selection scoped to the selected package", () => {
    const source = readFile("src/features/tours/components/TourDetailPage.tsx");

    expect(source.includes("const packageInstances = useMemo(")).toBe(true);
    expect(source.includes("instances={packageInstances}")).toBe(true);
  });
});
