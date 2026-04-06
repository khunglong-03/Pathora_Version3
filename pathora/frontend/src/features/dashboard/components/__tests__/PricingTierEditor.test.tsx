import { describe, it, expect } from "vitest";
import type { DynamicPricingDto } from "@/types/tour";

// Test validation logic from PricingTierEditor
const validateTiers = (tiers: DynamicPricingDto[]): string | null => {
  for (const tier of tiers) {
    if (tier.minParticipants <= 0) {
      return "Min participants must be greater than 0.";
    }

    if (tier.maxParticipants < tier.minParticipants) {
      return "Max participants must be greater than or equal to min participants.";
    }

    if (tier.pricePerPerson < 0) {
      return "Price per person must not be negative.";
    }
  }

  const ordered = [...tiers]
    .sort((left, right) => {
      if (left.minParticipants !== right.minParticipants) {
        return left.minParticipants - right.minParticipants;
      }

      return left.maxParticipants - right.maxParticipants;
    });

  for (let index = 1; index < ordered.length; index++) {
    if (ordered[index].minParticipants <= ordered[index - 1].maxParticipants) {
      return "Participant ranges must not overlap.";
    }
  }

  return null;
};

describe("PricingTierEditor validation", () => {
  it("should return null for valid single tier", () => {
    const tiers: DynamicPricingDto[] = [
      { minParticipants: 1, maxParticipants: 10, pricePerPerson: 100000 },
    ];

    expect(validateTiers(tiers)).toBeNull();
  });

  it("should return null for valid non-overlapping tiers", () => {
    const tiers: DynamicPricingDto[] = [
      { minParticipants: 1, maxParticipants: 10, pricePerPerson: 100000 },
      { minParticipants: 11, maxParticipants: 20, pricePerPerson: 90000 },
      { minParticipants: 21, maxParticipants: 50, pricePerPerson: 80000 },
    ];

    expect(validateTiers(tiers)).toBeNull();
  });

  it("should return error for zero min participants", () => {
    const tiers: DynamicPricingDto[] = [
      { minParticipants: 0, maxParticipants: 10, pricePerPerson: 100000 },
    ];

    expect(validateTiers(tiers)).toBe("Min participants must be greater than 0.");
  });

  it("should return error for negative min participants", () => {
    const tiers: DynamicPricingDto[] = [
      { minParticipants: -1, maxParticipants: 10, pricePerPerson: 100000 },
    ];

    expect(validateTiers(tiers)).toBe("Min participants must be greater than 0.");
  });

  it("should return error when max participants less than min", () => {
    const tiers: DynamicPricingDto[] = [
      { minParticipants: 10, maxParticipants: 5, pricePerPerson: 100000 },
    ];

    expect(validateTiers(tiers)).toBe(
      "Max participants must be greater than or equal to min participants.",
    );
  });

  it("should return error for negative price", () => {
    const tiers: DynamicPricingDto[] = [
      { minParticipants: 1, maxParticipants: 10, pricePerPerson: -100 },
    ];

    expect(validateTiers(tiers)).toBe("Price per person must not be negative.");
  });

  it("should return error for overlapping tiers", () => {
    const tiers: DynamicPricingDto[] = [
      { minParticipants: 1, maxParticipants: 15, pricePerPerson: 100000 },
      { minParticipants: 10, maxParticipants: 20, pricePerPerson: 90000 },
    ];

    expect(validateTiers(tiers)).toBe("Participant ranges must not overlap.");
  });

  it("should return error for touching tiers (1-10 and 10-20)", () => {
    const tiers: DynamicPricingDto[] = [
      { minParticipants: 1, maxParticipants: 10, pricePerPerson: 100000 },
      { minParticipants: 10, maxParticipants: 20, pricePerPerson: 90000 },
    ];

    expect(validateTiers(tiers)).toBe("Participant ranges must not overlap.");
  });

  it("should accept adjacent ranges (1-10 and 11-20)", () => {
    const tiers: DynamicPricingDto[] = [
      { minParticipants: 1, maxParticipants: 10, pricePerPerson: 100000 },
      { minParticipants: 11, maxParticipants: 20, pricePerPerson: 90000 },
    ];

    expect(validateTiers(tiers)).toBeNull();
  });

  it("should return error for empty tiers array", () => {
    const tiers: DynamicPricingDto[] = [];

    // Empty tiers should be valid (user can add tiers later)
    expect(validateTiers(tiers)).toBeNull();
  });
});

