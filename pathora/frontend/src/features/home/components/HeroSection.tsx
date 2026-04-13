"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import Button from "@/components/ui/Button";
import { homeService } from "@/api/services/homeService";
import {
  SelectField,
  CalendarDropdown,
  ListDropdown,
  NumberDropdown,
  DEFAULT_DESTINATIONS,
  DEFAULT_CLASSIFICATIONS,
  DEFAULT_WEEKDAYS,
} from "./HeroSearchBar";

/* ── Hero Background SVG (abstract travel pattern) ─────────── */
const HeroBgPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Warm gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
    {/* Radial accent glow */}
    <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-[#fa8b02]/8 blur-[120px]" />
    <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-[#e67a00]/5 blur-[100px]" />
    {/* Subtle grid pattern */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
    />
  </div>
);

/* ── Main Hero Section ─────────────────────────────────────── */
const HeroSection = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const locale = i18n.resolvedLanguage || i18n.language || "en";

  // Search state
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [classification, setClassification] = useState("");
  const [people, setPeople] = useState<number | null>(null);
  const [openField, setOpenField] = useState<string | null>(null);

  // Dynamic destinations from API
  const [destinations, setDestinations] = useState<string[]>(DEFAULT_DESTINATIONS);

  useEffect(() => {
    setMounted(true);
    homeService.getDestinations().then((data) => {
      if (data && data.length > 0) setDestinations(data);
    }).catch(() => {});
  }, []);

  const toggleField = useCallback(
    (field: string) => setOpenField((prev) => (prev === field ? null : field)),
    [],
  );

  // Close dropdowns on outside click
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpenField(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (date) params.set("date", date.toISOString().split("T")[0]);
    if (classification) params.set("classification", classification);
    if (people) params.set("people", people.toString());
    router.push(`/tours?${params.toString()}`);
  };

  const classifications = (t("landing.hero.classifications", { returnObjects: true }) as string[]) || DEFAULT_CLASSIFICATIONS;
  const weekdays = (t("landing.hero.weekdays", { returnObjects: true }) as string[]) || DEFAULT_WEEKDAYS;

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
    >
      <HeroBgPattern />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-16 md:pt-40 md:pb-24 flex flex-col items-center text-center">
        {/* Eyebrow */}
        <div
          className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold bg-white/10 text-white/80 backdrop-blur-sm border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fa8b02] animate-pulse" />
            {mounted ? t("landing.hero.publicTours") : "Public Tours"}
          </span>
        </div>

        {/* Main Heading */}
        <h1
          className={`mt-8 font-['Outfit',_'Space_Grotesk',_system-ui] font-bold text-white leading-[1.05] tracking-tight transition-all duration-1000 delay-100 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            mounted ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-10 blur-[4px]"
          }`}
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          {mounted ? t("landing.hero.title") : "Explore The World With Us"}
        </h1>

        {/* Subtitle */}
        <p
          className={`mt-5 text-white/60 text-base md:text-lg max-w-xl font-normal transition-all duration-1000 delay-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {mounted ? t("landing.hero.subtitle") : "Discover unforgettable journeys curated by experts"}
        </p>

        {/* Search Bar — Glassmorphic Double-Bezel */}
        <div
          ref={searchRef}
          className={`mt-10 md:mt-14 w-full max-w-4xl transition-all duration-1000 delay-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {/* Outer shell */}
          <div className="rounded-[1.5rem] md:rounded-[2rem] bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] p-1.5 md:p-2 shadow-2xl shadow-black/20">
            {/* Inner core */}
            <div
              className="rounded-[calc(1.5rem-0.375rem)] md:rounded-[calc(2rem-0.5rem)] bg-white/[0.08] backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] grid grid-cols-1 md:grid-cols-5 gap-0 md:divide-x md:divide-white/10"
              role="search"
              aria-label={t("landing.hero.searchAria")}
            >
              {/* Destination */}
              <div className="md:col-span-1 border-b md:border-b-0 border-white/10">
                <SelectField
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  }
                  label={mounted ? t("landing.hero.fields.destination.label") : "Destination"}
                  placeholder={mounted ? t("landing.hero.fields.destination.placeholder") : "Where to?"}
                  isOpen={openField === "destination"}
                  onToggle={() => toggleField("destination")}
                  displayValue={destination}
                >
                  <ListDropdown
                    items={destinations}
                    value={destination}
                    onChange={(v) => { setDestination(v); setOpenField(null); }}
                  />
                </SelectField>
              </div>

              {/* Date */}
              <div className="md:col-span-1 border-b md:border-b-0 border-white/10">
                <SelectField
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  }
                  label={mounted ? t("landing.hero.fields.date.label") : "Travel Date"}
                  placeholder={mounted ? t("landing.hero.fields.date.placeholder") : "When?"}
                  isOpen={openField === "date"}
                  onToggle={() => toggleField("date")}
                  displayValue={
                    date
                      ? date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
                      : ""
                  }
                >
                  <CalendarDropdown
                    value={date}
                    onChange={(d) => { setDate(d); setOpenField(null); }}
                    locale={locale}
                    weekdayLabels={weekdays}
                    previousMonthLabel={t("landing.hero.calendar.previousMonth")}
                    nextMonthLabel={t("landing.hero.calendar.nextMonth")}
                  />
                </SelectField>
              </div>

              {/* Classification */}
              <div className="md:col-span-1 border-b md:border-b-0 border-white/10">
                <SelectField
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  }
                  label={mounted ? t("landing.hero.fields.classification.label") : "Tour Type"}
                  placeholder={mounted ? t("landing.hero.fields.classification.placeholder") : "Which class?"}
                  isOpen={openField === "classification"}
                  onToggle={() => toggleField("classification")}
                  displayValue={classification}
                >
                  <ListDropdown
                    items={classifications}
                    value={classification}
                    onChange={(v) => { setClassification(v); setOpenField(null); }}
                  />
                </SelectField>
              </div>

              {/* People */}
              <div className="md:col-span-1 border-b md:border-b-0 border-white/10">
                <SelectField
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  }
                  label={mounted ? t("landing.hero.fields.people.label") : "Travelers"}
                  placeholder={mounted ? t("landing.hero.fields.people.placeholder") : "How many?"}
                  isOpen={openField === "people"}
                  onToggle={() => toggleField("people")}
                  displayValue={
                    people
                      ? `${people} ${people === 1 ? t("landing.hero.fields.people.single") : t("landing.hero.fields.people.plural")}`
                      : ""
                  }
                >
                  <NumberDropdown
                    value={people}
                    onChange={(v) => { setPeople(v); setOpenField(null); }}
                    singleLabel={t("landing.hero.fields.people.single")}
                    pluralLabel={t("landing.hero.fields.people.plural")}
                  />
                </SelectField>
              </div>

              {/* Search Button */}
              <div className="md:col-span-1 flex items-center justify-center p-2 md:p-1.5">
                <Button
                  type="button"
                  onClick={handleSearch}
                  className="w-full md:w-auto h-12 md:h-full px-6 md:px-0 md:aspect-square rounded-2xl md:rounded-[calc(2rem-1rem)] bg-gradient-to-r from-[#fa8b02] to-[#e67a00] hover:from-[#e67a00] hover:to-[#d06e00] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-lg hover:shadow-[#fa8b02]/30 active:scale-[0.97] cursor-pointer"
                  ariaLabel={mounted ? t("landing.hero.exploreTours") : "Explore Tours"}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <span className="md:hidden">{mounted ? t("landing.hero.exploreTours") : "Explore Tours"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div
          className={`mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-white/40 text-xs font-medium transition-all duration-1000 delay-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#fa8b02]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <span>Verified Tours</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#fa8b02]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            <span>Safe & Insured</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#fa8b02]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <span>50+ Countries</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
          <div className="w-1 h-2.5 rounded-full bg-white/40 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
