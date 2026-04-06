import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour code auto-generation wiring", () => {
  it("does not require manual tour code entry on create flow", () => {
    const source = readFile("src/app/(dashboard)/tour-management/create/page.tsx");

    expect(source.includes("Tour Code")).toBe(false);
    expect(source.includes('formData.append("tourCode"')).toBe(false);
    expect(source.includes("errors.tourCode")).toBe(false);
  });
});
