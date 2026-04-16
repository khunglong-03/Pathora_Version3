"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { MagnifyingGlass, MapPinIcon, CalendarBlankIcon, ArrowUpRight } from "@phosphor-icons/react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { homeService } from "@/api/services/homeService";
import { getFallbackImage } from "@/utils/imageFallback";

type HeroTour = {
  id: string;
  name: string;
  location: string;
  image: string;
};

export const BoldHeroSection = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [heroSearchText, setHeroSearchText] = useState("");
  const [tours, setTours] = useState<HeroTour[]>([]);

  const handleHeroSearch = () => {
    const query = heroSearchText.trim();
    router.push(`/tours?destination=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    let cancelled = false;
    homeService.getFeaturedTours(3, i18n.resolvedLanguage).then((data) => {
      if (cancelled) return;
      const mapped = (data || []).slice(0, 3).map((t, i) => ({
        id: t.id,
        name: t.tourName,
        location: `${t.durationDays} Days`,
        image: t.thumbnail || getFallbackImage(t.id + i),
      }));
      // If backend fails to return 3 tours, we mock it via Unsplash for the high-end UI preview
      if (mapped.length < 3) {
        setTours([
          ...mapped,
          ...[0, 1, 2].slice(mapped.length).map(i => ({
            id: `hero-mock-${i}`,
            name: "Exclusive Escape",
            location: "Asia",
            image: getFallbackImage(i)
          }))
        ]);
      } else {
        setTours(mapped);
      }
    }).catch(() => {
      if (cancelled) return;
      setTours([0, 1, 2].map(i => ({
        id: `hero-mock-${i}`,
        name: "Discovery Expedition",
        location: "Global",
        image: getFallbackImage(i)
      })));
    });
    return () => { cancelled = true; };
  }, [i18n.resolvedLanguage]);

  // Framer Motion variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  } as Variants;
  
  const staggerItem = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  } as Variants;

  return (
    <section className="relative w-full min-h-[100dvh] overflow-hidden flex items-center bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f8fafc_42%,_#eef2ff_100%)]">
      {/* Video background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <iframe
          title="Travel background video"
          aria-hidden="true"
          src="https://www.youtube.com/embed/NSnkb1IAjbE?autoplay=1&mute=1&controls=0&loop=1&playlist=NSnkb1IAjbE&playsinline=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3"
          className="absolute inset-0 h-[100%] w-[100%] scale-125 opacity-25"
          style={{ border: 0, pointerEvents: "none" }}
          allow="autoplay; encrypted-media"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,250,245,0.35),rgba(248,250,252,0.72)_45%,rgba(248,250,252,0.95))]" />
      </div>

      {/* Soft ambient gradients */}
      <div className="absolute inset-0 pointer-events-none" suppressHydrationWarning>
        <div
          className="absolute w-[700px] h-[700px] rounded-full blur-[120px] opacity-32 bg-gradient-to-tr from-[#fb8b02]/28 via-amber-200/18 to-transparent"
          style={{ top: "-18%", right: "-8%" }}
        />
        <div
          className="absolute w-[900px] h-[900px] rounded-full blur-[140px] opacity-28 bg-gradient-to-bl from-sky-300/24 via-cyan-200/10 to-transparent"
          style={{ bottom: "-28%", left: "-12%" }}
        />
      </div>

      {/* Subtle texture */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center h-full">
        
        {/* Left Side: Typography & Search */}
        <motion.div 
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
          className="lg:col-span-5 flex flex-col justify-center"
        >
          {/* Eyebrow */}
          <div className="mb-8 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur-md w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fb8b02] animate-pulse" />
            <span suppressHydrationWarning className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-600">
              {t("landing.hero.eyebrow") || "Curated Travel"}
            </span>
          </div>

          <h1
            suppressHydrationWarning
            className="text-5xl md:text-7xl lg:text-7xl font-bold text-slate-900 leading-[1.02] tracking-tight mb-6"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            {t("landing.hero.title") || "Discover Amazing Tours"}
          </h1>

          <p suppressHydrationWarning className="text-lg text-slate-600 mb-10 leading-relaxed font-medium max-w-lg">
            {t("landing.hero.subtitle") || "Explore hand-crafted itineraries and breathtaking locations. Your next agency-level experience is one search away."}
          </p>

          {/* Search Bar */}
          <div className="p-2 rounded-[2rem] border border-slate-200 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl relative overflow-hidden group/search hover:border-[#fb8b02]/30 transition-colors duration-500">
            <div className="inset-0 absolute bg-gradient-to-r from-[#fb8b02]/0 via-[#fb8b02]/0 to-[#fb8b02]/0 group-hover/search:via-[#fb8b02]/8 transition-all duration-700" />
            <div className="flex flex-col md:flex-row items-center gap-2 relative z-10 w-full bg-white rounded-[calc(2rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] border border-slate-100">
              
              <div className="flex-1 w-full relative flex items-center">
                <MapPinIcon className="absolute left-4 text-slate-400" size={20} weight="light" />
                <input
                  suppressHydrationWarning
                  type="text"
                  value={heroSearchText}
                  onChange={(e) => setHeroSearchText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleHeroSearch(); }}
                  placeholder={t("landing.hero.searchPlaceholder") || "Where to next?"}
                  className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 pl-12 pr-4 py-4 outline-none border-none text-base"
                />
              </div>

              <div className="w-full md:w-auto p-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={handleHeroSearch}
                  className="flex-1 md:flex-none h-12 px-6 bg-[#fb8b02] text-white font-semibold rounded-[1.25rem] hover:bg-[#e67d00] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#fb8b02]/25"
                >
                  <span suppressHydrationWarning>{t("landing.hero.exploreTours") || "Explore"}</span>
                  <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                    <ArrowUpRight size={14} weight="bold" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Image cards */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="lg:col-span-7 h-full w-full relative pl-0 lg:pl-10"
        >
          {tours.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-[600px]">
              {/* Primary Large Card */}
              <motion.div variants={staggerItem} className="md:col-span-1 md:row-span-2 relative group h-full">
                <div className="absolute inset-0 p-1.5 rounded-[2.5rem] border border-slate-200 bg-white/75 backdrop-blur-xl transition-all duration-700 hover:border-[#fb8b02]/25 shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
                  <div className="relative w-full h-full rounded-[calc(2.5rem-0.375rem)] overflow-hidden group-active:scale-[0.98] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <img src={tours[0].image} alt={tours[0].name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold text-[#fb8b02] w-max mb-3 border border-white/60">
                        {tours[0].location}
                      </div>
                      <h3 className="text-2xl font-semibold text-white tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(15,23,42,0.35)]">
                        {tours[0].name}
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Secondary Stacked Cards */}
              <div className="md:col-span-1 md:row-span-2 flex flex-col gap-5 h-full">
                {tours.slice(1, 3).map((tour) => (
                  <motion.div variants={staggerItem} key={tour.id} className="relative group flex-1">
                    <div className="absolute inset-0 p-1.5 rounded-[2rem] border border-slate-200 bg-white/75 backdrop-blur-xl transition-all duration-700 hover:border-[#fb8b02]/25 shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
                      <div className="relative w-full h-full rounded-[calc(2rem-0.375rem)] overflow-hidden group-active:scale-[0.98] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                        <img src={tour.image} alt={tour.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-900/10 to-transparent" />
                        <div className="absolute bottom-5 left-5 right-5">
                          <h3 className="text-xl font-semibold text-white tracking-tight leading-snug drop-shadow-[0_2px_10px_rgba(15,23,42,0.35)]">
                            {tour.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </section>
  );
};
