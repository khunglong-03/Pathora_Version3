# Pathora Homepage — Bold & Immersive Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing Pathora landing page with a bold, dark-first, cinematic redesign featuring video hero, 3D illustrations, scroll animations, and immersive visual design.

**Architecture:** All new "Bold*" components live alongside existing ones. The home page (`page.tsx`) is updated to use only Bold components. Design tokens (CSS variables) are added to `globals.css`. A shared animation hook provides 3D tilt and scroll-triggered effects.

**Tech Stack:** Next.js 16, Tailwind CSS v4, Framer Motion (existing), CSS animations

---

## File Structure

```
frontend/src/
├── app/globals.css                         # ADD: dark theme tokens
├── features/home/
│   ├── components/
│   │   ├── BoldNavbar.tsx                 # CREATE: new navbar variant
│   │   ├── BoldHeroSection.tsx            # CREATE: video hero
│   │   ├── BoldStatsStrip.tsx             # CREATE: count-up stats
│   │   ├── BoldTrendingDestinations.tsx   # CREATE: horizontal scroll
│   │   ├── BoldVideoShowcase.tsx          # CREATE: full-width video
│   │   ├── BoldFeaturedTrips.tsx          # CREATE: bento grid
│   │   ├── BoldLatestTours.tsx            # CREATE: horizontal scroll
│   │   ├── BoldWhyChooseUs.tsx           # CREATE: icon grid
│   │   ├── BoldCtaSection.tsx           # CREATE: gradient CTA
│   │   ├── BoldReviewsSection.tsx        # CREATE: carousel
│   │   └── BoldFooter.tsx                # CREATE: dark footer
│   └── hooks/
│       └── useScrollAnimation.ts          # CREATE: scroll-trigger + 3D tilt
└── app/(user)/home/page.tsx               # MODIFY: use Bold components
```

---

## Chunk 1: Foundation (Design Tokens + Hook)

### Task 1: Add dark theme CSS tokens to globals.css

**Files:**
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Add dark theme CSS variables after existing :root block**

After line ~76 (closing `}` of `:root`), add:

```css
/* ─── Dark Theme Tokens — Bold & Immersive ─── */
:root[data-theme="bold"] {
  /* Backgrounds */
  --bold-bg-primary: #0a0a1a;
  --bold-bg-deepest: #050510;
  --bold-bg-card: #111827;
  --bold-bg-elevated: #1a1a2e;

  /* Accent Colors */
  --bold-accent-orange: #fb8b02;
  --bold-accent-blue: #3b82f6;
  --bold-accent-pink: #ec4899;

  /* Text */
  --bold-text-primary: #ffffff;
  --bold-text-secondary: rgba(255, 255, 255, 0.6);
  --bold-text-muted: rgba(255, 255, 255, 0.4);

  /* Glows */
  --bold-glow-orange: 0 0 20px rgba(251, 139, 2, 0.3);
  --bold-glow-blue: 0 0 20px rgba(59, 130, 246, 0.3);
  --bold-glow-pink: 0 0 20px rgba(236, 72, 153, 0.3);

  /* Shadows */
  --bold-shadow-card: 0 8px 32px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2);
  --bold-shadow-hover: 0 20px 60px rgba(0, 0, 0, 0.4);

  /* Border Radius */
  --bold-radius-card: 16px;
  --bold-radius-section: 24px;
  --bold-radius-pill: 9999px;
}
```

- [ ] **Step 2: Add Google Fonts import for Space Grotesk + Inter**

At the top of `globals.css` (before the existing `@import url('https://fonts.googleapis.com/...')`), add:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
```

- [ ] **Step 3: Add dark theme body styles**

After the existing `:root` block, add:

```css
/* ─── Bold Dark Theme Body ─── */
body.bold-theme {
  background-color: #0a0a1a;
  color: #ffffff;
  font-family: 'Inter', system-ui, sans-serif;
}
```

### Task 2: Create useScrollAnimation hook

**Files:**
- Create: `frontend/src/features/home/hooks/useScrollAnimation.ts`

- [ ] **Step 1: Write the hook**

```typescript
"use client";
import { useRef, useState, useEffect, RefObject } from "react";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useScrollAnimation<T extends HTMLElement>(
  options: UseScrollAnimationOptions = {}
): [RefObject<T | null>, boolean] {
  const { threshold = 0.1, rootMargin = "0px", once = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, isVisible];
}

interface Use3DTiltOptions {
  perspective?: number;
  maxTilt?: number;
}

