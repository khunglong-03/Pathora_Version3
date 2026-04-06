"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";
import { fmtCurrency, copyToClipboard, STATUS_STEPS } from "./checkoutHelpers";
import { PaymentTransaction, type NormalizedPaymentStatus, paymentService } from "@/api/services/paymentService";
// Task 5.4.1: Optimistic UI for "I have transferred" + SignalR payment updates
import { signalRService } from "@/api/services/signalRService";
import i18n from "@/i18n/config";

/* ── Countdown Timer ─────────────────────────────────── */
function useCountdown(expiredAt: string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiredAt) return;

    const update = () => {
      const now = Date.now();
      const diff = new Date(expiredAt).getTime() - now;
      if (diff <= 0) { setTimeLeft("00:00"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiredAt]);

  return timeLeft;
}

/* ── Refresh cooldown hook ─────────────────────────────── */
function useRefreshCooldown(_initialSeconds = 5) {
  const [seconds, setSeconds] = useState(0);
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (seconds <= 0) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((p) => { if (p <= 1) { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = null; return 0; } return p - 1; });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [seconds]);

  const startCooldown = (secs: number, msg: string) => {
    setRateLimitMsg(msg);
    setSeconds(secs);
  };
  const clearCooldown = () => { setSeconds(0); setRateLimitMsg(null); };

  return { seconds, rateLimitMsg, startCooldown, clearCooldown };
}

