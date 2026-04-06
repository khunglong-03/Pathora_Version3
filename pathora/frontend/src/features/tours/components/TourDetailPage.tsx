"use client";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { LandingHeader } from "@/features/shared/components/LandingHeader";
import { LandingFooter } from "@/features/shared/components/LandingFooter";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";
import { tourService } from "@/api/services/tourService";
import { normalizeLanguageForApi } from "@/api/languageHeader";
import { formatCurrency } from "@/utils/format";
import {
  useScrollReveal,
  ImageLightbox,
  GuestRow,
  ItineraryDayCard,
  ReviewsSection,
  ScheduledDeparturesSection,
} from "@/features/shared/components";
import {
  TourDto,
  InsuranceTypeMap,
} from "@/types/tour";

/* ══════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════ */

/* ── Info Pill ──────────────────────────────────────────── */
function InfoPill({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="bg-white/80 backdrop-blur-sm border border-white/80 rounded-2xl p-4 flex items-center gap-3 reveal-on-scroll transition-all duration-300 hover:shadow-[var(--shadow-warm-md)] hover:-translate-y-0.5 hover:bg-white"
      style={{ boxShadow: "var(--shadow-warm-sm)" }}>
      <div className="bg-[#fa8b02]/10 rounded-full size-12 flex items-center justify-center shrink-0">
        <Icon icon={icon} className="text-[#fa8b02] size-5" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] uppercase tracking-[0.5px] text-[var(--tour-caption)] font-semibold mb-0.5">
          {label}
        </span>
        <span className="text-sm font-bold" style={{ color: "var(--tour-heading)" }}>{value}</span>
      </div>
    </div>
  );
}

