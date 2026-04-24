"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import Image from "next/image";
import { MapPin, Star } from "@phosphor-icons/react";
import { homeService } from "@/api/services/homeService";
import type { TopReview } from "@/types/home";

type ReviewCard = {
  name: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
};

const fallbackAvatar = "";

const mapTopReviews = (reviews: TopReview[]): ReviewCard[] =>
  reviews.map((review) => ({
    name: review.userName,
    location: review.tourName,
    avatar: review.userAvatar || fallbackAvatar,
    rating: Math.max(1, Math.min(5, Math.round(review.rating))),
    text:
      review.comment ||
      "Great experience with Pathora. Everything was smooth and memorable.",
  }));

export const BoldReviewsSection = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTopReviews = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await homeService.getTopReviews(6);
      const mapped = mapTopReviews(data ?? []);
      setReviews(mapped);
      setActiveIndex(0);
    } catch {
      setError(t("landing.reviews.loadError") || "Unable to load reviews");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTopReviews();
  }, [fetchTopReviews]);

  useEffect(() => {
    if (reviews.length === 0) {
      return;
    }
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reviews.length]);

  const handleMouseEnter = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleMouseLeave = () => {
    if (reviews.length === 0) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 6000);
  };

  return (
    <section
      ref={ref}
      className={`py-24 md:py-32 bg-stone-950 text-white transition-all duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-[60rem] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <span suppressHydrationWarning className="inline-block px-4 py-1.5 rounded-full bg-white/5 text-[11px] font-bold text-stone-300 uppercase tracking-[0.2em] mb-6 border border-white/10 shadow-sm">
            {t("landing.reviews.eyebrow") || "Testimonials"}
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]"
          >
            {t("landing.reviews.title") || "What Travelers Say"}
          </h2>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center max-w-2xl mx-auto">
            <p className="text-red-200 font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchTopReviews}
              className="mt-4 inline-flex items-center rounded-xl bg-red-500/20 px-6 py-2.5 text-sm font-bold text-red-100 hover:bg-red-500/30 transition-colors"
            >
              {t("landing.reviews.retry") || "Retry"}
            </button>
          </div>
        ) : isLoading ? (
          <div className="animate-pulse p-10 md:p-14 rounded-[2rem] bg-stone-900 border border-white/5">
            <div className="h-4 w-32 bg-stone-800 rounded mb-8" />
            <div className="h-8 w-full bg-stone-800 rounded mb-4" />
            <div className="h-8 w-4/5 bg-stone-800 rounded mb-12" />
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-stone-800" />
              <div>
                <div className="h-5 w-32 bg-stone-800 rounded mb-2" />
                <div className="h-4 w-24 bg-stone-800 rounded" />
              </div>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-[2rem] border border-white/5 bg-stone-900 p-12 text-center text-stone-500 font-medium">
            {t("landing.reviews.empty") || "No reviews available yet."}
          </div>
        ) : (
          <>
            {/* Review Cards */}
            <div className="relative min-h-[350px]">
              {reviews.map((review, idx) => (
                <div
                  key={`${review.name}-${idx}`}
                  className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                    idx === activeIndex
                      ? "opacity-100 translate-y-0 scale-100 z-10"
                      : "opacity-0 translate-y-8 scale-95 pointer-events-none z-0"
                  }`}
                >
                  <div className="p-10 md:p-14 rounded-[2rem] bg-stone-900 border border-white/5 shadow-2xl">
                    {/* Stars */}
                    <div className="flex gap-1.5 mb-8">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={20} weight="fill" className="text-amber-500" />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-stone-300 text-2xl md:text-3xl leading-snug font-medium mb-12 tracking-tight">
                      &quot;{review.text}&quot;
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center gap-5">
                      {review.avatar ? (
                        <Image
                          src={review.avatar}
                          alt={review.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full border border-white/10 bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl leading-none">
                          {review.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[17px] text-white">{review.name}</p>
                        <p className="text-stone-400 text-sm font-medium flex items-center gap-1.5 mt-0.5">
                          <MapPin size={14} weight="fill" className="text-stone-500" /> {review.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-3 mt-12">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === activeIndex
                      ? "w-8 bg-white"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
