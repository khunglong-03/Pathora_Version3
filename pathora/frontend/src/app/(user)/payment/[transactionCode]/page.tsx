"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { LandingHeader } from "@/features/shared/components/LandingHeader";
import { LandingFooter } from "@/features/shared/components/LandingFooter";
import { useTranslation } from "react-i18next";
import { paymentService, type PaymentTransaction, type CheckoutPriceResponse } from "@/api/services/paymentService";
import { handleApiError } from "@/utils/apiResponse";
// Task 4.5.2: SignalR real-time payment updates with polling fallback
import { usePaymentSignalR } from "@/hooks/usePaymentSignalR";

function CheckoutUrlDisplay({ url, size = 200 }: { url: string; size?: number }) {
  return (
    <img
      src={url}
      alt="Payment QR Code"
      style={{ width: size, height: size }}
      className="rounded-lg border-2 border-gray-200"
    />
  );
}

function PaymentMethodBadge({ method }: { method: string | undefined }) {
  if (!method) return null;

  const isPayOS = method === "PayOS" || method === "PayOs";
  const label = isPayOS ? "PayOS" : method === "Sepay" || method === "SePay" ? "Sepay" : method;
  const badgeStyle = isPayOS
    ? "bg-blue-100 text-blue-700 border-blue-200"
    : "bg-green-100 text-green-700 border-green-200";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
      <Icon icon={isPayOS ? "heroicons:credit-card" : "heroicons:qr-code"} className="size-3" />
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
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  if (!breakdown) return null;

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{t("landing.payment.breakdown.subtotal")}</span>
        <span className="text-sm font-medium text-slate-900">{formatCurrency(breakdown.subtotal)}</span>
      </div>
      {breakdown.taxRate > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {t("landing.payment.breakdown.tax")} ({Math.round(breakdown.taxRate * 100)}% VAT)
          </span>
          <span className="text-sm font-medium text-slate-900">{formatCurrency(breakdown.taxAmount)}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <span className="text-sm font-bold text-slate-900">{t("landing.payment.breakdown.total")}</span>
        <span className="text-base font-bold text-orange-500">{formatCurrency(breakdown.totalPrice)}</span>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const transactionCode = searchParams.get("code");
  const bookingId = searchParams.get("bookingId");
  const confirmParam = searchParams.get("confirm");
  const statusParam = searchParams.get("status");

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
        fetchStatus(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [transactionCode]);

  const fetchStatus = async (immediate = false) => {
    if (!transactionCode) {
      setError("Missing transaction code");
      setLoading(false);
      return;
    }

    try {
      const snapshot = await paymentService.checkPayment(transactionCode);
      setTransaction((prev) =>
        prev
          ? {
              ...prev,
              status: snapshot.rawStatus as PaymentTransaction["status"],
              paidAmount: snapshot.providerTransactionId ? prev.amount : prev.paidAmount,
              paidAt: snapshot.normalizedStatus === "paid" ? snapshot.checkedAt : prev.paidAt,
            }
          : null,
      );
      const newStatus = mapStatus(snapshot.rawStatus);
      setStatus(newStatus);
    } catch (err: unknown) {
      // No rate-limit on /check
      const handledError = handleApiError(err);
      console.error("Failed to fetch transaction:", handledError.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch (or immediate on ?confirm=true)
  useEffect(() => {
    if (confirmParam === "true") {
      fetchStatus(true);
    } else {
      fetchStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionCode]);

  const handleRefresh = () => {
    if (refreshCooldown > 0 || isTerminal) return;
    fetchStatus(true);
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
      <>
        <LandingHeader />
        <main className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Icon icon="heroicons:arrow-path" className="size-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading payment status...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !transaction) {
    return (
      <>
        <LandingHeader />
        <main className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto p-6 text-center">
            <div className="size-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="heroicons:exclamation-triangle" className="size-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Error</h1>
            <p className="text-gray-600 mb-6">{error || "Unable to load transaction"}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
              <Icon icon="heroicons:home" className="size-5" />
              Back to Home
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Success state
  if (status === "completed") {
    return (
      <>
        <LandingHeader />
        <main className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto p-6 text-center">
            <div className="size-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="heroicons:check-circle" className="size-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your payment of {formatCurrency(transaction.paidAmount || transaction.amount)} has been processed.
            </p>

            <div className="bg-white rounded-xl border border-gray-200 p-4 text-left mb-6">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction Code</span>
                  <span className="font-mono font-medium">{transaction.transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method</span>
                  <PaymentMethodBadge method={transaction.paymentMethod} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid Amount</span>
                  <span className="font-medium text-green-600">{formatCurrency(transaction.paidAmount || transaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Time</span>
                  <span>{formatDate(transaction.paidAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {bookingId ? (
                <Link
                  href={`/bookings/${bookingId}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                  <Icon icon="heroicons:clipboard-document-check" className="size-5" />
                  View Booking
                </Link>
              ) : (
                <Link
                  href="/bookings"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                  <Icon icon="heroicons:clipboard-document-check" className="size-5" />
                  My Bookings
                </Link>
              )}
            </div>
          </div>
        </main>
        <LandingFooter />
      </>
    );
  }

  // Expired state
  if (status === "expired") {
    return (
      <>
        <LandingHeader />
        <main className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto p-6 text-center">
            <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="heroicons:clock" className="size-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Expired</h1>
            <p className="text-gray-600 mb-6">
              The payment window has expired. Please create a new payment to complete your booking.
            </p>

            <div className="flex gap-3">
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                Back to Home
              </Link>
              {bookingId && (
                <Link
                  href={`/checkout?bookingId=${bookingId}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                  Try Again
                </Link>
              )}
            </div>
          </div>
        </main>
        <LandingFooter />
      </>
    );
  }

  // Failed state
  if (status === "failed") {
    return (
      <>
        <LandingHeader />
        <main className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto p-6 text-center">
            <div className="size-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="heroicons:x-circle" className="size-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">
              There was an issue processing your payment. Please try again.
            </p>

            <div className="flex gap-3">
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                Back to Home
              </Link>
              {bookingId && (
                <Link
                  href={`/checkout?bookingId=${bookingId}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                  Try Again
                </Link>
              )}
            </div>
          </div>
        </main>
        <LandingFooter />
      </>
    );
  }

  // Pending/Processing state
  return (
    <>
      <LandingHeader />
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Payment</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-gray-600">Pay {formatCurrency(transaction.amount)}</p>
              <PaymentMethodBadge method={transaction.paymentMethod} />
            </div>
          </div>

          {/* Transaction Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="p-5">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction Code</span>
                  <span className="font-mono font-medium">{transaction.transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-orange-600">{formatCurrency(transaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Content</span>
                  <span className="font-medium">{transaction.paymentNote}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          {bookingId && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Payment Breakdown</h3>
                <PaymentBreakdown bookingId={bookingId} />
              </div>
            </div>
          )}

          {/* QR Code Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="p-6 text-center">
              {transaction.checkoutUrl ? (
                <CheckoutUrlDisplay url={transaction.checkoutUrl} size={220} />
              ) : (
                <div className="size-[220px] bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                  <Icon icon="heroicons:qr-code" className="size-16 text-gray-400" />
                </div>
              )}

              <p className="text-xs text-gray-500 mt-4">
                Open your banking app and scan the QR code
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          {countdown > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center mb-6">
              <p className="text-sm text-orange-700">
                Payment expires in: <span className="font-bold text-lg">{formatCountdown(countdown)}</span>
              </p>
            </div>
          )}

          {/* Rate Limit Message */}
          {rateLimitMessage && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mb-6">
              <p className="text-sm text-amber-700">{rateLimitMessage}</p>
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshCooldown > 0 || isTerminal}
            className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors mb-6 ${
              refreshCooldown > 0 || isTerminal
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
            }`}>
            <Icon icon="heroicons:arrow-path" className={`size-4 ${refreshCooldown > 0 ? "animate-spin" : ""}`} />
            {refreshCooldown > 0
              ? t("landing.payment.retryAfterMessage", { seconds: refreshCooldown })
              : t("landing.payment.refreshButton")}
          </button>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Icon icon="heroicons:information-circle" className="size-5" />
              Payment Instructions
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open your mobile banking app</li>
              <li>Select &ldquo;Scan QR&rdquo; and scan the code above</li>
              <li>Verify the payment amount and content</li>
              <li>Confirm the payment</li>
              <li>Click &ldquo;Tôi đã chuyển khoản&rdquo; above to verify immediately</li>
            </ol>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
            <span className="text-sm">Waiting for payment...</span>
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
