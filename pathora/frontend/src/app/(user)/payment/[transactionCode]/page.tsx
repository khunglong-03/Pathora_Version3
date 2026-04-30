"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui";

import { useTranslation } from "react-i18next";
import { paymentService, type PaymentTransaction, type CheckoutPriceResponse } from "@/api/services/paymentService";
import { handleApiError } from "@/utils/apiResponse";
// Task 4.5.2: SignalR real-time payment updates with polling fallback
import { usePaymentSignalR } from "@/hooks/usePaymentSignalR";
import { PaymentBeneficiaryCard } from "@/features/checkout/components/PaymentBeneficiaryCard";
import { useAuth } from "@/contexts/AuthContext";

function buildPostPaymentLoginHref(bookingId: string | null | undefined): string {
  const nextPath = bookingId ? `/bookings/${bookingId}` : "/bookings";
  const params = new URLSearchParams();
  params.set("login", "true");
  params.set("next", nextPath);
  return `/?${params.toString()}`;
}

function CheckoutUrlDisplay({ url, size = 240 }: { url: string; size?: number }) {
  return (
    <div className="flex justify-center items-center bg-white p-4 rounded-[1.5rem] border border-slate-200/50 shadow-sm inline-block mx-auto">
      <img
        src={url}
        alt="Payment QR Code"
        style={{ width: size, height: size }}
        className="rounded-xl"
      />
    </div>
  );
}

function PaymentMethodBadge({ method }: { method: string | undefined }) {
  if (!method) return null;

  const isPayOS = method === "PayOS" || method === "PayOs";
  const label = isPayOS ? "PayOS" : method === "Sepay" || method === "SePay" ? "Sepay" : method;
  const badgeStyle = isPayOS
    ? "bg-blue-50 text-blue-700 border-blue-200/50"
    : "bg-emerald-50 text-emerald-700 border-emerald-200/50";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
      <Icon icon={isPayOS ? "heroicons:credit-card" : "heroicons:qr-code"} className="size-3.5" />
      {label}
    </span>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("vi-VN");
}

type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "expired";

