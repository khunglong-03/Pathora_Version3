"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "@/features/shared/components/LandingImage";
import { Button, Icon } from "@/components/ui";
import Spline from "@splinetool/react-spline";
import { useTranslation } from "react-i18next";
import { FaGlobe, FaLock, FaUsers, FaCalendarAlt, FaMapMarkerAlt, FaTag } from "react-icons/fa";
import { homeService } from "@/api/services/homeService";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  CalendarDropdown,
  ListDropdown,
  NumberDropdown,
  SelectField,
  DEFAULT_DESTINATIONS,
  DEFAULT_CLASSIFICATIONS,
  DEFAULT_WEEKDAYS,
} from "./HeroSearchBar";

const HERO_BG = "/hero-bg.png";

type TourType = "public" | "private";
type FieldName = "people" | "date" | "destination" | "classification";

export const HeroSection = () => {
  const { t, i18n } = useTranslation();
  const languageKey = i18n.resolvedLanguage || i18n.language;
  const router = useRouter();
  const [tourType, setTourType] = useState<TourType>("public");
  const [openField, setOpenField] = useState<FieldName | null>(null);

  // Form state
  const [people, setPeople] = useState<number | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [destination, setDestination] = useState("");
  const [classification, setClassification] = useState("");
  const [destinationsList, setDestinationsList] =
    useState<string[]>(DEFAULT_DESTINATIONS);

  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch destinations from API
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const data = await homeService.getDestinations();
        if (data && data.length > 0) {
          setDestinationsList(data);
        }
      } catch {
        // Use fallback on error
      }
    };
    fetchDestinations();
  }, [languageKey]);

  // Click-outside handler
  const closeDropdowns = useCallback(() => setOpenField(null), []);
  useClickOutside(searchRef, closeDropdowns);

  const toggleField = (name: FieldName) =>
    setOpenField((prev) => (prev === name ? null : name));
  const locale = (i18n.resolvedLanguage || i18n.language || "en").toLowerCase();
  const translatedClassifications = t("landing.hero.classifications", {
    returnObjects: true,
  }) as string[];
  const translatedWeekdays = t("landing.hero.weekdays", {
    returnObjects: true,
  }) as string[];
  const destinations =
    destinationsList.length > 0 ? destinationsList : DEFAULT_DESTINATIONS;
  const classifications =
    Array.isArray(translatedClassifications) &&
    translatedClassifications.length > 0
      ? translatedClassifications
      : DEFAULT_CLASSIFICATIONS;
  const weekdays =
    Array.isArray(translatedWeekdays) && translatedWeekdays.length === 7
      ? translatedWeekdays
      : DEFAULT_WEEKDAYS;

  const formatDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.append("destination", destination);
    if (classification) params.append("classification", classification);
    if (date) params.append("date", date.toISOString().split("T")[0]);
    if (people) params.append("people", people.toString());

    const queryString = params.toString();
    router.push(`/tours${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <section className="relative w-full min-h-150 md:h-189.75">
      {/* overflow-hidden scoped only to bg image so dropdowns can overflow the section */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={HERO_BG}
          alt={t("landing.hero.backgroundAlt")}
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-300/30 via-fuchsia-400/25 to-blue-500/30 mix-blend-screen"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="hidden md:block absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen md:opacity-60">
          <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
        </div>
        <div
          className="pointer-events-none absolute -top-28 -left-24 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl motion-safe:animate-[landing-aurora_12s_ease-in-out_infinite] motion-reduce:animate-none"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-36 -right-20 h-[28rem] w-[28rem] rounded-full bg-fuchsia-400/25 blur-3xl motion-safe:animate-[landing-aurora-slow_14s_ease-in-out_infinite] motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center pt-25 md:pt-51.75 gap-10 md:gap-15 px-4">
        <div className="flex flex-col items-center gap-4 text-white text-center w-full max-w-5xl">
          <h1 
            suppressHydrationWarning
            className="h-24 md:h-40 flex items-center justify-center text-4xl md:text-[72px] font-normal leading-tight font-serif overflow-hidden"
          >
            {t("landing.hero.title")}
          </h1>
          <p 
            suppressHydrationWarning
            className="h-7 md:h-8 overflow-hidden text-lg md:text-2xl font-bold"
          >
            {t("landing.hero.subtitle")}
          </p>
        </div>

        <div
          ref={searchRef}
          className="bg-white/35 backdrop-blur-md border border-white/30 rounded-xl px-3 md:px-5 pt-5 pb-5 flex flex-col items-start justify-center w-full max-w-4xl">
          <div className="flex -mb-px">
            <Button
              onClick={() => setTourType("public")}
              className={`flex items-center gap-2.5 px-3 md:px-4 py-3 md:py-4 rounded-tl-xl transition-colors ${
                tourType === "public" ? "bg-white" : "bg-white/40"
              }`}>
              <FaGlobe
                suppressHydrationWarning
                className={`w-5 md:w-6 h-5 md:h-6 ${
                  tourType === "public" ? "text-landing-accent" : "text-white"
                }`}
              />
              <span
                suppressHydrationWarning
                className={`font-semibold text-base md:text-lg ${
                  tourType === "public" ? "text-landing-accent" : "text-white"
                }`}>
                {t("landing.hero.publicTours")}
              </span>
            </Button>
            <Button
              onClick={() => setTourType("private")}
              className={`flex items-center gap-2.5 px-3 md:px-4 py-3 md:py-4 rounded-tr-xl transition-colors ${
                tourType === "private" ? "bg-white" : "bg-white/40"
              }`}>
              <FaLock
                suppressHydrationWarning
                className={`w-5 md:w-6 h-5 md:h-6 ${
                  tourType === "private" ? "text-landing-accent" : "text-white"
                }`}
              />
              <span
                suppressHydrationWarning
                className={`font-semibold text-base md:text-lg ${
                  tourType === "private" ? "text-landing-accent" : "text-white"
                }`}>
                {t("landing.hero.privateTours")}
              </span>
            </Button>
          </div>

          <div className="bg-white rounded-bl-xl rounded-br-xl rounded-tr-xl flex flex-col md:flex-row items-stretch md:items-center gap-0 w-full">
            <div className={`relative w-full md:flex-[1.2] md:min-w-0 ${openField === "people" ? "z-20" : "z-0"}`}>
              <SelectField
                icon={<FaUsers suppressHydrationWarning className="w-4 h-4 md:w-5 md:h-5" />}
                label={t("landing.hero.fields.people.label")}
                placeholder={t("landing.hero.fields.people.placeholder")}
                rounded="rounded-t-xl md:rounded-l-xl md:rounded-tr-none"
                isOpen={openField === "people"}
                onToggle={() => toggleField("people")}
                displayValue={people ? `${people} ${people === 1 ? t("landing.hero.fields.people.single") : t("landing.hero.fields.people.plural")}` : ""}>
                <NumberDropdown value={people} onChange={(v) => { setPeople(v); setOpenField(null); }} singleLabel={t("landing.hero.fields.people.single")} pluralLabel={t("landing.hero.fields.people.plural")} />
              </SelectField>
            </div>
            <div className="w-full h-px md:w-px md:h-12.5 bg-gray-200 shrink-0" />
            <div className={`relative w-full md:flex-1 md:min-w-0 ${openField === "date" ? "z-20" : "z-0"}`}>
              <SelectField
                icon={<FaCalendarAlt suppressHydrationWarning className="w-4 h-4 md:w-5 md:h-5" />}
                label={t("landing.hero.fields.date.label")}
                placeholder={t("landing.hero.fields.date.placeholder")}
                isOpen={openField === "date"}
                onToggle={() => toggleField("date")}
                displayValue={formatDate(date)}>
                <CalendarDropdown value={date} onChange={(d) => { setDate(d); setOpenField(null); }} locale={locale} weekdayLabels={weekdays} previousMonthLabel={t("landing.hero.calendar.previousMonth")} nextMonthLabel={t("landing.hero.calendar.nextMonth")} />
              </SelectField>
            </div>
            <div className="w-full h-px md:w-px md:h-12.5 bg-gray-200 shrink-0" />
            <div className={`relative w-full md:flex-[1.1] md:min-w-0 ${openField === "destination" ? "z-20" : "z-0"}`}>
              <SelectField
                icon={<FaMapMarkerAlt suppressHydrationWarning className="w-4 h-4 md:w-5 md:h-5" />}
                label={t("landing.hero.fields.destination.label")}
                placeholder={t("landing.hero.fields.destination.placeholder")}
                isOpen={openField === "destination"}
                onToggle={() => toggleField("destination")}
                displayValue={destination}>
                <ListDropdown items={destinations} value={destination} onChange={(v) => { setDestination(v); setOpenField(null); }} />
              </SelectField>
            </div>
            <div className="w-full h-px md:w-px md:h-12.5 bg-gray-200 shrink-0" />
            <div className={`relative w-full md:flex-[1.1] md:min-w-0 ${openField === "classification" ? "z-20" : "z-0"}`}>
              <SelectField
                icon={<FaTag suppressHydrationWarning className="w-4 h-4 md:w-5 md:h-5" />}
                label={t("landing.hero.fields.classification.label")}
                placeholder={t("landing.hero.fields.classification.placeholder")}
                isOpen={openField === "classification"}
                onToggle={() => toggleField("classification")}
                displayValue={classification}>
                <ListDropdown items={classifications} value={classification} onChange={(v) => { setClassification(v); setOpenField(null); }} />
              </SelectField>
            </div>
            <div className="p-3 md:p-0 md:pl-2 w-full md:w-auto md:shrink-0 flex justify-center">
              <Button
                onClick={handleSearch}
                className="bg-landing-accent rounded-lg md:rounded-xl h-11 md:h-12 px-4 md:px-5 hover:bg-landing-accent-hover transition-colors shrink-0 w-full md:w-full flex items-center justify-center gap-2"
                ariaLabel={t("landing.hero.searchAria")}
                suppressHydrationWarning>
                <span suppressHydrationWarning className="text-white font-medium text-sm md:text-base whitespace-nowrap">
                  {t("landing.hero.exploreTours")}
                </span>
                <Icon icon="heroicons-outline:search" className="w-4 h-4 md:w-5 md:h-5 text-white" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
