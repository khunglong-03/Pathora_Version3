import { describe, expect, it } from "vitest";

import { buildTourTranslationsPayload } from "../tourTranslations";

describe("tourTranslations", () => {
  it("includes both vi and en when english content is provided", () => {
    const result = buildTourTranslationsPayload(
      {
        tourName: "Tour tiếng Việt",
        shortDescription: "Mô tả vi",
        longDescription: "Mô tả dài vi",
        seoTitle: "SEO vi",
        seoDescription: "SEO mô tả vi",
      },
      {
        tourName: "English tour",
        shortDescription: "English short",
        longDescription: "English long",
        seoTitle: "",
        seoDescription: "",
      },
    );

    expect(result.vi.tourName).toBe("Tour tiếng Việt");
    expect(result.en?.tourName).toBe("English tour");
  });

  it("omits en when all english fields are empty", () => {
    const result = buildTourTranslationsPayload(
      {
        tourName: "Tour tiếng Việt",
        shortDescription: "Mô tả vi",
        longDescription: "Mô tả dài vi",
        seoTitle: "",
        seoDescription: "",
      },
      {
        tourName: "   ",
        shortDescription: "",
        longDescription: "",
        seoTitle: "",
        seoDescription: "",
      },
    );

    expect(result.vi.tourName).toBe("Tour tiếng Việt");
    expect(result.en).toBeUndefined();
  });
});
