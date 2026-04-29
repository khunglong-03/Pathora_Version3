"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui";


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
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  },
};

/* ── Step Indicator ────────────────────────────────────────── */
function StepIndicator({ normalizedStatus }: { normalizedStatus: NormalizedPaymentStatus }) {
  const { t } = useTranslation();

  // Compute dynamic step statuses based on payment state
  const isPaymentComplete = normalizedStatus === "paid";
  const isPaymentTerminal = normalizedStatus === "failed" || normalizedStatus === "cancelled" || normalizedStatus === "expired";

  const steps = STEP_KEYS.map((step, i) => {
    let status: "completed" | "active" | "upcoming" = step.status;
    if (i === 0) {
      status = "completed"; // Step 1 (Select Tour) is always completed on checkout page
    } else if (i === 1) {
      status = isPaymentComplete || isPaymentTerminal ? "completed" : "active";
    } else if (i === 2) {
      status = isPaymentComplete ? "active" : isPaymentTerminal ? "upcoming" : "upcoming";
    }
    return { ...step, status };
  });

  return (
    <div className="flex items-center justify-center gap-2 mb-10 mt-4">
      {steps.map((step, i) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center gap-2">
            {step.status === "completed" ? (
              <div className="size-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-md">
                <Icon icon="heroicons:check" className="size-5 text-white" />
              </div>
            ) : step.status === "active" ? (
              <div className="size-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-md shadow-zinc-900/20 ring-4 ring-zinc-900/10">
                <span className="text-base font-semibold text-white">{i + 1}</span>
              </div>
            ) : (
              <div className="size-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <span className="text-base font-semibold text-slate-400">{i + 1}</span>
              </div>
            )}
            <span
              className={`text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap ${
                step.status === "upcoming" ? "text-slate-400" : "text-zinc-900"
              }`}>
              {t(step.key)}
            </span>
          </div>

          {i < steps.length - 1 && (
            <div
              className={`h-0.5 w-12 md:w-20 mx-2 -mt-6 rounded-full ${
                step.status === "completed" ? "bg-zinc-900" : "bg-slate-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Passenger Adjuster Card ───────────────────────────────── */
function PassengerAdjusterCard({
  numberAdult, setNumberAdult,
  numberChild, setNumberChild,
  numberInfant, setNumberInfant,
}: {
  numberAdult: number; setNumberAdult: (v: number) => void;
  numberChild: number; setNumberChild: (v: number) => void;
  numberInfant: number; setNumberInfant: (v: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-8 md:p-10 flex flex-col gap-6">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">{t("landing.checkout.participants", "Participants")}</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{t("landing.checkout.adults", "Adults")}</div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
              <button type="button" onClick={() => setNumberAdult(Math.max(1, numberAdult - 1))} className="size-8 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-50" disabled={numberAdult <= 1}>
                <Icon icon="heroicons:minus" className="size-4" />
              </button>
              <span className="w-4 text-center font-semibold text-slate-900">{numberAdult}</span>
              <button type="button" onClick={() => setNumberAdult(numberAdult + 1)} className="size-8 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:border-slate-300">
                <Icon icon="heroicons:plus" className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{t("landing.checkout.children", "Children")}</div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
              <button type="button" onClick={() => setNumberChild(Math.max(0, numberChild - 1))} className="size-8 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-50" disabled={numberChild <= 0}>
                <Icon icon="heroicons:minus" className="size-4" />
              </button>
              <span className="w-4 text-center font-semibold text-slate-900">{numberChild}</span>
              <button type="button" onClick={() => setNumberChild(numberChild + 1)} className="size-8 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:border-slate-300">
                <Icon icon="heroicons:plus" className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{t("landing.checkout.infants", "Infants")}</div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
              <button type="button" onClick={() => setNumberInfant(Math.max(0, numberInfant - 1))} className="size-8 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-50" disabled={numberInfant <= 0}>
                <Icon icon="heroicons:minus" className="size-4" />
              </button>
              <span className="w-4 text-center font-semibold text-slate-900">{numberInfant}</span>
              <button type="button" onClick={() => setNumberInfant(numberInfant + 1)} className="size-8 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:border-slate-300">
                <Icon icon="heroicons:plus" className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ██  CheckoutPage
   ══════════════════════════════════════════════════════════════ */
export function CheckoutRequestPage() {
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

  const [isMounted, setIsMounted] = useState(false);
  const [loadingTopUpTransaction, setLoadingTopUpTransaction] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Task 5.3.1: visibility ref for tab focus tracking

  /* ── Get booking ID or tour instance info from URL ───── */
  const bookingIdParam = searchParams.get("bookingId");
  const tourInstanceIdParam = searchParams.get("tourInstanceId");
  const checkoutFlowParam = searchParams.get("flow");
  const transactionCodeParam = searchParams.get("transactionCode");
  const isPrivateCustomCheckout = true; // Always true for checkout-request
  const isPrivateTopUpCheckout = false;
  const usePublicBookingCheckoutPrice = true;

  const toastPaidSuccess = useCallback(() => {
    toast.success(
      isPrivateCustomCheckout
        ? t("landing.checkout.privateCustomPaymentReceived")
        : t("landing.checkout.paymentReceived"),
    );
  }, [isPrivateCustomCheckout, t]);

  const tourNameParam = searchParams.get("tourName");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const locationParam = searchParams.get("location");
  const depositPerPersonParam = searchParams.get("depositPerPerson");
  const basePriceParam = searchParams.get("basePrice");
  const depositPercentageParam = searchParams.get("depositPercentage");
  const bookingTypeParam = searchParams.get("bookingType") || "InstanceJoin";
  const instanceTypeParam = searchParams.get("instanceType") || "public";
  const thumbnailUrlParam = searchParams.get("thumbnailUrl");

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
    classificationId?: string;
    maxParticipation?: number;
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
        classificationId: searchParams.get("classificationId") || undefined,
        maxParticipation: parseInt(searchParams.get("maxParticipation") || "1", 10),
      });
      setLoadingPrice(false);
    }
  }, [tourInstanceIdParam, tourNameParam, startDateParam, endDateParam, locationParam, depositPerPersonParam, basePriceParam, depositPercentageParam, bookingTypeParam, instanceTypeParam]);

  /* ── Derived booking-id checkout (API price) vs tour-instance URL checkout ── */
  const isBookingIdPriceFetch = Boolean(bookingIdParam && !tourInstanceIdParam);

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
        const price = await paymentService.getCheckoutPrice(bookingIdParam, {
          usePublicBookingEndpoint: usePublicBookingCheckoutPrice,
        });
        if (price) {
          setCheckoutPrice(price);
          if (price.depositPercentage >= 1) {
            setPaymentOption("full");
          }
        } else {
          setPriceError(t("landing.checkout.checkoutPriceMissing"));
        }
      } catch (error) {
        const handledError = handleApiError(error);
        console.error("Failed to fetch checkout price:", handledError.message);
        setPriceError(handledError.message);
        toast.error(t("landing.checkout.priceFetchError"));
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchCheckoutPrice();
  }, [bookingIdParam, usePublicBookingCheckoutPrice, t]);

  /* ── Private top-up: load existing payment transaction (Delta &gt; 0) ─── */
  useEffect(() => {
    if (!isPrivateTopUpCheckout || !transactionCodeParam || !bookingIdParam) {
      return;
    }
    let cancelled = false;
    setLoadingTopUpTransaction(true);
    void paymentService
      .getTransaction(transactionCodeParam)
      .then((tx) => {
        if (cancelled) return;
        if (tx) {
          setTransaction(tx);
        } else {
          toast.error(t("landing.checkout.privateTopUpTransactionLoadError"));
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t("landing.checkout.privateTopUpTransactionLoadError"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTopUpTransaction(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isPrivateTopUpCheckout, transactionCodeParam, bookingIdParam, t]);

  useEffect(() => {
    if (!isPrivateTopUpCheckout) return;
    if (!bookingIdParam || !transactionCodeParam) {
      setPriceError(t("landing.checkout.privateTopUpMissingParams"));
      setLoadingPrice(false);
    }
  }, [isPrivateTopUpCheckout, bookingIdParam, transactionCodeParam, t]);

  /* ── Derived & State ──────────────────────────────────── */
  const adultsParam = searchParams.get("adults") || "1";
  const childrenParam = searchParams.get("children") || "0";
  const infantsParam = searchParams.get("infants") || "0";
  
  const [numberAdult, setNumberAdult] = useState(() => parseInt(adultsParam, 10) || 1);
  const [numberChild, setNumberChild] = useState(() => parseInt(childrenParam, 10) || 0);
  const [numberInfant, setNumberInfant] = useState(() => parseInt(infantsParam, 10) || 0);

  useEffect(() => {
    setNumberAdult(parseInt(searchParams.get("adults") || "1", 10));
    setNumberChild(parseInt(searchParams.get("children") || "0", 10));
    setNumberInfant(parseInt(searchParams.get("infants") || "0", 10));
  }, [searchParams]);

  const adultPriceParam = searchParams.get("adultPrice");
  const childPriceParam = searchParams.get("childPrice");
  const infantPriceParam = searchParams.get("infantPrice");

  // Build a CheckoutPriceResponse from URL params when there's no API response (tour instance direct checkout)
  const computedCheckoutPrice: CheckoutPriceResponse | null = React.useMemo(() => {
    if (tourInstanceIdParam && tourNameParam) {
      const basePrice = Number(basePriceParam) || 0;
      const depositPct = Number(depositPercentageParam) || 0.3;
      const adultPrice = adultPriceParam ? Number(adultPriceParam) : basePrice;
      const childPrice = childPriceParam ? Number(childPriceParam) : 0;
      const infantPrice = infantPriceParam ? Number(infantPriceParam) : 0;
      const adultSubtotal = adultPrice * numberAdult;
      const childSubtotal = childPrice * numberChild;
      const infantSubtotal = infantPrice * numberInfant;
      const subtotal = adultSubtotal + childSubtotal + infantSubtotal;
      const taxRate = 0;
      const taxAmount = Math.round(subtotal * taxRate);
      const totalPrice = subtotal + taxAmount;
      const depositAmount = Math.round(totalPrice * depositPct);

      // Calculate durationDays from startDate and endDate
      let durationDays = 0;
      if (startDateParam && endDateParam) {
        const start = new Date(startDateParam);
        const end = new Date(endDateParam);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }
      }

      return {
        bookingId: "",
        tourInstanceId: tourInstanceIdParam,
        tourName: decodeURIComponent(tourNameParam),
        tourCode: "",
        thumbnailUrl: thumbnailUrlParam ? decodeURIComponent(thumbnailUrlParam) : undefined,
        startDate: startDateParam || "",
        endDate: endDateParam || "",
        durationDays,
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
  }, [
    tourInstanceIdParam, tourNameParam, basePriceParam, depositPercentageParam,
    startDateParam, endDateParam, locationParam,
    numberAdult, numberChild, numberInfant,
    adultPriceParam, childPriceParam, infantPriceParam,
    thumbnailUrlParam
  ]);

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
    !isPrivateTopUpCheckout
    && agreeTerms && acknowledgeInfo && !loading && !loadingTopUpTransaction && !transaction
    && hasPrice
    && (!needsBookingCreation || hasCustomerInfo),
  );

  useEffect(() => {
    // Let user choose deposit or full payment for private custom booking request
  }, [isPrivateCustomCheckout, isPrivateTopUpCheckout]);

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
        toastPaidSuccess();
      } else if (paymentSignalR.status === "expired") {
        toast.error(t("landing.checkout.paymentExpired"));
      } else if (paymentSignalR.status === "failed" || paymentSignalR.status === "cancelled") {
        toast.error(t("landing.checkout.paymentFailed"));
      }
    }
  }, [paymentSignalR.status, transaction, t, toastPaidSuccess]);

  // Task 5.3.1: Page visibility handling — immediate fetch on tab focus
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && transaction?.transactionCode) {
        paymentService.checkPayment(transaction.transactionCode)
          .then(snapshot => {
            setNormalizedStatus(snapshot.normalizedStatus);
            if (snapshot.normalizedStatus === "paid") {
              toastPaidSuccess();
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
  }, [transaction?.transactionCode, t, toastPaidSuccess]);

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
          toastPaidSuccess();
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
  }, [searchParams, t, toastPaidSuccess]);

  /* ── Handle Confirm Booking ────────────────────────────── */
  const handleConfirmBooking = async () => {
    setLoading(true);

    try {
      let currentBookingId = bookingId;

      // Step 1: Create booking if needed (when coming from tour detail page)
      if (needsBookingCreation && tourInstanceBooking) {
        if (tourInstanceBooking.bookingType === "PrivateCustom") {
          const totalPax = numberAdult + numberChild + numberInfant;
          const bookingResult = await import("@/api/services/tourService").then((m) => m.tourService.requestPrivateTour(tourInstanceBooking.tourInstanceId, {
            classificationId: tourInstanceBooking.classificationId || "",
            startDate: new Date(tourInstanceBooking.startDate).toISOString(),
            endDate: new Date(tourInstanceBooking.endDate).toISOString(),
            maxParticipation: Math.max(tourInstanceBooking.maxParticipation || 1, totalPax),
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim() || undefined,
            numberAdult: numberAdult,
            numberChild: numberChild,
            numberInfant: numberInfant,
            paymentMethod: 2,
            isFullPay: paymentOption === "full",
          }));
          if (bookingResult && bookingResult.bookingId) {
            // We just need the bookingId to proceed to payment, requestPrivateTour returns price info including bookingId
            currentBookingId = bookingResult.bookingId;
          } else {
            throw new Error("Failed to create private custom booking");
          }
        } else {
          const bookingPayload: CreateBookingPayload = {
            tourInstanceId: tourInstanceBooking.tourInstanceId,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim() || undefined,
            numberAdult: numberAdult,
            numberChild: numberChild,
            numberInfant: numberInfant,
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
      }

      // Step 2: Create payment transaction
      let result: PaymentTransaction | null = null;
      if ((isPrivateCustomCheckout || tourInstanceBooking?.bookingType === "PrivateCustom") && currentBookingId) {
        result = await paymentService.createPrivateCustomInitial(currentBookingId);
      } else {
        result = await paymentService.createTransaction({
          bookingId: currentBookingId,
          type: paymentOption === "full" ? "FullPayment" : "Deposit",
          amount: payAmount,
          paymentMethod: "BankTransfer",
          paymentNote: `Payment for ${checkoutPrice?.tourName ?? "Tour"} - ${paymentOption === "full" ? "Full Payment" : `Deposit ${Math.round((checkoutPrice?.depositPercentage ?? DEFAULT_DEPOSIT_PERCENTAGE) * 100)}%`}`,
          createdBy: user?.email ?? user?.username ?? "guest",
        });
      }

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
      toast.error(
        isPrivateCustomCheckout
          ? t("landing.checkout.privateCustomTransactionError")
          : t("landing.checkout.transactionError"),
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Determine which left column to render ──────────── */
  const showTourInstanceCard = tourInstanceBooking && !checkoutPrice;
  const showBookingSummary = !!checkoutPrice;

  if (!isMounted) {
    return null;
  }

  return (
    <>
      

      <main className="bg-[#f9fafb] min-h-screen overflow-y-auto">
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* ── Back to Tour ──────────────────────────────── */}
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-zinc-900 transition-colors mb-6 group">
            <Icon icon="heroicons:arrow-left" className="size-4 transition-transform group-hover:-translate-x-1" />
            {t("landing.checkout.backToTour")}
          </Link>

          {/* ── Header ──────────────────────────────────────── */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="mb-8 md:mb-12 mt-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 leading-none mb-3">
              {isPrivateTopUpCheckout
                ? t("landing.checkout.privateTopUpPageTitle")
                : t("landing.checkout.pageTitle", "Secure Checkout")}
            </h1>
            <p className="text-base text-slate-500 max-w-[65ch]">
              {isPrivateTopUpCheckout
                ? t("landing.checkout.privateTopUpPageSubtitle")
                : t("landing.checkout.pageSubtitle", "Complete your booking securely below.")}
            </p>
          </motion.div>

          {isPrivateTopUpCheckout ? (
            <div
              className="mb-8 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-sm text-slate-800 max-w-[65ch]"
              data-private-top-up-context
            >
              <p className="font-medium">{t("landing.checkout.privateTopUpDeltaExplain")}</p>
              <p className="mt-2 text-xs text-slate-600">{t("landing.checkout.privateTopUpConfirmationDeadline")}</p>
            </div>
          ) : null}

          {isPrivateTopUpCheckout && (!bookingIdParam || !transactionCodeParam) ? (
            <div
              className="mb-8 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900 max-w-[65ch]"
              data-private-top-up-params-error
            >
              {t("landing.checkout.privateTopUpMissingParams")}
            </div>
          ) : null}

          {/* ── Step Indicator ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8"
          >
            <StepIndicator normalizedStatus={normalizedStatus} />
          </motion.div>

          {/* ── Two-column layout ─────────────────────────── */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col xl:flex-row gap-8 lg:gap-10">
            {/* ════════ LEFT COLUMN ════════════════════════ */}
            <div className="flex-1 flex flex-col gap-6 lg:gap-8">
              {showTourInstanceCard && (
                <motion.div variants={itemVariants}>
                  <TourInstanceInfoCard tourInstanceBooking={tourInstanceBooking} />
                </motion.div>
              )}

              {/* Booking summary — shown when we have price data */}
              {(isBookingIdPriceFetch || effectivePrice) && (
                <motion.div variants={itemVariants}>
                  <BookingSummarySection
                    checkoutPrice={effectivePrice}
                    totalPrice={effectivePrice?.totalPrice ?? 0}
                    loadingPrice={isBookingIdPriceFetch && loadingPrice}
                    priceError={isBookingIdPriceFetch ? priceError : null}
                  />
                </motion.div>
              )}



              {needsBookingCreation && !transaction && (
                <motion.div variants={itemVariants}>
                  <PassengerAdjusterCard 
                    numberAdult={numberAdult} setNumberAdult={setNumberAdult}
                    numberChild={numberChild} setNumberChild={setNumberChild}
                    numberInfant={numberInfant} setNumberInfant={setNumberInfant}
                  />
                </motion.div>
              )}

              {needsBookingCreation && !transaction && (
                <motion.div variants={itemVariants}>
                  <CustomerInfoCard
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    customerPhone={customerPhone}
                    setCustomerPhone={setCustomerPhone}
                    customerEmail={customerEmail}
                    setCustomerEmail={setCustomerEmail}
                  />
                </motion.div>
              )}

              {normalizedStatus !== "paid" && !isPrivateTopUpCheckout && (
                <motion.div variants={itemVariants}>
                  <TermsConditionsCard
                    agreeTerms={agreeTerms}
                    setAgreeTerms={setAgreeTerms}
                    acknowledgeInfo={acknowledgeInfo}
                    setAcknowledgeInfo={setAcknowledgeInfo}
                  />
                </motion.div>
              )}
            </div>

            {/* ════════ RIGHT COLUMN (sidebar) ════════════ */}
            <motion.div variants={itemVariants} className="w-full xl:w-[420px] shrink-0 xl:sticky xl:top-8 flex flex-col gap-6 lg:gap-8 self-start">
              <PaymentSidebar
                transaction={transaction}
                normalizedStatus={normalizedStatus}
                onStatusChange={setNormalizedStatus}
                paymentOption={paymentOption}
                onPaymentOptionChange={setPaymentOption}
                checkoutPrice={effectivePrice}
                depositAmount={depositAmount}
                totalPrice={totalPrice}
                remainingBalance={remainingBalance}
                canConfirm={canConfirm}
                loading={loading || loadingTopUpTransaction}
                onConfirmBooking={handleConfirmBooking}
                customerEmail={customerEmail}
                hidePayMethodToggle={false} // Allow 30% or 100% deposit for custom booking requests
                privateCustomCheckout={isPrivateCustomCheckout}
                privateTopUpCheckout={isPrivateTopUpCheckout}
                t={t}
              />

              <SecureBookingCard />
            </motion.div>
          </motion.div>
        </div>
      </main>

      
    </>
  );
}
