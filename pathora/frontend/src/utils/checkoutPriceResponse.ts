import type { CheckoutPriceResponse } from "@/api/services/paymentService";

/** Maps backend <c>CheckoutPriceResponse</c> (camelCase, <c>basePrice</c> for adult unit) to frontend shape. */
export function normalizeCheckoutPriceResponse(raw: unknown): CheckoutPriceResponse | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const r = raw as Record<string, unknown>;
  const bookingId = r.bookingId != null ? String(r.bookingId) : "";
  if (!bookingId) {
    return null;
  }
  const adultUnit = Number(r.adultPrice ?? r.basePrice ?? 0);
  return {
    bookingId,
    tourInstanceId: String(r.tourInstanceId ?? ""),
    tourName: String(r.tourName ?? ""),
    tourCode: String(r.tourCode ?? ""),
    thumbnailUrl: r.thumbnailUrl != null ? String(r.thumbnailUrl) : undefined,
    startDate: String(r.startDate ?? ""),
    endDate: String(r.endDate ?? ""),
    durationDays: Number(r.durationDays ?? 0),
    location: r.location != null ? String(r.location) : undefined,
    numberAdult: Number(r.numberAdult ?? 0),
    numberChild: Number(r.numberChild ?? 0),
    numberInfant: Number(r.numberInfant ?? 0),
    adultPrice: adultUnit,
    childPrice: Number(r.childPrice ?? 0),
    infantPrice: Number(r.infantPrice ?? 0),
    adultSubtotal: Number(r.adultSubtotal ?? 0),
    childSubtotal: Number(r.childSubtotal ?? 0),
    infantSubtotal: Number(r.infantSubtotal ?? 0),
    subtotal: Number(r.subtotal ?? 0),
    taxRate: Number(r.taxRate ?? 0),
    taxAmount: Number(r.taxAmount ?? 0),
    totalPrice: Number(r.totalPrice ?? 0),
    depositPercentage: normalizeDepositFraction(Number(r.depositPercentage ?? 0)),
    depositAmount: Number(r.depositAmount ?? 0),
    remainingBalance: Number(r.remainingBalance ?? 0),
  };
}

/** Backend sends 0–100 (e.g. 30, 100); normalize to 0–1 for UI math. */
function normalizeDepositFraction(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0;
  }
  return raw > 1 ? raw / 100 : raw;
}
