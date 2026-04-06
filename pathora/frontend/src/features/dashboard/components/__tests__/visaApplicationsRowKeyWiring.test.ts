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

describe("VisaApplicationsPage row key wiring", () => {
  it("uses a stable generated row key instead of raw visa id", () => {
    const source = readVisaApplicationsSource();

    expect(source.includes("buildVisaRowKeys")).toBe(true);
    expect(source.includes("key={visaRowKeys[index]}")).toBe(true);
    expect(source.includes("key={visa.id}")).toBe(false);
  });
});
