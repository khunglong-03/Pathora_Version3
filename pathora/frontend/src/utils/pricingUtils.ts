import { DepositPolicyDto, PricingPolicyDto } from "@/types/tour";

function applyPricingTier(basePrice: number, tiers: PricingPolicyDto['tiers'] | undefined | null, age: number, defaultPercentage: number = 100): number {
  if (!tiers || tiers.length === 0) return basePrice * (defaultPercentage / 100);

  for (const tier of tiers) {
    if (age >= tier.ageFrom && (tier.ageTo === null || tier.ageTo === undefined || age <= tier.ageTo)) {
      return basePrice * (tier.pricePercentage / 100);
    }
  }
  return basePrice * (defaultPercentage / 100);
}

export function calculateTourEstimate(
  basePrice: number,
  adults: number,
  children: number,
  infants: number,
  pricingPolicy?: PricingPolicyDto | null
): {
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  totalPrice: number;
} {
  const adultPrice = Math.round(applyPricingTier(basePrice, pricingPolicy?.tiers, 18, 100));
  const childPrice = Math.round(applyPricingTier(basePrice, pricingPolicy?.tiers, 5, 75));
  const infantPrice = Math.round(applyPricingTier(basePrice, pricingPolicy?.tiers, 1, 10));

  const totalPrice = adultPrice * adults + childPrice * children + infantPrice * infants;

  return { adultPrice, childPrice, infantPrice, totalPrice };
}

export function calculateDeposit(
  totalPrice: number,
  depositPolicy?: DepositPolicyDto | null
): number {
  if (!depositPolicy) {
    // Default fallback to 30% if no policy is provided
    return Math.round(totalPrice * 0.3);
  }

  const type = String(depositPolicy.depositType).toLowerCase();
  
  if (type === "percentage" || type === "0") {
    return Math.round(totalPrice * (depositPolicy.depositValue / 100));
  } else if (type === "fixedamount" || type === "1") {
    return Math.min(totalPrice, depositPolicy.depositValue);
  }

  return 0;
}
