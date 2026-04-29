"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon, TourStatusBadge } from "@/components/ui";
import Image from "@/features/shared/components/LandingImage";
import { motion, AnimatePresence } from "framer-motion";

import {
  ImageLightbox,
  GuestRow,
} from "@/features/shared/components";
import { TourPoliciesCard } from "./TourPoliciesCard";
import { calculateTourEstimate } from "@/utils/pricingUtils";
import { homeService } from "@/api/services/homeService";
import { handleApiError } from "@/utils/apiResponse";
import { useAuth } from "@/contexts/AuthContext";
import { NormalizedTourInstanceDto, DynamicPricingDto, ActivityTypeMap } from "@/types/tour";

/* ── Formatter Helpers ── */
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

const SPRING_TRANSITION = { type: "spring", stiffness: 100, damping: 20 } as const;

/* ── Motion Variants ── */
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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: SPRING_TRANSITION },
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

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NormalizedTourInstanceDto | null>(null);
  const [apiLanguage, setApiLanguage] = useState(() => resolveApiLanguage());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Guest selection
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

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
    () => (data?.images?.map((img) => img.publicURL).filter(Boolean) as string[]) ?? [],
    [data?.images],
  );

  const spotsLeft = useMemo(() => {
    if (!data) return 0;
    return Math.max(0, data.maxParticipation - data.currentParticipation);
  }, [data]);

  const totalGuests = adults + children + infants;
  const isPublicInstance =
    (data?.instanceType || "").toLowerCase() === "public" || data?.instanceType === "Public";

  const estimateBreakdown = useMemo(() => {
    if (!data) return null;
    return calculateTourEstimate(
      data.basePrice,
      adults,
      children,
      infants,
      data.pricingPolicy
    );
  }, [data, adults, children, infants]);

  const estimate = estimateBreakdown?.totalPrice ?? 0;

  /* ── Loading State ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#f9fafb] p-6 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="size-12 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
          <span className="text-sm font-medium text-slate-500 tracking-tight">Loading experience...</span>
        </motion.div>
      </div>
    );
  }

  /* ── Not Found ───────────────────────────────────────────── */
  if (!data) {
    return (
      <div className="min-h-[100dvh] bg-[#f9fafb] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] text-center max-w-md w-full">
          <Icon icon="ph:question" className="size-16 text-slate-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Tour not found</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            The tour instance you&apos;re looking for doesn&apos;t exist or has been removed.
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

  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] text-slate-900 font-sans pb-24 selection:bg-slate-900 selection:text-white">
      {/* ── Breadcrumbs Navbar (Floating) ── */}
      <div className="fixed top-[110px] left-6 z-40 hidden xl:block">
        <Link
          href={`/tours/${data.tourId}`}
          className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-full px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-[0_8px_16px_-8px_rgba(0,0,0,0.05)]"
        >
          <Icon icon="heroicons-outline:arrow-left" className="size-4" />
          {t("tourInstance.backToTour", "Back to tour")}
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
            {/* Background noise/grain for texture */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

            <div className="relative z-10 flex flex-col items-start gap-6">
              {/* Top Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  <Icon icon="heroicons:tag" className="size-3" />
                  {data.tourInstanceCode}
                </span>
                <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider border border-slate-200">
                  {data.classificationName}
                </span>
              </div>

              {/* Title & Location */}
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tighter text-slate-900 leading-[1.05]" style={{ textWrap: "balance" }}>
                  {data.title}
                </h1>
                
                {data.location && (
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Icon icon="heroicons-outline:map-pin" className="size-5 text-slate-400" />
                    <span>{data.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-6 mt-12">
              {/* Quick Stats Bento-mini */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Duration</span>
                  <span className="text-lg font-bold text-slate-900 tracking-tight">{data.durationDays} Days</span>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50 flex flex-col gap-1 relative overflow-hidden">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600/70">Availability</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-emerald-900 tracking-tight">{spotsLeft} Spots</span>
                    {spotsLeft > 0 && (
                      <motion.div 
                        animate={{ opacity: [1, 0.4, 1], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Price Callout */}
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold tracking-tighter text-slate-900 tabular-nums leading-none">
                  {formatCurrency(data.basePrice, formatterLocale)}
                </span>
                <span className="text-sm font-medium text-slate-500 mb-1">/ person</span>
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
                alt={data.title}
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
            {/* Liquid Glass Refraction */}
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
                        alt="Gallery image" 
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

            {/* Overview Bento */}
            <motion.div variants={itemVariants} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-8">Overview</h2>
              
              <div className="flex flex-col gap-8">
                {/* Guides */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Your Guides</h3>
                  {data.managers && data.managers.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {data.managers.map((mgr) => (
                        <div key={mgr.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 pr-5">
                          {mgr.userAvatar ? (
                            <Image src={mgr.userAvatar} alt={mgr.userName} width={40} height={40} className="rounded-full object-cover size-10" />
                          ) : (
                            <div className="size-10 rounded-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center">
                              {mgr.userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{mgr.userName}</span>
                            <span className="text-xs font-medium text-slate-500">{mgr.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No guides assigned yet.</p>
                  )}
                </div>

                {/* Included Services */}
                {data.includedServices.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">What&apos;s Included</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.includedServices.map((service, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="size-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <Icon icon="heroicons-outline:check" className="size-3.5" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Itinerary Bento */}
            <motion.div variants={itemVariants} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Itinerary</h2>
                <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                  {data.days?.length || 0} Days
                </div>
              </div>

              <div className="flex flex-col gap-6 relative">
                {/* Vertical connecting line */}
                <div className="absolute left-6 top-6 bottom-6 w-px bg-slate-100 z-0 hidden md:block" />

                {data.days && data.days.length > 0 ? (
                  data.days.map((day) => {
                    const activities = day.activities ?? [];
                    const sortedActivities = [...activities].sort((a, b) => a.order - b.order);

                    return (
                      <div key={day.id} className="relative z-10 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 md:p-8 hover:border-slate-200 transition-colors">
                        {/* Day Header */}
                        <div className="flex items-start gap-4 mb-6">
                          <div className="size-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold tracking-tight shrink-0 shadow-md">
                            D{day.instanceDayNumber}
                          </div>
                          <div className="flex flex-col pt-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                                {toDateText(day.actualDate, formatterLocale)}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                              {day.title || `Day ${day.instanceDayNumber}`}
                            </h3>
                            {day.description && (
                              <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-[65ch]">
                                {day.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Activities */}
                        {sortedActivities.length > 0 && (
                          <div className="flex flex-col gap-3 md:pl-16">
                            {sortedActivities.map((activity) => {
                              const activityTypeLabel = activity.activityType != null
                                ? ActivityTypeMap[activity.activityType] ?? "Activity"
                                : "Activity";

                              return (
                                <div key={activity.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.05)] transition-shadow">
                                  <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wider">
                                        {activityTypeLabel}
                                      </span>
                                      {activity.startTime && (
                                        <span className="text-xs font-medium text-slate-400 font-mono">
                                          {activity.startTime}{activity.endTime ? ` - ${activity.endTime}` : ""}
                                        </span>
                                      )}
                                    </div>
                                    {activity.isOptional && (
                                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-md uppercase">
                                        Optional
                                      </span>
                                    )}
                                  </div>
                                  
                                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">{activity.title}</h4>
                                  
                                  {activity.description && (
                                    <p className="text-xs text-slate-500 leading-relaxed">{activity.description}</p>
                                  )}

                                  {/* Specialized Info Blocks */}
                                  {activity.activityType?.toLowerCase() === "transportation" && (
                                    <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-600 flex items-center gap-2">
                                      <Icon icon="heroicons-outline:truck" className="size-4 text-slate-400" />
                                      {activity.vehicleType ? `${activity.vehicleType} ${activity.seatCapacity ? `(${activity.seatCapacity} seats)` : ""}` : "Transport"}
                                      {activity.pickupLocation && ` • ${activity.pickupLocation} → ${activity.dropoffLocation}`}
                                    </div>
                                  )}
                                  {activity.accommodation && (
                                    <div className="mt-2 bg-blue-50/50 border border-blue-100/50 rounded-xl px-3 py-2 text-xs text-blue-800 flex items-center gap-2">
                                      <Icon icon="heroicons-outline:building-office" className="size-4 text-blue-400" />
                                      {activity.accommodation.roomType ?? "Standard Room"} {activity.accommodation.quantity > 1 && `× ${activity.accommodation.quantity}`}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-slate-50 border border-slate-100 border-dashed rounded-[2rem] p-10 text-center">
                    <p className="text-slate-500 font-medium">Itinerary details are being finalized.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tour Policies */}
            {data && (data.pricingPolicy || data.cancellationPolicy || data.depositPolicy) && (
              <motion.div variants={itemVariants} className="mt-8">
                <TourPoliciesCard
                  pricingPolicy={data.pricingPolicy}
                  cancellationPolicy={data.cancellationPolicy}
                  depositPolicy={data.depositPolicy}
                  className="rounded-[2.5rem] border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
                />
              </motion.div>
            )}

          </motion.div>

          {/* Sticky Booking Column (Right, 4 cols) */}
          <motion.div 
            className="lg:col-span-4 sticky top-6 flex flex-col gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Booking Bento */}
            <motion.div variants={itemVariants} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col gap-6">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Checkout</span>
                <TourStatusBadge status={data.status} />
              </div>

              {/* Guest Selector */}
              <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-2 flex flex-col">
                <GuestRow
                  label="Adults"
                  value={adults}
                  onDecrement={() => setAdults(Math.max(1, adults - 1))}
                  onIncrement={() => setAdults(Math.min(20, adults + 1))}
                />
                <GuestRow
                  label="Children"
                  subtitle="< 12 years"
                  value={children}
                  onDecrement={() => setChildren(Math.max(0, children - 1))}
                  onIncrement={() => setChildren(Math.min(20, children + 1))}
                />
                <GuestRow
                  label="Infants"
                  subtitle="< 2 years"
                  value={infants}
                  onDecrement={() => setInfants(Math.max(0, infants - 1))}
                  onIncrement={() => setInfants(Math.min(20, infants + 1))}
                  showBorder={false}
                />
              </div>

              {/* Total Price */}
              <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 z-10">Total Estimate</span>
                <span className="text-3xl font-bold tracking-tighter tabular-nums z-10">
                  {formatCurrency(estimate, formatterLocale)}
                </span>
                <span className="text-[10px] text-slate-500 mt-2 z-10">* Price may vary at final confirmation</span>
              </div>

              {/* Action Button */}
              <motion.button
                type="button"
                disabled={spotsLeft === 0}
                whileHover={spotsLeft > 0 ? { scale: 0.98 } : {}}
                whileTap={spotsLeft > 0 ? { scale: 0.95 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push(`/?login=true&returnUrl=/tours/instances/${id}`);
                    return;
                  }
                  let depositPct = 0.3;
                  if (data.depositPolicy?.depositValue) {
                    const typeStr = String(data.depositPolicy.depositType).toLowerCase();
                    const isPercentage = typeStr === "percentage" || typeStr === "2";
                    depositPct = isPercentage 
                      ? data.depositPolicy.depositValue / 100 
                      : data.depositPolicy.depositValue;
                    // If depositPct is somehow > 1 but we know it's a percentage (e.g. 30 meaning 30%)
                    if (isPercentage && depositPct > 1) {
                      depositPct = depositPct / 100;
                    }
                  }

                  const params = new URLSearchParams({
                    tourInstanceId: id,
                    tourName: data.tourName,
                    thumbnailUrl: data.thumbnail?.publicURL || "",
                    startDate: data.startDate || "",
                    endDate: data.endDate || "",
                    location: data.location || "",
                    basePrice: String(data.basePrice),
                    adultPrice: String(estimateBreakdown?.adultPrice ?? data.basePrice),
                    childPrice: String(estimateBreakdown?.childPrice ?? data.basePrice),
                    infantPrice: String(estimateBreakdown?.infantPrice ?? 0),
                    adults: String(adults),
                    children: String(children),
                    infants: String(infants),
                    depositPercentage: String(depositPct),
                    bookingType: "InstanceJoin",
                    instanceType: isPublicInstance ? "public" : "private",
                  });
                  router.push(`/checkout?${params.toString()}`);
                }}
                className={`w-full py-4 rounded-full font-bold text-sm tracking-wide transition-colors ${
                  spotsLeft > 0 
                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)]" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {spotsLeft === 0 ? "Sold Out" : "Book Now"}
              </motion.button>

            </motion.div>

            {/* Help Bento */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-200/50 flex items-center gap-4 group cursor-pointer hover:border-slate-300 transition-colors shadow-[0_10px_20px_-10px_rgba(0,0,0,0.02)]">
              <div className="size-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                <Icon icon="heroicons-outline:chat-bubble-oval-left" className="size-5 text-slate-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 tracking-tight">Need Help?</span>
                <span className="text-xs text-slate-500">Contact our travel experts</span>
              </div>
            </motion.div>

          </motion.div>

        </div>
      </div>

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
