import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCurrentApiLanguage,
  normalizeLanguageForApi,
} from "../languageHeader";

describe("languageHeader", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes complex language tags to en/vi", () => {
    expect(normalizeLanguageForApi("en-US")).toBe("en");
    expect(normalizeLanguageForApi("vi-VN")).toBe("vi");
  });

  it("falls back to en for unsupported or empty languages", () => {
    expect(normalizeLanguageForApi("fr-FR")).toBe("en");
    expect(normalizeLanguageForApi("")).toBe("en");
    expect(normalizeLanguageForApi(undefined)).toBe("en");
  });

  it("returns currently normalized i18n language", () => {
    expect(getCurrentApiLanguage("en-US")).toBe("en");
    expect(getCurrentApiLanguage("fr-FR")).toBe("en");
  });

  it("prefers persisted i18next language from localStorage", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => "en",
      },
      navigator: {
        language: "vi-VN",
      },
    });

    expect(getCurrentApiLanguage()).toBe("en");
  });

  it("falls back to navigator language then default en", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
      },
      navigator: {
        language: "fr-FR",
      },
    });

    expect(getCurrentApiLanguage()).toBe("en");
  });

  it("resolves vietnamese from preferred and navigator language", () => {
    expect(getCurrentApiLanguage("vi-VN")).toBe("vi");

    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
      },
      navigator: {
        language: "vi-VN",
      },
    });

    expect(getCurrentApiLanguage()).toBe("vi");
  });
});
