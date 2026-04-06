import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour translation form wiring", () => {
  it("delegates translations payload serialization to create payload builder", () => {
    const createPageSource = readFile("src/app/(dashboard)/tour-management/create/page.tsx");
    const payloadBuilderSource = readFile("src/api/services/tourCreatePayload.ts");

    expect(createPageSource.includes("buildTourFormData")).toBe(true);
    expect(createPageSource.includes("vietnameseTranslation")).toBe(true);
    expect(createPageSource.includes("englishTranslation")).toBe(true);

    expect(payloadBuilderSource.includes("formData.append(\"translations\"")).toBe(true);
    expect(payloadBuilderSource.includes("JSON.stringify(translationsPayload)")).toBe(true);
  });

  it("uses language tabs and sends translations JSON payload in edit page", () => {
    const source = readFile("src/app/(dashboard)/tour-management/[id]/edit/page.tsx");

    expect(source.includes("LanguageTabs")).toBe(true);
    expect(source.includes("formData.append(\"translations\"")).toBe(true);
    expect(source.includes("JSON.stringify(translationPayload)")).toBe(true);
  });
});

describe("activity route wiring", () => {
  it("create page has routes state and expandedRoutes UI", () => {
    const source = readFile("src/app/(dashboard)/tour-management/create/page.tsx");

    // Route state and helpers exist
    expect(source.includes("expandedRoutes")).toBe(true);
    expect(source.includes("toggleActivityRoute")).toBe(true);

    // LocationCombobox is imported and used
    expect(source.includes("LocationCombobox")).toBe(true);

    // Route CRUD functions exist
    expect(source.includes("addRoute")).toBe(true);
    expect(source.includes("removeRoute")).toBe(true);
    expect(source.includes("updateRoute")).toBe(true);

    // Activity form has routes field
    expect(source.includes("ActivityRouteForm")).toBe(true);
    expect(source.includes("routes:")).toBe(true);
  });

  it("create page has i18n keys for routes", () => {
    const enSource = fs.readFileSync(path.join(process.cwd(), "src/i18n/locales/en.json"), "utf8");
    const en = JSON.parse(enSource);

    expect(en.tourAdmin?.itineraries?.route).toBeTruthy();
    expect(en.tourAdmin?.itineraries?.addRoute).toBeTruthy();
    expect(en.tourAdmin?.itineraries?.removeRoute).toBeTruthy();
    expect(en.tourAdmin?.itineraries?.fromLocation).toBeTruthy();
    expect(en.tourAdmin?.itineraries?.toLocation).toBeTruthy();
    expect(en.tourAdmin?.itineraries?.customLocation).toBeTruthy();
    expect(en.tourAdmin?.itineraries?.searchLocation).toBeTruthy();
    expect(en.tourAdmin?.itineraries?.noLocationMatch).toBeTruthy();
    expect(en.tourAdmin?.itineraries?.locationVI).toBeTruthy();
    expect(en.tourAdmin?.itineraries?.locationEN).toBeTruthy();
    expect(en.tourAdmin?.validation?.locationRemoved).toBeTruthy();
  });

  it("vi locale has matching i18n keys for routes", () => {
    const viSource = fs.readFileSync(path.join(process.cwd(), "src/i18n/locales/vi.json"), "utf8");
    const vi = JSON.parse(viSource);

    expect(vi.tourAdmin?.itineraries?.route).toBeTruthy();
    expect(vi.tourAdmin?.itineraries?.addRoute).toBeTruthy();
    expect(vi.tourAdmin?.itineraries?.removeRoute).toBeTruthy();
    expect(vi.tourAdmin?.itineraries?.fromLocation).toBeTruthy();
    expect(vi.tourAdmin?.itineraries?.toLocation).toBeTruthy();
    expect(vi.tourAdmin?.itineraries?.customLocation).toBeTruthy();
    expect(vi.tourAdmin?.validation?.locationRemoved).toBeTruthy();
  });

  // NOTE: Edit page route wiring (Chunk 5) is pending. These tests will be
  // enabled once Chunk 5 is merged. For now, only create page is tested.
});
