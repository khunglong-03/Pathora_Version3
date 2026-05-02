"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { fmtCurrency, copyToClipboard, STATUS_STEPS } from "./checkoutHelpers";
import { PaymentTransaction, type NormalizedPaymentStatus, paymentService } from "@/api/services/paymentService";
import { PaymentBeneficiaryCard } from "./PaymentBeneficiaryCard";

function buildPostPaymentLoginHref(bookingId: string | null | undefined): string {
  const nextPath = bookingId ? `/bookings/${bookingId}` : "/bookings";
  const params = new URLSearchParams();
  params.set("login", "true");
  params.set("next", nextPath);
  return `/?${params.toString()}`;
}

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
  customerEmail,
  privateCustomCheckout = false,
  privateTopUpCheckout = false,
  t,
}: {
  transaction: PaymentTransaction;
  normalizedStatus: NormalizedPaymentStatus;
  onStatusChange?: (status: NormalizedPaymentStatus) => void;
  customerEmail?: string;
  /** After base payment for private custom — show co-design next steps in success panel. */
  privateCustomCheckout?: boolean;
  privateTopUpCheckout?: boolean;
  t: ReturnType<typeof useTranslation>[0];
}) {
  const timeLeft = useCountdown(transaction.expiredAt);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { seconds: refreshCooldown, rateLimitMsg, clearCooldown } = useRefreshCooldown();
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
        {privateTopUpCheckout ? (
          <p className="text-sm text-emerald-800 text-center leading-relaxed px-1">
            {t("landing.checkout.privateTopUpSuccessNextSteps")}
          </p>
        ) : privateCustomCheckout ? (
          <p className="text-sm text-emerald-800 text-center leading-relaxed px-1">
            {t("landing.checkout.privateCustomCoDesignNextSteps")}
          </p>
        ) : null}
        <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-200 w-full text-center">
          <span className="text-xs text-gray-500">{t("landing.checkout.transactionCode")}</span>
          <p className="text-lg font-bold font-mono text-green-600 mt-1">{transaction.transactionCode}</p>
        </div>
        <div className="flex flex-col gap-3 w-full mt-2">
          {authLoading ? (
            <div className="flex flex-col gap-3 w-full animate-pulse">
              <div className="h-10 w-full rounded-xl bg-slate-200" />
              <div className="h-10 w-full rounded-xl bg-slate-100" />
            </div>
          ) : user != null ? (
            <>
              <Button
                type="button"
                onClick={() => router.push("/bookings")}
                className="w-full h-10 rounded-xl font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                <Icon icon="heroicons:ticket" className="size-4" />
                {t("landing.checkout.viewMyBookings")}
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full h-10 rounded-xl font-semibold text-sm flex items-center justify-center"
              >
                {t("landing.checkout.backToHome")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                onClick={() => router.push(buildPostPaymentLoginHref(transaction.bookingId))}
                className="w-full h-10 rounded-xl font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                <Icon icon="heroicons:arrow-right-on-rectangle" className="size-4" />
                {t("landing.checkout.loginToViewBookings")}
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full h-10 rounded-xl font-semibold text-sm flex items-center justify-center"
              >
                {t("landing.checkout.backToHome")}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                {t("landing.checkout.guestBookingNote", {
                  email: (customerEmail ?? "").trim() || "—",
                })}
              </p>
            </>
          )}
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
        {transaction.errorMessage ? (
          <p className="text-sm text-red-600 text-center max-w-sm" data-payment-provider-error>
            {transaction.errorMessage}
          </p>
        ) : null}
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
      <PaymentBeneficiaryCard transaction={transaction} />

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

/* ── Payment Sidebar ───────────────────────────────────────── */
interface PaymentSidebarProps {
  transaction: PaymentTransaction | null;
  normalizedStatus: NormalizedPaymentStatus;
  onStatusChange?: (status: NormalizedPaymentStatus) => void;
  paymentOption: "full" | "deposit";
  onPaymentOptionChange: (option: "full" | "deposit") => void;
  checkoutPrice: { depositPercentage?: number } | null;
  depositAmount: number;
  totalPrice: number;
  remainingBalance: number;
  canConfirm: boolean;
  loading: boolean;
  onConfirmBooking: () => void;
  /** Guest checkout email (for post-payment copy when user is not logged in). */
  customerEmail?: string;
  /** Private custom flow: 100% base upfront only — hide deposit vs full toggle. */
  hidePayMethodToggle?: boolean;
  /** Private custom flow — success panel shows co-design copy. */
  privateCustomCheckout?: boolean;
  /** Delta &gt; 0 — existing top-up transaction loaded by code. */
  privateTopUpCheckout?: boolean;
  t: ReturnType<typeof useTranslation>[0];
}

export function PaymentSidebar({
  transaction,
  normalizedStatus,
  onStatusChange,
  paymentOption,
  onPaymentOptionChange,
  checkoutPrice,
  depositAmount,
  totalPrice,
  remainingBalance,
  canConfirm,
  loading,
  onConfirmBooking,
  customerEmail,
  hidePayMethodToggle = false,
  privateCustomCheckout = false,
  privateTopUpCheckout = false,
  t,
}: PaymentSidebarProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-8 md:p-10">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-6">
          {transaction ? t("landing.checkout.paymentMethod") : t("landing.checkout.confirmBooking")}
        </h3>

        {transaction ? (
          <PaymentStatusPanel
            transaction={transaction}
            normalizedStatus={normalizedStatus}
            onStatusChange={onStatusChange}
            customerEmail={customerEmail}
            privateCustomCheckout={privateCustomCheckout}
            privateTopUpCheckout={privateTopUpCheckout}
            t={t}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Payment Option Toggle */}
            {hidePayMethodToggle ? (
              <p className="text-sm text-slate-600 leading-relaxed rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                {t(
                  "landing.checkout.privateCustomPayNote",
                  "Private custom tours require payment of the full published base price before co-design begins.",
                )}
              </p>
            ) : privateTopUpCheckout ? (
              <p className="text-sm text-slate-600 leading-relaxed rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3">
                {t("landing.checkout.privateTopUpPayNote")}
              </p>
            ) : (
            <div className="bg-slate-50 p-1.5 rounded-2xl flex items-center border border-slate-100">
              <button
                type="button"
                onClick={() => onPaymentOptionChange("deposit")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  paymentOption === "deposit"
                    ? "bg-white text-slate-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-slate-200/50"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("landing.checkout.deposit", "Deposit")} ({Math.round((checkoutPrice?.depositPercentage ?? 0.3) * 100)}%)
              </button>
              <button
                type="button"
                onClick={() => onPaymentOptionChange("full")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  paymentOption === "full"
                    ? "bg-white text-slate-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-slate-200/50"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("landing.checkout.payFull", "Full Payment")}
              </button>
            </div>
            )}

            {/* Price breakdown */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col gap-3">
              {paymentOption === "deposit" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      {t("landing.checkout.deposit")} ({Math.round((checkoutPrice?.depositPercentage ?? 0.3) * 100)}%)
                    </span>
                    <span className="text-lg font-semibold tracking-tight text-slate-900">{fmtCurrency(depositAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <span className="text-xs text-slate-500">{t("landing.checkout.remainingBalance")}</span>
                    <span className="text-xs text-slate-500">{fmtCurrency(remainingBalance)}</span>
                  </div>
                </>
              ) : null}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold tracking-tight text-slate-900">{t("landing.checkout.total")}</span>
                <span className="text-2xl font-bold tracking-tight text-slate-900">{fmtCurrency(totalPrice)}</span>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                disabled={!canConfirm}
                onClick={onConfirmBooking}
                className={`w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 ${
                  canConfirm
                    ? "bg-zinc-950 text-white hover:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/20 cursor-pointer"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                }`}>
                {loading ? (
                  <>
                    <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
                    <span>{t("landing.checkout.processing")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("landing.checkout.confirmBooking")}</span>
                    <Icon icon="heroicons:arrow-right" className="size-5 ml-1 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
              <p className="text-center text-[11px] font-medium text-slate-400 mt-2 flex items-center justify-center gap-1.5">
                <Icon icon="heroicons:lock-closed" className="size-3" />
                {t("landing.checkout.secureBookingNote")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