export function use3DTilt<T extends HTMLElement>(
  options: Use3DTiltOptions = {}
): [RefObject<T | null>, { style: React.CSSProperties }] {
  const { perspective = 1000, maxTilt = 10 } = options;
  const ref = useRef<T>(null);

  const handleMouseMove = (e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  return [
    ref,
    {
      style: { transformStyle: "preserve-3d" as const, transition: "transform 0.3s ease" },
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  ];
}
```

### Task 3: Create count-up animation hook

**Files:**
- Create: `frontend/src/features/home/hooks/useCountUp.ts`

- [ ] **Step 1: Write the count-up hook**

```typescript
"use client";
import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  end: number;
  duration?: number;
  startOnVisible?: boolean;
  suffix?: string;
}

export function useCountUp(
  { end, duration = 2000, startOnVisible = true, suffix = "" }: UseCountUpOptions,
  isVisible: boolean
): string {
  const [count, setCount] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!startOnVisible && !hasStarted.current) {
      hasStarted.current = true;
    } else if (startOnVisible && !isVisible) {
      return;
    }

    hasStarted.current = true;
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, startOnVisible, isVisible]);

  return `${count}${suffix}`;
}
```

---

## Chunk 2: Core Sections

### Task 4: Create BoldNavbar component

**Files:**
- Create: `frontend/src/features/home/components/BoldNavbar.tsx`

- [ ] **Step 1: Write the BoldNavbar component**

```typescript
"use client";
import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { useTranslation } from "react/i18next";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";
import { FiGlobe, FiChevronDown, FiCheck, FiMenu, FiX, FiUser, FiSettings, FiLock, FiLogOut, FiClipboard, FiCalendar, FiArrowRight } from "react-icons/fi";
import dynamic from "next/dynamic";

const AuthModal = dynamic(() => import("@/features/shared/components/AuthModal").then(m => m.AuthModal), { ssr: false });

const navLinks = [
  { labelKey: "landing.nav.home", href: "/home" },
  { labelKey: "landing.nav.aboutUs", href: "/about" },
  { labelKey: "landing.nav.tourPackages", href: "/tours" },
  { labelKey: "landing.nav.ourPolicies", href: "/policies" },
];

export const BoldNavbar = () => {
  const { t, i18n } = useTranslation();
  const { isAuth, user } = useSelector((state: RootState) => state.auth);
  const [scrolled, setScrolled] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"signup" | "login" | "forgot">("signup");

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const normalizedLanguage = (i18n.resolvedLanguage || i18n.language || "en").toLowerCase().split("-")[0];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0a0a1a]/95 backdrop-blur-xl border-b border-white/5 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/home" className="flex items-center shrink-0">
              <span className="text-2xl font-bold text-white font-['Space_Grotesk'] tracking-tight">
                Pathora
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.labelKey}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
                >
                  {mounted ? t(link.labelKey) : link.labelKey}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all text-sm text-white"
              >
                <FiGlobe className="w-4 h-4 text-white/70" />
                <span>{normalizedLanguage.toUpperCase()}</span>
                <FiChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${languageMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {!isAuth && (
                <>
                  <Button
                    onClick={() => { setAuthView("login"); setAuthOpen(true); }}
                    text="Sign In"
                    className="px-5 py-2.5 font-semibold text-sm text-white border border-white/20 rounded-full hover:bg-white/10 transition-all"
                  />
                  <Button
                    onClick={() => { setAuthView("signup"); setAuthOpen(true); }}
                    text="Book Now"
                    className="px-6 py-2.5 bg-[#fb8b02] text-white font-semibold text-sm rounded-full hover:shadow-lg hover:shadow-[#fb8b02]/30 transition-all"
                  />
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm lg:hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-[#0a0a1a] border-l border-white/10 p-6">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold text-white">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.labelKey}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  {mounted ? t(link.labelKey) : link.labelKey}
                </Link>
              ))}
            </nav>
            {!isAuth && (
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  onClick={() => { setAuthView("signup"); setAuthOpen(true); }}
                  text="Book Now"
                  className="w-full py-3 bg-[#fb8b02] text-white font-semibold rounded-full"
                />
              </div>
            )}
          </div>
          <div className="absolute inset-0 -left-full" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <AuthModal
        key={authView}
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialView={authView}
      />
    </>
  );
};
```

### Task 5: Create BoldHeroSection component

**Files:**
- Create: `frontend/src/features/home/components/BoldHeroSection.tsx`

- [ ] **Step 1: Write the BoldHeroSection component**

```typescript
"use client";
import React, { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Icon } from "@/components/ui";
import { BoldNavbar } from "./BoldNavbar";

