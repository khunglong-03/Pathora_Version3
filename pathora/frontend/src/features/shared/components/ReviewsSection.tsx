"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { homeService } from "@/api/services/homeService";
import { TopReview } from "@/types/home";

interface ReviewsSectionProps {
  // This component can optionally filter by tourId (for tour detail page)
  // or show all top reviews (for landing page)
  tourId?: string;
}

export function ReviewsSection({ tourId }: ReviewsSectionProps) {
  const { t, i18n } = useTranslation();
  const [reviews, setReviews] = useState<TopReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchReviews = async () => {
      try {
        const data = await homeService.getTopReviews(6);
        if (!cancelled) {
          setReviews(data ?? []);
        }
      } catch {
        if (!cancelled) {
          setReviews([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReviews();
    return () => {
      cancelled = true;
    };
  }, []);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6 animate-pulse reveal-on-scroll"
        style={{ boxShadow: "var(--shadow-warm-md)", background: "var(--tour-surface)" }}>
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden reveal-on-scroll"
      style={{ boxShadow: "var(--shadow-warm-md)", background: "var(--tour-surface)" }}>
      <div className="p-6">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--tour-heading)" }}>
          <Icon icon="heroicons:star" className="size-5 text-[#fa8b02]" />
          {t("landing.tourDetail.reviewsTitle")}
        </h3>

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              icon="heroicons:chat-bubble-bottom-center-text"
              className="size-10 mx-auto mb-3"
              style={{ color: "var(--tour-caption)" }}
            />
            <p className="text-sm" style={{ color: "var(--tour-body)" }}>
              {t("landing.tourDetail.noReviews")}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--tour-caption)" }}>
              {t("landing.tourDetail.noReviewsCta")}
            </p>
          </div>
        ) : (
          <>
            {/* Average rating header */}
            <div
              className="flex items-center gap-4 mb-5 border rounded-xl p-4"
              style={{
                background: "#fef3e4",
                borderColor: "#fde8d4",
              }}>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold tabular-nums" style={{ color: "#fa8b02" }}>
                  {averageRating.toFixed(1)}
                </span>
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      icon="heroicons:star-solid"
                      className="size-3.5"
                      style={{ color: i < Math.round(averageRating) ? "#fa8b02" : "#e5e7eb" }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold" style={{ color: "var(--tour-heading)" }}>
                  {t("landing.tourDetail.averageRating")}
                </span>
                <span className="text-xs" style={{ color: "var(--tour-caption)" }}>
                  {t("landing.tourDetail.totalReviews", { count: reviews.length })}
                </span>
              </div>
            </div>

            {/* Review cards */}
            <div className="flex flex-col gap-3">
              {reviews.map((review, idx) => (
                <div
                  key={idx}
                  className="border rounded-xl p-4 transition-all duration-300 hover:shadow-[var(--shadow-warm-sm)]"
                  style={{
                    borderColor: "var(--tour-divider)",
                    background: "var(--tour-surface-raised)",
                    animationDelay: `${idx * 80}ms`,
                  }}>
                  <div className="flex items-center gap-3 mb-2">
                    {review.userAvatar ? (
                      <Image
                        src={review.userAvatar}
                        alt={review.userName}
                        width={36}
                        height={36}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-9 rounded-full flex items-center justify-center" style={{ background: "#fef3e4" }}>
                        <span className="text-sm font-bold" style={{ color: "#fa8b02" }}>
                          {review.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold block truncate" style={{ color: "var(--tour-heading)" }}>
                        {review.userName}
                      </span>
                      <span className="text-xs" style={{ color: "var(--tour-caption)" }}>
                        {new Date(review.createdAt).toLocaleDateString(
                          i18n.language === "vi" ? "vi-VN" : "en-US",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Icon
                          key={i}
                          icon="heroicons:star-solid"
                          className="size-3.5"
                          style={{ color: i < review.rating ? "#fa8b02" : "#e5e7eb" }}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--tour-body)" }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
