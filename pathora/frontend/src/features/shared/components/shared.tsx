"use client";
import { Button, Icon } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState, useCallback } from "react";

/* ── Section Container ─────────────────────────────────────── */
export const SectionContainer = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`max-w-330 mx-auto px-4 md:px-3.75 ${className}`}>
    {children}
  </div>
);

/* ── ScrollReveal — fade-up on viewport entry ─────────────── */
export const ScrollReveal = ({
  children,
  className = "",
  delay = 0,
  threshold = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visible
          ? "opacity-100 translate-y-0 blur-0"
          : "opacity-0 translate-y-8 blur-[2px]"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ── AnimatedCounter — count up on viewport entry ─────────── */
export const AnimatedCounter = ({
  end,
  duration = 2000,
  suffix = "",
  prefix = "",
  className = "",
}: {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

/* ── Eyebrow Tag — microscopic pill badge ─────────────────── */
export const EyebrowTag = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-block rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold bg-[#fa8b02]/10 text-[#fa8b02] ${className}`}
  >
    {children}
  </span>
);

/* ── Nav Arrows ────────────────────────────────────────────── */
export const NavArrows = ({
  size = 10,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
}: {
  size?: 10 | 11;
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
}) => {
  const { t } = useTranslation();
  const dim = size === 11 ? "w-11.25 h-11.25" : "w-10 h-10";
  const resolvedPrevLabel = prevLabel ?? t("common.previous");
  const resolvedNextLabel = nextLabel ?? t("common.next");
  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onPrev}
        className={`${dim} rounded-full border border-landing-border flex items-center justify-center hover:bg-landing-accent hover:border-landing-accent transition-colors group bg-transparent`}
        icon="heroicons-outline:chevron-left"
        iconClass="text-[20px] text-landing-body group-hover:text-white transition-colors"
        ariaLabel={resolvedPrevLabel}
      />
      <Button
        onClick={onNext}
        className={`${dim} rounded-full border border-landing-border flex items-center justify-center hover:bg-landing-accent hover:border-landing-accent transition-colors group bg-transparent`}
        icon="heroicons-outline:chevron-right"
        iconClass="text-[20px] text-landing-body group-hover:text-white transition-colors"
        ariaLabel={resolvedNextLabel}
      />
    </div>
  );
};

/* ── Star Rating ───────────────────────────────────────────── */
export const StarRating = ({
  count,
  size = "sm",
}: {
  count: number;
  size?: "sm" | "md";
}) => {
  const { t } = useTranslation();
  const cls = size === "md" ? "w-4 h-4" : "w-2.5 h-2.5";
  const gap = size === "md" ? "gap-1" : "gap-0.5";
  const color = size === "md" ? "text-landing-accent" : "text-[#e2ad64]";
  return (
    <div
      className={`flex items-center ${gap}`}
      role="img"
      aria-label={t("landing.common.starsAria", { count })}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Icon
          key={i}
          icon="heroicons-solid:star"
          className={`${cls} ${color}`}
        />
      ))}
    </div>
  );
};
