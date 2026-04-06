import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("landing header hydration safety", () => {
  it("uses deterministic fallback auth labels before mount", () => {
    const source = readFile("src/features/shared/components/LandingHeader.tsx");

    expect(
      source.includes('text={mounted ? t("common.signIn") : "Sign In"}'),
    ).toBe(true);
    expect(
      source.includes('text={mounted ? t("common.signUp") : "Sign Up"}'),
    ).toBe(true);
  });

  it("keeps public home navigation pointing to /home", () => {
    const source = readFile("src/features/shared/components/LandingHeader.tsx");

    expect(
      source.includes('{ labelKey: "landing.nav.home", href: "/home" },'),
    ).toBe(true);
    expect(source.includes('href="/home"')).toBe(true);
  });

  it("suppresses hydration warnings for react-icons used in header controls", () => {
    const source = readFile("src/features/shared/components/LandingHeader.tsx");

    const iconPatterns = [
      /<FiSliders[\s\S]*?suppressHydrationWarning/,
      /<FiGlobe[\s\S]*?suppressHydrationWarning/,
      /<FiChevronDown[\s\S]*?suppressHydrationWarning/,
      /<FiMenu[\s\S]*?suppressHydrationWarning/,
      /<FiX[\s\S]*?suppressHydrationWarning/,
    ];

    iconPatterns.forEach((pattern) => {
      expect(pattern.test(source)).toBe(true);
    });
  });
});
