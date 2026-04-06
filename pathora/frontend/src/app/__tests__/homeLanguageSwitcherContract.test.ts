import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("home language switcher contract", () => {
  it("keeps home navbar wired to change i18n language", () => {
    const source = readFile("src/features/home/components/BoldNavbar.tsx");

    expect(source.includes("const languages = [")).toBe(true);
    expect(source.includes("i18n.changeLanguage(lang.code)")).toBe(true);
    expect(source.includes("landing.language.title")).toBe(true);
  });
});
