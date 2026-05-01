"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { homeService } from "@/api/services/homeService";
import { TopReview } from "@/types/home";
import { cn } from "@/lib/cn";
import {
  SectionContainer,
  ScrollReveal,
  EyebrowTag,
  StarRating,
} from "@/features/shared/components/shared";

const ReviewsSection = () => {
  const { t, i18n } = useTranslation();
  const [reviews, setReviews] = useState<TopReview[]>([]);
  const locale = i18n.resolvedLanguage || i18n.language || "en";

  useEffect(() => {
    homeService
      .getTopReviews(6)
      .then((data) => {
        if (data) setReviews(data);
      })
      .catch(() => {});
  }, []);

  // Fallback reviews if API returns empty
  const fallbackReviews: TopReview[] = [
    {
      userName: "Sarah Johnson",
      userAvatar: null,
      tourName: "Vietnam Discovery",
      rating: 5,
      comment: "This was an incredible experience! The tour was well organized and the guide was very knowledgeable.",
      createdAt: new Date().toISOString(),
    },
    {
      userName: "David Chen",
      userAvatar: null,
      tourName: "Japan Explorer",
      rating: 5,
      comment: "Had a wonderful time exploring new places. Highly recommend to everyone!",
      createdAt: new Date().toISOString(),
    },
    {
      userName: "Maria Garcia",
      userAvatar: null,
      tourName: "Europe Classic",
      rating: 4,
      comment: "Everything was perfect from start to end. Will definitely book again.",
      createdAt: new Date().toISOString(),
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews.slice(0, 3) : fallbackReviews;

  return (
    <section className={cn("py-24 md:py-32 bg-gray-50/50 dark:bg-[#0d0d1a]")}>
      <SectionContainer>
        {/* Header */}
        <ScrollReveal className={cn("text-center mb-14 md:mb-20")}>
          <EyebrowTag>Testimonials</EyebrowTag>
          <h2 className={cn("mt-4 text-3xl md:text-5xl font-bold text-gray-900 dark:text-white font-['Outfit',_system-ui] tracking-tight")}>
            {t("landing.reviews.title")}
          </h2>
          <p className={cn("mt-4 text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm md:text-base")}>
            {t("landing.reviews.subtitle")}
          </p>
        </ScrollReveal>

        {/* Review cards — 3 across on desktop */}
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6")}>
          {displayReviews.map((review, idx) => (
            <ScrollReveal key={idx} delay={idx * 120}>
              {/* Double-Bezel testimonial card */}
              <div className={cn("group rounded-[1.25rem] bg-gray-100/50 dark:bg-white/5 border border-gray-200/40 dark:border-white/8 p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 h-full")}>
                <div className={cn("rounded-[calc(1.25rem-0.25rem)] bg-white dark:bg-[#1a1a2e] p-6 md:p-8 h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] v-stack")}>
                  {/* Quote mark */}
                  <div className={cn("text-[#fa8b02]/20 text-5xl font-serif leading-none mb-3")}>&ldquo;</div>

                  {/* Rating */}
                  <div className={cn("mb-4")}>
                    <StarRating count={Math.min(review.rating, 5)} size="md" />
                  </div>

                  {/* Comment */}
                  <p className={cn("text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed spacer")}>
                    {review.comment}
                  </p>

                  {/* Divider */}
                  <div className={cn("mt-6 mb-5 h-px bg-gray-100 dark:bg-white/10")} />

                  {/* Author */}
                  <div className={cn("flex items-center gap-3")}>
                    {/* Avatar */}
                    <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br from-[#fa8b02] to-[#e67a00] center shrink-0 overflow-hidden")}>
                      {review.userAvatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={review.userAvatar}
                          alt={review.userName}
                          className={cn("w-full h-full object-cover")}
                          loading="lazy"
                        />
                      ) : (
                        <span className={cn("text-sm font-bold text-white")}>
                          {review.userName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className={cn("min-w-0")}>
                      <p className={cn("text-sm font-semibold text-gray-900 dark:text-white truncate")}>
                        {review.userName}
                      </p>
                      <p className={cn("text-xs text-gray-400 truncate")}>
                        {review.tourName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
};

export default ReviewsSection;
