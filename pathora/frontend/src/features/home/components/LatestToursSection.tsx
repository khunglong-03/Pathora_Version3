"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Button } from "@/components/ui";
import { SectionContainer } from "@/features/shared/components/shared";
import { useTranslation } from "react-i18next";
import { homeService } from "@/api/services/homeService";
import { LatestTour } from "@/types/home";

const TOUR_IMAGE_FALLBACK = "/explore-bg.png";

const FALLBACK_TOURS = [
  {
    image: TOUR_IMAGE_FALLBACK,
    title: "Discover the Hidden Gems of Vietnam",
    createdAt: "2024-01-15",
  },
  {
    image: TOUR_IMAGE_FALLBACK,
    title: "Adventure in the Mountains",
    createdAt: "2024-01-10",
  },
  {
    image: TOUR_IMAGE_FALLBACK,
    title: "Beach Paradise Escapes",
    createdAt: "2024-01-08",
  },
  {
    image: TOUR_IMAGE_FALLBACK,
    title: "Cultural Heritage Tour",
    createdAt: "2024-01-05",
  },
  {
    image: TOUR_IMAGE_FALLBACK,
    title: "Wildlife Safari Experience",
    createdAt: "2024-01-01",
  },
];

const TourThumbnail = ({ src, alt }: { src: string; alt: string }) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = !src || failedSrc === src ? TOUR_IMAGE_FALLBACK : src;

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill
      sizes="(max-width: 768px) 60px, 100px"
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => setFailedSrc(src)}
    />
  );
};

export const LatestToursSection = () => {
  const { t, i18n } = useTranslation();
  const [tours, setTours] = useState<FallbackTour[]>([]);
  const [loading, setLoading] = useState(true);
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || "en")
    .toLowerCase()
    .split("-")[0];

  interface FallbackTour {
    image: string;
    title: string;
    createdAt: string;
  }

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const data = await homeService.getLatestTours(6);
        if (data && data.length > 0) {
          const mapped = data.map((tour: LatestTour) => ({
            image: tour.thumbnail || FALLBACK_TOURS[0].image,
            title: tour.tourName,
            createdAt: tour.createdAt,
          }));
          setTours(mapped);
        } else {
          setTours(FALLBACK_TOURS);
        }
      } catch {
        setTours(FALLBACK_TOURS);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [activeLanguage]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(activeLanguage === "vi" ? "vi-VN" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <SectionContainer>
        <section className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 suppressHydrationWarning className="min-h-10 md:min-h-12 text-2xl md:text-[30px] font-bold text-landing-heading">
              {t("landing.latestTours.title")}
            </h2>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 overflow-x-auto pb-2">
            {[...Array(5)].map((_, idx) => (
              <div
                key={idx}
                className="flex flex-row md:flex-col items-center gap-3 md:gap-3 shrink-0 w-full md:w-auto">
                <div className="w-15 h-15 md:w-25 md:h-25 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-6 w-32 bg-gray-200 rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      <section className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 suppressHydrationWarning className="min-h-10 md:min-h-12 text-2xl md:text-[30px] font-bold text-landing-heading">
            {t("landing.latestTours.title")}
          </h2>
          <Button
            link="/tours"
            text={t("landing.latestTours.seeAll")}
            icon="heroicons-outline:chevron-right"
            iconPosition="right"
            iconClass="text-[14px]"
            className="w-24 justify-center text-landing-heading text-sm hover:text-landing-accent transition-colors bg-transparent"
            suppressHydrationWarning
          />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 overflow-x-auto pb-2">
          {tours.slice(0, 6).map((tour, idx) => (
            <Link
              key={idx}
              href="/tours"
              className="flex flex-row md:flex-col items-center gap-3 md:gap-3 shrink-0 group w-full md:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent rounded-lg">
              <div className="relative shrink-0">
                <div className="relative w-15 h-15 md:w-25 md:h-25 rounded-full overflow-hidden shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 ease-out">
                  <TourThumbnail src={tour.image} alt={tour.title} />
                </div>
              </div>
              <div className="text-left md:text-center max-w-full md:max-w-32.5 flex-1">
                <p className="h-4 md:h-5 overflow-hidden text-[#eb662b] text-[10px] md:text-sm font-normal">
                  {formatDate(tour.createdAt)}
                </p>
                <p className="h-8 md:h-10 overflow-hidden text-landing-heading text-xs md:text-sm font-medium leading-snug mt-0.5">
                  {tour.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SectionContainer>
  );
};
