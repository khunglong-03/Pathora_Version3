import { DepositPolicyDto, PricingPolicyDto } from "@/types/tour";

export function calculateTourEstimate(
  basePrice: number,
  adults: number,
  children: number,
  infants: number,
  _pricingPolicy?: PricingPolicyDto | null
): {
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  totalPrice: number;
} {
  // Frontend dùng basePrice trực tiếp cho estimate — backend tính giá chính xác sau booking.
  // Không áp dụng pricingPolicy.tiers ở đây vì tiers được backend dùng theo logic riêng.
  const adultPrice = Math.round(basePrice);
  const childPrice = Math.round(basePrice * 0.75);
  const infantPrice = Math.round(basePrice * 0.1);

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
