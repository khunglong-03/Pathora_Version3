import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour translation form wiring", () => {
  it("delegates translations payload serialization to create payload builder", () => {
    const createPageSource = readFile("src/app/manager/tour-management/create/page.tsx");
    const payloadBuilderSource = readFile("src/api/services/tourCreatePayload.ts");

    expect(createPageSource.includes("buildTourFormData")).toBe(true);
    expect(createPageSource.includes("vietnameseTranslation")).toBe(true);
    expect(createPageSource.includes("englishTranslation")).toBe(true);

    expect(payloadBuilderSource.includes("formData.append(\"translations\"")).toBe(true);
    expect(payloadBuilderSource.includes("JSON.stringify(translationsPayload)")).toBe(true);
  });

  it("uses language tabs and sends translations JSON payload in edit page", () => {
    const source = readFile("src/app/manager/tour-management/[id]/edit/page.tsx");

    expect(source.includes("LanguageTabs")).toBe(true);
    expect(source.includes("formData.append(\"translations\"")).toBe(true);
    expect(source.includes("JSON.stringify(translationPayload)")).toBe(true);
  });
});