function PaymentBreakdown({ bookingId }: { bookingId: string | null }) {
  const { t } = useTranslation();
  const [breakdown, setBreakdown] = useState<CheckoutPriceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const fetchBreakdown = async () => {
      try {
        setLoading(true);
        const data = await paymentService.getCheckoutPrice(bookingId);
        setBreakdown(data);
      } catch {
        // Graceful failure — show transaction amount only
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 mt-4">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
      </div>
    );
  }

  if (!breakdown) return null;

  return (
    <div className="bg-[#f9fafb] rounded-[1rem] p-5 border border-slate-200/50 space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{t("landing.payment.breakdown.subtotal", "Subtotal")}</span>
        <span className="text-sm font-medium text-slate-900 tabular-nums">{formatCurrency(breakdown.subtotal)}</span>
      </div>
      {breakdown.taxRate > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {t("landing.payment.breakdown.tax", "Tax")} ({Math.round(breakdown.taxRate * 100)}% VAT)
          </span>
          <span className="text-sm font-medium text-slate-900 tabular-nums">{formatCurrency(breakdown.taxAmount)}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
        <span className="text-sm font-bold text-slate-900">{t("landing.payment.breakdown.total", "Total")}</span>
        <span className="text-lg font-bold text-[#fa8b02] tabular-nums">{formatCurrency(breakdown.totalPrice)}</span>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams<{ transactionCode?: string }>();
  const searchParams = useSearchParams();
  const transactionCode =
    typeof params?.transactionCode === "string" && params.transactionCode.length > 0
      ? params.transactionCode
      : searchParams.get("code");
  const bookingId = searchParams.get("bookingId");
  const confirmParam = searchParams.get("confirm");

  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [countdown, setCountdown] = useState<number>(0);
  const [refreshCooldown, setRefreshCooldown] = useState<number>(0);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Task 4.5.2: SignalR real-time payment updates with polling fallback
  const paymentSignalR = usePaymentSignalR(transactionCode ?? "");

  const isTerminal = status === "completed" || status === "failed" || status === "expired";

  // Sync SignalR status to local state
  useEffect(() => {
    if (paymentSignalR.status !== "pending") {
      const newStatus = mapStatus(
        paymentSignalR.status === "paid" ? "Completed"
          : paymentSignalR.status === "failed" ? "Failed"
          : paymentSignalR.status === "expired" ? "Cancelled"
          : paymentSignalR.status === "cancelled" ? "Cancelled"
          : "Pending",
      );
      setStatus(newStatus);
    }
  }, [paymentSignalR.status]);

  useEffect(() => {
    if (!transaction?.expiredAt || status !== "pending") {
      setCountdown(0);
      return;
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(transaction.expiredAt).getTime() - Date.now()) / 1000),
    );

    setCountdown(remainingSeconds);
    if (remainingSeconds === 0) {
      setStatus("expired");
    }
  }, [transaction?.expiredAt, status]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0 || status !== "pending") {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [countdown, status]);

  // Refresh cooldown timer
  useEffect(() => {
    if (refreshCooldown <= 0) {
      if (refreshCooldownRef.current) {
        clearInterval(refreshCooldownRef.current);
        refreshCooldownRef.current = null;
      }
      return;
    }

    refreshCooldownRef.current = setInterval(() => {
      setRefreshCooldown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (refreshCooldownRef.current) clearInterval(refreshCooldownRef.current);
    };
  }, [refreshCooldown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (refreshCooldownRef.current) clearInterval(refreshCooldownRef.current);
    };
  }, []);

  // Task 5.3.2: Page visibility handling — immediate fetch on tab focus
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && transactionCode) {
        fetchStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [transactionCode]);

  const fetchStatus = async () => {
    if (!transactionCode || transactionCode === "null" || transactionCode === "undefined") {
      setError("Missing transaction code");
      setLoading(false);
      return;
    }

    try {
      const [currentTransaction, snapshot] = await Promise.all([
        paymentService.getTransaction(transactionCode),
        paymentService.checkPayment(transactionCode),
      ]);

      setTransaction({
        ...currentTransaction,
        status: snapshot.rawStatus as PaymentTransaction["status"],
        paidAmount:
          snapshot.normalizedStatus === "paid"
            ? currentTransaction.paidAmount ?? currentTransaction.amount
            : currentTransaction.paidAmount,
        paidAt:
          snapshot.normalizedStatus === "paid"
            ? currentTransaction.paidAt ?? snapshot.checkedAt
            : currentTransaction.paidAt,
      });
      const newStatus = mapStatus(snapshot.rawStatus);
      setStatus(newStatus);
      setError(null);
    } catch {
      try {
        const currentTransaction = await paymentService.getTransaction(transactionCode);
        setTransaction(currentTransaction);
        setStatus(mapStatus(currentTransaction.status));
        setError(null);
      } catch (transactionErr: unknown) {
        const handledError = handleApiError(transactionErr);
        console.error("Failed to fetch transaction:", handledError.message);
        setError(handledError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch (or immediate on ?confirm=true)
  useEffect(() => {
    if (confirmParam === "true") {
      fetchStatus();
    } else {
      fetchStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionCode]);

  const handleRefresh = () => {
    if (refreshCooldown > 0 || isTerminal) return;
    fetchStatus();
  };

  function mapStatus(status: string): PaymentStatus {
    switch (status) {
      case "Completed":
        return "completed";
      case "Processing":
        return "processing";
      case "Failed":
        return "failed";
      case "Cancelled":
        return "expired";
      default:
        return "pending";
    }
  }

  function formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <main className="bg-[#f9fafb] min-h-[100dvh] flex items-center justify-center px-4">
        <div className="text-center">
          <Icon icon="heroicons:arrow-path" className="size-12 text-[#fa8b02] animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">{t("landing.payment.loading", "Loading payment status...")}</p>
        </div>
      </main>
    );
  }

  if (error || !transaction) {
    return (
      <main className="bg-[#f9fafb] min-h-[100dvh] flex items-center justify-center py-8 md:py-10 px-4">
        <div className="w-full max-w-xl bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 text-center">
          <div className="size-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="heroicons:exclamation-triangle" className="size-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-slate-900 leading-tight mb-3">Payment Error</h1>
          <p className="text-slate-500 leading-relaxed mb-8">{error || "Unable to load transaction"}</p>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">
            <Icon icon="heroicons:home" className="size-5" />
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  // Success state
  if (status === "completed") {
    const effectiveBookingId = bookingId ?? transaction.bookingId ?? null;

    return (
      <main className="bg-[#f9fafb] min-h-[100dvh] flex flex-col items-center justify-center py-8 md:py-10 px-4">
        <div className="w-full max-w-xl bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 text-center">
          <div className="size-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="heroicons:check-circle" className="size-10 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-slate-900 leading-tight mb-3">Payment Successful!</h1>
          <p className="text-slate-500 leading-relaxed mb-8">
            Your payment of <span className="font-semibold text-slate-900">{formatCurrency(transaction.paidAmount || transaction.amount)}</span> has been processed.
          </p>

          <div className="bg-[#f9fafb] rounded-[1rem] border border-slate-200/50 p-5 text-left mb-8">
            <div className="grid gap-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Transaction Code</span>
                <span className="font-mono font-bold text-slate-900">{transaction.transactionCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Method</span>
                <PaymentMethodBadge method={transaction.paymentMethod} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Paid Amount</span>
                <span className="font-bold text-emerald-600 text-base tabular-nums">{formatCurrency(transaction.paidAmount || transaction.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Time</span>
                <span className="font-medium text-slate-900">{formatDate(transaction.paidAt)}</span>
              </div>
            </div>
          </div>

          {authLoading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              <div className="h-14 w-full rounded-xl bg-slate-100" />
              <div className="h-14 w-full rounded-xl bg-slate-50" />
            </div>
          ) : user != null ? (
            <div className="flex gap-3">
              {effectiveBookingId ? (
                <Link
                  href={`/bookings/${effectiveBookingId}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#fa8b02] text-white rounded-xl font-semibold hover:bg-orange-600 transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02]">
                  <Icon icon="heroicons:clipboard-document-check" className="size-5" />
                  View Booking
                </Link>
              ) : (
                <Link
                  href="/bookings"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#fa8b02] text-white rounded-xl font-semibold hover:bg-orange-600 transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02]">
                  <Icon icon="heroicons:clipboard-document-check" className="size-5" />
                  My Bookings
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => router.push(buildPostPaymentLoginHref(effectiveBookingId))}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#fa8b02] text-white rounded-xl font-semibold hover:bg-orange-600 transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02]">
                <Icon icon="heroicons:arrow-right-on-rectangle" className="size-5" />
                {t("landing.checkout.loginToViewBookings", "Login to View Bookings")}
              </button>
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200">
                <Icon icon="heroicons:home" className="size-5" />
                {t("landing.checkout.backToHome", "Back to Home")}
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Expired state
  if (status === "expired") {
    return (
      <main className="bg-[#f9fafb] min-h-[100dvh] flex items-center justify-center py-8 md:py-10 px-4">
        <div className="w-full max-w-xl bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 text-center">
          <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="heroicons:clock" className="size-10 text-slate-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-slate-900 leading-tight mb-3">Payment Expired</h1>
          <p className="text-slate-500 leading-relaxed mb-8">
            The payment window has expired. Please create a new payment to complete your booking.
          </p>

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all active:scale-[0.98]">
              Back to Home
            </Link>
            {bookingId && (
              <Link
                href={`/checkout?bookingId=${bookingId}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-[0.98]">
                Try Again
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Failed state
  if (status === "failed") {
    return (
      <main className="bg-[#f9fafb] min-h-[100dvh] flex items-center justify-center py-8 md:py-10 px-4">
        <div className="w-full max-w-xl bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 text-center">
          <div className="size-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="heroicons:x-circle" className="size-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-slate-900 leading-tight mb-3">Payment Failed</h1>
          <p className="text-slate-500 leading-relaxed mb-8">
            There was an issue processing your payment. Please try again.
          </p>

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all active:scale-[0.98]">
              Back to Home
            </Link>
            {bookingId && (
              <Link
                href={`/checkout?bookingId=${bookingId}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-[0.98]">
                Try Again
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Pending/Processing state
  return (
    <main className="bg-[#f9fafb] min-h-[100dvh] flex flex-col items-center justify-center py-8 md:py-10 px-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tighter text-slate-900 leading-tight mb-3">Complete Your Payment</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-slate-500 text-lg">Pay <span className="font-bold text-slate-900">{formatCurrency(transaction.amount)}</span></p>
            <PaymentMethodBadge method={transaction.paymentMethod} />
          </div>
        </div>

        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden mb-6">
          <div className="p-6 md:p-8">
            <div className="grid gap-4 text-sm mb-8 pb-8 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transaction Code</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200/50">{transaction.transactionCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Amount</span>
                <span className="font-bold text-lg tabular-nums text-emerald-600">{formatCurrency(transaction.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Content</span>
                <span className="font-medium text-slate-900 bg-[#fa8b02]/10 text-orange-800 px-3 py-1 rounded-lg font-mono text-xs">{transaction.paymentNote}</span>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="text-center mb-8">
              {transaction.checkoutUrl ? (
                <CheckoutUrlDisplay url={transaction.checkoutUrl} size={240} />
              ) : (
                <div className="size-[240px] bg-slate-50 rounded-[1.5rem] border border-slate-200/50 flex items-center justify-center mx-auto">
                  <Icon icon="heroicons:qr-code" className="size-16 text-slate-300" />
                </div>
              )}
              <p className="text-sm text-slate-500 mt-5 leading-relaxed max-w-[40ch] mx-auto">
                Open your banking app and scan the QR code to complete your booking securely.
              </p>
            </div>

            {/* Countdown Timer */}
            {countdown > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center mb-6">
                <p className="text-sm text-orange-800">
                  Payment expires in: <span className="font-bold tabular-nums text-lg ml-1">{formatCountdown(countdown)}</span>
                </p>
              </div>
            )}

            {/* Rate Limit Message */}
            {rateLimitMessage && (
              <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 text-center mb-6">
                <p className="text-sm font-medium text-amber-800">{rateLimitMessage}</p>
              </div>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshCooldown > 0 || isTerminal}
              className={`w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${
                refreshCooldown > 0 || isTerminal
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-[#fa8b02] text-white hover:bg-orange-600 active:scale-[0.98] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02] cursor-pointer"
              }`}>
              <Icon icon="heroicons:arrow-path" className={`size-5 ${refreshCooldown > 0 ? "animate-spin" : ""}`} />
              {refreshCooldown > 0
                ? t("landing.payment.retryAfterMessage", { seconds: refreshCooldown })
                : t("landing.payment.refreshButton", "I have transferred the money")}
            </button>

            {/* Payment Breakdown */}
            {bookingId && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Payment Breakdown</h3>
                <PaymentBreakdown bookingId={bookingId} />
              </div>
            )}
          </div>
        </div>

        <PaymentBeneficiaryCard transaction={transaction} className="mb-6 border-slate-200/50 shadow-sm" />

        {/* Instructions */}
        <div className="bg-[#f9fafb] border border-slate-200/50 rounded-[1.5rem] p-6 md:p-8 mb-8">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-base">
            <Icon icon="heroicons:information-circle" className="size-5 text-slate-400" />
            Payment Instructions
          </h3>
          <ol className="text-sm text-slate-600 space-y-3 list-decimal list-inside leading-relaxed">
            <li>Open your mobile banking app</li>
            <li>Select <strong>&ldquo;Scan QR&rdquo;</strong> and scan the code above</li>
            <li>Verify the payment amount and content exactly</li>
            <li>Confirm the payment in your app</li>
            <li>Click <strong>&ldquo;I have transferred&rdquo;</strong> above to verify immediately</li>
          </ol>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-2 text-slate-500 mb-8">
          <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
          <span className="text-sm font-medium">Waiting for payment...</span>
        </div>
      </div>
    </main>
  );
}
