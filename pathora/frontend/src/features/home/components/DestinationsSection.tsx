"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Badge, Icon } from "@/components/ui";
import { SectionContainer } from "@/features/shared/components/shared";
import { useTranslation } from "react-i18next";
import { homeService } from "@/api/services/homeService";
import { TrendingDestination, TopAttraction } from "@/types/home";

const FALLBACK_DESTINATIONS = [
  {
    image: null,
    city: "Paris",
    country: "France",
    toursCount: 12,
  },
  {
    image: null,
    city: "Singapore",
    country: "Singapore",
    toursCount: 8,
  },
  {
    image: null,
    city: "Rome",
    country: "Italy",
    toursCount: 15,
  },
  {
    image: null,
    city: "Bangkok",
    country: "Thailand",
    toursCount: 10,
  },
  {
    image: null,
    city: "Bali",
    country: "Indonesia",
    toursCount: 9,
  },
  {
    image: null,
    city: "Phuket",
    country: "Thailand",
    toursCount: 7,
  },
];

const FALLBACK_ATTRACTIONS = [
  {
    image: null,
    name: "Colosseum",
    location: "Italy",
  },
  {
    image: null,
    name: "Statue of Liberty",
    location: "New York",
  },
  {
    image: null,
    name: "Tower of London",
    location: "London",
  },
  {
    image: null,
    name: "Vatican Museums",
    location: "Vatican City",
  },
];

const DESTINATION_PLACEHOLDER_GRADIENTS = [
  "from-sky-600 via-cyan-500 to-emerald-400",
  "from-fuchsia-600 via-violet-500 to-indigo-500",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-teal-600 via-emerald-500 to-lime-500",
  "from-blue-700 via-indigo-600 to-violet-600",
  "from-rose-600 via-pink-500 to-orange-500",
];

const ATTRACTION_PLACEHOLDER_GRADIENTS = [
  "from-blue-600 to-indigo-600",
  "from-cyan-600 to-teal-600",
  "from-violet-600 to-purple-600",
  "from-amber-500 to-orange-500",
];

interface DestinationData {
  image: string | null;
  city: string;
  country: string;
  toursCount: number;
}

interface AttractionData {
  image: string | null;
  name: string;
  location: string;
}

const TrendingDestinationCard = ({
  destination,
  index,
  toursLabel,
}: {
  destination: DestinationData;
  index: number;
  toursLabel: string;
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const hasImage = Boolean(destination.image) && !hasImageError;
  const gradient = DESTINATION_PLACEHOLDER_GRADIENTS[index % DESTINATION_PLACEHOLDER_GRADIENTS.length];

  return (
    <Link
      href="/tours"
      className="group relative block w-full rounded-2xl overflow-hidden aspect-[4/5] border border-white/30 bg-slate-900/5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent">
      {hasImage ? (
        <Image
          src={destination.image!}
          alt={destination.city}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className={`absolute inset-0 bg-linear-to-br ${gradient}`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute right-3 top-3 w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon icon="heroicons:map-pin" className="size-5 text-white" />
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-4 left-3 right-3 text-white">
        <p className="font-bold text-base leading-tight truncate">{destination.city}</p>
        <p className="text-xs text-white/85 truncate">{destination.country}</p>
        <Badge
          label={toursLabel}
          className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5 mt-1 inline-block"
        />
      </div>
    </Link>
  );
};

const TopAttractionCard = ({
  attraction,
  index,
}: {
  attraction: AttractionData;
  index: number;
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const hasImage = Boolean(attraction.image) && !hasImageError;
  const gradient = ATTRACTION_PLACEHOLDER_GRADIENTS[index % ATTRACTION_PLACEHOLDER_GRADIENTS.length];

  return (
    <Link
      href="/tours"
      className="group flex items-center gap-4 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-landing-accent/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent">
      <div className="relative w-[4.5rem] h-[4.5rem] rounded-xl overflow-hidden shrink-0 border border-slate-200">
        {hasImage ? (
          <Image
            src={attraction.image!}
            alt={attraction.name}
            fill
            sizes="72px"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className={`absolute inset-0 bg-linear-to-br ${gradient} flex items-center justify-center`}>
            <Icon icon="heroicons:photo" className="size-7 text-white/90" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
          {attraction.name}
        </p>
        <p className="text-slate-500 text-xs mt-1 line-clamp-1">{attraction.location}</p>
      </div>
    </Link>
  );
};

export const TrendingDestinationsSection = () => {
  const { t, i18n } = useTranslation();
  const languageKey = i18n.resolvedLanguage || i18n.language;
  const [destinations, setDestinations] = useState<DestinationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDestinations = async () => {
      setLoading(true);
      try {
        const data = await homeService.getTrendingDestinations(6);
        if (data && data.length > 0) {
          const mapped = data.map((dest: TrendingDestination) => ({
            image: dest.imageUrl ?? null,
            city: dest.city,
            country: dest.country,
            toursCount: dest.toursCount,
          }));
          setDestinations(mapped);
        } else {
          setDestinations(FALLBACK_DESTINATIONS);
        }
      } catch {
        setDestinations(FALLBACK_DESTINATIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, [languageKey]);

  if (loading) {
    return (
      <SectionContainer>
        <section className="w-full">
          <div className="mb-8">
            <div className="h-10 w-64 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl overflow-hidden aspect-[3/4] bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        </section>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      <section className="w-full">
        <div className="mb-8">
          <h2 suppressHydrationWarning className="text-2xl md:text-[30px] font-bold text-landing-heading">
            {t("landing.destinations.trendingTitle")}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {destinations.map((destination, index) => (
            <TrendingDestinationCard
              key={`${destination.city}-${destination.country}`}
              destination={destination}
              index={index}
              toursLabel={t("landing.destinations.tours", {
                count: destination.toursCount,
              })}
            />
          ))}
        </div>
      </section>
    </SectionContainer>
  );
};

export const TopAttractionsSection = () => {
  const { t, i18n } = useTranslation();
  const languageKey = i18n.resolvedLanguage || i18n.language;
  const [attractions, setAttractions] = useState<AttractionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttractions = async () => {
      setLoading(true);
      try {
        const data = await homeService.getTopAttractions(8);
        if (data && data.length > 0) {
          const mapped = data.map((attr: TopAttraction) => ({
            image: attr.imageUrl ?? null,
            name: attr.name,
            location:
              attr.city && attr.country
                ? `${attr.city}, ${attr.country}`
                : attr.location || t("common.noData", "No data"),
          }));
          setAttractions(mapped);
        } else {
          setAttractions(FALLBACK_ATTRACTIONS);
        }
      } catch {
        setAttractions(FALLBACK_ATTRACTIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchAttractions();
  }, [languageKey, t]);

  if (loading) {
    return (
      <SectionContainer>
        <section className="w-full">
          <div className="mb-8">
            <div className="h-10 w-64 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-landing-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-2" />
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
        <div className="mb-8">
          <h2 suppressHydrationWarning className="text-2xl md:text-[30px] font-bold text-landing-heading">
            {t("landing.destinations.topAttractionsTitle")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {attractions.slice(0, 8).map((attraction, index) => (
            <TopAttractionCard
              key={`${attraction.name}-${attraction.location}`}
              attraction={attraction}
              index={index}
            />
          ))}
        </div>
      </section>
    </SectionContainer>
  );
};
