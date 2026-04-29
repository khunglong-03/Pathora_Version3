import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour detail private-custom booking contract", () => {
  it("exposes request-private flow: modal, API, and checkout deep link", () => {
    const page = readFile("src/features/tours/components/TourDetailPage.tsx");
    expect(page).toMatch(/tourService\.requestPrivateTour/);
    expect(page).toMatch(/privateModalOpen/);
    expect(page).toMatch(/flow=private-custom/);
    expect(page).toMatch(/landing\.tourDetail\.privateCustom\./);
  });
});
