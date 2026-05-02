"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { useAuth } from "@/contexts/AuthContext";
import { PrivateTourCoDesignCustomerSection } from "@/features/private-co-design/PrivateTourCoDesignCustomerSection";
import { PrivateTourCoDesignManagerSection } from "@/features/private-co-design/PrivateTourCoDesignManagerSection";
import { PrivateTourWalletCreditBanner } from "@/features/private-co-design/PrivateTourWalletCreditBanner";

export function CoDesignPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const tourInstanceId = searchParams.get("tourInstanceId") ?? "";
  const bookingId = searchParams.get("bookingId") ?? "";
  const creditRaw = searchParams.get("creditedAmount");
  const creditedAmount = creditRaw ? Number(creditRaw) : NaN;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null | undefined>(undefined);
  const [days, setDays] = useState<NonNullable<Awaited<ReturnType<typeof tourInstanceService.getInstanceDetail>>>["days"]>([]);
  const [tourStatus, setTourStatus] = useState<string>("");
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    if (!tourInstanceId) {
      setLoading(false);
      setErr("missing_params");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const detail = await tourInstanceService.getInstanceDetail(tourInstanceId);
        if (cancelled) return;
        if (!detail) {
          setErr("not_found");
          return;
        }
        setDays(detail.days ?? []);
        setFinalPrice(detail.finalSellPrice ?? null);
        setTourStatus(detail.status ?? "");
        
        const hasManagerRole = user?.roles?.some((r: any) => r.name === "Admin" || r.name === "Manager");
        const isAssignedManager = detail.managers?.some((m: any) => m.id === user?.id);
        setIsManager(Boolean(hasManagerRole || isAssignedManager));
      } catch {
        if (!cancelled) setErr("load_error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tourInstanceId]);

  const showCreditBanner = useMemo(
    () => !Number.isNaN(creditedAmount) && creditedAmount > 0,
    [creditedAmount],
  );

  // If user is loading, wait
  if (authLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      </main>
    );
  }

  // Check required params depending on role
  const hasManagerPerms = user?.roles?.some((r: any) => r.name === "Admin" || r.name === "Manager");
  if (!tourInstanceId || (!bookingId && !hasManagerPerms)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-600">{t("landing.privateCoDesign.missingQuery", "Missing Tour or Booking details.")}</p>
        <Link href="/tours" className="mt-4 inline-flex text-sm font-semibold text-[#fa8b02]">
          {t("landing.checkout.backToTour", "Return to Tour list")}
        </Link>
      </main>
    );
  }



  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-600">{t("landing.privateCoDesign.loginRequired")}</p>
        <Link
          href={`/?login=true&next=${encodeURIComponent(`/private-tour/co-design?tourInstanceId=${encodeURIComponent(tourInstanceId)}&bookingId=${encodeURIComponent(bookingId)}`)}`}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t("landing.checkout.loginToViewBookings")}
        </Link>
      </main>
    );
  }

  return (
    <main className="bg-[#f9fafb] min-h-[70vh]">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Link
          href="/bookings"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-zinc-900"
        >
          <Icon icon="heroicons:arrow-left" className="size-4" />
          {t("landing.checkout.viewMyBookings")}
        </Link>

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          {t("landing.privateCoDesign.pageTitle")}
        </h1>
        <p className="mb-8 text-slate-500">{t("landing.privateCoDesign.pageSubtitle")}</p>

        {showCreditBanner ? <div className="mb-6"><PrivateTourWalletCreditBanner creditAmountVnd={creditedAmount} /></div> : null}

        {loading ? (
          <div className="h-64 animate-pulse rounded-[2rem] bg-slate-100" data-loading-co-design-page />
        ) : err ? (
          <p className="text-red-600" data-co-design-page-error>
            {t("landing.privateCoDesign.loadFailed")}
          </p>
        ) : isManager ? (
          <PrivateTourCoDesignManagerSection
            tourInstanceId={tourInstanceId}
            days={days ?? []}
          />
        ) : (
          <PrivateTourCoDesignCustomerSection
            tourInstanceId={tourInstanceId}
            bookingId={bookingId}
            days={days ?? []}
            finalSellPrice={finalPrice}
            tourStatus={tourStatus}
          />
        )}
      </div>
    </main>
  );
}
