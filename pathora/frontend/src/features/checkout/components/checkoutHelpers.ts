import i18n from "@/i18n/config";
import { toast } from "react-toastify";

/* ── Formatters ─────────────────────────────────────────── */
export const fmtCurrency = (n: number, currency = "VND") => {
  const locale = typeof window !== "undefined" && i18n.language === "vi" ? "vi-VN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n);
};

export const copyToClipboard = (text: string, successMsg: string) => {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(successMsg);
  });
};

/* ── Static data ─────────────────────────────────────────── */
export const STATUS_STEPS = ["Pending", "Processing", "Completed"] as const;
export const DEFAULT_DEPOSIT_PERCENTAGE = 0.3;

export const mapPaymentMethodToApi = (method: "qr" | "cash" | "bank_transfer"): number => {
  if (method === "cash") return 1;
  return 2; // qr and bank_transfer both map to BankTransfer
};

export const CANCELLATION_KEYS = [
  "landing.checkout.cancelItem1",
  "landing.checkout.cancelItem2",
  "landing.checkout.cancelItem3",
  "landing.checkout.cancelItem4",
] as const;

export const PAYMENT_TERM_KEYS = [
  "landing.checkout.payTermItem1",
  "landing.checkout.payTermItem2",
  "landing.checkout.payTermItem3",
  "landing.checkout.payTermItem4",
] as const;

export const IMPORTANT_INFO_KEYS = [
  "landing.checkout.infoItem1",
  "landing.checkout.infoItem2",
  "landing.checkout.infoItem3",
  "landing.checkout.infoItem4",
  "landing.checkout.infoItem5",
] as const;

export const STEP_KEYS = [
  { key: "landing.checkout.stepSelectTour", status: "completed" as const },
  { key: "landing.checkout.stepCheckout", status: "active" as const },
  { key: "landing.checkout.stepConfirmation", status: "upcoming" as const },
] as const;
