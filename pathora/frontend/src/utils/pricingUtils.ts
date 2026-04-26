import { DepositPolicyDto, PricingPolicyDto } from "@/types/tour";

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
  let markupPercentage = 0;
  const totalParticipants = adults + children + infants;

  if (pricingPolicy?.tiers && pricingPolicy.tiers.length > 0) {
    const applicableTier = pricingPolicy.tiers.find(
      (t) => totalParticipants >= t.minParticipants && totalParticipants <= t.maxParticipants
    );
    if (applicableTier) {
      markupPercentage = applicableTier.markupPercentage;
    }
  }

  const adjustedBasePrice = basePrice * (1 + markupPercentage / 100);

  // In the absence of a specific child/infant pricing policy rule, 
  // we apply standard industry practices:
  // Adults = 100%, Children = 75%, Infants = 10%
  // This removes the hardcoded zero-pricing constraint from legacy code.
  const adultPrice = Math.round(adjustedBasePrice);
  const childPrice = Math.round(adjustedBasePrice * 0.75);
  const infantPrice = Math.round(adjustedBasePrice * 0.1);

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
