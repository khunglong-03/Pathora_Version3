"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/format";
import { SearchTour } from "@/types/home";
import { getFallbackImage } from "@/utils/imageFallback";
import { motion } from "framer-motion";

interface TourCardProps {
  tour: SearchTour;
}

export const TourCard = ({ tour }: TourCardProps) => {
  const { t } = useTranslation("landing");
  const [imgError, setImgError] = useState(false);

  const hasPrice = (tour.basePrice ?? 0) > 0;
  const hasLocation = Boolean(tour.location);
  const imageSrc =
    imgError || !tour.thumbnail
      ? getFallbackImage(tour.id, "tour")
      : tour.thumbnail;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      // Double bezel premium card style from homepage
      className="group relative flex flex-col bg-white/70 backdrop-blur-xl border border-white/20 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <Link href={`/tours/${tour.id}`} className="flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-[2rem]">
        {/* Image Frame */}
        <div className="p-3 pb-0">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] bg-slate-100">
            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity duration-500" />
            <Image
              src={imageSrc}
              alt={tour.tourName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={() => setImgError(true)}
            />

            {/* Classification Badge */}
            {tour.classificationName && (
              <div className="absolute top-3 left-3 z-20">
                <span className="bg-white/90 backdrop-blur-md rounded-full text-xs px-3 py-1 text-landing-heading font-semibold shadow-sm">
                  {tour.classificationName}
                </span>
              </div>
            )}

            {/* Rating Badge */}
            {(tour.rating ?? 0) > 0 && (
              <div className="absolute top-3 right-3 z-20">
                <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-landing-heading rounded-full shadow-sm">
                  <Icon
                    icon="heroicons-solid:star"
                    className="w-3 h-3 text-[#fa8b02]"
                  />
                  {tour.rating!.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          {hasLocation && (
            <div className="flex items-center gap-1 text-xs text-landing-body font-medium mb-2 uppercase tracking-wider">
              <Icon icon="heroicons-outline:map-pin" className="w-3.5 h-3.5" />
              <span>{tour.location}</span>
            </div>
          )}

          <h3 className="text-xl font-bold text-landing-heading leading-tight mb-2 line-clamp-2 group-hover:text-[#fa8b02] transition-colors">
            {tour.tourName}
          </h3>

          {tour.shortDescription && (
            <p className="text-sm text-landing-body line-clamp-2 mb-4 leading-relaxed">
              {tour.shortDescription}
            </p>
          )}

          {/* Meta flex row at bottom */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-landing-body">
              <div className="flex items-center gap-1.5 font-medium">
                <Icon
                  icon="heroicons-outline:clock"
                  className="w-4 h-4 text-landing-heading"
                />
                <span>
                  {tour.durationDays} {tour.durationDays > 1 ? t("tourDiscovery.days", "Days") : t("tourDiscovery.day", "Day")}
                </span>
              </div>
            </div>

            {hasPrice && (
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-landing-body">From</span>
                <span className="text-lg font-bold text-landing-heading">
                  {formatCurrency(tour.basePrice!)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
