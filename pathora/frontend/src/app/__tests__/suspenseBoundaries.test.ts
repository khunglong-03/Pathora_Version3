import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("suspense boundaries and prefetching", () => {
  it("wraps lazy home sections in suspense boundaries with section-shaped fallbacks", () => {
    const source = readFile("src/app/(user)/home/page.tsx");

    expect(source.includes("<Suspense fallback={<SectionSkeleton")).toBe(true);
    expect(source.includes("animate-pulse")).toBe(true);
  });

  it("prefetches navigation routes when links are hovered or focused", () => {
    const source = readFile("src/features/shared/components/LandingHeader.tsx");

    expect(source.includes("router.prefetch(link.href)")).toBe(true);
    expect(
      source.includes("onMouseEnter={() => router.prefetch(link.href)}"),
    ).toBe(true);
    expect(source.includes("onFocus={() => router.prefetch(link.href)}")).toBe(
      true,
    );
  });
});
