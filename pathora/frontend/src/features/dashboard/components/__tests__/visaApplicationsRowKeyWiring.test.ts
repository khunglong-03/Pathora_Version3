import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readVisaApplicationsSource = (): string => {
  return fs.readFileSync(
    path.join(
      process.cwd(),
      "src/features/dashboard/components/VisaApplicationsPage.tsx",
    ),
    "utf8",
  );
};

describe("VisaApplicationsPage booking key wiring", () => {
  it("uses bookingId as the stable key for the Bento Cards", () => {
    const source = readVisaApplicationsSource();

    expect(source.includes("key={bookingId}")).toBe(true);
  });
});
