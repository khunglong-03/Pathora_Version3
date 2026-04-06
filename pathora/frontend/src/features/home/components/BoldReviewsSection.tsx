"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import Image from "next/image";
import { homeService } from "@/api/services/homeService";
import type { TopReview } from "@/types/home";

type ReviewCard = {
  name: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
};

const fallbackAvatar =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80";

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
    }, 5000);
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
    }, 5000);
  };

  return (
    <section
      ref={ref}
      className={`py-20 md:py-28 bg-[#050510] transition-all duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-white/40 uppercase tracking-widest">
            {t("landing.reviews.eyebrow") || "Testimonials"}
          </span>
          <h2
            className="mt-3 text-4xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            {t("landing.reviews.title") || "What Travelers Say"}
          </h2>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-center text-sm text-red-200">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchTopReviews}
              className="mt-3 inline-flex items-center rounded-full border border-red-300/30 px-4 py-2 text-xs font-medium text-red-100 hover:bg-red-500/20 transition-colors"
            >
              {t("landing.reviews.retry") || "Retry"}
            </button>
          </div>
        ) : isLoading ? (
          <div className="animate-pulse p-8 md:p-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="h-5 w-24 bg-white/10 rounded mb-6" />
            <div className="h-6 w-full bg-white/10 rounded mb-3" />
            <div className="h-6 w-4/5 bg-white/10 rounded mb-8" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10" />
              <div>
                <div className="h-4 w-28 bg-white/10 rounded mb-2" />
                <div className="h-3 w-20 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
            {t("landing.reviews.empty") || "No reviews available yet."}
          </div>
        ) : (
          <>
            {/* Review Cards */}
            <div className="relative">
              {reviews.map((review, idx) => (
                <div
                  key={`${review.name}-${idx}`}
                  className={`transition-all duration-700 ${
                    idx === activeIndex
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
                  }`}
                >
                  <div className="p-8 md:p-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                    {/* Stars */}
                    <div className="flex gap-1 mb-6">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i} className="text-[#fb8b02] text-lg">
                          ★
                        </span>
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-white/80 text-lg md:text-xl leading-relaxed mb-8 italic">
                      {`“${review.text}”`}
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <Image
                        src={review.avatar}
                        alt={review.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                      />
                      <div>
                        <p className="font-semibold text-white">{review.name}</p>
                        <p className="text-white/40 text-sm">📍 {review.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? "w-6 bg-[#fb8b02]"
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
