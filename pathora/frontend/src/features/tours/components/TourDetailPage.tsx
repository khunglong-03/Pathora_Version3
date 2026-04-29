"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";

import { tourService } from "@/api/services/tourService";
import { normalizeLanguageForApi } from "@/api/languageHeader";
import { formatCurrency } from "@/utils/format";
import { calculateTourEstimate } from "@/utils/pricingUtils";
import {
  ImageLightbox,
  GuestRow,
  ItineraryDayCard,
  ReviewsSection,
  ScheduledDeparturesSection,
} from "@/features/shared/components";
import { TourDto, InsuranceTypeMap } from "@/types/tour";

/* ── Motion & Style Constants ── */
const SPRING_TRANSITION = { type: "spring", stiffness: 100, damping: 20 } as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: SPRING_TRANSITION },
};

function addCalendarDays(isoDate: string, daysToAdd: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

/* ── Sub-components ── */
function InfoPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 flex items-start gap-4 transition-all duration-300 hover:bg-slate-100/80 hover:scale-[1.02] cursor-default">
      <div className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl size-12 flex items-center justify-center shrink-0 border border-slate-100">
        <Icon icon={icon} className="size-5 text-slate-700" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</span>
        <span className="text-sm font-bold tracking-tight text-slate-900 leading-tight">{value}</span>
      </div>
    </div>
  );
}

function TourDetailSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] p-6 flex items-center justify-center">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-4"
      >
        <div className="size-12 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
        <span className="text-sm font-medium text-slate-500 tracking-tight">Loading tour details...</span>
      </motion.div>
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
    normalizeLanguageForApi(i18n.resolvedLanguage || i18n.language)
  );

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

  /* ── API State ── */
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

  /* ── UI State ── */
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary">("overview");
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [departureDate, setDepartureDate] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [privateModalOpen, setPrivateModalOpen] = useState(false);
  const [privateSubmitting, setPrivateSubmitting] = useState(false);
  const [privateCustomerName, setPrivateCustomerName] = useState("");
  const [privateCustomerPhone, setPrivateCustomerPhone] = useState("");
  const [privateCustomerEmail, setPrivateCustomerEmail] = useState("");
  const [privateMaxPax, setPrivateMaxPax] = useState(2);

  const openPrivateModal = useCallback(() => {
    const total = adults + children + infants;
    setPrivateMaxPax(Math.max(1, total));
    setPrivateModalOpen(true);
  }, [adults, children, infants]);

  const submitPrivateRequest = async () => {
    if (!tourId || !selectedClassification?.id || !departureDate) {
      return;
    }
    if (!privateCustomerName.trim()) {
      toast.error(t("landing.tourDetail.privateCustom.nameRequired"));
      return;
    }
    if (!privateCustomerPhone.trim()) {
      toast.error(t("landing.tourDetail.privateCustom.phoneRequired"));
      return;
    }
    setPrivateSubmitting(true);
    try {
      const totalPax = adults + children + infants;
      const endDateStr = addCalendarDays(
        departureDate,
        Math.max(0, (selectedClassification.durationDays ?? 1) - 1),
      );
      const startIso = new Date(`${departureDate}T12:00:00`).toISOString();
      const endIso = new Date(`${endDateStr}T12:00:00`).toISOString();
      const price = await tourService.requestPrivateTour(tourId, {
        classificationId: String(selectedClassification.id),
        startDate: startIso,
        endDate: endIso,
        maxParticipation: Math.max(privateMaxPax, totalPax),
        customerName: privateCustomerName.trim(),
        customerPhone: privateCustomerPhone.trim(),
        customerEmail: privateCustomerEmail.trim() || undefined,
        numberAdult: adults,
        numberChild: children,
        numberInfant: infants,
        paymentMethod: 2,
        isFullPay: true,
      });
      if (price?.bookingId) {
        setPrivateModalOpen(false);
        router.push(
          `/checkout?bookingId=${encodeURIComponent(price.bookingId)}&flow=private-custom`,
        );
        return;
      }
      toast.error(t("landing.tourDetail.privateCustom.error"));
    } catch {
      toast.error(t("landing.tourDetail.privateCustom.error"));
    } finally {
      setPrivateSubmitting(false);
    }
  };

  /* ── Derived values ── */
  const classifications = tour?.classifications ?? [];
  const selectedClassification = classifications[selectedPackage] ?? null;

  const pricePerPerson = selectedClassification?.salePrice ?? selectedClassification?.price ?? 0;
  const originalPrice = selectedClassification?.price ?? 0;

  const estimateBreakdown = useMemo(() => {
    return calculateTourEstimate(
      pricePerPerson,
      adults,
      children,
      infants,
      null // We don't have the PricingPolicy object directly in TourDetailPage, so it falls back to defaults.
    );
  }, [pricePerPerson, adults, children, infants]);

  const serviceFee = 0;
  const estimatedTotal = estimateBreakdown.totalPrice + serviceFee;
  const canBook = adults > 0 && departureDate !== "";
  const canRequestPrivate =
    Boolean(tourId && selectedClassification && departureDate && adults > 0);

  const heroImage = tour?.thumbnail?.publicURL ?? "";
  const galleryImages = useMemo(
    () => (tour?.images?.map((img) => img.publicURL).filter(Boolean) as string[]) ?? [],
    [tour?.images]
  );

  const duration = selectedClassification
    ? `${selectedClassification.durationDays} ${t("landing.tourDetail.days", "days")}`
    : "";

  const aboutParagraphs = useMemo(
    () => tour?.longDescription?.split("\n").filter(Boolean) ?? [],
    [tour?.longDescription]
  );

  const insurances = selectedClassification?.insurances ?? [];
  const itineraryDays = selectedClassification?.plans ?? [];

  /* ── Conditional Render: Loading ── */
  if (loading) return <TourDetailSkeleton />;

  /* ── Conditional Render: Error / Not Found ── */
  if (error === "not_found" || !tour) {
    return (
      <div className="min-h-[100dvh] bg-[#f9fafb] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] text-center max-w-md w-full">
          <Icon icon="ph:question" className="size-16 text-slate-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Tour not found</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            The tour you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-medium hover:bg-slate-800 transition-colors"
          >
            <Icon icon="heroicons-outline:arrow-left" className="size-4" />
            Back to tours
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#f9fafb] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] text-center max-w-md w-full">
          <Icon icon="heroicons-outline:exclamation-triangle" className="size-16 text-rose-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Failed to load tour details. Please try again.
          </p>
          <Button
            onClick={() => { setLoading(true); setError(null); setRefetchTrigger((k) => k + 1); }}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-medium hover:bg-slate-800 transition-colors"
          >
            <Icon icon="heroicons-outline:arrow-path" className="size-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] text-slate-900 font-sans pb-24 selection:bg-slate-900 selection:text-white">
      {/* ── Breadcrumbs Navbar (Floating) ── */}
      <div className="fixed top-6 left-6 z-40 hidden md:block">
        <Link
          href="/tours"
          className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-full px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-[0_8px_16px_-8px_rgba(0,0,0,0.05)]"
        >
          <Icon icon="heroicons-outline:arrow-left" className="size-4" />
          All Tours
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 pt-6 md:pt-12 flex flex-col gap-6 md:gap-8">
        
        {/* ── ROW 1: Hero Split Bento ── */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[60vh]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left: Hero Content */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-5 bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

            <div className="relative z-10 flex flex-col items-start gap-6">
              {/* Top Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                  <Icon icon="heroicons:tag" className="size-3" />
                  {tour.tourCode}
                </span>
                {tour.classifications?.[0] && (
                  <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider border border-slate-200">
                    {tour.classifications[0].name}
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tighter text-slate-900 leading-[1.05]" style={{ textWrap: "balance" }}>
                  {tour.tourName}
                </h1>
                <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-xl" style={{ textWrap: "pretty" }}>
                  {tour.shortDescription}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-12 flex flex-col gap-6">
               <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 flex items-center justify-between">
                 <div className="flex flex-col gap-1">
                   <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Starting From</span>
                   <div className="flex items-end gap-2">
                     <span className="text-3xl font-bold tracking-tighter text-slate-900 tabular-nums leading-none">
                       {formatCurrency(pricePerPerson)}
                     </span>
                     <span className="text-sm font-medium text-slate-500 mb-1">/ person</span>
                   </div>
                 </div>
                 <div className="size-12 rounded-full bg-[#fa8b02]/10 flex items-center justify-center">
                    <Icon icon="heroicons-outline:fire" className="size-6 text-[#fa8b02]" />
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Right: Hero Image */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-7 rounded-[2.5rem] bg-slate-200 border border-slate-200/50 overflow-hidden relative shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] group"
          >
            {heroImage ? (
              <Image
                src={heroImage}
                alt={tour.tourName}
                fill
                priority
                className="object-cover transition-transform duration-1000 group-hover:scale-105 ease-out"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                <Icon icon="heroicons-outline:photo" className="size-12 text-slate-300" />
              </div>
            )}
            <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] border border-white/10 pointer-events-none rounded-[2.5rem]" />
          </motion.div>
        </motion.div>

        {/* ── ROW 2: The Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Content Column (8 cols) */}
          <motion.div 
            className="lg:col-span-8 flex flex-col gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Gallery Bento */}
            {galleryImages.length > 0 && (
              <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Gallery</h2>
                  {galleryImages.length > 4 && (
                    <button 
                      onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                      className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      View all {galleryImages.length}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {galleryImages.slice(0, 4).map((img, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer group ${i === 0 ? "col-span-2 row-span-2 aspect-[4/3] md:aspect-square" : "aspect-square"}`}
                    >
                      <Image 
                        src={img} 
                        alt={`Gallery image ${i}`} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 bg-white/90 backdrop-blur-md rounded-full size-10 flex items-center justify-center shadow-lg">
                          <Icon icon="heroicons-outline:magnifying-glass" className="size-5 text-slate-900" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Info Cards Grid Bento */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {duration && <InfoPill icon="heroicons-outline:clock" label="Duration" value={duration} />}
              <InfoPill icon="heroicons-outline:tag" label="Package" value={selectedClassification?.name ?? "—"} />
              <InfoPill icon="heroicons-outline:document-text" label="Day Plans" value={`${itineraryDays.length} days`} />
              <InfoPill icon="heroicons-outline:shield-check" label="Insurance" value={insurances.length > 0 ? `${insurances.length} included` : "None"} />
              {tour.isVisa && <InfoPill icon="heroicons-outline:identification" label="Visa" value="Required" />}
            </motion.div>

            {/* Content Tabs (Overview/Itinerary) inside Bento */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-[1.25rem] w-full md:w-fit">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold transition-all rounded-xl duration-300 ${
                      activeTab === "overview"
                        ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-slate-900"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Icon icon="heroicons-outline:information-circle" className="size-4" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("itinerary")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold transition-all rounded-xl duration-300 ${
                      activeTab === "itinerary"
                        ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-slate-900"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Icon icon="heroicons-outline:map" className="size-4" />
                    Itinerary
                  </button>
                </div>
              </div>

              <div className="p-8 md:p-10">
                <AnimatePresence mode="wait">
                  {activeTab === "overview" && (
                    <motion.div 
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={SPRING_TRANSITION}
                      className="flex flex-col gap-10"
                    >
                      <div>
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">About This Tour</h3>
                        <div className="flex flex-col gap-4">
                          {aboutParagraphs.length > 0 ? (
                            aboutParagraphs.map((p, i) => (
                              <p key={i} className="text-base leading-[1.8] text-slate-600 max-w-[70ch]">
                                {p}
                              </p>
                            ))
                          ) : (
                            <p className="text-base leading-[1.8] text-slate-600 max-w-[70ch]">
                              {tour.shortDescription}
                            </p>
                          )}
                        </div>
                      </div>

                      {insurances.length > 0 && (
                        <div>
                          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">Insurance Coverage</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {insurances.map((ins) => (
                              <div key={ins.id} className="bg-emerald-50 border border-emerald-100 rounded-[1.5rem] p-6 flex flex-col gap-4 relative overflow-hidden group hover:shadow-[0_8px_20px_-8px_rgba(16,185,129,0.3)] transition-shadow">
                                <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                                  <Icon icon="heroicons-outline:shield-check" className="size-24 text-emerald-600" />
                                </div>
                                <div className="relative z-10 flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <Icon icon="heroicons:shield-check" className="size-5 text-emerald-600" />
                                    <span className="text-sm font-bold text-slate-900">{ins.insuranceName}</span>
                                  </div>
                                  <span className="text-xs font-medium text-emerald-800">{ins.insuranceProvider} • {InsuranceTypeMap[ins.insuranceType] ?? "Insurance"}</span>
                                </div>
                                <p className="relative z-10 text-xs leading-relaxed text-slate-600 max-w-[90%]">
                                  {ins.coverageDescription}
                                </p>
                                <div className="relative z-10 flex items-center gap-4 mt-auto pt-2 border-t border-emerald-200/50 flex-wrap">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Coverage</span>
                                    <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(ins.coverageAmount)}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Fee</span>
                                    <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(ins.coverageFee)}</span>
                                  </div>
                                  {ins.isOptional && (
                                    <span className="ml-auto bg-white/60 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                                      Optional
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "itinerary" && (
                    <motion.div 
                      key="itinerary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={SPRING_TRANSITION}
                      className="flex flex-col gap-4"
                    >
                      {itineraryDays.length > 0 ? (
                        <div className="flex flex-col gap-4">
                          {[...itineraryDays]
                            .sort((a, b) => a.dayNumber - b.dayNumber)
                            .map((day) => (
                              <ItineraryDayCard key={day.id} day={day} />
                            ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-100 border-dashed rounded-[2rem] p-12 text-center">
                          <Icon icon="heroicons-outline:map" className="size-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500 font-medium">No itinerary available for this package yet.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Additional Sections */}
            <motion.div variants={itemVariants}>
              <ReviewsSection />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <ScheduledDeparturesSection tourId={tourId} apiLanguage={apiLanguage} />
            </motion.div>

          </motion.div>

          {/* ── Sticky Booking Column (Right, 4 cols) ── */}
          <motion.div 
            className="lg:col-span-4 sticky top-6 flex flex-col gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Booking Bento */}
            <motion.div variants={itemVariants} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col gap-6">
              
              {classifications.length > 0 && (
                <div className="flex flex-col gap-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Select Package</span>
                  <div className="flex flex-col gap-3">
                    {classifications.map((cls, i) => {
                      const isActive = selectedPackage === i;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelectedPackage(i)}
                          className="relative flex items-center justify-between p-5 rounded-[1.5rem] text-left transition-colors border group"
                          style={{
                            borderColor: isActive ? "transparent" : "var(--color-slate-100)",
                            background: isActive ? "transparent" : "#f8fafc"
                          }}
                        >
                          {isActive && (
                            <motion.div 
                              layoutId="active-package" 
                              className="absolute inset-0 bg-slate-900 rounded-[1.5rem]" 
                              transition={SPRING_TRANSITION} 
                            />
                          )}
                          <div className="relative z-10 flex items-center gap-4">
                            <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${isActive ? "border-emerald-400 bg-emerald-500" : "border-slate-300 bg-white group-hover:border-slate-400"}`}>
                              {isActive && <Icon icon="heroicons:check" className="size-3 text-white stroke-[3]" />}
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold tracking-tight ${isActive ? "text-white" : "text-slate-900"}`}>{cls.name}</span>
                              <span className={`text-[11px] font-medium flex items-center gap-1 ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                                <Icon icon="heroicons-outline:clock" className="size-3" />
                                {cls.durationDays} {t("landing.tourDetail.days", "days")}
                              </span>
                            </div>
                          </div>
                          <div className="relative z-10 flex flex-col items-end">
                            <span className={`text-[15px] font-bold tabular-nums tracking-tight ${isActive ? "text-white" : "text-slate-900"}`}>
                              {formatCurrency(cls.salePrice)}
                            </span>
                            {cls.price !== cls.salePrice && (
                              <span className={`text-[11px] line-through font-semibold tabular-nums ${isActive ? "text-slate-400" : "text-slate-400"}`}>
                                {formatCurrency(cls.price)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preferences Container */}
              <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">Departure Date</label>
                  <div className="relative">
                    <Icon icon="heroicons-outline:calendar" className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                    <TextInput
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-200/60 mx-2" />

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">Guests</label>
                  <div className="flex flex-col">
                    <GuestRow label="Adults" value={adults} onDecrement={() => setAdults(Math.max(1, adults - 1))} onIncrement={() => setAdults(adults + 1)} />
                    <GuestRow label="Children" subtitle="< 12 years" value={children} onDecrement={() => setChildren(Math.max(0, children - 1))} onIncrement={() => setChildren(children + 1)} />
                    <GuestRow label="Infants" subtitle="< 2 years" value={infants} onDecrement={() => setInfants(Math.max(0, infants - 1))} onIncrement={() => setInfants(infants + 1)} showBorder={false} />
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Adults × {adults}</span>
                    <span className="font-mono">{formatCurrency(estimateBreakdown.adultPrice * adults)}</span>
                  </div>
                  {children > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Children × {children}</span>
                      <span className="font-mono">{formatCurrency(estimateBreakdown.childPrice * children)}</span>
                    </div>
                  )}
                  {infants > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Infants × {infants}</span>
                      <span className="font-mono">{formatCurrency(estimateBreakdown.infantPrice * infants)}</span>
                    </div>
                  )}
                  {serviceFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Service Fee</span>
                      <span className="font-mono">{formatCurrency(serviceFee)}</span>
                    </div>
                  )}
                  <div className="h-px bg-slate-700 w-full" />
                  <div className="flex items-end justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Estimated Total</span>
                    <span className="text-3xl font-bold tracking-tighter tabular-nums text-emerald-400">
                      {formatCurrency(estimatedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="relative group/book">
                <motion.button
                  type="button"
                  disabled={!canBook}
                  whileHover={canBook ? { scale: 0.98 } : {}}
                  whileTap={canBook ? { scale: 0.95 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => {
                    if (tourId && canBook) {
                      router.push(`/tours/instances/${tourId}`);
                    }
                  }}
                  className={`w-full py-4 rounded-full font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 ${
                    canBook 
                      ? "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)]" 
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Icon icon="heroicons-outline:paper-airplane" className={`size-4 ${canBook ? "group-hover/book:-translate-y-0.5 group-hover/book:translate-x-0.5 group-hover/book:rotate-[-8deg] transition-all duration-300" : ""}`} />
                  Request Booking
                </motion.button>
                {!canBook && !departureDate && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover/book:opacity-100 transition-opacity pointer-events-none bg-slate-800 shadow-xl">
                    Please select a departure date first
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>
                )}
              </div>

              <motion.button
                type="button"
                disabled={!canRequestPrivate}
                whileHover={canRequestPrivate ? { scale: 0.99 } : {}}
                whileTap={canRequestPrivate ? { scale: 0.97 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={openPrivateModal}
                className={`mt-3 w-full py-3.5 rounded-full font-semibold text-sm tracking-wide border-2 transition-colors flex items-center justify-center gap-2 ${
                  canRequestPrivate
                    ? "border-slate-900 text-slate-900 bg-white hover:bg-slate-50"
                    : "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                }`}
              >
                <Icon icon="heroicons-outline:user-group" className="size-4" />
                {t("landing.tourDetail.privateCustom.cta")}
              </motion.button>

              <p className="text-[10px] text-center leading-[0.9375rem] text-slate-400 mt-2">
                No payment required now. You&apos;ll be redirected to complete your booking details.
              </p>
            </motion.div>

          </motion.div>

        </div>
      </div>

      <AnimatePresence>
        {privateModalOpen && (
          <motion.div
            key="private-custom-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label={t("landing.tourDetail.privateCustom.cancel")}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
              disabled={privateSubmitting}
              onClick={() => setPrivateModalOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="private-custom-modal-title"
              className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={SPRING_TRANSITION}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="private-custom-modal-title"
                className="text-lg font-bold tracking-tight text-slate-900"
              >
                {t("landing.tourDetail.privateCustom.modalTitle")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t("landing.tourDetail.privateCustom.modalIntro")}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t("landing.tourDetail.privateCustom.customerName")}
                  </label>
                  <TextInput
                    type="text"
                    value={privateCustomerName}
                    onChange={(e) => setPrivateCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    autoComplete="name"
                    disabled={privateSubmitting}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t("landing.tourDetail.privateCustom.customerPhone")}
                  </label>
                  <TextInput
                    type="tel"
                    value={privateCustomerPhone}
                    onChange={(e) => setPrivateCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    autoComplete="tel"
                    disabled={privateSubmitting}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t("landing.tourDetail.privateCustom.customerEmail")}
                  </label>
                  <TextInput
                    type="email"
                    value={privateCustomerEmail}
                    onChange={(e) => setPrivateCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    autoComplete="email"
                    disabled={privateSubmitting}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t("landing.tourDetail.privateCustom.maxParticipants")}
                  </label>
                  <TextInput
                    type="number"
                    min={Math.max(1, adults + children + infants)}
                    value={String(privateMaxPax)}
                    onChange={(e) => {
                      const v = Number.parseInt(e.target.value, 10);
                      const floor = Math.max(1, adults + children + infants);
                      setPrivateMaxPax(Number.isFinite(v) ? Math.max(floor, v) : floor);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    disabled={privateSubmitting}
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full rounded-full sm:w-auto"
                  disabled={privateSubmitting}
                  onClick={() => void submitPrivateRequest()}
                >
                  {privateSubmitting
                    ? t("landing.tourDetail.privateCustom.submitting")
                    : t("landing.tourDetail.privateCustom.submit")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full sm:w-auto"
                  disabled={privateSubmitting}
                  onClick={() => setPrivateModalOpen(false)}
                >
                  {t("landing.tourDetail.privateCustom.cancel")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {lightboxOpen && (
        <ImageLightbox
          images={galleryImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
