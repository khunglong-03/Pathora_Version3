import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  normalizePolicySections,
  pickLocalizedText,
  pickLocalizedArray,
  resolveLocalizedSection,
} from "../utils/normalizePolicySections";
import {
  isPlainTextPolicySection,
  isLocalizedPolicySection,
} from "@/types/siteContent";

// Mock i18n for tests that call getResolvedLocale
vi.mock("@/i18n/config", () => ({
  default: {
    resolvedLanguage: "en",
    language: "en",
  },
}));

describe("normalizePolicySections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Case A — backend resolved locale (plain strings)", () => {
    it("parses valid Case A sections", () => {
      const raw = [
        {
          id: "booking-payment",
          icon: "heroicons-outline:document-text",
          title: "Booking & Payment",
          items: [
            "Booking is confirmed only after payment.",
            "Prices may change before confirmation.",
          ],
        },
        {
          id: "privacy-policy",
          icon: "heroicons-outline:shield-check",
          title: "Privacy Policy",
          items: ["We do not share your data with third parties."],
        },
      ];

      const result = normalizePolicySections(raw);

      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].id).toBe("booking-payment");
      expect(result.sections[0].icon).toBe("heroicons-outline:document-text");
      expect(result.sections[0].title).toBe("Booking & Payment");
      expect(result.sections[0].items).toEqual([
        "Booking is confirmed only after payment.",
        "Prices may change before confirmation.",
      ]);
      expect(result.sections[1].title).toBe("Privacy Policy");
    });

    it("handles Case A section without id", () => {
      const raw = [
        {
          icon: "heroicons-outline:document-text",
          title: "Cancellation Policy",
          items: ["No refunds after 48 hours."],
        },
      ];

      const result = normalizePolicySections(raw);

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].id).toBeUndefined();
      expect(result.sections[0].title).toBe("Cancellation Policy");
    });

    it("skips items that fail both type guards", () => {
      const raw = [
        {
          id: "valid-section",
          icon: "heroicons-outline:check",
          title: "Valid Section",
          items: ["Valid item"],
        },
        { foo: "bar" },
        {
          icon: "heroicons-outline:x",
          title: { en: "Localized" },
          items: ["Item"],
        },
      ];

      const result = normalizePolicySections(raw);

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].title).toBe("Valid Section");
    });

    it("skips Case A item with non-string items array elements", () => {
      const raw = [
        {
          id: "mixed-types",
          icon: "heroicons-outline:check",
          title: "Mixed",
          items: ["valid string", 42],
        },
      ];

      const result = normalizePolicySections(raw);

      expect(result.sections).toHaveLength(0);
    });

    it("keeps Case A items with empty title", () => {
      const raw = [
        {
          icon: "heroicons-outline:check",
          title: "",
          items: ["Item 1"],
        },
      ];

      const result = normalizePolicySections(raw);
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].title).toBe("");
    });
  });

  describe("Case A type guards", () => {
    it("returns true for valid plain-text section", () => {
      expect(
        isPlainTextPolicySection({
          icon: "x",
          title: "Title",
          items: ["item"],
        })
      ).toBe(true);
    });

    it("returns false for localized section", () => {
      expect(
        isPlainTextPolicySection({
          icon: "x",
          title: { en: "EN", vi: "VI" },
          items: ["item"],
        })
      ).toBe(false);
    });

    it("returns false for non-array items", () => {
      expect(
        isPlainTextPolicySection({
          icon: "x",
          title: "Title",
          items: null,
        })
      ).toBe(false);
    });

    it("returns false for non-object input", () => {
      expect(isPlainTextPolicySection(null)).toBe(false);
      expect(isPlainTextPolicySection("string")).toBe(false);
      expect(isPlainTextPolicySection(123)).toBe(false);
    });
  });

  describe("Case B type guards", () => {
    it("returns true for valid localized section with en and vi", () => {
      expect(
        isLocalizedPolicySection({
          icon: "x",
          title: { en: "EN", vi: "VI" },
          items: { en: ["en item"], vi: ["vi item"] },
        })
      ).toBe(true);
    });

    it("returns false for plain-text section", () => {
      expect(
        isLocalizedPolicySection({
          icon: "x",
          title: "Plain Title",
          items: ["item"],
        })
      ).toBe(false);
    });

    it("returns true when localized title lacks en (has vi)", () => {
      expect(
        isLocalizedPolicySection({
          icon: "x",
          title: { vi: "VI" },
          items: { en: ["en"], vi: ["vi"] },
        })
      ).toBe(true);
    });

    it("returns true when localized items lacks vi (has en)", () => {
      expect(
        isLocalizedPolicySection({
          icon: "x",
          title: { en: "EN", vi: "VI" },
          items: { en: ["en"] },
        })
      ).toBe(true);
    });

    it("returns false for null input", () => {
      expect(isLocalizedPolicySection(null)).toBe(false);
    });
  });

  describe("Case B — localized objects with locale injection", () => {
    it("picks English text when locale is en", () => {
      const raw = [
        {
          id: "booking-payment",
          icon: "heroicons-outline:document-text",
          title: {
            en: "Booking & Payment",
            vi: "Đặt chỗ và thanh toán",
          },
          items: {
            en: ["Booking is confirmed only after payment."],
            vi: ["Đặt chỗ chỉ được xác nhận sau khi thanh toán."],
          },
        },
      ];

      const result = normalizePolicySections(raw, "en");

      expect(result.sections[0].title).toBe("Booking & Payment");
      expect(result.sections[0].items).toEqual([
        "Booking is confirmed only after payment.",
      ]);
    });

    it("picks Vietnamese text when locale is vi", () => {
      const raw = [
        {
          id: "booking-payment",
          icon: "heroicons-outline:document-text",
          title: {
            en: "Booking & Payment",
            vi: "Đặt chỗ và thanh toán",
          },
          items: {
            en: ["Booking is confirmed only after payment."],
            vi: ["Đặt chỗ chỉ được xác nhận sau khi thanh toán."],
          },
        },
      ];

      const result = normalizePolicySections(raw, "vi");

      expect(result.sections[0].title).toBe("Đặt chỗ và thanh toán");
      expect(result.sections[0].items).toEqual([
        "Đặt chỗ chỉ được xác nhận sau khi thanh toán.",
      ]);
    });

    it("falls back from missing vi locale to en", () => {
      const raw = [
        {
          id: "booking-payment",
          icon: "heroicons-outline:document-text",
          title: { en: "English Only Title" },
          items: { en: ["English item"] },
        },
      ];

      const result = normalizePolicySections(raw, "vi");

      expect(result.sections[0].title).toBe("English Only Title");
      expect(result.sections[0].items).toEqual(["English item"]);
    });

    it("returns both Case A and Case B sections in order", () => {
      const raw = [
        {
          id: "case-a",
          icon: "heroicons-outline:a",
          title: "Case A Title",
          items: ["Case A item"],
        },
        {
          id: "case-b",
          icon: "heroicons-outline:b",
          title: { en: "Case B EN", vi: "Case B VI" },
          items: { en: ["Case B EN item"], vi: ["Case B VI item"] },
        },
      ];

      const result = normalizePolicySections(raw, "en");

      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].id).toBe("case-a");
      expect(result.sections[0].title).toBe("Case A Title");
      expect(result.sections[1].id).toBe("case-b");
      expect(result.sections[1].title).toBe("Case B EN");
    });
  });

  describe("edge cases", () => {
    it("returns empty sections for non-array raw", () => {
      expect(normalizePolicySections(null).sections).toEqual([]);
      expect(normalizePolicySections(undefined).sections).toEqual([]);
      expect(normalizePolicySections("string").sections).toEqual([]);
      expect(normalizePolicySections({ foo: "bar" }).sections).toEqual([]);
      expect(normalizePolicySections(123).sections).toEqual([]);
    });

    it("returns empty sections for empty array", () => {
      expect(normalizePolicySections([]).sections).toEqual([]);
    });

    it("returns raw unchanged in result object", () => {
      const raw = [{ icon: "x", title: "Test", items: ["item"] }];
      const result = normalizePolicySections(raw);
      expect(result.raw).toBe(raw);
    });
  });

  describe("pickLocalizedText", () => {
    it("returns value for matching locale", () => {
      expect(pickLocalizedText({ en: "Hello", vi: "Xin chao" }, "en")).toBe("Hello");
    });

    it("falls back to vi then en for unknown locale", () => {
      expect(pickLocalizedText({ en: "Hello", vi: "Xin chao" }, "fr")).toBe("Xin chao");
    });

    it("falls back to en when target locale is missing", () => {
      expect(pickLocalizedText({ en: "Hello" }, "vi")).toBe("Hello");
    });

    it("returns empty string when no locales match", () => {
      expect(pickLocalizedText({ de: "Hallo" }, "vi")).toBe("");
    });

    it("returns empty string for empty object", () => {
      expect(pickLocalizedText({}, "vi")).toBe("");
    });
  });

  describe("pickLocalizedArray", () => {
    it("returns array for matching locale", () => {
      const result = pickLocalizedArray({ en: ["a", "b"], vi: ["c"] }, "en");
      expect(result).toEqual(["a", "b"]);
    });

    it("falls back to vi then en for unknown locale", () => {
      const result = pickLocalizedArray({ en: ["en"], vi: ["vi"] }, "fr");
      expect(result).toEqual(["vi"]);
    });

    it("falls back to en when target locale is missing", () => {
      const result = pickLocalizedArray({ en: ["en"] }, "vi");
      expect(result).toEqual(["en"]);
    });

    it("returns empty array when no locales match", () => {
      const result = pickLocalizedArray({ de: ["d"] }, "vi");
      expect(result).toEqual([]);
    });

    it("filters out non-string elements", () => {
      const result = pickLocalizedArray({ en: ["valid", 42, null, "also valid"] }, "en");
      expect(result).toEqual(["valid", "also valid"]);
    });
  });

  describe("resolveLocalizedSection", () => {
    it("resolves section with en locale", () => {
      const raw = {
        id: "test",
        icon: "x",
        title: { en: "EN Title", vi: "VI Title" },
        items: { en: ["EN item"], vi: ["VI item"] },
      };

      const result = resolveLocalizedSection(raw, "en");

      expect(result.title).toBe("EN Title");
      expect(result.items).toEqual(["EN item"]);
    });

    it("resolves section with vi locale", () => {
      const raw = {
        id: "test",
        icon: "x",
        title: { en: "EN Title", vi: "VI Title" },
        items: { en: ["EN item"], vi: ["VI item"] },
      };

      const result = resolveLocalizedSection(raw, "vi");

      expect(result.title).toBe("VI Title");
      expect(result.items).toEqual(["VI item"]);
    });

    it("preserves id and icon", () => {
      const raw = {
        id: "my-id",
        icon: "my-icon",
        title: { en: "Title", vi: "Tieu de" },
        items: { en: ["item"], vi: ["muc"] },
      };

      const result = resolveLocalizedSection(raw, "en");

      expect(result.id).toBe("my-id");
      expect(result.icon).toBe("my-icon");
    });
  });
});
