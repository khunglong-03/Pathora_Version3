import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("offline build font safety", () => {
  it("does not import next/font/google in root layout", () => {
    const source = readFile("src/app/layout.tsx");
    expect(source.includes("next/font/google")).toBe(false);
  });

  it("defines local fallback font variables in globals", () => {
    const source = readFile("src/app/globals.css");
    expect(source.includes("--font-geist-sans:")).toBe(true);
    expect(source.includes("--font-geist-mono:")).toBe(true);
  });
});
