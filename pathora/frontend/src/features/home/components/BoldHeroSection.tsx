"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { MagnifyingGlass, MapPinIcon, CalendarBlankIcon } from "@phosphor-icons/react";
import { homeService } from "@/api/services/homeService";

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
    <section
      suppressHydrationWarning
      className="relative w-full min-h-[100dvh] overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0c0c1d 0%, #141428 40%, #0d1117 100%)" }}
    >
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" suppressHydrationWarning>
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          data-darkreader-ignore
          suppressHydrationWarning
          style={{
            background: "radial-gradient(circle, rgba(251,139,2,0.15) 0%, transparent 70%)",
            filter: "blur(80px)",
            top: "-5%",
            right: "-10%",
            animation: "heroOrb1 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          data-darkreader-ignore
          suppressHydrationWarning
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
            bottom: "10%",
            left: "-5%",
            animation: "heroOrb2 10s ease-in-out infinite 2s",
          }}
        />
      </div>

      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 z-50 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content — asymmetric left-aligned layout */}
      <div className="relative z-10 flex items-center min-h-[100dvh] px-4 md:px-8">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-32 lg:py-0">
          {/* Left — Text block */}
          <div className="max-w-xl">
            {/* Eyebrow */}
            <div className="mb-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#fb8b02] animate-pulse" />
              <span suppressHydrationWarning className="text-sm font-medium text-white/50 tracking-wide">
                {t("landing.hero.eyebrow")}
              </span>
            </div>

            {/* Headline */}
            <h1
              suppressHydrationWarning
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tighter mb-6"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              {t("landing.hero.title")}
            </h1>

            {/* Subheadline */}
            <p suppressHydrationWarning className="text-lg text-white/50 max-w-[50ch] mb-10 leading-relaxed">
              {t("landing.hero.subtitle")}
            </p>

            {/* Search Bar — glassmorphism with refraction border */}
            <div
              className="w-full bg-white/[0.04] backdrop-blur-xl rounded-2xl p-3 flex flex-col md:flex-row items-center gap-3"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex-1 w-full relative">
                <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={18} weight="regular" />
                <input
                  suppressHydrationWarning
                  type="text"
                  value={heroSearchText}
                  onChange={(e) => setHeroSearchText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleHeroSearch(); }}
                  placeholder={t("landing.hero.searchPlaceholder")}
                  className="w-full bg-transparent text-white placeholder:text-white/30 pl-10 pr-4 py-3 rounded-xl outline-none border border-white/[0.05] focus:border-[#fb8b02]/40 transition-colors"
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <div className="flex-1 md:flex-none md:w-44 relative">
                  <CalendarBlankIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={18} weight="regular" />
                  <input
                    type="date"
                    className="w-full bg-transparent text-white pl-10 pr-4 py-3 rounded-xl outline-none border border-white/[0.05] focus:border-[#fb8b02]/40 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleHeroSearch}
                  className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-[#fb8b02] to-[#e67d00] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#fb8b02]/20 transition-all whitespace-nowrap inline-flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <MagnifyingGlass size={18} weight="bold" />
                  <span suppressHydrationWarning>{t("landing.hero.exploreTours")}</span>
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-8 mt-10 text-white/35 text-sm">
              <span suppressHydrationWarning className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fb8b02]" />
                {statsLoading
                  ? "..."
                  : `${Math.max(0, stats?.tours ?? 0).toLocaleString()}+`}{" "}
                {t("landing.stats.items.totalTours")}
              </span>
              <span suppressHydrationWarning className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                {statsLoading
                  ? "..."
                  : `${Math.max(0, Math.round((stats?.travellers ?? 0) / 1000))}K+`}{" "}
                {t("landing.stats.items.totalTravellers")}
              </span>
              <span suppressHydrationWarning className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                4.9&#9733; {t("landing.reviews.rating")}
              </span>
            </div>
          </div>

          {/* Right — Decorative abstract element */}
          <div className="hidden lg:flex items-center justify-center relative">
            <div className="relative w-[420px] h-[420px]">
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: "1px solid rgba(251,139,2,0.15)",
                  animation: "heroRingSpin 20s linear infinite",
                }}
              />
              {/* Inner ring */}
              <div
                className="absolute inset-8 rounded-full"
                style={{
                  border: "1px solid rgba(59,130,246,0.1)",
                  animation: "heroRingSpin 15s linear infinite reverse",
                }}
              />
              {/* Center glow */}
              <div
                className="absolute inset-16 rounded-full"
                data-darkreader-ignore
                suppressHydrationWarning
                style={{
                  background: "radial-gradient(circle, rgba(251,139,2,0.08) 0%, transparent 70%)",
                }}
              />
              {/* Floating dots */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-[#fb8b02]/40"
                  style={{
                    top: `${20 + (i * 12)}%`,
                    left: `${10 + (i * 15) % 80}%`,
                    animation: `heroFloat ${3 + i}s ease-in-out infinite ${i * 0.5}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 animate-bounce">
        <span className="text-xs tracking-[0.2em] uppercase font-medium">Scroll</span>
        <svg data-darkreader-ignore suppressHydrationWarning className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes heroOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 20px) scale(1.05); }
        }
        @keyframes heroOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.08); }
        }
        @keyframes heroRingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-12px) scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </section>
  );
};
