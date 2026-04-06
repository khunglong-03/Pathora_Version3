"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { BoldNavbar } from "./BoldNavbar";
import { homeService } from "@/api/services/homeService";

const HERO_VIDEO = "/hero-video.mp4"; // Placeholder — replace with actual video asset

interface HeroStats {
  tours: number;
  travellers: number;
}

export const BoldHeroSection = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [stats, setStats] = useState<HeroStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [heroSearchText, setHeroSearchText] = useState("");

  const handleHeroSearch = () => {
    const query = heroSearchText.trim();
    router.push(`/tours?destination=${encodeURIComponent(query)}`);
  };

  React.useEffect(() => {
    let cancelled = false;
    homeService
      .getHomeStats()
      .then((data) => {
        if (cancelled) return;
        setStats({ tours: data.totalTours, travellers: data.totalTravelers });
        setStatsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section suppressHydrationWarning className="relative w-full h-screen min-h-[600px] overflow-hidden bg-[#0a0a1a]">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        {/* Gradient overlay — always visible as fallback */}
        <div className="absolute inset-0 bg-linear-to-br from-[#0a0a1a]/80 via-[#1a0a2e]/60 to-[#0a1a2e]/70" />
      </div>

      {/* Floating Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" suppressHydrationWarning>
        <div
          className="absolute w-64 h-64 rounded-full"
          data-darkreader-ignore
          suppressHydrationWarning
          style={{
            background: "radial-gradient(circle, rgba(251,139,2,0.4) 0%, transparent 70%)",
            filter: "blur(60px)",
            top: "10%",
            left: "5%",
            animation: "floatOrb1 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full"
          data-darkreader-ignore
          suppressHydrationWarning
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)",
            filter: "blur(60px)",
            top: "30%",
            right: "10%",
            animation: "floatOrb2 8s ease-in-out infinite 1s",
          }}
        />
        <div
          className="absolute w-40 h-40 rounded-full"
          data-darkreader-ignore
          suppressHydrationWarning
          style={{
            background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
            bottom: "20%",
            left: "30%",
            animation: "floatOrb3 7s ease-in-out infinite 2s",
          }}
        />
      </div>

      {/* Navbar */}
      <BoldNavbar />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        {/* Eyebrow */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#fb8b02] animate-pulse" />
          <span className="text-sm font-medium text-white/70">
            {t("landing.hero.eyebrow") || "Vietnam's Premier Travel Platform"}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6"
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        >
          {t("landing.hero.title")}
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed">
          {t("landing.hero.subtitle")}
        </p>

        {/* Search Bar */}
        <div className="w-full max-w-3xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <input
              type="text"
              value={heroSearchText}
              onChange={(e) => setHeroSearchText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleHeroSearch(); }}
              placeholder={t("landing.hero.searchPlaceholder") || "Where do you want to go?"}
              className="w-full bg-transparent text-white placeholder:text-white/40 px-4 py-3 rounded-xl outline-none border border-white/5 focus:border-[#fb8b02]/50 transition-colors"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="date"
              className="flex-1 md:flex-none md:w-44 bg-transparent text-white px-4 py-3 rounded-xl outline-none border border-white/5 focus:border-[#fb8b02]/50 transition-colors"
            />
            <Button
              onClick={handleHeroSearch}
              text={t("landing.hero.exploreTours") || "Explore"}
              className="flex-1 md:flex-none px-8 py-3 bg-linear-to-r from-[#fb8b02] to-[#ff9f2d] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#fb8b02]/30 transition-all whitespace-nowrap"
              icon="heroicons-outline:search"
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-8 mt-8 text-white/40 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fb8b02]" />
            {statsLoading
              ? "..."
              : `${Math.max(0, stats?.tours ?? 0).toLocaleString()}+`} {t("landing.stats.items.totalTours") || "Tours"}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            {statsLoading
              ? "..."
              : `${Math.max(0, Math.round((stats?.travellers ?? 0) / 1000))}K+`} {t("landing.stats.items.totalTravellers") || "Travelers"}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899]" />
            4.9&#9733; {t("landing.reviews.rating") || "Rating"}
          </span>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <svg data-darkreader-ignore suppressHydrationWarning className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.1); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15px, 20px) scale(1.05); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, 15px) scale(1.08); }
        }
      `}</style>
    </section>
  );
};
