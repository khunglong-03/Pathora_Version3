"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PencilSimple, EyeIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence, type Variants, useMotionTemplate, useMotionValue } from "framer-motion";

import { Icon } from "@/components/ui";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { tourService } from "@/api/services/tourService";
import type { TourDto, ServiceDto } from "@/types/tour";
import { TourStatusMap } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { canTourOperatorEditTour } from "./editableTourStatus";

type DetailState = "loading" | "ready" | "error";

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  "1": { bg: "bg-emerald-50", text: "text-emerald-700", label: "Đã duyệt", dot: "bg-emerald-500" },
  "3": { bg: "bg-amber-50", text: "text-amber-700", label: "Chờ duyệt", dot: "bg-amber-500" },
  "4": { bg: "bg-rose-50", text: "text-rose-700", label: "Từ chối", dot: "bg-rose-500" },
};

const ACTIVITY_ICONS: Record<string, string> = {
  "0": "heroicons:eye",
  "1": "heroicons:cake",
  "2": "heroicons:shopping-bag",
  "3": "heroicons:sparkles",
  "4": "heroicons:ticket",
  "5": "heroicons:building-library",
  "6": "heroicons:musical-note",
  "7": "heroicons:truck",
  "8": "heroicons:home-modern",
  "9": "heroicons:clock",
  "99": "heroicons:ellipsis-horizontal-circle",
};

const TRANSPORT_ICONS: Record<string, string> = {
  "0": "heroicons:paper-airplane",
  "1": "mdi:train",
  "2": "mdi:bus",
  "3": "mdi:car",
  "4": "mdi:taxi",
  "5": "mdi:sail-boat",
  "6": "mdi:ferry",
  "7": "mdi:motorbike",
  "8": "mdi:bicycle",
  "9": "mdi:walk",
  "99": "heroicons:truck",
};

const PRICING_TYPE_OPTIONS: Record<string, string> = {
  "0": "Per Person",
  "1": "Per Room",
  "2": "Per Group",
  "3": "Per Ride",
  "4": "Fixed Price",
};

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemFadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: springTransition }
};

// Perpetual Micro-Interactions
const PulsingDot = memo(({ colorClass }: { colorClass: string }) => (
  <motion.div
    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    className={`w-2 h-2 rounded-full ${colorClass}`}
  />
));
PulsingDot.displayName = "PulsingDot";

const HoverIlluminationCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      variants={itemFadeIn}
      onMouseMove={onMouseMove}
      className={`group relative bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(16, 185, 129, 0.03),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </motion.div>
  );
};

export function TourOperatorTourDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const tourId = params?.id as string;

  const [tour, setTour] = useState<TourDto | null>(null);
  const [dataState, setDataState] = useState<DetailState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTour = useCallback(async () => {
    if (!tourId) return;
    try {
      setDataState("loading");
      setErrorMessage(null);
      const result = await tourService.getTourDetail(tourId);
      if (result) {
        setTour(result);
        setDataState("ready");
      } else {
        setTour(null);
        setDataState("error");
        setErrorMessage("Tour not found");
      }
    } catch (error: unknown) {
      setDataState("error");
      setErrorMessage(handleApiError(error).message);
    }
  }, [tourId]);

  useEffect(() => {
    void fetchTour();
  }, [fetchTour]);

  if (dataState === "loading") {
    return (
      <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 min-h-[100dvh] bg-[#f9fafb]">
        <SkeletonTable rows={3} columns={3} />
      </div>
    );
  }

  if (dataState === "error" || !tour) {
    return (
      <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 min-h-[100dvh] bg-[#f9fafb]">
        <div className="p-10 bg-white border border-rose-200 rounded-[2.5rem] text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <p className="text-rose-700 font-medium mb-6 text-lg">
            {errorMessage ?? t("tourOperator.messages.errorLoading", "Failed to load tour")}
          </p>
          <button
            onClick={() => void fetchTour()}
            className="px-8 py-4 text-sm font-black uppercase tracking-widest text-rose-700 border-2 border-rose-200 rounded-2xl hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-95"
          >
            {t("tourOperator.actions.retry", "Retry")}
          </button>
        </div>
      </div>
    );
  }

  const statusKey = String(tour.status ?? "");
  const badge = STATUS_BADGE[statusKey] ?? { bg: "bg-slate-50", text: "text-slate-700", label: statusKey, dot: "bg-slate-400" };
  const canEdit = canTourOperatorEditTour(statusKey);
  const hasIncludedServices = (tour.services && tour.services.length > 0) || (tour.includedServices && tour.includedServices.length > 0);

  return (
    <div className="max-w-[1400px] w-full mx-auto p-4 md:p-8 lg:p-12 bg-[#f9fafb] min-h-[100dvh] font-sans">
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-12">
        
        {/* Premium Header - Asymmetric Split */}
        <motion.div variants={itemFadeIn} className="flex flex-col xl:flex-row justify-between items-start gap-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 text-[13px] font-bold text-slate-400 mb-8 uppercase tracking-widest">
              <Link href="/tour-operator/tours" className="hover:text-slate-900 transition-colors">
                {t("tourOperator.breadcrumb.myTours", "My Tours")}
              </Link>
              <Icon icon="heroicons:chevron-right" className="size-4" />
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                <Icon icon="heroicons:finger-print" className="size-4" />
                {tour.tourCode}
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-8">
              {tour.tourName}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-[65ch] font-medium">
              {tour.shortDescription}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mt-10">
              <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest border border-slate-200/60 ${badge.bg} ${badge.text} shadow-sm`}>
                <PulsingDot colorClass={badge.dot} />
                {TourStatusMap[Number(tour.status)] ?? badge.label}
              </div>
              <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm text-[13px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                <Icon icon="heroicons:globe-americas" className="size-4 text-slate-400" />
                {tour.tourScope === 1 ? "Domestic" : "International"}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/tour-operator/tours"
              className="px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 hover:shadow-md transition-all duration-300 active:scale-95"
            >
              {t("common.back", "Back")}
            </Link>
            {canEdit && (
              <Link
                href={`/tour-operator/tours/${tourId}/edit`}
                className="group relative flex items-center gap-3 px-8 py-4 text-sm font-black uppercase tracking-widest text-white bg-slate-900 rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all duration-300 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <PencilSimple size={18} weight="bold" />
                {t("tourOperator.actions.edit", "Edit")}
              </Link>
            )}
          </div>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Main Info Area (Left) */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Overview Card */}
            <HoverIlluminationCard className="p-8 md:p-12">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-10 flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-700 border border-slate-100">
                  <Icon icon="heroicons:information-circle" className="size-6" />
                </div>
                {t("tourOperator.tourDetail", "Tour Details")}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Tour Code</span>
                  <span className="font-mono text-lg font-black text-slate-900">{tour.tourCode}</span>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Scope</span>
                  <span className="text-lg font-black text-slate-900">
                    {tour.tourScope === 1 ? "Domestic" : "International"}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Segment</span>
                  <span className="text-lg font-black text-slate-900">
                    {tour.customerSegment === 2 ? "Group" : "Individual"}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Created</span>
                  <span className="font-mono text-lg font-black text-slate-900">
                    {tour.createdOnUtc ? new Date(tour.createdOnUtc).toLocaleDateString("vi-VN") : "-"}
                  </span>
                </div>
              </div>

              {tour.longDescription && (
                <div className="pt-10 border-t border-slate-100">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">Description</span>
                  <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap max-w-[75ch] font-medium">{tour.longDescription}</p>
                </div>
              )}
            </HoverIlluminationCard>

            {/* Packages */}
            {tour.classifications && tour.classifications.length > 0 && (
              <motion.div variants={itemFadeIn} className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100/50 shadow-sm">
                    <Icon icon="heroicons:map" className="size-6" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {t("tourOperator.packages", "Tour Packages")}
                  </h2>
                </div>
                
                <div className="space-y-8">
                  {tour.classifications.map((cls, idx) => (
                    <HoverIlluminationCard key={idx} className="p-8 md:p-12">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                        <div className="max-w-2xl">
                          <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{cls.name}</h3>
                          {cls.description && (
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">{cls.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-start md:items-end shrink-0 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Base Price</span>
                          <span className="font-mono text-4xl font-black text-emerald-600 tracking-tight">
                            {cls.price?.toLocaleString("vi-VN") ?? "-"} <span className="text-xl text-emerald-500 font-bold">VND</span>
                          </span>
                        </div>
                      </div>
                      
                      {cls.durationDays && (
                        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[13px] font-black uppercase tracking-widest text-slate-700 mb-12">
                          <Icon icon="heroicons:calendar" className="size-5 text-slate-400" />
                          {cls.durationDays} {t("tourOperator.durationDays", "day(s)")}
                        </div>
                      )}

                      {/* Insurances (Fixed Bug) */}
                      {cls.insurances && cls.insurances.length > 0 && (
                        <div className="mb-12">
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 pl-2">
                            {t("tourOperator.insurances", "Insurances")}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {cls.insurances.map(ins => (
                              <div key={ins.id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors group/ins">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                  <span className="font-bold text-slate-900 text-lg leading-tight">{ins.insuranceName}</span>
                                  <span className="text-emerald-600 font-mono font-black text-sm bg-emerald-50 px-3 py-1 rounded-xl shrink-0">
                                    {ins.coverageFee.toLocaleString("vi-VN")} VND
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mb-5">{ins.coverageDescription}</p>
                                <div className="flex items-center gap-3 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                                  <span className="flex items-center gap-1.5"><Icon icon="heroicons:shield-check" className="size-4" />{ins.insuranceProvider}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <span className="text-emerald-700">Cover: {ins.coverageAmount.toLocaleString("vi-VN")}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cls.plans && cls.plans.length > 0 && (
                        <div className="space-y-6">
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 pl-2">
                            {t("tourOperator.itinerary", "Itinerary")}
                          </h4>
                          <div className="space-y-4">
                            {cls.plans.map((day) => (
                              <DayPlanAccordion key={day.id} day={day} t={t} />
                            ))}
                          </div>
                        </div>
                      )}
                    </HoverIlluminationCard>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Contextual & Assets (Right) */}
          <div className="xl:col-span-4 space-y-8">
            
            {/* Thumbnail */}
            <motion.div variants={itemFadeIn} className="bg-white rounded-[2.5rem] border border-slate-200/50 p-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
              {tour.thumbnail?.publicURL ? (
                 <motion.div whileHover={{ scale: 1.02 }} transition={springTransition} className="w-full aspect-square xl:aspect-[4/5] rounded-[2rem] overflow-hidden">
                   <img
                      src={tour.thumbnail.publicURL}
                      alt={tour.tourName}
                      className="w-full h-full object-cover"
                    />
                 </motion.div>
              ) : (
                 <div className="w-full aspect-square xl:aspect-[4/5] bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-center">
                    <Icon icon="heroicons:photo" className="size-12 text-slate-300" />
                 </div>
              )}
              <div className="mt-4 px-4 pb-2 text-center">
                 <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Primary Thumbnail</span>
              </div>
            </motion.div>

            {/* Included Services (Fixed Bug) */}
            {hasIncludedServices && (
              <HoverIlluminationCard className="p-8">
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100/50">
                    <Icon icon="heroicons:wrench-screwdriver" className="size-6" />
                  </div>
                  {t("tourOperator.services", "Included Services")}
                </h3>
                <div className="space-y-4">
                  {/* Detailed services mapping */}
                  {tour.services?.map((svc: ServiceDto, idx: number) => (
                    <motion.div 
                      key={svc.id ?? `svc-${idx}`}
                      whileHover={{ scale: 0.98, x: 4 }}
                      transition={springTransition}
                      className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 relative group overflow-hidden"
                    >
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <h4 className="font-bold text-slate-900 text-lg leading-tight">{svc.serviceName}</h4>
                        {svc.price != null && (
                          <span className="font-mono text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl shrink-0 border border-emerald-100/50">
                            {svc.price.toLocaleString("vi-VN")} <span className="text-[11px]">VND</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 mt-4 text-[13px] font-medium text-slate-500">
                         {svc.pricingType && (
                           <div className="flex items-center gap-3">
                              <Icon icon="heroicons:tag" className="size-4 text-slate-400" />
                              <span>{PRICING_TYPE_OPTIONS[svc.pricingType] || svc.pricingType}</span>
                           </div>
                         )}
                         {svc.email && (
                           <div className="flex items-center gap-3">
                              <Icon icon="heroicons:envelope" className="size-4 text-slate-400" />
                              <span className="truncate">{svc.email}</span>
                           </div>
                         )}
                         {svc.contactNumber && (
                           <div className="flex items-center gap-3">
                              <Icon icon="heroicons:phone" className="size-4 text-slate-400" />
                              <span>{svc.contactNumber}</span>
                           </div>
                         )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Simple includedServices array mapping if present */}
                  {tour.includedServices?.map((svcName: string, idx: number) => (
                    <div key={`included-${idx}`} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="p-1.5 bg-emerald-100/50 rounded-full text-emerald-600">
                        <Icon icon="heroicons:check" className="size-4" />
                      </div>
                      <span className="font-bold text-slate-800">{svcName}</span>
                    </div>
                  ))}
                </div>
              </HoverIlluminationCard>
            )}

            {/* Quick Info */}
            <HoverIlluminationCard className="p-8">
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-700 border border-slate-100">
                  <Icon icon="heroicons:sparkles" className="size-6" />
                </div>
                {t("tourOperator.quickInfo", "Metadata")}
              </h3>
              <div className="space-y-6 text-sm">
                <div className="flex justify-between items-center py-4 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Status</span>
                  <span className={`font-black uppercase tracking-widest text-[11px] px-3 py-1.5 rounded-xl border border-slate-200/50 ${badge.bg} ${badge.text}`}>
                    {TourStatusMap[Number(tour.status)] ?? badge.label}
                  </span>
                </div>
                {tour.translations?.en && (
                  <div className="flex flex-col gap-3 py-4 border-b border-slate-100">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">English Name</span>
                    <span className="font-bold text-slate-900 text-base">
                      {tour.translations.en.tourName ?? "-"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-4">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Visa Required</span>
                  <span className="font-bold text-slate-900 text-base">{tour.isVisa ? "Yes" : "No"}</span>
                </div>
              </div>
            </HoverIlluminationCard>

            {/* Images Gallery */}
            {tour.images && tour.images.length > 0 && (
              <HoverIlluminationCard className="p-8">
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-700 border border-slate-100">
                    <Icon icon="heroicons:photo" className="size-6" />
                  </div>
                  {t("tourOperator.images", "Gallery")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {tour.images.map((img, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ scale: 1.05 }}
                      transition={springTransition}
                      className="aspect-square rounded-[1.5rem] overflow-hidden bg-slate-50 border border-slate-100 relative group cursor-pointer"
                    >
                      {img.publicURL ? (
                        <img
                          src={img.publicURL}
                          alt={`Tour image ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <EyeIcon size={24} weight="bold" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </HoverIlluminationCard>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DayPlanAccordion({ day, t }: { day: any; t: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sortedActivities = day.activities ? [...day.activities].sort((a: any, b: any) => a.order - b.order) : [];

  return (
    <motion.div 
      layout
      className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 group"
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-6 px-8 py-6 text-left bg-white hover:bg-slate-50 transition-colors duration-200 focus:outline-none"
      >
        <motion.div 
          layout
          className="w-14 h-14 rounded-2xl bg-slate-50 shadow-sm text-slate-900 flex items-center justify-center font-mono text-xl font-black shrink-0 border border-slate-200/60 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300"
        >
          {day.dayNumber}
        </motion.div>
        <div className="flex-1 min-w-0">
          <motion.h5 layout className="text-lg font-black text-slate-900 truncate tracking-tight">
            {t("tourOperator.day", "Day")} {day.dayNumber}: {day.title}
          </motion.h5>
          {day.description && (
            <motion.p layout className="text-sm text-slate-500 font-medium truncate mt-2">{day.description}</motion.p>
          )}
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <AnimatePresence>
            {!isExpanded && sortedActivities.length > 0 && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="font-mono text-[11px] font-black uppercase tracking-widest text-slate-400 bg-white border border-slate-200/50 px-4 py-2 rounded-xl shadow-sm"
              >
                {sortedActivities.length} {t("tourOperator.activities", "ACTs")}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.div 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={springTransition}
            className="p-3 rounded-full bg-slate-50 border border-slate-200/50 text-slate-400 shadow-sm group-hover:bg-white group-hover:text-slate-900 transition-colors"
          >
            <Icon icon="heroicons:chevron-down" className="size-5" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springTransition}
            className="overflow-hidden"
          >
            <div className="px-8 pb-8 pt-2 bg-white">
              {sortedActivities.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-100 ml-2 mt-4">
                  {sortedActivities.map((act: any, actIdx: number) => (
                    <motion.div 
                      key={act.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springTransition, delay: actIdx * 0.05 }}
                      className="relative flex gap-8 text-sm group/act"
                    >
                      {/* Timeline Node */}
                      <div className="w-10 flex flex-col items-center shrink-0 py-2">
                        <div className="w-4 h-4 rounded-full bg-slate-900 ring-4 ring-white z-10 transition-transform duration-300 group-hover/act:scale-125" />
                      </div>
                      
                      {/* Activity Content */}
                      <div className="flex-1 bg-slate-50 rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-300 hover:-translate-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                          <p className="font-black text-slate-900 text-lg leading-tight tracking-tight">{act.title}</p>
                          {(act.startTime || act.endTime) && (
                            <span className="shrink-0 inline-flex items-center gap-2 text-[11px] font-black uppercase text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm">
                              <Icon icon="heroicons:clock" className="size-4 text-slate-400" />
                              <span className="font-mono">
                                {act.startTime || "--:--"} {act.endTime ? `- ${act.endTime}` : ""}
                              </span>
                            </span>
                          )}
                        </div>
                        
                        {/* Meta Tags */}
                        <div className="flex flex-wrap gap-3 mt-6">
                          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm">
                            <Icon icon={ACTIVITY_ICONS[String(act.activityType)] || ACTIVITY_ICONS["99"]} className="size-4 text-slate-900" />
                            Activity
                          </span>
                          
                          {(act.activityType === "7" || act.activityType === "Transportation") && act.transportationName ? (
                            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200/50 shadow-sm">
                              <Icon icon={TRANSPORT_ICONS[String(act.transportationType)] || TRANSPORT_ICONS["99"]} className="size-4 text-emerald-600" />
                              {act.transportationName}
                            </span>
                          ) : null}
                          
                          {(act.activityType === "8" || act.activityType === "Accommodation") && (act.accommodation?.accommodationName || act.locationName) ? (
                            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200/50 shadow-sm">
                              <Icon icon="heroicons:building-office-2" className="size-4 text-indigo-600" />
                              {act.accommodation?.accommodationName || act.locationName}
                            </span>
                          ) : null}
                        </div>

                        {act.description && (
                          <p className="text-[15px] text-slate-500 font-medium mt-6 leading-relaxed">{act.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 mt-4">
                  <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6 border border-slate-100">
                    <Icon icon="heroicons:inbox" className="size-8 text-slate-300" />
                  </div>
                  <p className="text-base font-bold text-slate-400">{t("tourOperator.noActivities", "No activities scheduled for this day.")}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


