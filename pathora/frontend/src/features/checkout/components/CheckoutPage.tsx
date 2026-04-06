"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui";
import { LandingHeader } from "@/features/shared/components/LandingHeader";
import { LandingFooter } from "@/features/shared/components/LandingFooter";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  paymentService,
  PaymentTransaction,
  CheckoutPriceResponse,
  type NormalizedPaymentStatus,
} from "@/api/services/paymentService";
import { bookingService, type CreateBookingPayload } from "@/api/services/bookingService";
import { handleApiError } from "@/utils/apiResponse";
import { useAuth } from "@/contexts/AuthContext";
import {
  isCancelReturn,
  mapTransactionStatusToNormalized,
  resolveReturnTransactionCode,
  shouldRedirectToHostedCheckout,
} from "@/features/checkout/components/paymentFlowUtils";
import {
  DEFAULT_DEPOSIT_PERCENTAGE,
  STEP_KEYS,
} from "@/features/checkout/components/checkoutHelpers";
// Task 4.5.1: SignalR real-time payment updates + polling fallback
import { usePaymentSignalR } from "@/hooks/usePaymentSignalR";
import { BookingSummarySection } from "@/features/checkout/components/BookingSummarySection";
import { CustomerInfoCard } from "@/features/checkout/components/CustomerInfoCard";
import { TermsConditionsCard } from "@/features/checkout/components/TermsConditionsCard";
import { PaymentSidebar } from "@/features/checkout/components/PaymentSidebar";
import { SecureBookingCard } from "@/features/checkout/components/SecureBookingCard";
import { TourInstanceInfoCard } from "@/features/checkout/components/TourInstanceInfoCard";

