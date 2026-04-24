"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { MapPinIcon, ArrowRight } from "@phosphor-icons/react";
import { motion, Variants } from "framer-motion";
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
      // Mock if < 3
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
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  } as Variants;
  
  const staggerItem = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
  } as Variants;

  return (
    <section className="relative w-full min-h-[100dvh] overflow-hidden flex items-center bg-stone-950 selection:bg-white/20 selection:text-white">
      {/* Video background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90 scale-105"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Refined gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/30" />
      </div>

      <div className="relative z-10 w-full max-w-[90rem] mx-auto px-6 md:px-12 py-32 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center h-full">
        
        {/* Left Side: Typography & Search */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="lg:col-span-6 flex flex-col justify-center"
        >
          {/* Eyebrow */}
          <div className="mb-8 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md w-max shadow-2xl">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
            <span suppressHydrationWarning className="text-[11px] uppercase tracking-[0.2em] font-bold text-stone-200">
              {t("landing.hero.eyebrow") || "Curated Travel"}
            </span>
          </div>

          <h1
            suppressHydrationWarning
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white leading-[1.05] tracking-tighter mb-8 drop-shadow-sm"
          >
            {t("landing.hero.title") || "Discover Amazing Tours"}
          </h1>

          <p suppressHydrationWarning className="text-lg md:text-xl text-stone-300 mb-12 leading-relaxed font-medium max-w-xl">
            {t("landing.hero.subtitle") || "Explore hand-crafted itineraries and breathtaking locations. Your next agency-level experience is one search away."}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex flex-col sm:flex-row items-center p-2 rounded-[2rem] border border-white/20 bg-stone-950/40 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="flex-1 w-full relative flex items-center h-14">
                <MapPinIcon className="absolute left-6 text-stone-400" size={24} weight="bold" />
                <input
                  suppressHydrationWarning
                  type="text"
                  value={heroSearchText}
                  onChange={(e) => setHeroSearchText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleHeroSearch(); }}
                  placeholder={t("landing.hero.searchPlaceholder") || "Where to next?"}
                  className="w-full h-full bg-transparent text-white placeholder:text-stone-500 pl-16 pr-4 outline-none border-none text-[17px] font-medium"
                />
              </div>

              <div className="w-full sm:w-auto p-1 mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={handleHeroSearch}
                  className="w-full sm:w-auto h-12 px-8 bg-white text-stone-950 font-bold tracking-wide rounded-[1.5rem] hover:bg-stone-200 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:scale-[0.98]"
                >
                  <span suppressHydrationWarning>{t("landing.hero.exploreTours") || "Explore"}</span>
                  <ArrowRight size={16} weight="bold" />
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
          className="lg:col-span-6 h-full w-full relative pl-0 lg:pl-12 hidden md:block"
        >
          {tours.length >= 3 && (
            <div className="grid grid-cols-2 gap-4 h-[650px]">
              {/* Primary Large Card */}
              <motion.div variants={staggerItem} className="col-span-1 row-span-2 relative group h-full">
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-stone-900 border border-white/10 shadow-2xl">
                  <div className="relative w-full h-full">
                    <img src={tours[0].image} alt={tours[0].name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8">
                      <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white w-max mb-4 border border-white/20">
                        {tours[0].location}
                      </div>
                      <h3 className="text-3xl font-bold text-white tracking-tight leading-tight drop-shadow-md">
                        {tours[0].name}
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Secondary Stacked Cards */}
              <div className="col-span-1 row-span-2 flex flex-col gap-4 h-full">
                {tours.slice(1, 3).map((tour) => (
                  <motion.div variants={staggerItem} key={tour.id} className="relative group flex-1">
                    <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-stone-900 border border-white/10 shadow-2xl">
                      <div className="relative w-full h-full">
                        <img src={tour.image} alt={tour.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <h3 className="text-xl font-bold text-white tracking-tight leading-snug drop-shadow-md">
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
