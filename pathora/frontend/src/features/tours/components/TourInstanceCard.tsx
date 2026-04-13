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
      ? getFallbackImage(tour.tourId, "tour")
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
      whileHover={{ y: -4, scale: 0.99 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group block bg-white/70 backdrop-blur-xl border border-white/20 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <Link href={`/tours/instances/${tour.id}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-[2rem]">
        {/* Horizontal layout: 60/40 grid (desktop), stacked (mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-[3fr_2fr] h-full p-2 gap-2">
          {/* Image section */}
          <div className="relative aspect-video sm:aspect-auto sm:h-full overflow-hidden rounded-[1.5rem] bg-slate-100">
            {/* Dark overlay on hover */}
            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity duration-500" />
            <Image
              src={imageSrc}
              alt={tour.tourName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={() => setImgError(true)}
            />

            {/* Status Badge — top-right corner */}
            {tour.status && (
              <div className="absolute top-3 right-3 z-20">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                  statusKey === "confirmed" ? "bg-green-100/90 text-green-700" :
                  statusKey === "available" ? "bg-amber-100/90 text-amber-700" :
                  statusKey === "soldout" ? "bg-red-100/90 text-red-700" :
                  "bg-slate-100/90 text-slate-600"
                }`}>
                  {statusLabel}
                </span>
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="p-5 flex flex-col justify-between h-full bg-white/40 rounded-[1.5rem]">
            <div>
              {/* Classification badge */}
              {hasClassification && (
                <div className="mb-2">
                  <span className="bg-white/90 backdrop-blur-md rounded-full text-xs px-3 py-1 text-landing-heading font-semibold shadow-sm inline-block">
                    {tour.classificationName}
                  </span>
                </div>
              )}

              {/* Location */}
              {hasLocation && (
                <div className="flex items-center gap-1 text-xs text-landing-body font-medium mb-2 uppercase tracking-wider">
                  <Icon icon="heroicons-outline:map-pin" className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{tour.location}</span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-xl font-bold text-landing-heading leading-tight mb-2 line-clamp-2 group-hover:text-[#fa8b02] transition-colors">
                {tour.title || tour.tourName}
              </h3>

              {/* Date row */}
              {formatDateRange() && (
                <div className="flex items-center gap-1.5 text-sm text-landing-body mb-4 font-medium">
                  <Icon icon="heroicons-outline:calendar" className="w-4 h-4 text-landing-heading" />
                  <span>{formatDateRange()}</span>
                </div>
              )}

              {/* Meta — duration + group */}
              <div className="grid grid-cols-2 gap-2 text-sm text-landing-body mb-4">
                <div className="flex items-center gap-1.5 font-medium">
                  <Icon icon="heroicons-outline:clock" className="w-4 h-4 text-landing-heading" />
                  <span>
                    {tour.durationDays} {t("tourInstance.days", "days")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Icon icon="heroicons-outline:user-group" className="w-4 h-4 text-landing-heading" />
                  <span className="line-clamp-1">
                    {tour.maxParticipation} {t("tourInstance.people", "people")}
                  </span>
                </div>
              </div>

              {/* Spots available progress bar */}
              {maxParticipation > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-landing-body mb-2 font-medium">
                    <span>{spotsLeft} {t("tourInstance.spotsAvailable", "spots available")}</span>
                    <span>{registeredParticipants}/{maxParticipation}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#fa8b02] rounded-full transition-all duration-300"
                      style={{ width: `${spotsProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Price + CTA — bottom aligned */}
            <div className="mt-4 pt-4 border-t border-slate-100/50">
              <div className="flex flex-col gap-3">
                {hasPrice && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-landing-heading">
                      {formatCurrency(tour.basePrice!)}
                    </span>
                    <span className="text-sm text-landing-body">
                      {t("tourInstance.perPersonShort", "/person")}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center rounded-[1rem] bg-[#fa8b02] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e67a00] transition-colors"
                >
                  {t("tourDiscovery.reserveNow", "Reserve Now")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