const HERO_VIDEO = "/hero-video.mp4"; // Placeholder — replace with actual video asset
const HERO_FALLBACK = "/tour-placeholder.svg";

export const BoldHeroSection = () => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden bg-[#0a0a1a]">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? "opacity-40" : "opacity-0"}`}
        />
        {/* Fallback image when video not loaded */}
        {!videoLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e]" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a]/80 via-[#1a0a2e]/60 to-[#0a1a2e]/70" />
      </div>

      {/* Floating Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-64 h-64 rounded-full"
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
              onClick={() => {}}
              text={t("landing.hero.exploreTours") || "Explore"}
              className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-[#fb8b02] to-[#ff9f2d] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#fb8b02]/30 transition-all whitespace-nowrap"
              icon="heroicons-outline:search"
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-8 mt-8 text-white/40 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fb8b02]" />
            1200+ {t("landing.stats.items.totalTours") || "Tours"}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            50K+ {t("landing.stats.items.totalTravellers") || "Travelers"}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899]" />
            4.9★ {t("landing.reviews.rating") || "Rating"}
          </span>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
```

### Task 6: Create BoldStatsStrip component

**Files:**
- Create: `frontend/src/features/home/components/BoldStatsStrip.tsx`

- [ ] **Step 1: Write the BoldStatsStrip component**

```typescript
"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { useCountUp } from "../hooks/useCountUp";

const stats = [
  { value: 1200, suffix: "+", labelKey: "landing.stats.items.totalTours" },
  { value: 50000, suffix: "+", labelKey: "landing.stats.items.totalTravellers" },
  { value: 4.9, suffix: "★", labelKey: "landing.reviews.rating", isDecimal: true },
  { value: 24, suffix: "/7", labelKey: "landing.stats.items.support" },
];

export const BoldStatsStrip = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.3 });

  return (
    <section className="relative py-6 bg-[#0a0a1a] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div
          ref={ref}
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {stats.map((stat, idx) => {
            const countValue = useCountUp(
              { end: stat.value, duration: 2000, suffix: stat.suffix },
              isVisible
            );
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center py-4 md:px-8"
              >
                <span
                  className="text-3xl md:text-4xl font-bold text-white mb-1"
                  style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                >
                  {stat.isDecimal ? stat.value + stat.suffix : countValue}
                </span>
                <span className="text-sm text-white/40 uppercase tracking-wider">
                  {t(stat.labelKey)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
```

### Task 7: Create BoldTrendingDestinations component

**Files:**
- Create: `frontend/src/features/home/components/BoldTrendingDestinations.tsx`

- [ ] **Step 1: Write the BoldTrendingDestinations component**

```typescript
"use client";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { BoldTiltCard } from "./BoldTiltCard";

const destinations = [
  { name: "Hanoi", country: "Vietnam", image: "https://images.unsplash.com/photo-1509030969356-4dd11f51c5e8?w=600&q=80", tours: 120 },
  { name: "Ho Chi Minh City", country: "Vietnam", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80", tours: 95 },
  { name: "Da Nang", country: "Vietnam", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80", tours: 78 },
  { name: "Hue", country: "Vietnam", image: "https://images.unsplash.com/photo-1584979093722-1be5c7c0c35f?w=600&q=80", tours: 45 },
  { name: "Mekong Delta", country: "Vietnam", image: "https://images.unsplash.com/photo-1583425921686-c5daf6b3d820?w=600&q=80", tours: 62 },
];

export const BoldTrendingDestinations = () => {
  const { t } = useTranslation();
  const [titleRef, titleVisible] = useScrollAnimation<HTMLDivElement>();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-20 md:py-28 bg-[#0a0a1a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div
          ref={titleRef}
          className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 transition-all duration-700 ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div>
            <span className="text-sm font-medium text-[#fb8b02] uppercase tracking-widest mb-3 block">
              {t("landing.destinations.eyebrow") || "Explore"}
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              {t("landing.destinations.title") || "Trending Destinations"}
            </h2>
          </div>
          <a
            href="/tours"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium group"
          >
            {t("landing.destinations.viewAll") || "View all destinations"}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>

        {/* Horizontal Scroll Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {destinations.map((dest, idx) => (
            <div
              key={dest.name}
              className="snap-center shrink-0"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <BoldTiltCard
                image={dest.image}
                title={dest.name}
                subtitle={dest.country}
                badge={`${dest.tours} ${t("landing.destinations.tours") || "tours"}`}
                href="/tours"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
```

### Task 8: Create BoldTiltCard shared component

**Files:**
- Create: `frontend/src/features/home/components/BoldTiltCard.tsx`

- [ ] **Step 1: Write the BoldTiltCard component**

```typescript
"use client";
import React, { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface BoldTiltCardProps {
  image: string;
  title: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  href: string;
  height?: string;
  width?: string;
}

export const BoldTiltCard = ({
  image,
  title,
  subtitle,
  badge,
  price,
  href,
  height = "h-[360px]",
  width = "w-[280px]",
}: BoldTiltCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    setIsHovered(false);
  }, []);

  return (
    <Link href={href}>
      <div
        ref={cardRef}
        className={`${width} ${height} relative rounded-2xl overflow-hidden cursor-pointer group transition-shadow duration-300`}
        style={{ transformStyle: "preserve-3d", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background Image */}
        <Image
          src={image}
          alt={title}
          fill
          sizes="280px"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Hover Glassmorphism Overlay */}
        <div
          className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        />

        {/* Glow border on hover */}
        <div
          className={`absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          style={{ boxShadow: "inset 0 0 20px rgba(251,139,2,0.15)" }}
        />

        {/* Badge */}
        {badge && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#fb8b02]/90 text-white text-xs font-semibold backdrop-blur-sm">
            {badge}
          </div>
        )}

        {/* Price */}
        {price && (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-semibold">
            {price}
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-white/60 text-sm flex items-center gap-1">
              <span>📍</span> {subtitle}
            </p>
          )}
          {/* CTA reveal on hover */}
          <div
            className={`transition-all duration-300 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          >
            <span className="inline-flex items-center gap-2 mt-3 text-[#fb8b02] text-sm font-semibold">
              Explore <span>→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
```

### Task 9: Create BoldVideoShowcase component

**Files:**
- Create: `frontend/src/features/home/components/BoldVideoShowcase.tsx`

- [ ] **Step 1: Write the BoldVideoShowcase component**

```typescript
"use client";
import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { Icon } from "@/components/ui";

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
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#ec4899]/5 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-[#3b82f6]/5 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8">
          {/* Section Label */}
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-medium uppercase tracking-widest">
              {t("landing.videoShowcase.label") || "Experience Vietnam"}
            </span>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#111827] border border-white/10">
            <video
              ref={videoRef}
              src={SHOWCASE_VIDEO}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              muted
              playsInline
              onEnded={() => setIsPlaying(false)}
            />

            {/* Fallback gradient when no video */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0a1a2e] to-[#1a0a2e]" />

            {/* Play Button */}
            {!isPlaying && (
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center group cursor-pointer"
              >
                <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300"
                  style={{ boxShadow: "0 0 40px rgba(251,139,2,0.2)" }}
                >
                  <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-2" />
                </div>
              </button>
            )}

            {/* Expand button */}
            <button
              onClick={handleFullscreen}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
            >
              <Icon icon="heroicons-outline:arrows-expand" className="w-5 h-5" />
            </button>
          </div>

          {/* Caption */}
          <p className="text-center mt-6 text-xl md:text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            {t("landing.videoShowcase.caption") || "Vietnam Awaits"}
          </p>
          <p className="text-center mt-2 text-white/50 text-sm">
            {t("landing.videoShowcase.subcaption") || "Discover breathtaking landscapes and rich cultural heritage"}
          </p>
        </div>
      </section>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center">
          <button
            onClick={closeFullscreen}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <Icon icon="heroicons-outline:x" className="w-6 h-6" />
          </button>
          <video
            src={SHOWCASE_VIDEO}
            className="w-full h-full object-contain"
            controls
            autoPlay
          />
        </div>
      )}
    </>
  );
};
```

---

## Chunk 3: Remaining Sections

### Task 10: Create BoldFeaturedTrips (Bento Grid) component

**Files:**
- Create: `frontend/src/features/home/components/BoldFeaturedTrips.tsx`

- [ ] **Step 1: Write the BoldFeaturedTrips component**

```typescript
"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { BoldTiltCard } from "./BoldTiltCard";

