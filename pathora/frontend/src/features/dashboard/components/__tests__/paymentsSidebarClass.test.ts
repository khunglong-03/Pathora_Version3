import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readPaymentsPageSource = (): string => {
  return fs.readFileSync(
    path.join(
      process.cwd(),
      "src/features/dashboard/components/PaymentsPage.tsx",
    ),
    "utf8",
  );
};

describe("PaymentsPage sidebar classes", () => {
  it("keeps desktop sidebar visible while still hiding it on mobile when closed", () => {
    const source = readPaymentsPageSource();

    expect(source.includes('open ? "translate-x-0" : "max-lg:-translate-x-full"')).toBe(true);
    expect(source.includes('open ? "translate-x-0" : "-translate-x-full"')).toBe(false);
  });
});
