import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("language fallback contract", () => {
  it("keeps i18n fallback configured to default English locale", () => {
    const i18nConfig = readFile("src/i18n/config.ts");

    expect(i18nConfig.includes('const DEFAULT_LANGUAGE: SupportedLanguage = "en"')).toBe(true);
    expect(i18nConfig.includes("fallbackLng: DEFAULT_LANGUAGE")).toBe(true);
    expect(i18nConfig.includes('localStorage.setItem("i18nextLng", normalizedLanguage)')).toBe(true);
  });

  it("keeps critical API-backed labels resilient when locale keys are missing", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");
    const landingHeader = readFile("src/features/shared/components/LandingHeader.tsx");
    const instanceDetail = readFile("src/features/tours/components/TourInstancePublicDetailPage.tsx");
    const enLocale = readFile("src/i18n/locales/en.json");
    const viLocale = readFile("src/i18n/locales/vi.json");

    expect(discovery.includes("const safeT = (key: string, fallback: string)")).toBe(true);
    expect(discovery.includes('"landing.tourDiscovery.noToursFound"')).toBe(true);
    expect(discovery.includes('"landing.tourDiscovery.noDeparturesFound"')).toBe(true);
    expect(landingHeader.includes("i18n.resolvedLanguage || i18n.language || \"en\"")).toBe(true);
    expect(instanceDetail.includes('t("tourInstance.notFound", "Tour instance not found")')).toBe(true);
    expect(instanceDetail.includes('t("tourInstance.backToTour", "Back to tour")')).toBe(true);
    expect(instanceDetail.includes('"tourInstance.depositRequiredNote"')).toBe(true);
    expect(enLocale.includes('"depositRequiredNote"')).toBe(true);
    expect(viLocale.includes('"depositRequiredNote"')).toBe(true);
  });
});