/* ── Loading Skeleton ──────────────────────────────────────── */
function TourDetailSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: "var(--tour-surface-muted)" }}>
      <div className="relative h-[460px] animate-pulse" style={{ background: "var(--tour-surface)" }}>
        <div className="absolute inset-x-0 top-0 z-20">
          <LandingHeader />
        </div>
      </div>
      <div className="max-w-330 mx-auto px-4 md:px-3.75">
        <div className="py-4 px-6">
          <div className="h-4 w-48 rounded animate-pulse" style={{ background: "var(--tour-divider)" }} />
        </div>
        <div className="flex flex-col lg:flex-row gap-5 px-6 pb-16">
          <div className="flex-1 flex flex-col gap-5">
            <div className="h-[260px] rounded-2xl animate-pulse" style={{ background: "var(--tour-divider)" }} />
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

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */
export function TourDetailPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const tourId = params?.id as string;
  const [apiLanguage, setApiLanguage] = useState(() =>
    normalizeLanguageForApi(i18n.resolvedLanguage || i18n.language),
  );

  // Scroll reveal on mount
  useScrollReveal();

  useEffect(() => {
    const updateLanguage = (language: string) => {
      setApiLanguage(normalizeLanguageForApi(language));
    };

    updateLanguage(i18n.resolvedLanguage || i18n.language);
    i18n.on("languageChanged", updateLanguage);

    return () => {
      i18n.off("languageChanged", updateLanguage);
    };
  }, [i18n]);

  /* ── API State ───────────────────────────────────────────── */
  const [tour, setTour] = useState<TourDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!tourId) return;
    let cancelled = false;

    const initFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await tourService.getPublicTourDetail(tourId, apiLanguage);
        if (!cancelled) {
          setTour(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const status = (err as { response?: { status: number } })?.response?.status;
          setError(status === 404 ? "not_found" : "error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initFetch();

    return () => {
      cancelled = true;
    };
  }, [tourId, apiLanguage, refetchTrigger]);

  /* ── UI State ────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary">(
    "overview",
  );
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [departureDate, setDepartureDate] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  /* ── Derived values ──────────────────────────────────────── */
  const classifications = tour?.classifications ?? [];
  const selectedClassification = classifications[selectedPackage] ?? null;

  const pricePerPerson =
    selectedClassification?.salePrice ?? selectedClassification?.price ?? 0;
  const originalPrice = selectedClassification?.price ?? 0;

  const adultTotal = adults * pricePerPerson;
  const serviceFee = 0;
  const estimatedTotal = adultTotal + serviceFee;
  const canBook = adults > 0 && departureDate !== "";

  const heroImage = tour?.thumbnail?.publicURL ?? "";
  const galleryImages = useMemo(
    () =>
      (tour?.images?.map((img) => img.publicURL).filter(Boolean) as string[]) ??
      [],
    [tour?.images],
  );

  const duration = selectedClassification
    ? `${selectedClassification.durationDays} ${t("landing.tourDetail.days")}`
    : "";

  const aboutParagraphs = useMemo(
    () => tour?.longDescription?.split("\n").filter(Boolean) ?? [],
    [tour?.longDescription],
  );

  const insurances = selectedClassification?.insurances ?? [];
  const itineraryDays = selectedClassification?.plans ?? [];

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) return <TourDetailSkeleton />;

  /* ── Not Found ───────────────────────────────────────────── */
  if (error === "not_found" || !tour) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--tour-surface-muted)" }}>
        <LandingHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <Icon
              icon="heroicons:map"
              className="size-16 mx-auto mb-4"
              style={{ color: "var(--tour-caption)" }}
            />
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--tour-heading)" }}>
              {t("landing.tourDetail.notFound", "Tour not found")}
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--tour-body)" }}>
              {t("landing.tourDetail.notFoundDesc", "The tour you're looking for doesn't exist or has been removed.")}
            </p>
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "#fa8b02", color: "white" }}>
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {t("landing.tourDetail.allTours")}
            </Link>
          </div>
        </div>
        <LandingFooter />
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--tour-surface-muted)" }}>
        <LandingHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <Icon
              icon="heroicons:exclamation-triangle"
              className="size-16 mx-auto mb-4"
              style={{ color: "var(--danger)" }}
            />
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--tour-heading)" }}>
              {t("landing.tourDetail.error", "Something went wrong")}
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--tour-body)" }}>
              {t("landing.tourDetail.errorDesc", "Failed to load tour details. Please try again.")}
            </p>
            <Button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(null);
                setRefetchTrigger((k) => k + 1);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "#fa8b02", color: "white" }}>
              <Icon icon="heroicons:arrow-path" className="size-4" />
              {t("landing.tourDetail.retry", "Try Again")}
            </Button>
          </div>
        </div>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--tour-surface-muted)" }}>
      {/* ── Hero Section ───────────────────────────────────── */}
      <div className="relative h-[62vh] max-h-[640px] overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage}
            alt={tour.tourName}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            style={{ transform: "scale(1.05)" }}
          />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-linear-to-b from-[#05073c]/50 via-[#05073c]/20 to-[#05073c]/85" />
        <div className="absolute inset-0 bg-linear-to-r from-[#05073c]/40 via-transparent to-[#05073c]/20" />

        {/* Header */}
        <div className="absolute inset-x-0 top-0 z-20">
          <LandingHeader />
        </div>

        {/* Back button */}
        <div className="absolute inset-x-0 top-[81px] z-10 max-w-330 mx-auto px-4 md:px-3.75">
          <div className="px-6">
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white text-sm font-medium hover:bg-white/20 hover:border-white/30 transition-all duration-300">
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {t("landing.tourDetail.allTours")}
            </Link>
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute inset-x-0 bottom-0 z-10 max-w-330 mx-auto px-4 md:px-3.75 pb-12">
          <div className="px-6 flex flex-col items-start gap-5">
            {/* Breadcrumb Floating Pill */}
            <nav className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[11px] text-white/90 animate-reveal-up stagger-1">
              <Link href="/home" className="hover:text-white transition-colors">
                {t("landing.tourDetail.home")}
              </Link>
              <Icon
                icon="heroicons:chevron-right"
                className="size-2.5 opacity-50"
              />
              <Link
                href="/tours"
                className="hover:text-white transition-colors">
                {t("landing.tourDetail.packageTours")}
              </Link>
              <Icon
                icon="heroicons:chevron-right"
                className="size-2.5 opacity-50"
              />
              <span className="font-semibold text-white truncate max-w-[9.375rem] md:max-w-none">
                {tour.tourName}
              </span>
            </nav>

            <div className="flex flex-col items-start gap-4 w-full">
              {/* Badges */}
              <div className="flex items-center gap-2 animate-reveal-up stagger-2">
                <span className="bg-[#fa8b02] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-orange-500/25">
                  <Icon icon="heroicons:tag" className="size-3" />
                  {tour.tourCode}
                </span>
                {tour.classifications?.[0] && (
                  <span className="bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-full">
                    {tour.classifications[0].name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                className="text-[clamp(2rem,6vw,3.5rem)] font-extrabold text-white leading-[1.05] max-w-2xl animate-reveal-up stagger-3"
                style={{ textWrap: "balance", letterSpacing: "-0.03em", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
                {tour.tourName}
              </h1>

              {/* Description */}
              <p
                className="text-sm md:text-base text-white/80 max-w-xl leading-relaxed font-medium animate-reveal-up stagger-4"
                style={{ textWrap: "pretty" }}>
                {tour.shortDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-[#F7F6F3] to-transparent pointer-events-none" />
      </div>

      {/* ── Main Content ───────────────────────────────────── */}
      <div className="max-w-330 mx-auto px-4 md:px-3.75 mt-8">
        <div className="flex flex-col lg:flex-row gap-5 px-6 pb-16">
          {/* ── Left Column ──────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Image Gallery */}
            {galleryImages.length > 0 && (
              <div className="reveal-on-scroll stagger-1">
                <div
                  className={`flex gap-3 h-[280px] md:h-[320px] rounded-3xl overflow-hidden`}
                  style={{ boxShadow: "var(--shadow-warm-md)" }}>
                  {/* Large image */}
                  <div
                    className={`relative min-w-0 rounded-l-3xl overflow-hidden group cursor-pointer ${galleryImages.length === 1 ? "w-full rounded-r-3xl" : "flex-1"}`}
                    onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}>
                    <Image
                      src={galleryImages[0]}
                      alt={tour.tourName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-[#05073c]/0 group-hover:bg-[#05073c]/15 transition-colors duration-500 rounded-l-3xl flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full size-10 flex items-center justify-center shadow-lg">
                        <Icon icon="heroicons:magnifying-glass" className="size-5 text-[#05073c]" />
                      </div>
                    </div>
                  </div>
                  {/* Small images grid */}
                  {galleryImages.length > 1 && (
                    <div
                      className={`grid gap-3 w-[220px] md:w-[260px] shrink-0 ${
                        galleryImages.length === 2 ? "grid-cols-1" : "grid-cols-2"
                      }`}>
                      {galleryImages.slice(1, 5).map((img, i) => {
                        const isTopRight =
                          i === 1 || (galleryImages.length === 2 && i === 0);
                        const isBottomRight =
                          i === 3 ||
                          (galleryImages.length === 2 && i === 0) ||
                          (galleryImages.length === 3 && i === 2);
                        const isLastImage =
                          i === Math.min(galleryImages.length - 2, 3);
                        const imgIdx = i + 1;

                        return (
                          <div
                            key={i}
                            className={`relative overflow-hidden group cursor-pointer ${isTopRight ? "rounded-tr-3xl" : ""} ${isBottomRight ? "rounded-br-3xl" : ""}`}
                            onClick={() => { setLightboxIndex(imgIdx); setLightboxOpen(true); }}>
                            <Image
                              src={img}
                              alt={`Gallery ${imgIdx + 1}`}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                              sizes="130px"
                            />
                            <div className="absolute inset-0 bg-[#05073c]/0 group-hover:bg-[#05073c]/15 transition-colors duration-500 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full size-8 flex items-center justify-center shadow-lg">
                                <Icon icon="heroicons:magnifying-glass" className="size-4 text-[#05073c]" />
                              </div>
                            </div>
                            {isLastImage && galleryImages.length > 5 && (
                              <div className="absolute inset-0 bg-[#05073c]/30 group-hover:bg-[#05073c]/50 transition-colors duration-300 flex flex-col items-center justify-center">
                                <Button
                                  type="button"
                                  className="bg-white text-[#05073c] px-4 py-2 rounded-full shadow-md font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform">
                                  <Icon
                                    icon="heroicons:photo"
                                    className="size-4"
                                  />
                                  +{galleryImages.length - 5}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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

            {/* Info Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 reveal-on-scroll stagger-2">
              {duration && (
                <InfoPill
                  icon="heroicons:clock"
                  label={t("landing.tourDetail.duration")}
                  value={duration}
                />
              )}
              <InfoPill
                icon="heroicons:tag"
                label={t("landing.tourDetail.package", "Package")}
                value={selectedClassification?.name ?? "—"}
              />
              <InfoPill
                icon="heroicons:document-text"
                label={t("landing.tourDetail.plans", "Day Plans")}
                value={`${itineraryDays.length} ${t("landing.tourDetail.days", "days")}`}
              />
              <InfoPill
                icon="heroicons:shield-check"
                label={t("landing.tourDetail.insurance", "Insurance")}
                value={
                  insurances.length > 0
                    ? `${insurances.length} ${t("landing.tourDetail.included", "included")}`
                    : t("landing.tourDetail.none", "None")
                }
              />
            </div>

            {/* Tabs: Overview / Itinerary */}
            <div
              className="bg-white border border-white/80 rounded-2xl overflow-hidden mt-6 reveal-on-scroll stagger-3"
              style={{ boxShadow: "var(--shadow-warm-md)" }}>
              {/* Segmented Control Tab bar */}
              <div className="p-4">
                <div className="flex gap-1.5 p-1.5 bg-[var(--tour-surface-muted)] rounded-2xl w-full sm:w-auto">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all rounded-xl duration-300 ${
                      activeTab === "overview"
                        ? "bg-white shadow-[var(--shadow-warm-sm)] text-[#fa8b02] ring-2 ring-[#fa8b02]/20"
                        : "text-[var(--tour-body)] hover:text-[var(--tour-heading)] hover:bg-white/50"
                    }`}>
                    <Icon
                      icon="heroicons:information-circle"
                      className="size-4"
                    />
                    {t("landing.tourDetail.overview")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("itinerary")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all rounded-xl duration-300 ${
                      activeTab === "itinerary"
                        ? "bg-white shadow-[var(--shadow-warm-sm)] text-[#fa8b02] ring-2 ring-[#fa8b02]/20"
                        : "text-[var(--tour-body)] hover:text-[var(--tour-heading)] hover:bg-white/50"
                    }`}>
                    <Icon icon="heroicons:document-text" className="size-4" />
                    {t("landing.tourDetail.itinerary")}
                  </Button>
                </div>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="flex flex-col gap-6 reveal-on-scroll">
                    <div>
                      <h3 className="text-base font-bold mb-3" style={{ color: "var(--tour-heading)" }}>
                        {t("landing.tourDetail.aboutThisTour")}
                      </h3>
                      {aboutParagraphs.length > 0 ? (
                        aboutParagraphs.map((p, i) => (
                          <p
                            key={i}
                            className="text-sm leading-[1.8] max-w-[65ch]"
                            style={{ color: "var(--tour-body)" }}>
                            {p}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm leading-[1.8]" style={{ color: "var(--tour-body)" }}>
                          {tour.shortDescription}
                        </p>
                      )}
                    </div>

                    {/* Insurance Section */}
                    {insurances.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--tour-heading)" }}>
                          <Icon
                            icon="heroicons:shield-check"
                            className="size-4 text-[#fa8b02]"
                          />
                          {t(
                            "landing.tourDetail.insuranceCoverage",
                            "Insurance Coverage",
                          )}
                        </h4>
                        <div className="flex flex-col gap-2">
                          {insurances.map((ins) => (
                            <div
                              key={ins.id}
                              className="flex items-start gap-3 bg-[#EDF3EC] border border-[#C6D9C2] rounded-xl p-4 reveal-on-scroll transition-all duration-300 hover:shadow-[var(--shadow-warm-sm)]"
                              style={{ boxShadow: "var(--shadow-warm-sm)" }}>
                              <Icon
                                icon="heroicons:check-circle"
                                className="size-5 text-[var(--success)] mt-0.5 shrink-0"
                              />
                              <div className="flex flex-col gap-1 flex-1">
                                <span className="text-sm font-semibold" style={{ color: "var(--tour-heading)" }}>
                                  {ins.insuranceName}
                                </span>
                                <span className="text-xs" style={{ color: "var(--tour-body)" }}>
                                  {ins.insuranceProvider} •{" "}
                                  {InsuranceTypeMap[ins.insuranceType] ??
                                    "Insurance"}
                                </span>
                                <span className="text-xs leading-relaxed" style={{ color: "var(--tour-body)" }}>
                                  {ins.coverageDescription}
                                </span>
                                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                  <span className="text-xs font-semibold" style={{ color: "#fa8b02" }}>
                                    {t("landing.tourDetail.coverage", "Coverage")}: {formatCurrency(ins.coverageAmount)}
                                  </span>
                                  <span className="text-xs" style={{ color: "var(--tour-caption)" }}>
                                    {t("landing.tourDetail.fee", "Fee")}: {formatCurrency(ins.coverageFee)}
                                  </span>
                                  {ins.isOptional && (
                                    <span className="bg-[#E1F3FE] text-[#1F6C9F] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      {t("landing.tourDetail.optional", "Optional")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "itinerary" && (
                  <div className="flex flex-col gap-3 reveal-on-scroll">
                    <h3 className="text-base font-bold" style={{ color: "var(--tour-heading)" }}>
                      {t("landing.tourDetail.itinerary")}
                    </h3>
                    {itineraryDays.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {[...itineraryDays]
                          .sort((a, b) => a.dayNumber - b.dayNumber)
                          .map((day) => (
                            <ItineraryDayCard key={day.id} day={day} />
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: "var(--tour-body)" }}>
                        {t("landing.tourDetail.noItinerary", "No itinerary available for this package yet.")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <ReviewsSection />

            {/* Scheduled Departures */}
            {tourId && (
              <ScheduledDeparturesSection
                tourId={tourId}
                apiLanguage={apiLanguage}
              />
            )}
          </div>

          {/* ── Right Sidebar ────────────────────────────── */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 lg:sticky lg:top-24 self-start">
            {/* Booking Card */}
            <div
              className="rounded-[20px] overflow-hidden animate-reveal-right"
              style={{
                boxShadow: "var(--shadow-warm-lg)",
                background: "var(--tour-surface)",
                border: "1px solid rgba(255,255,255,0.8)",
              }}>
              {/* Warm gradient top accent bar */}
              <div className="h-1.5" style={{ background: "linear-gradient(90deg, #fa8b02, #c9873a, #fa8b02)" }} />

              <div className="p-5 flex flex-col gap-5">
                {/* Select Package */}
                {classifications.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider pl-1" style={{ color: "var(--tour-caption)" }}>
                      {t("landing.tourDetail.selectPackage")}
                    </span>
                    <div className="flex flex-col gap-2">
                      {[...classifications].map((cls, i) => (
                        <Button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelectedPackage(i)}
                          className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden text-left ${
                            selectedPackage === i
                              ? "border-[#fa8b02] z-10"
                              : "border-[var(--tour-divider)] hover:border-[#fa8b02]/30 bg-[var(--tour-surface-raised)]"
                          }`}
                          style={
                            selectedPackage === i
                              ? { background: "rgba(250, 139, 2, 0.06)", boxShadow: "0 4px 16px rgba(250, 139, 2, 0.12)" }
                              : {}
                          }>
                          {selectedPackage === i && (
                            <div className="absolute top-0 right-0 w-28 h-28 bg-linear-to-bl from-[#fa8b02]/15 to-transparent rounded-bl-full pointer-events-none" />
                          )}
                          <div className="flex items-center gap-3.5 relative z-10">
                            <div
                              className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                                selectedPackage === i
                                  ? "border-[#fa8b02] bg-[#fa8b02]"
                                  : "border-[var(--tour-divider)] bg-[var(--tour-surface)]"
                              }`}>
                              {selectedPackage === i && (
                                <Icon
                                  icon="heroicons:check"
                                  className="size-3 text-white stroke-[3]"
                                />
                              )}
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                              <span
                                className={`text-sm font-bold transition-colors ${selectedPackage === i ? "text-[#c9873a]" : ""}`}
                                style={selectedPackage === i ? {} : { color: "var(--tour-heading)" }}>
                                {cls.name}
                              </span>
                              <span
                                className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                                style={{ color: selectedPackage === i ? "#fa8b02" : "var(--tour-caption)" }}>
                                <Icon
                                  icon="heroicons:clock"
                                  className="size-3 shrink-0"
                                />
                                {cls.durationDays}{" "}
                                {t("landing.tourDetail.days", "days")}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 relative z-10">
                            <span
                              className="text-[15px] font-bold tabular-nums tracking-tight transition-colors"
                              style={{ color: selectedPackage === i ? "#fa8b02" : "var(--tour-heading)" }}>
                              {formatCurrency(cls.salePrice)}
                            </span>
                            {cls.price !== cls.salePrice && (
                              <span className="text-[11px] line-through font-semibold tabular-nums" style={{ color: "var(--tour-caption)" }}>
                                {formatCurrency(cls.price)}
                              </span>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estimated Price */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs" style={{ color: "var(--tour-caption)" }}>
                    {t("landing.tourDetail.estimatedPrice")}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[28px] font-extrabold leading-8 tabular-nums" style={{ color: "#fa8b02" }}>
                      {formatCurrency(pricePerPerson)}
                    </span>
                    <span className="text-sm" style={{ color: "var(--tour-caption)" }}>
                      {t("landing.tourDetail.perPerson", "/person")}
                    </span>
                    {originalPrice !== pricePerPerson && (
                      <span className="text-sm line-through" style={{ color: "var(--tour-caption)" }}>
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                  </div>
                  <div
                    className="rounded-[10px] p-3 border"
                    style={{ background: "#E1F3FE", borderColor: "#B8D8F0" }}>
                    <p className="text-[10px] leading-[0.9375rem]" style={{ color: "#1F6C9F" }}>
                      {t("landing.tourDetail.packageNoticeStart")}{" "}
                      <span className="font-bold">
                        {t("landing.tourDetail.packageTour")}
                      </span>
                      <span>. {t("landing.tourDetail.packageNoticeEnd")}</span>
                    </p>
                  </div>
                </div>

                {/* Preferred Departure Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold" style={{ color: "var(--tour-heading)" }}>
                    {t("landing.tourDetail.preferredDepartureDate")}
                  </label>
                  <div className="relative">
                    <Icon
                      icon="heroicons:calendar"
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                      style={{ color: "var(--tour-caption)" }}
                    />
                    <TextInput
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="!rounded-[14px] !pl-9 !pr-3 !py-2.5 !text-sm transition-colors"
                      style={{
                        borderColor: "var(--tour-divider)",
                        color: "var(--tour-heading)",
                      }}
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--tour-caption)" }}>
                    {t("landing.tourDetail.flexibleDates")}
                  </p>
                </div>

                {/* Guests */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold" style={{ color: "var(--tour-heading)" }}>
                    {t("landing.tourDetail.guestsLabel")}
                  </label>
                  <div
                    className="rounded-[14px] overflow-hidden"
                    style={{
                      border: "1px solid var(--tour-divider)",
                      background: "var(--tour-surface-raised)",
                    }}>
                    <GuestRow
                      label={t("landing.tourDetail.adults")}
                      value={adults}
                      onDecrement={() => setAdults(Math.max(1, adults - 1))}
                      onIncrement={() => setAdults(adults + 1)}
                    />
                    <GuestRow
                      label={t("landing.tourDetail.children")}
                      subtitle={t("landing.tourDetail.childrenAge")}
                      value={children}
                      onDecrement={() => setChildren(Math.max(0, children - 1))}
                      onIncrement={() => setChildren(children + 1)}
                    />
                    <GuestRow
                      label={t("landing.tourDetail.infants")}
                      subtitle={t("landing.tourDetail.infantsAge")}
                      value={infants}
                      onDecrement={() => setInfants(Math.max(0, infants - 1))}
                      onIncrement={() => setInfants(infants + 1)}
                      showBorder={false}
                    />
                  </div>
                </div>

                {/* Price Summary */}
                <div
                  className="rounded-[14px] p-4 flex flex-col gap-2"
                  style={{ background: "var(--tour-surface-muted)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--tour-body)" }}>
                      {t("landing.tourDetail.adults")} × {adults}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: "var(--tour-body)" }}>
                      {formatCurrency(adultTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--tour-body)" }}>
                      {t("landing.tourDetail.serviceFee")}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: "var(--tour-body)" }}>
                      {formatCurrency(serviceFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: "var(--tour-divider)" }}>
                    <span className="text-sm font-bold" style={{ color: "var(--tour-heading)" }}>
                      {t("landing.tourDetail.estimatedTotal")}
                    </span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: "#fa8b02" }}>
                      {formatCurrency(estimatedTotal)}
                    </span>
                  </div>
                </div>

                {/* Request Booking Button */}
                <div className="relative group/book mt-2">
                  <Button
                    type="button"
                    disabled={!canBook}
                    onClick={() => {
                      if (tourId && canBook) {
                        router.push(`/tours/instances/${tourId}`);
                      }
                    }}
                    className={`relative w-full py-4 rounded-2xl text-[15px] font-extrabold text-white overflow-hidden transition-all duration-300 flex items-center justify-center gap-2 ${
                      canBook
                        ? "hover:-translate-y-0.5 active:scale-[0.98]"
                        : "cursor-not-allowed"
                    }`}
                    style={
                      canBook
                        ? {
                            background: "linear-gradient(135deg, #fa8b02 0%, #c9873a 100%)",
                            boxShadow: "0 8px 24px rgba(250, 139, 2, 0.3)",
                          }
                        : {
                            background: "var(--tour-surface-muted)",
                            color: "var(--tour-caption)",
                            border: "1px solid var(--tour-divider)",
                            boxShadow: "none",
                          }
                    }>
                    {canBook && (
                      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                        <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover/book:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                      </div>
                    )}
                    <Icon
                      icon="heroicons:paper-airplane"
                      className={`size-5 transition-all duration-300 ${canBook ? "group-hover/book:-translate-y-0.5 group-hover/book:translate-x-0.5 group-hover/book:rotate-[-8deg]" : ""}`}
                    />
                    <span className="relative z-10 tracking-wide">
                      {t("landing.tourDetail.requestBooking")}
                    </span>
                  </Button>
                  {!canBook && !departureDate && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover/book:opacity-100 transition-opacity pointer-events-none"
                      style={{ background: "var(--tour-dark)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                      {t("landing.tourDetail.selectDateFirst")}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent"
                        style={{ borderTopColor: "var(--tour-dark)" }} />
                    </div>
                  )}
                </div>

                {/* No payment notice */}
                <p className="text-[10px] text-center leading-[0.9375rem]" style={{ color: "var(--tour-caption)" }}>
                  {t("landing.tourDetail.noPaymentNotice")}
                </p>
              </div>
            </div>

            {/* Need Help Card */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:shadow-[var(--shadow-warm-md)]"
              style={{
                boxShadow: "var(--shadow-warm-sm)",
                background: "var(--tour-surface)",
                border: "1px solid rgba(255,255,255,0.8)",
              }}>
              <div className="flex items-center gap-3">
                <div className="rounded-[14px] size-10 flex items-center justify-center shrink-0" style={{ background: "#fef3e4" }}>
                  <Icon
                    icon="heroicons:phone"
                    className="size-5 text-[#fa8b02]"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold" style={{ color: "var(--tour-heading)" }}>
                    {t("landing.tourDetail.needHelp")}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--tour-caption)" }}>
                    {t("landing.tourDetail.hereForYou")}
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
                  el.style.borderColor = "#fa8b02";
                  el.style.color = "#c9873a";
                  el.style.background = "#fef3e4";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "var(--tour-divider)";
                  el.style.color = "var(--tour-heading)";
                  el.style.background = "var(--tour-surface)";
                }}>
                {t("landing.tourDetail.contactUs")}
                <Icon
                  icon="heroicons:arrow-small-right"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Social Buttons ────────────────────────── */}
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
          style={{ background: "#fa8b02", boxShadow: "0 4px 16px rgba(250, 139, 2, 0.3)" }}>
          <Icon
            icon="heroicons:chat-bubble-oval-left"
            className="size-5 text-white"
          />
        </Button>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <LandingFooter />
    </div>
  );
}