/* ── Step Indicator ────────────────────────────────────────── */
function StepIndicator() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_KEYS.map((step, i) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center gap-1.5">
            {step.status === "completed" ? (
              <div className="size-8 rounded-full bg-orange-500 flex items-center justify-center">
                <Icon icon="heroicons:check" className="size-4 text-white" />
              </div>
            ) : step.status === "active" ? (
              <div className="size-8 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{i + 1}</span>
              </div>
            ) : (
              <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-400">{i + 1}</span>
              </div>
            )}
            <span
              className={`text-xs font-medium whitespace-nowrap ${
                step.status === "upcoming" ? "text-gray-400" : "text-gray-700"
              }`}>
              {t(step.key)}
            </span>
          </div>

          {i < STEP_KEYS.length - 1 && (
            <div
              className={`h-0.5 w-8 md:w-15 mx-1 md:mx-2 -mt-5 ${
                i === 0 ? "bg-orange-500" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ██  CheckoutPage
   ══════════════════════════════════════════════════════════════ */
export function CheckoutPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  /* ── State ─────────────────────────────────────────────── */
  const [paymentOption, setPaymentOption] = useState<"full" | "deposit">("deposit");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [acknowledgeInfo, setAcknowledgeInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [normalizedStatus, setNormalizedStatus] = useState<NormalizedPaymentStatus>("pending");
  const [checkoutPrice, setCheckoutPrice] = useState<CheckoutPriceResponse | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Customer info for booking creation
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Task 5.3.1: visibility ref for tab focus tracking

  /* ── Get booking ID or tour instance info from URL ───── */
  const bookingIdParam = searchParams.get("bookingId");
  const tourInstanceIdParam = searchParams.get("tourInstanceId");
  const tourNameParam = searchParams.get("tourName");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const locationParam = searchParams.get("location");
  const depositPerPersonParam = searchParams.get("depositPerPerson");
  const basePriceParam = searchParams.get("basePrice");
  const depositPercentageParam = searchParams.get("depositPercentage");
  const bookingTypeParam = searchParams.get("bookingType") || "InstanceJoin";
  const instanceTypeParam = searchParams.get("instanceType") || "public";

  /* ── State for tour instance booking ─────────────────── */
  const [tourInstanceBooking, setTourInstanceBooking] = useState<{
    tourInstanceId: string;
    tourName: string;
    startDate: string;
    endDate: string;
    location: string;
    depositPerPerson: number;
    depositPercentage: number;
    bookingType: string;
    instanceType: string;
  } | null>(null);

  /* ── Initialize tour instance booking from URL params ──── */
  useEffect(() => {
    if (tourInstanceIdParam && tourNameParam) {
      const basePrice = Number(basePriceParam) || 0;
      const depositPercentage = Number(depositPercentageParam) || 0.3;
      const depositAmount = Math.round(basePrice * depositPercentage);

      setTourInstanceBooking({
        tourInstanceId: tourInstanceIdParam,
        tourName: tourNameParam,
        startDate: startDateParam || "",
        endDate: endDateParam || "",
        location: locationParam || "",
        depositPerPerson: depositAmount,
        depositPercentage: depositPercentage,
        bookingType: bookingTypeParam,
        instanceType: instanceTypeParam,
      });
      setLoadingPrice(false);
    }
  }, [tourInstanceIdParam, tourNameParam, startDateParam, endDateParam, locationParam, depositPerPersonParam, basePriceParam, depositPercentageParam, bookingTypeParam, instanceTypeParam]);

  /* ── Fetch checkout price from API ────────────────────── */
  useEffect(() => {
    if (!bookingIdParam) {
      setLoadingPrice(false);
      return;
    }

    const fetchCheckoutPrice = async () => {
      try {
        setLoadingPrice(true);
        setPriceError(null);
        const price = await paymentService.getCheckoutPrice(bookingIdParam);
        if (price) {
          setCheckoutPrice(price);
        }
      } catch (error) {
        const handledError = handleApiError(error);
        console.error("Failed to fetch checkout price:", handledError.message);
        setPriceError(handledError.message);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchCheckoutPrice();
  }, [bookingIdParam]);

  /* ── Derived ──────────────────────────────────────────── */
  const adultsParam = searchParams.get("adults") || "1";
  const childrenParam = searchParams.get("children") || "0";
  const infantsParam = searchParams.get("infants") || "0";
  const numberAdult = parseInt(adultsParam, 10) || 1;
  const numberChild = parseInt(childrenParam, 10) || 0;
  const numberInfant = parseInt(infantsParam, 10) || 0;

  // Build a CheckoutPriceResponse from URL params when there's no API response (tour instance direct checkout)
  const computedCheckoutPrice: CheckoutPriceResponse | null = React.useMemo(() => {
    if (tourInstanceIdParam && tourNameParam) {
      const basePrice = Number(basePriceParam) || 0;
      const depositPct = Number(depositPercentageParam) || 0.3;
      const adultPrice = basePrice;
      const childPrice = 0;
      const infantPrice = 0;
      const adultSubtotal = adultPrice * numberAdult;
      const childSubtotal = childPrice * numberChild;
      const infantSubtotal = infantPrice * numberInfant;
      const subtotal = adultSubtotal + childSubtotal + infantSubtotal;
      const taxRate = 0;
      const taxAmount = Math.round(subtotal * taxRate);
      const totalPrice = subtotal + taxAmount;
      const depositAmount = Math.round(totalPrice * depositPct);
      return {
        bookingId: "",
        tourInstanceId: tourInstanceIdParam,
        tourName: decodeURIComponent(tourNameParam),
        tourCode: "",
        startDate: startDateParam || "",
        endDate: endDateParam || "",
        durationDays: 0,
        location: locationParam || "",
        numberAdult,
        numberChild,
        numberInfant,
        adultPrice,
        childPrice,
        infantPrice,
        adultSubtotal,
        childSubtotal,
        infantSubtotal,
        subtotal,
        taxRate,
        taxAmount,
        totalPrice,
        depositPercentage: depositPct,
        depositAmount,
        remainingBalance: totalPrice - depositAmount,
      };
    }
    return null;
  }, [tourInstanceIdParam, tourNameParam, basePriceParam, depositPercentageParam, startDateParam, endDateParam, locationParam, numberAdult, numberChild, numberInfant]);

  const effectivePrice = checkoutPrice ?? computedCheckoutPrice;
  const bookingId = effectivePrice?.bookingId ?? "";
  const hasPrice = !!(checkoutPrice ?? computedCheckoutPrice);
  const hasTourInstanceBooking = !!tourInstanceBooking;
  const needsBookingCreation = !bookingId && tourInstanceIdParam;
  const hasCustomerInfo = Boolean(customerName.trim() && customerPhone.trim());
  const totalPrice = effectivePrice?.totalPrice ?? 0;
  const depositAmount = effectivePrice?.depositAmount ?? 0;
  const remainingBalance = effectivePrice?.remainingBalance ?? 0;
  const payAmount = paymentOption === "full" ? totalPrice : depositAmount;
  const canConfirm = Boolean(
    agreeTerms && acknowledgeInfo && !loading && !transaction
    && hasPrice
    && (!needsBookingCreation || hasCustomerInfo),
  );

  useEffect(() => {
    if (!transaction) {
      setNormalizedStatus("pending");
      return;
    }
    setNormalizedStatus(mapTransactionStatusToNormalized(transaction.status, transaction.errorCode));
  }, [transaction]);

  // Task 4.5.1: SignalR real-time payment updates + visibility fetch (no polling)
  const paymentSignalR = usePaymentSignalR(transaction?.transactionCode ?? "");

  // Sync hook status to component state
  useEffect(() => {
    if (transaction && paymentSignalR.status !== "pending") {
      setNormalizedStatus(paymentSignalR.status);
      if (paymentSignalR.status === "paid") {
        toast.success(t("landing.checkout.paymentReceived"));
      } else if (
        paymentSignalR.status === "failed"
        || paymentSignalR.status === "cancelled"
        || paymentSignalR.status === "expired"
      ) {
        toast.error(t("landing.checkout.paymentFailed"));
      }
    }
  }, [paymentSignalR.status, transaction, t]);

  // Task 5.3.1: Page visibility handling — immediate fetch on tab focus
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && transaction?.transactionCode) {
        paymentService.checkPayment(transaction.transactionCode)
          .then(snapshot => {
            setNormalizedStatus(snapshot.normalizedStatus);
            if (snapshot.normalizedStatus === "paid") {
              toast.success(t("landing.checkout.paymentReceived"));
            } else if (snapshot.normalizedStatus === "expired") {
              toast.error(t("landing.checkout.paymentExpired"));
            } else if (snapshot.normalizedStatus === "failed") {
              toast.error(t("landing.checkout.paymentFailed"));
            } else if (snapshot.normalizedStatus === "cancelled") {
              toast.warn(t("landing.checkout.paymentCancelled"));
            }
          })
          .catch(() => {
            toast.error(t("landing.checkout.checkPaymentError"));
          });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [transaction?.transactionCode]);

  /* ── Handle redirect return/cancel from hosted payment ───── */
  useEffect(() => {
    const transactionCode = resolveReturnTransactionCode(searchParams);
    if (!transactionCode) {
      return;
    }

    const reconcilePayment = async () => {
      try {
        const snapshot = isCancelReturn(searchParams)
          ? await paymentService.reconcileCancel(transactionCode)
          : await paymentService.reconcileReturn(transactionCode);

        setNormalizedStatus(snapshot.normalizedStatus);

        const updatedTransaction = await paymentService.getTransaction(transactionCode);
        if (updatedTransaction) {
          setTransaction(updatedTransaction);
        }

        if (snapshot.normalizedStatus === "paid") {
          toast.success(t("landing.checkout.paymentReceived"));
          return;
        }

        if (snapshot.isTerminal) {
          toast.error(t("landing.checkout.paymentFailed"));
          return;
        }

        // SignalR hook handles polling for transactionCode (via usePaymentSignalR above)
      } catch (error: unknown) {
        const handledError = handleApiError(error);
        console.error("Failed to reconcile hosted payment return:", handledError.message);
        toast.error(t("landing.checkout.transactionError"));
      }
    };

    reconcilePayment();
  }, [searchParams, t]);

  /* ── Handle Confirm Booking ────────────────────────────── */
  const handleConfirmBooking = async () => {
    setLoading(true);

    try {
      let currentBookingId = bookingId;

      // Step 1: Create booking if needed (when coming from tour detail page)
      if (needsBookingCreation && tourInstanceBooking) {
        const adultsParam = searchParams.get("adults") || "1";
        const childrenParam = searchParams.get("children") || "0";
        const infantsParam = searchParams.get("infants") || "0";

        const bookingPayload: CreateBookingPayload = {
          tourInstanceId: tourInstanceBooking.tourInstanceId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          numberAdult: parseInt(adultsParam, 10) || 1,
          numberChild: parseInt(childrenParam, 10) || 0,
          numberInfant: parseInt(infantsParam, 10) || 0,
          paymentMethod: 2, // BankTransfer
          isFullPay: paymentOption === "full",
        };

        const bookingResult = await bookingService.createBooking(bookingPayload);
        if (bookingResult && bookingResult.bookingId) {
          setCheckoutPrice(bookingResult);
          currentBookingId = bookingResult.bookingId;
        } else {
          throw new Error("Failed to create booking");
        }
      }

      // Step 2: Create payment transaction
      const result = await paymentService.createTransaction({
        bookingId: currentBookingId,
        type: paymentOption === "full" ? "FullPayment" : "Deposit",
        amount: payAmount,
        paymentMethod: "BankTransfer",
        paymentNote: `Payment for ${checkoutPrice?.tourName ?? "Tour"} - ${paymentOption === "full" ? "Full Payment" : `Deposit ${Math.round((checkoutPrice?.depositPercentage ?? DEFAULT_DEPOSIT_PERCENTAGE) * 100)}%`}`,
        createdBy: user?.email ?? user?.username ?? "guest",
      });

      if (result) {
        setTransaction(result);

        if (shouldRedirectToHostedCheckout(result.checkoutUrl)) {
          window.location.assign(result.checkoutUrl!);
          return;
        }

        toast.success(t("landing.checkout.transactionCreated"));
        // SignalR + polling handled by usePaymentSignalR hook (auto-starts when transaction is set)
      }
    } catch (error: unknown) {
      const handledError = handleApiError(error);
      console.error("Failed to create transaction:", handledError.message);
      toast.error(t("landing.checkout.transactionError"));
    } finally {
      setLoading(false);
    }
  };

  /* ── Determine which left column to render ──────────── */
  const showTourInstanceCard = tourInstanceBooking && !checkoutPrice;
  const showBookingSummary = !!checkoutPrice;

  return (
    <>
      <LandingHeader />

      <main className="bg-gray-50 h-screen overflow-y-auto">
        <div className="max-w-330 mx-auto px-4 md:px-3.75 py-6 md:py-10">
          {/* ── Back to Tour ──────────────────────────────── */}
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-500 transition-colors mb-6">
            <Icon icon="heroicons:arrow-left" className="size-4" />
            {t("landing.checkout.backToTour")}
          </Link>

          {/* ── Step Indicator ────────────────────────────── */}
          <StepIndicator />

          {/* ── Two-column layout ─────────────────────────── */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ════════ LEFT COLUMN ════════════════════════ */}
            <div className="flex-1 flex flex-col gap-4">
              {showTourInstanceCard && (
                <TourInstanceInfoCard tourInstanceBooking={tourInstanceBooking} />
              )}

              {/* Booking summary — shown when we have price data */}
              {effectivePrice && (
                <BookingSummarySection
                  checkoutPrice={effectivePrice}
                  totalPrice={effectivePrice.totalPrice}
                  loadingPrice={false}
                  priceError={null}
                />
              )}

              {transaction && needsBookingCreation && (
                <CustomerInfoCard
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  customerPhone={customerPhone}
                  setCustomerPhone={setCustomerPhone}
                  customerEmail={customerEmail}
                  setCustomerEmail={setCustomerEmail}
                />
              )}

              {needsBookingCreation && !transaction && (
                <CustomerInfoCard
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  customerPhone={customerPhone}
                  setCustomerPhone={setCustomerPhone}
                  customerEmail={customerEmail}
                  setCustomerEmail={setCustomerEmail}
                />
              )}

              <TermsConditionsCard
                agreeTerms={agreeTerms}
                setAgreeTerms={setAgreeTerms}
                acknowledgeInfo={acknowledgeInfo}
                setAcknowledgeInfo={setAcknowledgeInfo}
              />
            </div>

            {/* ════════ RIGHT COLUMN (sidebar) ════════════ */}
            <div className="w-full lg:w-96 shrink-0 lg:sticky lg:top-6 flex flex-col gap-4">
              <PaymentSidebar
                transaction={transaction}
                normalizedStatus={normalizedStatus}
                onStatusChange={setNormalizedStatus}
                paymentOption={paymentOption}
                checkoutPrice={checkoutPrice}
                depositAmount={depositAmount}
                totalPrice={totalPrice}
                remainingBalance={remainingBalance}
                canConfirm={canConfirm}
                loading={loading}
                onConfirmBooking={handleConfirmBooking}
                t={t}
              />

              <SecureBookingCard />
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </>
  );
}
