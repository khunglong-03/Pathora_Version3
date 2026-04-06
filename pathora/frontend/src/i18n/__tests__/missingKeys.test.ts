import { describe, expect, it } from "vitest";

import en from "../locales/en.json";
import vi from "../locales/vi.json";

const REQUIRED_KEYS = [
  "tourAdmin.invalidDuration",
  "tourAdmin.invalidPrice",
  "tourAdmin.actDescription",
  "tourAdmin.coverageDesc",
  "landing.customTour.backToHome",
  "landing.customTour.title",
  "landing.customTour.subtitle",
  "landing.customTour.comingSoon",
  "landing.customTour.comingSoonDesc",
  "tourAdmin.searchPlaceholder",
  "common.processing",
  "landing.tourDetail.notFoundDesc",
  "landing.tourDetail.errorDesc",
  "landing.tourDetail.insuranceCoverage",
  "landing.tourDetail.coverage",
  "landing.tourDetail.optional",
  "landing.tourDetail.noItinerary",
] as const;

const getByPath = (source: unknown, keyPath: string): unknown => {
  return keyPath.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") {
      return undefined;
    }

    return (acc as Record<string, unknown>)[key];
  }, source);
};

describe("i18n missing keys", () => {
  it("defines required EN/VI keys for public + tour admin flows", () => {
    REQUIRED_KEYS.forEach((keyPath) => {
      const enValue = getByPath(en, keyPath);
      const viValue = getByPath(vi, keyPath);

      expect(typeof enValue).toBe("string");
      expect(typeof viValue).toBe("string");
      expect((enValue as string).trim().length).toBeGreaterThan(0);
      expect((viValue as string).trim().length).toBeGreaterThan(0);
    });
  });
});
