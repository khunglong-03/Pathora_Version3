import type { NormalizedPaymentStatus } from "@/api/services/paymentService";

type SearchParamsReader = {
  get: (key: string) => string | null;
};

// PayOS removed — no hosted checkout markers

export const mapTransactionStatusToNormalized = (
  rawStatus: string | undefined,
  errorCode?: string,
): NormalizedPaymentStatus => {
  if (rawStatus === "Completed") {
    return "paid";
  }

  if (rawStatus === "Cancelled") {
    return "cancelled";
  }

  if (rawStatus === "Failed" && errorCode?.toUpperCase() === "EXPIRED") {
    return "expired";
  }

  if (rawStatus === "Failed") {
    return "failed";
  }

  return "pending";
};

export const resolveReturnTransactionCode = (searchParams: SearchParamsReader): string | null => {
  const candidates = [
    searchParams.get("transactionCode"),
    searchParams.get("code"),
    searchParams.get("orderCode"),
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
};

export const isCancelReturn = (searchParams: SearchParamsReader): boolean => {
  const cancelFlag = searchParams.get("cancel");
  const status = (searchParams.get("status") ?? searchParams.get("paymentStatus") ?? "")
    .toLowerCase()
    .trim();

  if (cancelFlag?.toLowerCase() === "true") {
    return true;
  }

  return status === "cancel" || status === "cancelled" || status === "canceled";
};

// PayOS removed — no hosted checkout, always return false
export const shouldRedirectToHostedCheckout = (_url?: string): boolean => {
  return false;
};
