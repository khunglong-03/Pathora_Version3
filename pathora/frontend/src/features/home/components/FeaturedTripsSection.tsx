"use client";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { SectionContainer, StarRating } from "@/features/shared/components/shared";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { homeService } from "@/api/services/homeService";
import { FeaturedTour, SearchTour } from "@/types/home";

const TOUR_IMAGE_FALLBACK = "/stats-bg.png";

const FALLBACK_TRIPS = [
  {
    image: TOUR_IMAGE_FALLBACK,
    location: "Paris, France",
    title: "Centipede Tour - Guided Arizona Desert Tour by ATV",
    rating: 5,
    days: 4,
    price: "$189.25",
  },
  {
    image: TOUR_IMAGE_FALLBACK,
    location: "New York, USA",
    title: "Molokini and Turtle Town Snorkeling Adventure Aboard",
    rating: 5,
    days: 4,
    price: "$225",
  },
  {
    image: TOUR_IMAGE_FALLBACK,
    location: "London, UK",
    title: "Westminster Walking Tour & Westminster Abbey Entry",
    rating: 5,
    days: 4,
    price: "$943",
  },
  {
    image: TOUR_IMAGE_FALLBACK,
    location: "Sydney, Australia",
    title: "Australian Wilderness Explorer Full Day Safari",
    rating: 5,
    days: 3,
    price: "$320",
  },
];

interface TripCardProps {
  image: string;
  location: string;
  title: string;
  rating: number;
  days: number;
  price: string;
}

interface FallbackTrip {
  image: string;
  location: string;
  title: string;
  rating: number;
  days: number;
  price: string;
}

const normalizePositiveNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const normalizeNonNegativeNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
};

const resolveTripPrice = (salePrice: unknown, basePrice: unknown): string => {
  const normalizedSalePrice = normalizeNonNegativeNumber(salePrice);
  const normalizedBasePrice = normalizeNonNegativeNumber(basePrice);
  const amount = normalizedSalePrice > 0 ? normalizedSalePrice : normalizedBasePrice;

  return `$${amount.toLocaleString()}`;
};

const mapFeaturedTourToTrip = (tour: FeaturedTour): FallbackTrip => ({
  image: tour.thumbnail || TOUR_IMAGE_FALLBACK,
  location: tour.location || "Unknown",
  title: tour.tourName || "Tour",
  rating: Math.round(normalizePositiveNumber(tour.rating, 5)),
  days: Math.round(normalizePositiveNumber(tour.durationDays, 1)),
  price: resolveTripPrice(0, tour.basePrice),
});

const mapSearchTourToTrip = (tour: SearchTour): FallbackTrip => ({
  image: tour.thumbnail || TOUR_IMAGE_FALLBACK,
  location: tour.location || "Unknown",
  title: tour.tourName || "Tour",
  rating: Math.round(normalizePositiveNumber(tour.rating, 5)),
  days: Math.round(normalizePositiveNumber(tour.durationDays, 1)),
  price: resolveTripPrice(0, tour.basePrice),
});

const TripCard = ({
  image,
  location,
  title,
  rating,
  days,
  price,
}: TripCardProps) => {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const resolvedImage = !image || failedImage === image ? TOUR_IMAGE_FALLBACK : image;

  return (
    <Link
      href="/tours"
      className="group bg-white border border-landing-border rounded-xl overflow-hidden w-full flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out">
      <div className="relative h-53.75 overflow-hidden">
        <Image
          src={resolvedImage}
          alt={title}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setFailedImage(image)}
        />
      </div>

      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1 text-landing-body text-base">
          <Icon icon="heroicons-solid:map-pin" className="w-4 h-4 shrink-0" />
          <span className="text-sm truncate">{location}</span>
        </div>
        <h3 className="h-11 overflow-hidden text-landing-heading font-medium text-[15px] leading-snug">
          {title}
        </h3>
        <StarRating count={rating} />
      </div>

      <div className="px-5 pb-4 border-t border-landing-border pt-2.5 flex items-center justify-between">
        <div className="flex w-24 items-center gap-1 text-landing-heading text-xs">
          <Icon
            icon="heroicons-outline:calendar"
            className="w-4 h-4 text-gray-500"
          />
          <span className="truncate">{days} days</span>
        </div>
        <div className="w-26 text-right text-landing-heading text-sm">
          <span className="text-gray-500 text-xs font-normal">From </span>
          <span className="font-medium text-[15px]">{price}</span>
        </div>
      </div>
    </Link>
  );
};

export const FeaturedTripsSection = () => {
  const { t, i18n } = useTranslation();
  const [trips, setTrips] = useState<FallbackTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || "en")
    .toLowerCase()
    .split("-")[0];

  useEffect(() => {
    const fetchTours = async () => {
      const hydrateFallbackFromSearch = async (): Promise<boolean> => {
        try {
          const searchResult = await homeService.searchTours({
            page: 1,
            pageSize: 8,
          });
          const mappedSearchTrips = (searchResult?.data ?? []).map(
            mapSearchTourToTrip,
          );

          if (mappedSearchTrips.length > 0) {
            setTrips(mappedSearchTrips);
            return true;
          }
        } catch {
          return false;
        }

        return false;
      };

      try {
        const data = await homeService.getFeaturedTours(8);
        const mappedFeaturedTrips = (data ?? []).map(mapFeaturedTourToTrip);

        if (mappedFeaturedTrips.length > 0) {
          setTrips(mappedFeaturedTrips);
        } else if (!(await hydrateFallbackFromSearch())) {
          setTrips(FALLBACK_TRIPS);
        }
      } catch {
        if (!(await hydrateFallbackFromSearch())) {
          setTrips(FALLBACK_TRIPS);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [activeLanguage]);

  if (loading) {
    return (
      <SectionContainer>
        <section className="w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 suppressHydrationWarning className="min-h-10 md:min-h-12 text-2xl md:text-[30px] font-bold text-landing-heading">
              {t("landing.featured.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-landing-border rounded-xl overflow-hidden animate-pulse">
                <div className="h-53.75 bg-gray-200" />
                <div className="p-5 flex flex-col gap-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="px-5 pb-4 border-t border-landing-border pt-2.5">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="min-h-10 md:min-h-12 text-2xl md:text-[30px] font-bold text-landing-heading">
            {t("landing.featured.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
          {trips.slice(0, 8).map((trip, idx) => (
            <TripCard key={`${trip.title}-${trip.image}-${idx}`} {...trip} />
          ))}
        </div>
      </section>
    </SectionContainer>
  );
};
