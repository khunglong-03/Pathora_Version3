import { describe, expect, it } from "vitest";
import { calculateTourEstimate } from "../pricingUtils";
import type { PricingPolicyDto } from "@/types/tour";

const createPolicy = (
  tiers: PricingPolicyDto["tiers"],
): PricingPolicyDto => ({
  id: "policy-1",
  policyCode: "PP-001",
  name: "Public pricing",
  tiers,
});

describe("calculateTourEstimate", () => {
  it("uses matching pricing policy tiers for adults, children, and infants", () => {
    const estimate = calculateTourEstimate(
      1_000_000,
      1,
      1,
      1,
      createPolicy([
        { label: "Infant", ageFrom: 0, ageTo: 1, pricePercentage: 25 },
        { label: "Child", ageFrom: 2, ageTo: 12, pricePercentage: 60 },
        { label: "Adult", ageFrom: 13, ageTo: null, pricePercentage: 100 },
      ]),
    );

    expect(estimate).toEqual({
      adultPrice: 1_000_000,
      childPrice: 600_000,
      infantPrice: 250_000,
      totalPrice: 1_850_000,
    });
  });

  it("falls back to base price when no pricing policy tier matches", () => {
    const estimate = calculateTourEstimate(
      1_000_000,
      1,
      1,
      1,
      createPolicy([
        { label: "Adult", ageFrom: 18, ageTo: null, pricePercentage: 100 },
      ]),
    );

    expect(estimate).toEqual({
      adultPrice: 1_000_000,
      childPrice: 1_000_000,
      infantPrice: 1_000_000,
      totalPrice: 3_000_000,
    });
  });

  it("falls back to base price when pricing policy is missing", () => {
    const estimate = calculateTourEstimate(1_000_000, 1, 1, 1, null);

    expect(estimate).toEqual({
      adultPrice: 1_000_000,
      childPrice: 1_000_000,
      infantPrice: 1_000_000,
      totalPrice: 3_000_000,
    });
  });
});
