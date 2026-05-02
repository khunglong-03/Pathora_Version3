"use client";
import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

const SHOWCASE_VIDEO = "/showcase-video.mp4"; // Placeholder

export const BoldVideoShowcase = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  return (
    <>
      <section
        ref={ref}
        className={`relative py-20 md:py-32 overflow-hidden transition-all duration-1000 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(59,130,246,0.1), rgba(251,139,2,0.1))",
        }}
      >
        {/* Background decorative elements */}
        <div className={cn("absolute inset-0 overflow-hidden pointer-events-none")}>
          <div className={cn("absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#ec4899]/5 blur-3xl")} />
          <div className={cn("absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-[#3b82f6]/5 blur-3xl")} />
        </div>

        <div className={cn("max-w-5xl mx-auto px-4 md:px-8")}>
          {/* Section Label */}
          <div className={cn("text-center mb-8")}>
            <span className={cn("inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-medium uppercase tracking-widest")}>
              {t("landing.videoShowcase.label") || "Experience Vietnam"}
            </span>
          </div>

          {/* Video Container */}
          <div className={cn("relative aspect-video rounded-2xl overflow-hidden bg-[#111827] border border-white/10")}>
            <video
              ref={videoRef}
              src={SHOWCASE_VIDEO}
              className={cn("absolute inset-0 w-full h-full object-cover")}
              loop
              muted
              playsInline
              onEnded={() => setIsPlaying(false)}
            />

            {/* Fallback gradient when no video */}
            <div className={cn("absolute inset-0 bg-linear-to-br from-[#1a0a2e] via-[#0a1a2e] to-[#1a0a2e]")} />

            {/* Play Button */}
            {!isPlaying && (
              <button
                onClick={handlePlay}
                className={cn("absolute inset-0 center group cursor-pointer")}
              >
                <div className={cn("w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 center group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300")}
                  style={{ boxShadow: "0 0 40px rgba(251,139,2,0.2)" }}
                >
                  <div className={cn("w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-2")} />
                </div>
              </button>
            )}

            {/* Expand button */}
            <button
              onClick={handleFullscreen}
              className={cn("absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 center text-white/70 hover:text-white hover:bg-white/20 transition-all")}
            >
              <Icon icon="heroicons-outline:arrows-expand" className={cn("w-5 h-5")} />
            </button>
          </div>

          {/* Caption */}
          <p className={cn("text-center mt-6 text-xl md:text-2xl font-bold text-white")} style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            {t("landing.videoShowcase.caption") || "Vietnam Awaits"}
          </p>
          <p className={cn("text-center mt-2 text-white/50 text-sm")}>
            {t("landing.videoShowcase.subcaption") || "Discover breathtaking landscapes and rich cultural heritage"}
          </p>
        </div>
      </section>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className={cn("fixed inset-0 z-[200] bg-black/95 center")}>
          <button
            onClick={closeFullscreen}
            className={cn("absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 border border-white/20 center text-white hover:bg-white/20 transition-all")}
          >
            <Icon icon="heroicons-outline:x" className={cn("w-6 h-6")} />
          </button>
          <video
            src={SHOWCASE_VIDEO}
            className={cn("w-full h-full object-contain")}
            controls
            autoPlay
          />
        </div>
      )}
    </>
  );
};