/* ── Payment Status Panel ─────────────────────────────── */
function PaymentStatusPanel({
  transaction,
  normalizedStatus,
  onStatusChange,
  t,
}: {
  transaction: PaymentTransaction;
  normalizedStatus: NormalizedPaymentStatus;
  onStatusChange?: (status: NormalizedPaymentStatus) => void;
  t: ReturnType<typeof useTranslation>[0];
}) {
  const timeLeft = useCountdown(transaction.expiredAt);
  const router = useRouter();
  const { seconds: refreshCooldown, rateLimitMsg, startCooldown, clearCooldown } = useRefreshCooldown();
  const [verifyingPayment, setVerifyingPayment] = useState(false); // Task 5.4.1: optimistic UI state

  const isTerminal = normalizedStatus === "paid" || normalizedStatus === "failed" || normalizedStatus === "cancelled" || normalizedStatus === "expired";

  const handleRefresh = async () => {
    if (refreshCooldown > 0 || isTerminal) return;
    try {
      const snapshot = await paymentService.checkPayment(transaction.transactionCode);
      clearCooldown();
      onStatusChange?.(snapshot.normalizedStatus);
      if (snapshot.normalizedStatus === "paid") {
        toast.success(t("landing.checkout.paymentReceived"));
      } else if (snapshot.normalizedStatus === "expired") {
        toast.error(t("landing.checkout.paymentExpired"));
      } else if (snapshot.normalizedStatus === "failed") {
        toast.error(t("landing.checkout.paymentFailed"));
      } else if (snapshot.normalizedStatus === "cancelled") {
        toast.warn(t("landing.checkout.paymentCancelled"));
      } else {
        toast.info(t("landing.checkout.paymentNotFoundYet"));
      }
    } catch (err: unknown) {
      console.error("Check payment failed:", err);
      toast.error(t("landing.checkout.checkPaymentError"));
    }
  };

  // Task 5.4.1: Optimistic UI — verify with API before navigating
  const handleIHaveTransferred = async () => {
    setVerifyingPayment(true);
    try {
      const snapshot = await paymentService.checkPayment(transaction.transactionCode);
      if (snapshot.normalizedStatus === "paid") {
        // Success — parent will re-render via normalizedStatus change
      } else {
        router.push(`/payment/${transaction.transactionCode}?confirm=true`);
      }
    } catch {
      // On error, still navigate to the payment page
      router.push(`/payment/${transaction.transactionCode}?confirm=true`);
    }
    setVerifyingPayment(false);
  };

  if (normalizedStatus === "paid") {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
          <Icon icon="heroicons:check-circle" className="size-10 text-green-500" />
        </div>
        <h3 className="text-lg font-bold text-green-600">{t("landing.checkout.paymentReceived")}</h3>
        <p className="text-sm text-gray-500 text-center">{t("landing.checkout.paymentConfirmedDesc")}</p>
        <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-200 w-full text-center">
          <span className="text-xs text-gray-500">{t("landing.checkout.transactionCode")}</span>
          <p className="text-lg font-bold font-mono text-green-600 mt-1">{transaction.transactionCode}</p>
        </div>
      </div>
    );
  }

  if (normalizedStatus === "failed" || normalizedStatus === "cancelled" || normalizedStatus === "expired") {
    const iconName = normalizedStatus === "cancelled" ? "heroicons:no-symbol" : normalizedStatus === "expired" ? "heroicons:clock" : "heroicons:x-circle";
    const iconStyles = normalizedStatus === "cancelled" ? "bg-amber-100 text-amber-600" : normalizedStatus === "expired" ? "bg-slate-100 text-slate-500" : "bg-red-100 text-red-500";
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className={`size-16 rounded-full flex items-center justify-center ${iconStyles}`}>
          <Icon icon={iconName} className="size-10" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {normalizedStatus === "cancelled" ? t("landing.checkout.paymentCancelled")
            : normalizedStatus === "expired" ? t("landing.checkout.paymentExpired")
            : t("landing.checkout.paymentFailed")}
        </h3>
        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 w-full text-center">
          <span className="text-xs text-gray-500">{t("landing.checkout.transactionCode")}</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">{transaction.transactionCode}</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(transaction.status as (typeof STATUS_STEPS)[number]);

  return (
    <div className="flex flex-col gap-4">
      {/* Status + countdown */}
      <div className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3 border border-orange-200">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-sm font-semibold text-orange-600">{t("landing.checkout.awaitingPayment")}</span>
        </div>
        {timeLeft && (
          <div className="flex items-center gap-1.5">
            <Icon icon="heroicons:clock" className="size-4 text-orange-500" />
            <span className="text-sm font-mono font-bold text-orange-600">{timeLeft}</span>
          </div>
        )}
      </div>

      {/* Transaction code */}
      <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
        <span className="text-xs text-gray-500 block mb-1">{t("landing.checkout.transactionCode")}</span>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-wider">{transaction.transactionCode}</span>
          <button
            type="button"
            onClick={() => copyToClipboard(transaction.transactionCode, t("landing.checkout.copied"))}
            className="size-8 rounded-lg bg-orange-100 hover:bg-orange-200 flex items-center justify-center transition-colors cursor-pointer">
            <Icon icon="heroicons:clipboard-document" className="size-4 text-orange-600" />
          </button>
        </div>
      </div>

      {/* QR code */}
      {transaction.checkoutUrl && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={transaction.checkoutUrl} alt="Payment QR Code" className="size-48 rounded-lg object-contain" />
          <p className="text-xs font-semibold text-slate-900 mt-3">{t("landing.checkout.scanToPay")}</p>
        </div>
      )}

      {/* Bank account info */}
      <BankAccountInfo t={t} />

      {/* Status progress */}
      <div className="flex items-center justify-between px-2">
        {STATUS_STEPS.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div className={`size-6 rounded-full flex items-center justify-center ${i <= currentIdx ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                {i < currentIdx ? <Icon icon="heroicons:check" className="size-3.5" />
                  : <span className="text-[10px] font-bold">{i + 1}</span>}
              </div>
              <span className={`text-[10px] font-medium ${i <= currentIdx ? "text-orange-600" : "text-gray-400"}`}>
                {t(`landing.checkout.status${step}`)}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 -mt-4 ${i < currentIdx ? "bg-orange-500" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">{t("landing.checkout.transferInstructions")}</p>

      {/* Rate limit message */}
      {rateLimitMsg && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-sm text-amber-700">{rateLimitMsg}</p>
        </div>
      )}

      {/* Refresh button */}
      <Button
        type="button"
        onClick={handleRefresh}
        disabled={refreshCooldown > 0 || isTerminal}
        className={`w-full h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
          refreshCooldown > 0 || isTerminal
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
        }`}>
        <Icon icon="heroicons:arrow-path" className={`size-4 ${refreshCooldown > 0 ? "animate-spin" : ""}`} />
        {refreshCooldown > 0 ? t("landing.payment.retryAfterMessage", { seconds: refreshCooldown }) : t("landing.payment.refreshButton")}
      </Button>

      {/* Task 5.4.1: "I have transferred" button with optimistic UI */}
      <Button
        type="button"
        onClick={handleIHaveTransferred}
        disabled={verifyingPayment}
        className={`w-full h-10 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-colors ${
          verifyingPayment
            ? "bg-green-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 shadow-[0_2px_4px_0_#bbf7d0] cursor-pointer"
        }`}
        aria-label={t("landing.checkout.iHaveTransferredTooltip")}>
        <Icon icon={verifyingPayment ? "heroicons:arrow-path" : "heroicons:check-circle"} className={`size-4 ${verifyingPayment ? "animate-spin" : ""}`} />
        {verifyingPayment ? t("landing.checkout.verifyingPayment") : t("landing.checkout.iHaveTransferred")}
      </Button>
    </div>
  );
}

/* ── Bank Account Info ─────────────────────────────── */
function BankAccountInfo({ t }: { t: ReturnType<typeof useTranslation>[0] }) {
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || "MBBank (MB)";
  const accountNumber = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "0378175727";
  const accountHolder = process.env.NEXT_PUBLIC_BANK_ACCOUNT_HOLDER || "PATHORA TRAVEL";

  return (
    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <Icon icon="heroicons:building-library" className="size-5 text-blue-600" />
        <h4 className="text-sm font-semibold text-slate-900">{t("landing.checkout.bankAccountInfo")}</h4>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{t("landing.checkout.bankName")}</span>
          <span className="text-sm font-semibold text-slate-900">{bankName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{t("landing.checkout.accountNumber")}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 font-mono">{accountNumber}</span>
            <button type="button" aria-label={t("landing.checkout.copyAccountNumber")}
              onClick={() => copyToClipboard(accountNumber, t("landing.checkout.copied"))}
              className="size-6 rounded-md bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors cursor-pointer">
              <Icon icon="heroicons:clipboard-document" className="size-3.5 text-blue-600" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{t("landing.checkout.accountHolder")}</span>
          <span className="text-sm font-semibold text-slate-900">{accountHolder}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Payment Sidebar ───────────────────────────────────────── */
interface PaymentSidebarProps {
  transaction: PaymentTransaction | null;
  normalizedStatus: NormalizedPaymentStatus;
  onStatusChange?: (status: NormalizedPaymentStatus) => void;
  paymentOption: "full" | "deposit";
  checkoutPrice: { depositPercentage?: number } | null;
  depositAmount: number;
  totalPrice: number;
  remainingBalance: number;
  canConfirm: boolean;
  loading: boolean;
  onConfirmBooking: () => void;
  t: ReturnType<typeof useTranslation>[0];
}

export function PaymentSidebar({
  transaction,
  normalizedStatus,
  onStatusChange,
  paymentOption,
  checkoutPrice,
  depositAmount,
  totalPrice,
  remainingBalance,
  canConfirm,
  loading,
  onConfirmBooking,
  t,
}: PaymentSidebarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
      <div className="bg-linear-to-b from-orange-500 to-orange-600 h-1 w-full rounded-t-2xl" />
      <div className="p-5">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          {transaction ? t("landing.checkout.paymentMethod") : t("landing.checkout.confirmBooking")}
        </h3>

        {transaction ? (
          <PaymentStatusPanel transaction={transaction} normalizedStatus={normalizedStatus} onStatusChange={onStatusChange} t={t} />
        ) : (
          <>
            {/* Price breakdown */}
            <div
              className="rounded-xl p-4 flex flex-col gap-2 mb-5"
              style={{
                backgroundImage: "linear-gradient(158deg, rgb(255,247,237) 0%, rgb(255,251,235) 100%)",
                border: "1px solid #ffedd4",
              }}>
              {paymentOption === "deposit" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {t("landing.checkout.deposit")} ({Math.round((checkoutPrice?.depositPercentage ?? 0.3) * 100)}%)
                    </span>
                    <span className="text-lg font-bold text-slate-900">{fmtCurrency(depositAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                    <span className="text-xs text-gray-500">{t("landing.checkout.remainingBalance")}</span>
                    <span className="text-xs text-gray-500">{fmtCurrency(remainingBalance)}</span>
                  </div>
                </>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{t("landing.checkout.total")}</span>
                <span className="text-2xl font-bold text-orange-500">{fmtCurrency(totalPrice)}</span>
              </div>
            </div>

            {/* Confirm Button */}
            <Button
              type="button"
              disabled={!canConfirm}
              onClick={onConfirmBooking}
              className={`w-full h-12 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all ${
                canConfirm
                  ? "bg-orange-500 hover:bg-orange-600 shadow-[0_4px_6px_0_#ffd6a8,0_2px_4px_0_#ffd6a8] cursor-pointer"
                  : "bg-orange-500 opacity-50 cursor-not-allowed shadow-[0_4px_6px_0_#ffd6a8,0_2px_4px_0_#ffd6a8]"
              }`}>
              {loading ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
                  {t("landing.checkout.processing")}
                </>
              ) : (
                <>
                  {t("landing.checkout.confirmBooking")}
                  <Icon icon="heroicons:chevron-right" className="size-4" />
                </>
              )}
            </Button>
            <p className="text-center text-[10px] text-gray-400 mt-3">
              {t("landing.checkout.secureBookingNote")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
