import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour request admin layout hydration safety", () => {
  it("uses useSyncExternalStore to prevent badge hydration mismatch", () => {
    const source = readFile("src/features/dashboard/components/TourRequestAdminLayout.tsx");

    // Must use useSyncExternalStore for mounted guard
    expect(source.includes("useSyncExternalStore")).toBe(true);

    // Must have safeT helper for deterministic translations before mount
    expect(source.includes("const safeT = (key: string, fallback: string) =>")).toBe(
      true,
    );

    // Badge must be guarded by mounted state to avoid SSR/client mismatch
    expect(source.includes("mounted && item.showPendingBadge")).toBe(true);
  });

  it("does not render pending count badge unconditionally", () => {
    const source = readFile("src/features/dashboard/components/TourRequestAdminLayout.tsx");

    // The badge render should depend on mounted — not render until client mount
    // This prevents: SSR renders with count=0, client re-renders with count>0 after API call
    expect(source.includes("pendingCount > 0 && !mounted")).toBe(false);
    expect(source.includes("mounted && item.showPendingBadge && pendingCount > 0")).toBe(true);
  });

  it("uses safeT for translation in nav items", () => {
    const source = readFile("src/features/dashboard/components/TourRequestAdminLayout.tsx");

    // safeT must be used (not bare t()) to ensure deterministic SSR output
    expect(
      source.includes(
        'safeT("tourRequest.page.adminRequests.title", "Tour Requests")',
      ),
    ).toBe(true);
  });
});
