"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/format";
import { SearchTour } from "@/types/home";

interface TourCardProps {
  tour: SearchTour;
}

export const TourCard = ({ tour }: TourCardProps) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);

  // Guard: only show price row if basePrice > 0
  const hasPrice = (tour.basePrice ?? 0) > 0;

  // Guard: only show location row if truthy
  const hasLocation = Boolean(tour.location);

  return (
    <Link href={`/tours/${tour.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] border border-slate-100 transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Dark overlay on hover */}
          <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity duration-300" />

          {(imgError || !tour.thumbnail) ? (
            <div className="w-full h-full bg-linear-to-br from-[#05073c] to-[#1a1c5e] flex items-center justify-center">
              <Icon
                icon="heroicons-outline:calendar-days"
                className="w-10 h-10 text-white/40"
              />
            </div>
          ) : (
            <Image
              src={tour.thumbnail}
              alt={tour.tourName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          )}

          {/* Classification badge */}
          {tour.classificationName && (
            <div className="absolute top-3 left-3 z-20">
              <span className="badge-base bg-white/90 backdrop-blur-sm rounded-full text-sm px-3 py-1 text-slate-700 font-medium">
                {tour.classificationName}
              </span>
            </div>
          )}

          {/* Rating Badge */}
          {(tour.rating ?? 0) > 0 && (
            <div className="absolute top-3 right-3 z-20">
              <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-slate-700 rounded-full">
                <Icon
                  icon="heroicons-solid:star"
                  className="w-3.5 h-3.5 text-[#fa8b02]"
                />
                {tour.rating!.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Location */}
          {hasLocation && (
            <div className="flex items-center gap-1 text-sm text-slate-500 mb-1.5">
              <Icon icon="heroicons-outline:map-pin" className="w-4 h-4" />
              <span>{tour.location}</span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-[#1a1a2e] leading-tight mb-1.5 line-clamp-2 group-hover:text-[#fa8b02] transition-colors">
            {tour.tourName}
          </h3>

          {/* Short description */}
          {tour.shortDescription && (
            <p className="text-sm text-slate-500 line-clamp-1 mb-3">
              {tour.shortDescription}
            </p>
          )}

          {/* Meta row — duration + group size */}
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-500 mb-3">
            <div className="flex items-center gap-1.5">
              <Icon icon="heroicons-outline:clock" className="w-4 h-4 text-slate-400" />
              <span>
                {tour.durationDays} {t("tourInstance.days", "days")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon icon="heroicons-outline:user-group" className="w-4 h-4 text-slate-400" />
              <span className="line-clamp-1">
                {tour.durationDays > 3 ? "Small group" : "Group"}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 mb-3" />

          {/* Price + CTA row */}
          <div className="flex items-center justify-between gap-3">
            {hasPrice ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#1a1a2e]">
                  {formatCurrency(tour.basePrice!)}
                </span>
                <span className="text-sm text-slate-500">
                  {t("tourInstance.perPersonShort", "/person")}
                </span>
              </div>
            ) : (
              <div />
            )}
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-[#fa8b02] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e67a00] transition-colors"
            >
              {t("tourDiscovery.bookNow", "Book Now")}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};
