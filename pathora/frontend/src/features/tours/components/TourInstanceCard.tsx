"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/format";
import { NormalizedTourInstanceVm } from "@/types/tour";
import { getFallbackImage } from "@/utils/imageFallback";
import { motion } from "framer-motion";

interface TourInstanceCardProps {
  tour: NormalizedTourInstanceVm;
}

export const TourInstanceCard = ({ tour }: TourInstanceCardProps) => {
  const { t, i18n } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const locale =
    (i18n.resolvedLanguage || i18n.language || "en").toLowerCase() === "vi"
      ? "vi-VN"
      : "en-US";

  const imageSrc =
    imgError || !tour.thumbnail?.publicURL
      ? getFallbackImage(tour.tourId)
      : tour.thumbnail.publicURL;

  // Guard: only show location row if truthy
  const hasLocation = Boolean(tour.location);

  // Guard: only show classification badge if truthy
  const hasClassification = Boolean(tour.classificationName);

  // Guard: only show price if basePrice > 0
  const hasPrice = (tour.basePrice ?? 0) > 0;

  // Spots progress
  const maxParticipation = tour.maxParticipation ?? 0;
  const registeredParticipants = tour.registeredParticipants ?? 0;
  const spotsLeft = maxParticipation - registeredParticipants;
  const spotsProgress = maxParticipation > 0 ? (registeredParticipants / maxParticipation) * 100 : 0;

  const statusKey = tour.status?.trim().toLowerCase().replace(/[\s_]+/g, "");
  const statusLabel = statusKey
    ? t(`tourInstance.statusLabels.${statusKey}`, tour.status)
    : tour.status;

  // Format dates: "Jan 15 — Jan 16, 2026"
  const formatDateRange = () => {
    if (!tour.startDate || !tour.endDate) return null;
    const start = new Date(tour.startDate);
    const end = new Date(tour.endDate);
    const startStr = start.toLocaleDateString(locale, { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} — ${endStr}`;
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 0.995 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="group block bg-white/70 backdrop-blur-2xl border border-white/40 rounded-[2rem] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,1),0_10px_40px_-10px_rgba(0,0,0,0.08)] relative"
    >
      <Link href={`/tours/instances/${tour.id}`} className="flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-[2rem]">
        
        {/* Image Frame */}
        <div className="p-2.5 pb-0">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.5rem] bg-slate-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
            {/* Dark overlay on hover */}
            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-700" />
            <Image
              src={imageSrc}
              alt={tour.tourName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              onError={() => setImgError(true)}
            />

            {/* Status Badge — top-right corner */}
            {tour.status && (
              <div className="absolute top-3 right-3 z-20">
                <span className={`inline-block px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-full backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_8px_rgba(0,0,0,0.05)] border ${
                  statusKey === "confirmed" ? "bg-green-500/10 text-green-700 border-green-500/20" :
                  statusKey === "available" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" :
                  statusKey === "soldout" ? "bg-zinc-900/10 text-zinc-800 border-zinc-900/20" :
                  "bg-slate-100/50 text-slate-700 border-slate-200/50"
                }`}>
                  {statusLabel}
                </span>
              </div>
            )}
            
            {/* Classification Badge - Moved to image for unified layout */}
            {hasClassification && (
              <div className="absolute top-3 left-3 z-20">
                <span className="bg-white/90 backdrop-blur-md rounded-full text-[10px] uppercase tracking-widest px-3 py-1 text-slate-700 font-bold shadow-[0_2px_8px_rgb(0,0,0,0.1)] border border-slate-100 inline-block">
                  {tour.classificationName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info section */}
        <div className="flex flex-col flex-1 p-5 relative">
          {/* Subtle gradient behind text to make it blend well with the liquid glass container */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/40 pointer-events-none rounded-b-[2rem]" />
          
          <div className="relative z-10 flex flex-col flex-1">
            {/* Location */}
            {hasLocation && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mb-2 flex-shrink-0 uppercase tracking-widest">
                <Icon icon="heroicons-outline:map-pin" className="w-3.5 h-3.5" />
                <span className="line-clamp-1">{tour.location}</span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 leading-[1.2] mb-3 line-clamp-2 transition-colors duration-300">
              {tour.title || tour.tourName}
            </h3>

            {/* Date row */}
            {formatDateRange() && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 font-medium flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                  <Icon icon="heroicons-outline:calendar" className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="tracking-tight">{formatDateRange()}</span>
              </div>
            )}

            {/* Meta — duration + group */}
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 mb-5 flex-shrink-0">
              <div className="flex items-center gap-2 font-medium">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                  <Icon icon="heroicons-outline:clock" className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="tracking-tight">
                  {tour.durationDays} {t("tourInstance.days", "days")}
                </span>
              </div>
              <div className="flex items-center gap-2 font-medium overflow-hidden">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,1)] flex-shrink-0">
                  <Icon icon="heroicons-outline:user-group" className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="line-clamp-1 tracking-tight">
                  {tour.maxParticipation} {t("tourInstance.people", "people")}
                </span>
              </div>
            </div>

            {/* Spots available progress bar */}
            {maxParticipation > 0 && (
              <div className="mb-2 group/progress mt-auto flex-shrink-0">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                  <span>{spotsLeft} {t("tourInstance.spotsAvailable", "spots")}</span>
                  <span className="text-slate-900">{registeredParticipants}/{maxParticipation}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#fa8b02] via-[#ffaa40] to-[#fa8b02] bg-[length:200%_100%] rounded-full shadow-[0_0_8px_rgba(250,139,2,0.4)]"
                    style={{ width: `${Math.max(spotsProgress, 2)}%` }} // Ensure minimum sliver visible
                    animate={ spotsProgress > 0 ? { backgroundPosition: ["0% 0%", "200% 0%"] } : {} }
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Price + CTA — bottom aligned */}
          <div className="mt-5 pt-5 border-t border-slate-200/60 relative flex-shrink-0">
             <div className="absolute top-0 left-0 w-full h-[1px] bg-white/50" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-baseline gap-1.5 order-2 sm:order-1">
                {hasPrice ? (
                  <>
                    <span className="text-2xl font-black tracking-tighter text-slate-900">
                      {formatCurrency(tour.basePrice!)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      {t("tourInstance.perPersonShort", "/person")}
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-slate-400">N/A</span>
                )}
              </div>
              <button
                type="button"
                className="order-1 sm:order-2 w-full sm:w-auto relative overflow-hidden inline-flex items-center justify-center rounded-[1rem] bg-zinc-900 px-6 py-2.5 text-sm font-bold tracking-wide text-white transition-all hover:bg-zinc-800 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                 {/* Liquid glass inner reflection on button */}
                 <span className="absolute inset-0 rounded-[1rem] border border-white/20 pointer-events-none" />
                 <span className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[1rem]" />
                {t("tourDiscovery.reserveNow", "Reserve Now")}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