const featuredTours = [
  {
    id: 1,
    name: "Ha Long Bay 3-Day Adventure",
    duration: "3 days",
    price: "$299",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
    size: "large", // 2-col wide
  },
  {
    id: 2,
    name: "Sapa Mountain Trek",
    duration: "2 days",
    price: "$149",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80",
    size: "medium",
  },
  {
    id: 3,
    name: "Mekong Delta Explorer",
    duration: "4 days",
    price: "$399",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1583425921686-c5daf6b3d820?w=600&q=80",
    size: "medium",
  },
  {
    id: 4,
    name: "Hue Imperial City Tour",
    duration: "1 day",
    price: "$89",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1584979093722-1be5c7c0c35f?w=800&q=80",
    size: "wide",
  },
];

export const BoldFeaturedTrips = () => {
  const { t } = useTranslation();
  const [titleRef, titleVisible] = useScrollAnimation<HTMLDivElement>();
  const [gridRef, gridVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section className="py-20 md:py-28 bg-[#0a0a1a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div
          ref={titleRef}
          className={`text-center mb-14 transition-all duration-700 ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="text-sm font-medium text-[#ec4899] uppercase tracking-widest">
            {t("landing.featured.eyebrow") || "Handpicked"}
          </span>
          <h2
            className="mt-3 text-4xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            {t("landing.featured.title") || "Featured Adventures"}
          </h2>
        </div>

        {/* Bento Grid */}
        <div
          ref={gridRef}
          className={`grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[300px] transition-all duration-1000 ${
            gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {featuredTours.map((tour) => {
            const sizeClass =
              tour.size === "large"
                ? "md:col-span-2 row-span-2"
                : tour.size === "wide"
                  ? "md:col-span-2"
                  : "";

            return (
              <div key={tour.id} className={sizeClass}>
                <BoldTiltCard
                  image={tour.image}
                  title={tour.name}
                  subtitle={tour.duration}
                  badge={`${tour.rating}★`}
                  price={tour.price}
                  href="/tours"
                  height={tour.size === "large" ? "h-full" : "h-[300px]"}
                  width="w-full"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
```

### Task 11: Create BoldLatestTours component

**Files:**
- Create: `frontend/src/features/home/components/BoldLatestTours.tsx`

- [ ] **Step 1: Write the BoldLatestTours component**

```typescript
"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { Button } from "@/components/ui";
import Image from "next/image";

const latestTours = [
  { name: "Ninh Binh Boat Tour", price: "$79", image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80" },
  { name: "Phu Quoc Island Escape", price: "$199", image: "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=400&q=80" },
  { name: "Hoi An Lantern Night", price: "$59", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80" },
  { name: "Cu Chi Tunnels Adventure", price: "$49", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=80" },
  { name: "Da Lat Flower Garden", price: "$69", image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&q=80" },
];

export const BoldLatestTours = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="py-20 md:py-28 bg-[#050510]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div
          className={`flex items-end justify-between mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div>
            <span className="text-sm font-medium text-[#3b82f6] uppercase tracking-widest">
              {t("landing.latest.eyebrow") || "Just Added"}
            </span>
            <h2
              className="mt-3 text-4xl md:text-5xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              {t("landing.latest.title") || "Latest Tours"}
            </h2>
          </div>
          <Button
            link="/tours"
            text={t("landing.latest.viewAll") || "View all"}
            icon="heroicons-outline:arrow-right"
            iconPosition="right"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white/10 transition-all text-sm"
          />
        </div>

        {/* Horizontal Scroll */}
        <div
          ref={ref}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {latestTours.map((tour, idx) => (
            <a
              key={idx}
              href="/tours"
              className="snap-center shrink-0 w-64 group"
            >
              <div className="relative h-40 rounded-xl overflow-hidden mb-3 bg-[#111827]">
                <Image
                  src={tour.image}
                  alt={tour.name}
                  fill
                  sizes="256px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-[#fb8b02]/90 text-white text-xs font-semibold">
                  {tour.price}
                </div>
              </div>
              <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-[#fb8b02] transition-colors">
                {tour.name}
              </h3>
              <p className="text-white/40 text-xs flex items-center gap-1">
                View details <span className="group-hover:translate-x-1 transition-transform">→</span>
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
```

### Task 12: Create BoldWhyChooseUs component

**Files:**
- Create: `frontend/src/features/home/components/BoldWhyChooseUs.tsx`

- [ ] **Step 1: Write the BoldWhyChooseUs component**

```typescript
"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const features = [
  {
    icon: "🏆",
    titleKey: "landing.whyChoose.items.price.title",
    descKey: "landing.whyChoose.items.price.desc",
    color: "#fb8b02",
  },
  {
    icon: "🧭",
    titleKey: "landing.whyChoose.items.guides.title",
    descKey: "landing.whyChoose.items.guides.desc",
    color: "#3b82f6",
  },
  {
    icon: "💬",
    titleKey: "landing.whyChoose.items.support.title",
    descKey: "landing.whyChoose.items.support.desc",
    color: "#ec4899",
  },
  {
    icon: "🔄",
    titleKey: "landing.whyChoose.items.flexible.title",
    descKey: "landing.whyChoose.items.flexible.desc",
    color: "#fb8b02",
  },
];

export const BoldWhyChooseUs = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="py-20 md:py-28 bg-[#0a0a1a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="text-sm font-medium text-white/40 uppercase tracking-widest">
            {t("landing.whyChoose.eyebrow") || "Why Pathora"}
          </span>
          <h2
            className="mt-3 text-4xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            {t("landing.whyChoose.title") || "Why Choose Us"}
          </h2>
        </div>

        {/* 4-Column Grid */}
        <div
          ref={ref}
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#111827]/50 border border-white/5 hover:border-white/10 hover:bg-[#111827]/80 transition-all duration-300 group text-center"
            >
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
              >
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">
                {t(feature.titleKey)}
              </h3>
              <p className="text-white/40 text-xs leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
```

### Task 13: Create BoldCtaSection component

**Files:**
- Create: `frontend/src/features/home/components/BoldCtaSection.tsx`

- [ ] **Step 1: Write the BoldCtaSection component**

```typescript
"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { Button } from "@/components/ui";

export const BoldCtaSection = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.3 });

  return (
    <section
      ref={ref}
      className={`relative py-24 md:py-32 overflow-hidden transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        background: "linear-gradient(135deg, #fb8b02, #ec4899, #3b82f6)",
      }}
    >
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatParticle ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-3xl mx-auto px-4 md:px-8 text-center">
        <h2
          className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        >
          {t("landing.cta.title") || "Ready for Your Next Adventure?"}
        </h2>
        <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
          {t("landing.cta.subtitle") || "Join thousands of travelers discovering Vietnam's hidden gems with Pathora."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            link="/tours"
            text={t("landing.cta.ctaButton") || "Explore Tours"}
            className="px-10 py-4 bg-white text-[#0a0a1a] font-bold rounded-full hover:shadow-2xl hover:shadow-black/20 transition-all text-base"
          />
          <Button
            link="/about"
            text={t("landing.cta.secondaryButton") || "Learn More"}
            className="px-10 py-4 bg-white/10 text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all text-base backdrop-blur-sm"
          />
        </div>
      </div>

      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(10px, -20px); opacity: 0.7; }
        }
      `}</style>
    </section>
  );
};
```

### Task 14: Create BoldReviewsSection component

**Files:**
- Create: `frontend/src/features/home/components/BoldReviewsSection.tsx`

- [ ] **Step 1: Write the BoldReviewsSection component**

```typescript
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const reviews = [
  {
    name: "Sarah Johnson",
    location: "United Kingdom",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    rating: 5,
    text: "Absolutely incredible experience! The Ha Long Bay tour exceeded all expectations. The guides were knowledgeable and the scenery was breathtaking.",
  },
  {
    name: "Michael Chen",
    location: "Singapore",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    rating: 5,
    text: "Pathora made planning our Vietnam trip effortless. The booking process was smooth and the tours were well-organized. Highly recommended!",
  },
  {
    name: "Emma Williams",
    location: "Australia",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    rating: 5,
    text: "Best travel experience ever! The local guides gave us insights we never would have gotten on our own. Every detail was perfect.",
  },
];

export const BoldReviewsSection = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleMouseEnter = () => clearInterval(intervalRef.current);
  const handleMouseLeave = () => {
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

        {/* Review Cards */}
        <div className="relative">
          {reviews.map((review, idx) => (
            <div
              key={idx}
              className={`transition-all duration-700 ${
                idx === activeIndex
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
              }`}
            >
              <div className="p-8 md:p-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <span key={i} className="text-[#fb8b02] text-lg">★</span>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-white/80 text-lg md:text-xl leading-relaxed mb-8 italic">
                  "{review.text}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img
                    src={review.avatar}
                    alt={review.name}
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
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? "w-6 bg-[#fb8b02]"
                  : "bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
```

### Task 15: Create BoldFooter component

**Files:**
- Create: `frontend/src/features/home/components/BoldFooter.tsx`

- [ ] **Step 1: Write the BoldFooter component**

```typescript
"use client";
import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export const BoldFooter = () => {
  const { t } = useTranslation();

  const columns = [
    {
      title: "Pathora",
      links: [
        { label: t("landing.footer.about") || "About", href: "/about" },
        { label: t("landing.footer.tours") || "Tours", href: "/tours" },
        { label: t("landing.footer.blog") || "Blog", href: "#" },
        { label: t("landing.footer.careers") || "Careers", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: t("landing.footer.help") || "Help Center", href: "#" },
        { label: t("landing.footer.contact") || "Contact", href: "#" },
        { label: t("landing.footer.faq") || "FAQ", href: "#" },
        { label: t("landing.footer.policies") || "Policies", href: "/policies" },
      ],
    },
    {
      title: t("landing.footer.destinations") || "Destinations",
      links: [
        { label: "Hanoi", href: "/tours?destination=Hanoi" },
        { label: "Ho Chi Minh City", href: "/tours?destination=HCMC" },
        { label: "Da Nang", href: "/tours?destination=DaNang" },
        { label: "Hue", href: "/tours?destination=Hue" },
      ],
    },
  ];

  return (
    <footer className="bg-[#050510] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div>
            <Link href="/home" className="inline-block mb-4">
              <span
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                Pathora
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              {t("landing.footer.tagline") || "Vietnam's premier travel platform. Discover hidden gems, curated tours, and unforgettable adventures."}
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {["twitter", "facebook", "instagram", "youtube"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#fb8b02] hover:border-[#fb8b02]/30 transition-all"
                >
                  <span className="text-xs capitalize">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/40 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              {t("landing.footer.newsletter") || "Stay Updated"}
            </h4>
            <p className="text-white/40 text-sm mb-4">
              {t("landing.footer.newsletterDesc") || "Get the latest travel deals and updates."}
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2"
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 outline-none focus:border-[#fb8b02]/50 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#fb8b02] text-white text-sm font-semibold rounded-lg hover:bg-[#e67d00] transition-colors"
              >
                →
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} Pathora. {t("landing.footer.copyright") || "All rights reserved."}
          </p>
          <div className="flex gap-6 text-white/30 text-sm">
            <a href="#" className="hover:text-white transition-colors">
              {t("landing.footer.privacy") || "Privacy"}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {t("landing.footer.terms") || "Terms"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
```

---

## Chunk 4: Page Integration + Export

### Task 16: Update home page to use Bold components

**Files:**
- Modify: `frontend/src/app/(user)/home/page.tsx`

- [ ] **Step 1: Replace all imports and sections**

Replace the entire imports + component list section with:

```typescript
import type { Metadata } from "next";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Discover Amazing Tours | Pathora",
  description:
    "Explore curated tour packages across Vietnam and Asia. Book guided tours, custom itineraries, and discover trending destinations with Pathora.",
  keywords: ["tours", "Vietnam travel", "Asia tours", "travel packages", "guided tours"],
  openGraph: {
    title: "Discover Amazing Tours | Pathora",
    description:
      "Explore curated tour packages across Vietnam and Asia. Book guided tours, custom itineraries, and discover trending destinations.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

// All Bold components — no lazy loading needed for this redesign
import {
  BoldHeroSection,
  BoldStatsStrip,
  BoldTrendingDestinations,
  BoldVideoShowcase,
  BoldFeaturedTrips,
  BoldLatestTours,
  BoldWhyChooseUs,
  BoldCtaSection,
  BoldReviewsSection,
  BoldFooter,
} from "@/features/home/components";

const SectionSkeleton = ({ className }: { className: string }) => {
  return (
    <div
      aria-hidden="true"
      className={`mx-auto w-full max-w-7xl rounded-2xl bg-white/5 animate-pulse ${className}`}
    />
  );
};

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="bold-theme min-h-screen overflow-x-hidden"
    >
      {/* Hero */}
      <BoldHeroSection />

      {/* Stats Strip */}
      <BoldStatsStrip />

      {/* Trending Destinations */}
      <Suspense fallback={<SectionSkeleton className="h-96" />}>
        <BoldTrendingDestinations />
      </Suspense>

      {/* Video Showcase */}
      <Suspense fallback={<SectionSkeleton className="h-[500px]" />}>
        <BoldVideoShowcase />
      </Suspense>

      {/* Featured Trips (Bento Grid) */}
      <Suspense fallback={<SectionSkeleton className="h-[800px]" />}>
        <BoldFeaturedTrips />
      </Suspense>

      {/* Latest Tours */}
      <Suspense fallback={<SectionSkeleton className="h-72" />}>
        <BoldLatestTours />
      </Suspense>

      {/* Why Choose Us */}
      <Suspense fallback={<SectionSkeleton className="h-64" />}>
        <BoldWhyChooseUs />
      </Suspense>

      {/* CTA */}
      <Suspense fallback={<SectionSkeleton className="h-64" />}>
        <BoldCtaSection />
      </Suspense>

      {/* Reviews */}
      <Suspense fallback={<SectionSkeleton className="h-80" />}>
        <BoldReviewsSection />
      </Suspense>

      {/* Footer */}
      <Suspense fallback={<SectionSkeleton className="h-64" />}>
        <BoldFooter />
      </Suspense>
    </main>
  );
}
```

### Task 17: Update features/home/components/index.ts

**Files:**
- Modify: `frontend/src/features/home/components/index.ts`

- [ ] **Step 1: Add Bold component exports**

Add the following exports to the barrel file:

```typescript
export { BoldNavbar } from "./BoldNavbar";
export { BoldHeroSection } from "./BoldHeroSection";
export { BoldStatsStrip } from "./BoldStatsStrip";
export { BoldTrendingDestinations } from "./BoldTrendingDestinations";
export { BoldVideoShowcase } from "./BoldVideoShowcase";
export { BoldFeaturedTrips } from "./BoldFeaturedTrips";
export { BoldLatestTours } from "./BoldLatestTours";
export { BoldWhyChooseUs } from "./BoldWhyChooseUs";
export { BoldCtaSection } from "./BoldCtaSection";
export { BoldReviewsSection } from "./BoldReviewsSection";
export { BoldFooter } from "./BoldFooter";
export { BoldTiltCard } from "./BoldTiltCard";
```

### Task 18: Update i18n locale files

**Files:**
- Modify: `frontend/src/i18n/locales/en.json`
- Modify: `frontend/src/i18n/locales/vi.json`

- [ ] **Step 1: Add new translation keys for new sections**

Add to both `en.json` and `vi.json`:

```json
{
  "landing": {
    "hero": {
      "eyebrow": "Vietnam's Premier Travel Platform",
      "searchPlaceholder": "Where do you want to go?"
    },
    "destinations": {
      "eyebrow": "Explore",
      "title": "Trending Destinations",
      "viewAll": "View all destinations",
      "tours": "tours"
    },
    "videoShowcase": {
      "label": "Experience Vietnam",
      "caption": "Vietnam Awaits",
      "subcaption": "Discover breathtaking landscapes and rich cultural heritage"
    },
    "featured": {
      "eyebrow": "Handpicked",
      "title": "Featured Adventures"
    },
    "latest": {
      "eyebrow": "Just Added",
      "title": "Latest Tours",
      "viewAll": "View all"
    },
    "whyChoose": {
      "eyebrow": "Why Pathora",
      "title": "Why Choose Us",
      "items": {
        "price": { "title": "Best Price", "desc": "Guaranteed lowest prices on all tours" },
        "guides": { "title": "Expert Guides", "desc": "Local experts with deep knowledge" },
        "support": { "title": "24/7 Support", "desc": "Always here when you need us" },
        "flexible": { "title": "Flexible Booking", "desc": "Free cancellation up to 24 hours" }
      }
    },
    "cta": {
      "title": "Ready for Your Next Adventure?",
      "subtitle": "Join thousands of travelers discovering Vietnam's hidden gems with Pathora.",
      "ctaButton": "Explore Tours",
      "secondaryButton": "Learn More"
    },
    "reviews": {
      "eyebrow": "Testimonials",
      "title": "What Travelers Say",
      "rating": "Rating"
    },
    "footer": {
      "about": "About",
      "tours": "Tours",
      "blog": "Blog",
      "careers": "Careers",
      "help": "Help Center",
      "contact": "Contact",
      "faq": "FAQ",
      "policies": "Policies",
      "destinations": "Destinations",
      "tagline": "Vietnam's premier travel platform. Discover hidden gems, curated tours, and unforgettable adventures.",
      "newsletter": "Stay Updated",
      "newsletterDesc": "Get the latest travel deals and updates.",
      "copyright": "All rights reserved.",
      "privacy": "Privacy",
      "terms": "Terms"
    }
  }
}
```

---

## Verification Commands

After implementing, run these to verify:

```bash
# Build check
npm run build --prefix pathora/frontend

# Type check
npx tsc --noEmit --prefix pathora/frontend

# Dev server
npm run dev --prefix pathora/frontend
# Visit http://localhost:3001/home

# Lint
npm run lint --prefix pathora/frontend
```
