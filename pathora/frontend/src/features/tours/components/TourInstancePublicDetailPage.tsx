"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon, TourStatusBadge } from "@/components/ui";
import Button from "@/components/ui/Button";
import Image from "@/features/shared/components/LandingImage";
import { LandingFooter } from "@/features/shared/components/LandingFooter";
import { LandingHeader } from "@/features/shared/components/LandingHeader";
import {
  CapacityBar,
  ImageLightbox,
  GuestRow,
  PricingTierCard,
  useScrollReveal,
} from "@/features/shared/components";
import { homeService } from "@/api/services/homeService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { handleApiError } from "@/utils/apiResponse";
import { useAuth } from "@/contexts/AuthContext";
import { NormalizedTourInstanceDto, DynamicPricingDto, ActivityTypeMap, TransportationTypeMap, RoomTypeMap, MealTypeMap } from "@/types/tour";

/* ── Currency / Date formatters ──────────────────────────────── */
const createCurrencyFormatter = (locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const createDateFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatCurrency = (value: number, locale: string): string =>
  createCurrencyFormatter(locale).format(value).replace("VND", "VND").trim();

const toDateText = (value: string | null | undefined, locale: string): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return createDateFormatter(locale).format(date);
};

const daysRemaining = (value: string | null | undefined): number => {
  if (!value) return -1;
  const deadline = new Date(value);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */
export function TourInstancePublicDetailPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const id = params.id as string;

  const resolveApiLanguage = useCallback((): string => {
    return i18n.resolvedLanguage || i18n.language || "en";
  }, [i18n.resolvedLanguage, i18n.language]);

  const [activeTab, setActiveTab] = useState<"overview" | "pricing" | "itinerary">("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NormalizedTourInstanceDto | null>(null);
  const [apiLanguage, setApiLanguage] = useState(() => resolveApiLanguage());
  const [pricingTiers, setPricingTiers] = useState<DynamicPricingDto[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Guest selection
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  useScrollReveal();

  useEffect(() => {
    const handleLanguageChanged = (language: string): void => {
      setApiLanguage(language || resolveApiLanguage());
    };
    i18n.on("languageChanged", handleLanguageChanged);
    setApiLanguage(resolveApiLanguage());
    return () => i18n.off("languageChanged", handleLanguageChanged);
  }, [i18n, resolveApiLanguage]);

  const formatterLocale = useMemo(() => {
    return apiLanguage === "vi" ? "vi-VN" : "en-GB";
  }, [apiLanguage]);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const detail = await homeService.getPublicInstanceDetail(id, apiLanguage);
        setData(detail);
        setPricingTiers([]);
      } catch (error: unknown) {
        const handledError = handleApiError(error);
        console.error("Failed to load public instance detail:", handledError.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, apiLanguage]);

  const heroImage = useMemo(() => {
    if (!data) return "";
    return data.thumbnail?.publicURL || data.images?.[0]?.publicURL || "";
  }, [data]);

  const galleryImages = useMemo(
    () =>
      (data?.images?.map((img) => img.publicURL).filter(Boolean) as string[]) ?? [],
    [data?.images],
  );

  const spotsLeft = useMemo(() => {
    if (!data) return 0;
    return Math.max(0, data.maxParticipation - data.currentParticipation);
  }, [data]);

  const deadlineDays = useMemo(() => {
    if (!data) return -1;
    return daysRemaining(data.confirmationDeadline);
  }, [data]);

  const totalGuests = adults + children + infants;

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--tour-surface-muted)" }}>
        <LandingHeader variant="solid" />
        <div className="max-w-6xl mx-auto px-6 md:px-8 mt-8">
          <div className="py-4 px-6">
            <div className="h-4 w-48 rounded animate-pulse" style={{ background: "var(--tour-divider)" }} />
          </div>
          <div className="flex flex-col lg:flex-row gap-5 px-6 pb-16">
            <div className="flex-1 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-3 rounded-2xl overflow-hidden">
                <div className="aspect-video rounded-2xl animate-pulse" style={{ background: "var(--tour-divider)" }} />
                <div className="aspect-video rounded-2xl animate-pulse" style={{ background: "var(--tour-divider)" }} />
                <div className="aspect-video rounded-2xl animate-pulse" style={{ background: "var(--tour-divider)" }} />
                <div className="aspect-video rounded-2xl animate-pulse" style={{ background: "var(--tour-divider)" }} />
              </div>
              <div className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--tour-divider)" }} />
              <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--tour-divider)" }} />
            </div>
            <div className="w-full lg:w-80 shrink-0">
              <div className="h-[500px] rounded-2xl animate-pulse" style={{ background: "var(--tour-divider)" }} />
            </div>
          </div>
        </div>
        <LandingFooter />
      </div>
    );
  }

  /* ── Not Found ───────────────────────────────────────────── */
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--tour-surface-muted)" }}>
        <LandingHeader variant="solid" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <Icon
              icon="heroicons:exclamation-circle"
              className="size-16 mx-auto mb-4"
              style={{ color: "var(--tour-caption)" }}
            />
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--tour-heading)" }}>
              {t("tourInstance.notFound", "Tour instance not found")}
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--tour-body)" }}>
              The tour instance you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "var(--landing-accent)", color: "white" }}>
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {t("landing.tourDetail.allTours", "All tours")}
            </Link>
          </div>
        </div>
        <LandingFooter />
      </div>
    );
  }

  const isPublicInstance =
    (data.instanceType || "").toLowerCase() === "public" ||
    data.instanceType === "Public";

  return (
    <div className="min-h-screen" style={{ background: "var(--tour-surface-muted)" }}>
      {/* ── Hero Section ─────────────────────────────────────── */}
      <div className="relative min-h-[45vh] max-h-[480px] overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage}
            alt={data.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            style={{ transform: "scale(1.05)" }}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-[var(--tour-dark)]/50 via-[var(--tour-dark)]/30 to-[var(--tour-dark)]/90" />
        <div className="absolute inset-0 bg-linear-to-r from-[var(--tour-dark)]/30 via-transparent to-transparent" />

        {/* Header */}
        <div className="absolute inset-x-0 top-0 z-20">
          <LandingHeader />
        </div>

        {/* Back button */}
        <div className="absolute inset-x-0 top-[81px] z-10 max-w-6xl mx-auto px-6 md:px-8">
          <Link
            href={`/tours/${data.tourId}`}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white text-sm font-medium hover:bg-white/20 hover:border-white/30 transition-all duration-300">
            <Icon icon="heroicons:arrow-left" className="size-4" />
            {t("tourInstance.backToTour", "Back to tour")}
          </Link>
        </div>

        {/* Hero content */}
        <div className="absolute inset-x-0 bottom-0 z-10 max-w-6xl mx-auto px-6 md:px-8 pb-10">
          <div className="flex flex-col items-start gap-4">
            {/* Breadcrumb */}
            <nav className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[11px] text-white/90 animate-reveal-up">
              <Link href="/home" className="hover:text-white transition-colors">
                {t("landing.tourDetail.home", "Home")}
              </Link>
              <Icon icon="heroicons:chevron-right" className="size-2.5 opacity-50" />
              <Link href="/tours" className="hover:text-white transition-colors">
                {t("landing.tourDetail.packageTours", "Package Tours")}
              </Link>
              <Icon icon="heroicons:chevron-right" className="size-2.5 opacity-50" />
              <Link href={`/tours/${data.tourId}`} className="hover:text-white transition-colors truncate max-w-[9.375rem]">
                {data.tourName}
              </Link>
              <Icon icon="heroicons:chevron-right" className="size-2.5 opacity-50" />
              <span className="font-semibold text-white truncate max-w-[7.5rem]">{data.title}</span>
            </nav>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 animate-reveal-up stagger-1">
              <span className="flex items-center gap-1.5 bg-[var(--landing-accent)] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-lg" style={{ boxShadow: "0 4px 12px rgba(var(--landing-accent-rgb, 250,139,2), 0.3)" }}>
                <Icon icon="heroicons:tag" className="size-3" />
                {data.tourInstanceCode}
              </span>
              <span className="bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-full">
                {data.classificationName}
              </span>
              <TourStatusBadge status={data.status} />
              {/* Rating */}
              {data.rating > 0 && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5">
                  <Icon icon="heroicons:star-solid" className="size-3.5 text-[var(--landing-accent)]" />
                  <span className="text-white text-[11px] font-bold tabular-nums">{data.rating.toFixed(1)}</span>
                  {data.totalBookings > 0 && (
                    <span className="text-white/70 text-[11px]">({data.totalBookings})</span>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <h1
              className="text-[clamp(1.75rem,5vw,3rem)] font-extrabold text-white leading-[1.08] max-w-2xl animate-reveal-up stagger-2"
              style={{ textWrap: "balance", letterSpacing: "-0.025em", textShadow: "0 2px 20px rgba(0,0,0,0.25)" }}>
              {data.title}
            </h1>

            {/* Location + Duration quick facts */}
            <div className="flex items-center gap-4 animate-reveal-up stagger-3">
              {data.location && (
                <div className="flex items-center gap-1.5 text-white/85 text-sm font-medium">
                  <Icon icon="heroicons:map-pin" className="size-4" />
                  {data.location}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-white/85 text-sm font-medium">
                <Icon icon="heroicons:clock" className="size-4" />
                {data.durationDays} {t("tourInstance.days", "days")}
              </div>
              {data.totalBookings > 0 && (
                <div className="flex items-center gap-1.5 text-white/85 text-sm font-medium">
                  <Icon icon="heroicons:user-group" className="size-4" />
                  {data.totalBookings} {t("tourInstance.bookings", "bookings")}
                </div>
              )}
            </div>
            {/* Start date + base price preview */}
            <div className="flex items-center gap-4 animate-reveal-up stagger-4">
              {data.startDate && (
                <div className="flex items-center gap-1.5 text-white/75 text-xs font-medium">
                  <Icon icon="heroicons:calendar" className="size-3.5" />
                  {toDateText(data.startDate, formatterLocale)}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-white/75 text-xs font-medium">
                <Icon icon="heroicons:currency-dollar" className="size-3.5" />
                <span className="tabular-nums">{formatCurrency(data.basePrice, formatterLocale)}</span>
                <span className="text-white/60">{t("tourInstance.perPerson", "/person")}</span>
              </div>
              {spotsLeft > 0 && (
                <div className="flex items-center gap-1.5 text-white/75 text-xs font-medium">
                  <span className="text-white/60">{spotsLeft} {t("tourInstance.spotsLeft", "spots left")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-[var(--tour-surface-muted)] to-transparent pointer-events-none" />
      </div>

      {/* ── Main Content ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-5 pb-16">
          {/* ── Left Column ─────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Image Gallery */}
            {galleryImages.length > 0 && (
              <div className="reveal-on-scroll">
                <div className="grid grid-cols-2 gap-3 rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-warm-md)" }}>
                  {galleryImages.slice(0, 4).map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer"
                      onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}>
                      <Image
                        src={img}
                        alt={data.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-[var(--tour-dark)]/0 group-hover:bg-[var(--tour-dark)]/10 transition-colors duration-500 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full size-9 flex items-center justify-center shadow-lg">
                          <Icon icon="heroicons:magnifying-glass" className="size-5" style={{ color: "var(--tour-heading)" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {galleryImages.length > 4 && (
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold transition-colors duration-200 hover:underline"
                    style={{ color: "var(--landing-accent)" }}
                    onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}>
                    {t("landing.tourDetail.morePhotos", "+{{count}} photos", { count: galleryImages.length - 4 })}
                  </button>
                )}
              </div>
            )}

            {/* Lightbox */}
            {lightboxOpen && (
              <ImageLightbox
                images={galleryImages}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
              />
            )}

            {/* Info Sections — 3 semantic cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 reveal-on-scroll">
              {/* Trip Details card */}
              <div
                className="rounded-2xl p-4 transition-all duration-300 hover:shadow-[var(--shadow-warm-md)] hover:-translate-y-0.5"
                style={{ boxShadow: "var(--shadow-warm-sm)", background: "var(--tour-surface)", border: "1px solid rgba(255,255,255,0.8)" }}>
                <span className="text-[10px] uppercase tracking-[0.5px] font-semibold mb-3 block" style={{ color: "var(--tour-caption)" }}>
                  {t("tourInstance.tripDetails", "Trip Details")}
                </span>
                <div className="flex flex-col gap-2">
                  {data.location && (
                    <div className="flex items-center gap-2">
                      <Icon icon="heroicons:map-pin" className="size-3.5 shrink-0" style={{ color: "var(--tour-caption)" }} />
                      <span className="text-xs font-medium" style={{ color: "var(--tour-body)" }}>{data.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:calendar" className="size-3.5 shrink-0" style={{ color: "var(--tour-caption)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--tour-body)" }}>{toDateText(data.startDate, formatterLocale)} – {toDateText(data.endDate, formatterLocale)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:clock" className="size-3.5 shrink-0" style={{ color: "var(--tour-caption)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--tour-body)" }}>{data.durationDays} {t("tourInstance.days", "days")}</span>
                  </div>
                  {data.confirmationDeadline && deadlineDays >= 0 && (
                    <div className="flex items-center gap-2">
                      <Icon icon="heroicons:clock" className="size-3.5 shrink-0" style={{ color: deadlineDays <= 3 ? "#9F2F2D" : deadlineDays <= 7 ? "#956400" : "var(--tour-caption)" }} />
                      <span className="text-xs font-medium" style={{ color: deadlineDays <= 3 ? "#9F2F2D" : deadlineDays <= 7 ? "#956400" : "var(--tour-body)" }}>
                        {toDateText(data.confirmationDeadline, formatterLocale)} ({deadlineDays} {t("tourInstance.daysLeft", "days left")})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Capacity card */}
              <div
                className="rounded-2xl p-4 transition-all duration-300 hover:shadow-[var(--shadow-warm-md)] hover:-translate-y-0.5"
                style={{ boxShadow: "var(--shadow-warm-sm)", background: "var(--tour-surface)", border: "1px solid rgba(255,255,255,0.8)" }}>
                <span className="text-[10px] uppercase tracking-[0.5px] font-semibold mb-3 block" style={{ color: "var(--tour-caption)" }}>
                  {t("tourInstance.capacity", "Capacity")}
                </span>
                <CapacityBar current={data.currentParticipation} max={data.maxParticipation} />
              </div>

              {/* Pricing highlight card */}
              <div
                className="rounded-2xl p-4 transition-all duration-300 hover:shadow-[var(--shadow-warm-md)] hover:-translate-y-0.5"
                style={{ boxShadow: "var(--shadow-warm-sm)", background: "var(--tour-surface)", border: "1px solid rgba(255,255,255,0.8)" }}>
                <span className="text-[10px] uppercase tracking-[0.5px] font-semibold mb-3 block" style={{ color: "var(--tour-caption)" }}>
                  {t("tourInstance.basePrice", "Base Price")}
                </span>
                <span className="text-[24px] font-black tabular-nums leading-none block" style={{ color: "var(--landing-accent)" }}>
                  {formatCurrency(data.basePrice, formatterLocale)}
                </span>
                <span className="text-[10px] mt-1 block" style={{ color: "var(--tour-caption)" }}>
                  {t("tourInstance.perPerson", "/person")}
                </span>
              </div>
            </div>

            {/* Tabs: Overview / Pricing */}
            <div
              className="rounded-2xl overflow-hidden reveal-on-scroll"
              style={{ boxShadow: "var(--shadow-warm-md)", background: "var(--tour-surface)", border: "1px solid rgba(255,255,255,0.8)" }}>
              {/* Tab bar */}
              <div className="p-4">
                <div className="flex gap-1.5 p-1.5 rounded-2xl w-full" style={{ background: "var(--tour-surface-muted)" }}>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all rounded-xl duration-300 ${
                      activeTab === "overview"
                        ? "bg-white shadow-[var(--shadow-warm-sm)] text-[var(--landing-accent)] ring-2 ring-[var(--landing-accent)]/20"
                        : "text-[var(--tour-body)] hover:text-[var(--tour-heading)] hover:bg-white/50"
                    }`}>
                    <Icon icon="heroicons:information-circle" className="size-4" />
                    {t("tourInstance.overview", "Overview")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("pricing")}
                    className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all rounded-xl duration-300 ${
                      activeTab === "pricing"
                        ? "bg-white shadow-[var(--shadow-warm-sm)] text-[var(--landing-accent)] ring-2 ring-[var(--landing-accent)]/20"
                        : "text-[var(--tour-body)] hover:text-[var(--tour-heading)] hover:bg-white/50"
                    }`}>
                    <Icon icon="heroicons:currency-dollar" className="size-4" />
                    {t("tourInstance.pricingDetails", "Pricing Details")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("itinerary")}
                    className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all rounded-xl duration-300 ${
                      activeTab === "itinerary"
                        ? "bg-white shadow-[var(--shadow-warm-sm)] text-[var(--landing-accent)] ring-2 ring-[var(--landing-accent)]/20"
                        : "text-[var(--tour-body)] hover:text-[var(--tour-heading)] hover:bg-white/50"
                    }`}>
                    <Icon icon="heroicons:calendar-days" className="size-4" />
                    {t("tourInstance.itinerary", "Itinerary")}
                  </Button>
                </div>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="flex flex-col gap-6">

                    {/* Guides & Managers */}
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight mb-3 flex items-center gap-2" style={{ color: "var(--tour-heading)" }}>
                        <Icon icon="heroicons:user-group" className="size-4" style={{ color: "var(--landing-accent)" }} />
                        {t("tourInstance.guidesAndManagers", "Guides & Managers")}
                      </h3>
                      {data.managers && data.managers.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {data.managers.map((mgr) => (
                            <div
                              key={mgr.id}
                              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-300 hover:shadow-[var(--shadow-warm-sm)]"
                              style={{
                                background: "var(--tour-surface-raised)",
                                border: "1px solid var(--tour-divider)",
                              }}>
                              {mgr.userAvatar ? (
                                <Image
                                  src={mgr.userAvatar}
                                  alt={mgr.userName}
                                  width={32}
                                  height={32}
                                  className="rounded-full object-cover size-8"
                                />
                              ) : (
                                <div className="size-8 rounded-full flex items-center justify-center" style={{ background: "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)" }}>
                                  <span className="text-sm font-bold" style={{ color: "var(--landing-accent)" }}>
                                    {mgr.userName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold" style={{ color: "var(--tour-heading)" }}>
                                  {mgr.userName}
                                </span>
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit"
                                  style={{
                                    background: mgr.role === "Guide" ? "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)" : "#E1F3FE",
                                    color: mgr.role === "Guide" ? "var(--accent)" : "#1F6C9F",
                                  }}>
                                  {mgr.role}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: "var(--tour-body)" }}>
                          {t("tourInstance.noGuidesOrManagers", "No guides or managers assigned yet.")}
                        </p>
                      )}
                    </div>

                    {/* Included Services */}
                    {data.includedServices.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight mb-3 flex items-center gap-2" style={{ color: "var(--tour-heading)" }}>
                          <Icon icon="heroicons:check-badge" className="size-4" style={{ color: "var(--landing-accent)" }} />
                          {t("tourInstance.includedServices", "Included Services")}
                        </h3>
                        <div className="flex flex-col gap-2">
                          {data.includedServices.map((service, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-all duration-200 hover:shadow-[var(--shadow-warm-sm)]"
                              style={{ background: "#EDF3EC", border: "1px solid #C6D9C2" }}>
                              <Icon icon="heroicons:check-circle" className="size-4 shrink-0" style={{ color: "#346538" }} />
                              <span className="text-sm" style={{ color: "#346538" }}>{service}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick stats row */}
                    {(data.rating > 0 || data.totalBookings > 0) && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {data.rating > 0 && (
                          <div className="rounded-xl p-4" style={{ background: "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)", border: "1px solid rgba(var(--landing-accent-rgb, 250,139,2), 0.1)" }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon icon="heroicons:star-solid" className="size-4 text-[var(--landing-accent)]" />
                              <span className="text-lg font-extrabold tabular-nums" style={{ color: "var(--landing-accent)" }}>
                                {data.rating.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-xs" style={{ color: "var(--tour-body)" }}>
                              {t("tourInstance.rating", "Rating")}
                            </span>
                          </div>
                        )}
                        {data.totalBookings > 0 && (
                          <div className="rounded-xl p-4" style={{ background: "var(--tour-surface-raised)", border: "1px solid var(--tour-divider)" }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon icon="heroicons:document-text" className="size-4" style={{ color: "var(--tour-caption)" }} />
                              <span className="text-lg font-extrabold tabular-nums" style={{ color: "var(--tour-heading)" }}>
                                {data.totalBookings}
                              </span>
                            </div>
                            <span className="text-xs" style={{ color: "var(--tour-body)" }}>
                              {t("tourInstance.totalBookings", "Bookings")}
                            </span>
                          </div>
                        )}
                        <div className="rounded-xl p-4" style={{ background: "var(--tour-surface-raised)", border: "1px solid var(--tour-divider)" }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon icon="heroicons:user-group" className="size-4" style={{ color: "var(--tour-caption)" }} />
                            <span className="text-lg font-extrabold tabular-nums" style={{ color: "var(--tour-heading)" }}>
                              {spotsLeft}
                            </span>
                          </div>
                          <span className="text-xs" style={{ color: "var(--tour-body)" }}>
                            {t("tourInstance.spotsLeft", "Spots left")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "pricing" && (
                  <div className="flex flex-col gap-5">
                    {/* Base Price Hero */}
                    <div className="rounded-xl p-5 text-center" style={{ background: "rgba(var(--landing-accent-rgb, 250,139,2), 0.06)", border: "1px solid rgba(var(--landing-accent-rgb, 250,139,2), 0.15)" }}>
                      <span className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: "var(--landing-accent)" }}>
                        {t("tourInstance.basePricePerPerson", "Base price per person")}
                      </span>
                      <span className="text-[32px] font-black tabular-nums leading-none" style={{ color: "var(--landing-accent)" }}>
                        {formatCurrency(data.basePrice, formatterLocale)}
                      </span>
                      <p className="text-[10px] mt-2" style={{ color: "var(--tour-caption)" }}>
                        {t("tourInstance.pricingNote", "Price per person. Group discounts may apply.")}
                      </p>
                    </div>

                    {/* Dynamic Pricing Tiers */}
                    {pricingTiers.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight mb-3 flex items-center gap-2" style={{ color: "var(--tour-heading)" }}>
                          <Icon icon="heroicons:chart-bar" className="size-4" style={{ color: "var(--landing-accent)" }} />
                          {t("tourInstance.pricingTiers", "Group pricing")}
                        </h3>
                        <div className="flex flex-col gap-2">
                          {pricingTiers.map((tier, idx) => (
                            <PricingTierCard key={idx} tier={tier} base={data.basePrice} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pricing breakdown info */}
                    <div className="rounded-xl p-4" style={{ background: "#E1F3FE", border: "1px solid #B8D8F0" }}>
                      <div className="flex items-start gap-2.5">
                        <Icon icon="heroicons:information-circle" className="size-4 mt-0.5 shrink-0" style={{ color: "#1F6C9F" }} />
                        <p className="text-[11px] leading-relaxed" style={{ color: "#1F6C9F" }}>
                          {t("tourInstance.pricingExplainer", "Pricing is calculated based on the number of participants. Larger groups may qualify for discounted rates. Final price will be confirmed at checkout.")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "itinerary" && (
                  <div className="flex flex-col gap-4">
                    {data.days && data.days.length > 0 ? (
                      data.days.map((day) => {
                        const activities = day.tourDay?.activities ?? [];
                        const sortedActivities = [...activities].sort((a, b) => a.order - b.order);

                        return (
                          <div
                            key={day.id}
                            className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-warm-md)]"
                            style={{
                              boxShadow: "var(--shadow-warm-sm)",
                              background: "var(--tour-surface)",
                              border: "1px solid var(--tour-divider)",
                            }}>
                            {/* Day Header */}
                            <div
                              className="flex items-center gap-3 px-5 py-4"
                              style={{ background: "var(--tour-surface-raised)" }}>
                              <div className="rounded-full size-10 flex items-center justify-center shrink-0" style={{ background: "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)" }}>
                                <span className="text-base font-bold" style={{ color: "var(--landing-accent)" }}>
                                  {day.instanceDayNumber}
                                </span>
                              </div>
                              <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: "#E1F3FE", color: "#1F6C9F" }}>
                                    {toDateText(day.actualDate, formatterLocale)}
                                  </span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: "var(--tour-heading)" }}>
                                  {day.title || t("tourInstance.dayLabel", `Day ${day.instanceDayNumber}`)}
                                </span>
                                {day.description && (
                                  <span className="text-xs" style={{ color: "var(--tour-body)" }}>
                                    {day.description}
                                  </span>
                                )}
                              </div>
                              {day.startTime && (
                                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--tour-caption)" }}>
                                  <Icon icon="heroicons:clock" className="size-3.5" />
                                  <span>{day.startTime}{day.endTime ? ` – ${day.endTime}` : ""}</span>
                                </div>
                              )}
                            </div>

                            {/* Activities */}
                            {sortedActivities.length > 0 ? (
                              <div className="px-5 pb-5 pt-3 flex flex-col gap-3">
                                {sortedActivities.map((activity) => {
                                  const activityTypeLabel = activity.activityType != null
                                    ? ActivityTypeMap[activity.activityType] ?? t("landing.tourDetail.activity", "Activity")
                                    : t("landing.tourDetail.activity", "Activity");

                                  return (
                                    <div
                                      key={activity.id}
                                      className="flex gap-3 pl-3 border-l-2 transition-all duration-200 hover:border-[var(--landing-accent)]"
                                      style={{ borderColor: "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)" }}>
                                      <div className="flex flex-col gap-2 flex-1">
                                        {/* Activity header */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                            style={{ background: "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)", color: "var(--accent)" }}>
                                            {activityTypeLabel}
                                          </span>
                                          {activity.isOptional && (
                                            <span
                                              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                              style={{ background: "#E1F3FE", color: "#1F6C9F" }}>
                                              {t("tourInstance.optional", "Optional")}
                                            </span>
                                          )}
                                          {activity.startTime && (
                                            <span className="text-[10px]" style={{ color: "var(--tour-caption)" }}>
                                              {activity.startTime}{activity.endTime ? ` – ${activity.endTime}` : ""}
                                            </span>
                                          )}
                                        </div>

                                        {/* Activity title */}
                                        <span className="text-sm font-semibold" style={{ color: "var(--tour-heading)" }}>
                                          {activity.title}
                                        </span>

                                        {/* Description */}
                                        {activity.description && (
                                          <p className="text-[11px] leading-relaxed" style={{ color: "var(--tour-body)" }}>
                                            {activity.description}
                                          </p>
                                        )}

                                        {/* Routes */}
                                        {activity.routes && activity.routes.length > 0 && (
                                          <div className="flex flex-col gap-2">
                                            {[...activity.routes].sort((a, b) => a.order - b.order).map((route) => {
                                              const transLabel = route.transportationType != null
                                                ? TransportationTypeMap[route.transportationType] ?? t("landing.tourDetail.transport", "Transport")
                                                : t("landing.tourDetail.transport", "Transport");
                                              return (
                                                <div
                                                  key={route.id}
                                                  className="rounded-lg px-3 py-2.5 text-[11px]"
                                                  style={{ background: "var(--tour-surface-muted)", color: "var(--tour-body)" }}>
                                                  <div className="flex flex-wrap items-center gap-1.5">
                                                    <Icon icon="heroicons:arrow-right" className="size-3 shrink-0" style={{ color: "var(--tour-caption)" }} />
                                                    <span className="font-semibold">{transLabel}</span>
                                                    {route.fromLocation?.locationName && route.toLocation?.locationName && (
                                                      <span>
                                                        {route.fromLocation.locationName} → {route.toLocation.locationName}
                                                      </span>
                                                    )}
                                                    {route.durationMinutes != null && (
                                                      <span style={{ color: "var(--tour-caption)" }}>
                                                        ({route.durationMinutes} {t("tourInstance.minutes", "min")})
                                                      </span>
                                                    )}
                                                  </div>
                                                  {route.estimatedDepartureTime && route.estimatedArrivalTime && (
                                                    <div className="mt-1" style={{ color: "var(--tour-caption)" }}>
                                                      {t("tourInstance.routeTime", "Time")}: {route.estimatedDepartureTime} → {route.estimatedArrivalTime}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {/* Accommodation */}
                                        {activity.accommodation && (
                                          <div
                                            className="rounded-lg border px-3 py-2.5 text-[11px]"
                                            style={{ background: "#E1F3FE", borderColor: "#B8D8F0", color: "var(--tour-body)" }}>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              <Icon icon="heroicons:building-office" className="size-3 shrink-0" style={{ color: "var(--tour-caption)" }} />
                                              <span className="font-semibold">{activity.accommodation.accommodationName}</span>
                                              <span>({activity.accommodation.roomType != null ? RoomTypeMap[activity.accommodation.roomType] ?? t("landing.tourDetail.room", "Room") : t("landing.tourDetail.room", "Room")})</span>
                                              {activity.accommodation.mealsIncluded > 0 && (
                                                <span style={{ color: "var(--landing-accent)" }}>
                                                  • {MealTypeMap[activity.accommodation.mealsIncluded] ?? t("landing.tourDetail.meal", "Meal")}
                                                </span>
                                              )}
                                            </div>
                                            {(activity.accommodation.checkInTime || activity.accommodation.checkOutTime) && (
                                              <div className="mt-1" style={{ color: "var(--tour-caption)" }}>
                                                {t("tourInstance.checkInOut", "Check-in/out")}: {activity.accommodation.checkInTime}{activity.accommodation.checkOutTime ? ` – ${activity.accommodation.checkOutTime}` : ""}
                                              </div>
                                            )}
                                            {activity.accommodation.address && (
                                              <div className="mt-1 line-clamp-2" style={{ color: "var(--tour-caption)" }}>
                                                {activity.accommodation.address}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Activity note */}
                                        {activity.note && (
                                          <p className="text-[10px] italic" style={{ color: "var(--tour-caption)" }}>
                                            {activity.note}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="px-5 pb-5 pt-1">
                                <p className="text-xs" style={{ color: "var(--tour-body)" }}>
                                  {t("tourInstance.emptyActivities", "No activities planned for this day.")}
                                </p>
                              </div>
                            )}

                            {/* Day note */}
                            {day.note && (
                              <div className="px-5 pb-4">
                                <p className="text-[10px] italic px-3 py-2 rounded-lg" style={{ background: "var(--tour-surface-muted)", color: "var(--tour-caption)" }}>
                                  {day.note}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 rounded-2xl" style={{ background: "var(--tour-surface-raised)" }}>
                        <Icon icon="heroicons:calendar" className="size-12 mx-auto mb-3" style={{ color: "var(--tour-caption)" }} />
                        <p className="text-sm font-semibold mb-1" style={{ color: "var(--tour-heading)" }}>
                          {t("tourInstance.dailyPlanEmpty", "No itinerary available")}
                        </p>
                        <p className="text-xs" style={{ color: "var(--tour-body)" }}>
                          {t("tourInstance.dailyPlanEmptyDesc", "This tour instance doesn't have a day-by-day schedule yet.")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Sidebar (Booking Card) ──────────────────── */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-5 lg:sticky lg:top-24 self-start">
            <div
              className="rounded-2xl overflow-hidden animate-reveal-right"
              style={{
                boxShadow: "var(--shadow-warm-lg)",
                background: "var(--tour-surface)",
                border: "1px solid rgba(255,255,255,0.8)",
              }}>
              {/* Gradient accent bar */}
              <div className="h-1" style={{ background: "linear-gradient(90deg, var(--landing-accent), var(--accent), var(--landing-accent))" }} />

              <div className="p-5 flex flex-col gap-5">
                {/* Instance type badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon={isPublicInstance ? "heroicons:globe-alt" : "heroicons:lock-closed"}
                      className="size-4"
                      style={{ color: isPublicInstance ? "var(--landing-accent)" : "#1F6C9F" }}
                    />
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{
                      background: isPublicInstance ? "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)" : "#E1F3FE",
                      color: isPublicInstance ? "var(--accent)" : "#1F6C9F",
                    }}>
                      {isPublicInstance ? t("tourInstance.public", "Public") : t("tourInstance.private", "Private")}
                    </span>
                  </div>
                  <TourStatusBadge status={data.status} />
                </div>

                {/* Heading */}
                <div>
                  <h3 className="text-sm font-semibold tracking-tight mb-0.5" style={{ color: "var(--tour-heading)" }}>
                    {t("tourInstance.userPricingBreakdown", "Pricing breakdown")}
                  </h3>
                  <span className="text-[11px]" style={{ color: "var(--tour-caption)" }}>
                    {t("tourInstance.selectGuests", "Select number of guests")}
                  </span>
                </div>

                {/* Guest Selector */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid var(--tour-divider)", background: "var(--tour-surface-raised)" }}>
                  <GuestRow
                    label={t("landing.tourDetail.adults")}
                    value={adults}
                    onDecrement={() => setAdults(Math.max(1, adults - 1))}
                    onIncrement={() => setAdults(Math.min(20, adults + 1))}
                  />
                  <GuestRow
                    label={t("landing.tourDetail.children")}
                    subtitle={t("landing.tourDetail.childrenAge", "< 12 years")}
                    value={children}
                    onDecrement={() => setChildren(Math.max(0, children - 1))}
                    onIncrement={() => setChildren(Math.min(20, children + 1))}
                  />
                  <GuestRow
                    label={t("landing.tourDetail.infants")}
                    subtitle={t("landing.tourDetail.infantsAge", "< 2 years")}
                    value={infants}
                    onDecrement={() => setInfants(Math.max(0, infants - 1))}
                    onIncrement={() => setInfants(Math.min(20, infants + 1))}
                    showBorder={false}
                  />
                </div>

                {/* Price Breakdown */}
                <div className="flex flex-col gap-2">
                  {adults > 0 && (
                    <div className="flex items-center justify-between border-b pb-2 tabular-nums" style={{ borderColor: "var(--tour-divider)" }}>
                      <span className="text-xs" style={{ color: "var(--tour-body)" }}>
                        {t("landing.tourDetail.adults")} × {adults}
                      </span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: "var(--tour-heading)" }}>
                        {formatCurrency(data.basePrice * adults, formatterLocale)}
                      </span>
                    </div>
                  )}
                  {children > 0 && (
                    <div className="flex items-center justify-between border-b pb-2 tabular-nums" style={{ borderColor: "var(--tour-divider)" }}>
                      <span className="text-xs" style={{ color: "var(--tour-body)" }}>
                        {t("landing.tourDetail.children")} × {children}
                      </span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: "var(--tour-heading)" }}>
                        {formatCurrency(data.basePrice * children, formatterLocale)}
                      </span>
                    </div>
                  )}
                  {infants > 0 && (
                    <div className="flex items-center justify-between border-b pb-2 tabular-nums" style={{ borderColor: "var(--tour-divider)" }}>
                      <span className="text-xs" style={{ color: "var(--tour-body)" }}>
                        {t("landing.tourDetail.infants")} × {infants}
                      </span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: "var(--tour-heading)" }}>
                        {formatCurrency(data.basePrice * infants, formatterLocale)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total Price */}
                <div className="rounded-xl p-4 transition-all duration-300" style={{ background: "rgba(var(--landing-accent-rgb, 250,139,2), 0.06)", border: "1px solid rgba(var(--landing-accent-rgb, 250,139,2), 0.15)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--landing-accent)" }}>
                      {t("tourInstance.totalEstimate")} ({totalGuests} {t("tourInstance.guests")})
                    </span>
                    <span className="text-[28px] font-black tabular-nums leading-none transition-all duration-300" style={{ color: "var(--landing-accent)" }}>
                      {formatCurrency(data.basePrice * totalGuests, formatterLocale)}
                    </span>
                  </div>
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--tour-caption)" }}>
                    {t("tourInstance.priceMayVary")}
                  </span>
                </div>

                {/* CTA Button */}
                <div className="relative group/book mt-2">
                  <Button
                    type="button"
                    disabled={spotsLeft === 0}
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push(`/home?login=true&returnUrl=/tours/instances/${id}`);
                        return;
                      }
                      const params = new URLSearchParams({
                        tourInstanceId: id,
                        tourName: data.tourName,
                        startDate: data.startDate || "",
                        endDate: data.endDate || "",
                        location: data.location || "",
                        basePrice: String(data.basePrice),
                        adults: String(adults),
                        children: String(children),
                        infants: String(infants),
                        bookingType: "InstanceJoin",
                        instanceType: isPublicInstance ? "public" : "private",
                      });
                      router.push(`/checkout?${params.toString()}`);
                    }}
                    className={`relative w-full py-4 rounded-2xl text-[15px] font-extrabold text-white overflow-hidden transition-all duration-300 flex items-center justify-center gap-2 ${
                      spotsLeft > 0 ? "hover:-translate-y-0.5 active:scale-[0.98]" : "cursor-not-allowed"
                    }`}
                    style={
                      spotsLeft > 0
                        ? {
                            background: isPublicInstance
                              ? "linear-gradient(135deg, var(--landing-accent) 0%, var(--accent) 100%)"
                              : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            boxShadow: isPublicInstance
                              ? "0 8px 24px rgba(var(--landing-accent-rgb, 250,139,2), 0.3)"
                              : "0 8px 24px rgba(59, 130, 246, 0.3)",
                          }
                        : {
                            background: "var(--tour-surface-muted)",
                            color: "var(--tour-caption)",
                            border: "1px solid var(--tour-divider)",
                          }
                    }>
                    {spotsLeft > 0 && (
                      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                        <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover/book:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                      </div>
                    )}
                    <Icon
                      icon={spotsLeft === 0 ? "heroicons:x-circle" : isPublicInstance ? "heroicons:check-circle" : "heroicons:clock"}
                      className="size-5 transition-all duration-300 relative z-10"
                    />
                    <span className="relative z-10 tracking-wide">
                      {spotsLeft === 0
                        ? t("tourInstance.soldOut", "Sold Out")
                        : isPublicInstance
                        ? t("landing.tourDetail.bookNow", "Book Now — Instant Confirmation")
                        : t("landing.tourDetail.requestToJoin", "Request to Join")}
                    </span>
                  </Button>
                </div>

                {/* No payment notice */}
                <p className="text-[10px] text-center leading-[0.9375rem]" style={{ color: "var(--tour-caption)" }}>
                  {t("landing.tourDetail.noPaymentNotice", "No payment required now. You'll be redirected to complete your booking.")}
                </p>
              </div>
            </div>

            {/* Need Help Card */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:shadow-[var(--shadow-warm-md)] hover:-translate-y-0.5"
              style={{
                boxShadow: "var(--shadow-warm-sm)",
                background: "var(--tour-surface)",
                border: "1px solid rgba(255,255,255,0.8)",
              }}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl size-10 flex items-center justify-center shrink-0" style={{ background: "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)" }}>
                  <Icon icon="heroicons:phone" className="size-5" style={{ color: "var(--landing-accent)" }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold" style={{ color: "var(--tour-heading)" }}>
                    {t("landing.tourDetail.needHelp", "Need help booking?")}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--tour-caption)" }}>
                    {t("landing.tourDetail.hereForYou", "We're here for you")}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                className="w-full rounded-xl py-3 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 group"
                style={{
                  border: "2px solid var(--tour-divider)",
                  color: "var(--tour-heading)",
                  background: "var(--tour-surface)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "var(--landing-accent)";
                  el.style.color = "var(--accent)";
                  el.style.background = "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "var(--tour-divider)";
                  el.style.color = "var(--tour-heading)";
                  el.style.background = "var(--tour-surface)";
                }}>
                {t("landing.tourDetail.contactUs", "Contact us")}
                <Icon icon="heroicons:arrow-small-right" className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Social Buttons ─────────────────────────── */}
      <div className="fixed right-5 bottom-28 z-50 flex flex-col gap-3">
        <a
          href="#"
          className="rounded-full size-11 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95"
          style={{ background: "#1877f2", boxShadow: "0 4px 16px rgba(24, 119, 242, 0.3)" }}>
          <Icon icon="ri:facebook-fill" className="size-5 text-white" />
        </a>
        <Button
          type="button"
          className="rounded-full size-11 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95"
          style={{ background: "var(--landing-accent)", boxShadow: "0 4px 16px rgba(var(--landing-accent-rgb, 250,139,2), 0.3)" }}>
          <Icon icon="heroicons:chat-bubble-oval-left" className="size-5 text-white" />
        </Button>
      </div>

      <LandingFooter />
    </div>
  );
}
