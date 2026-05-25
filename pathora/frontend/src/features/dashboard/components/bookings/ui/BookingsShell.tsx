import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { SPRING, EASE_BENTO, CSS } from "../BookingsPageData";

/* ── Soft-Skill: Double-Bezel Shell ─────────────────────────────── */
export function CardShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[1.5rem] ${className}`}
      style={{
        background: "linear-gradient(145deg, rgba(68,64,60,0.06) 0%, rgba(68,64,60,0.014) 100%)",
        boxShadow: "0 24px 70px -38px rgba(68,64,60,0.5), 0 4px 12px rgba(68,64,60,0.04)",
      }}
    >
      <div className="absolute inset-0 rounded-[1.5rem] pointer-events-none" style={{ border: "1px solid rgba(0,0,0,0.04)" }} />
      <div className="relative rounded-[1.25rem] h-full overflow-hidden" style={{ backgroundColor: CSS.surface }}>
        {children}
      </div>
    </div>
  );
}

/* ── Soft-Skill: Eyebrow ──────────────────────────────────────── */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-[9px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full mb-3"
      style={{ color: CSS.accent, backgroundColor: `${CSS.accent}10`, border: `1px solid ${CSS.accent}18` }}
    >
      {children}
    </span>
  );
}

/* ── Soft-Skill: Scroll Reveal ─────────────────────────────────── */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: "blur(8px)", y: 28 }}
      animate={isInView ? { opacity: 1, filter: "blur(0px)", y: 0 } : {}}
      transition={{ duration: 0.82, ease: EASE_BENTO, delay: delay * 0.07 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Soft-Skill: Spring Card ─────────────────────────────────────── */
export const SpringCard = React.memo(function SpringCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -3, boxShadow: CSS.shadowCard }}
      transition={SPRING}
    >
      {children}
    </motion.div>
  );
});

/* ── Taste-Skill: Breathing Dot ────────────────────────────────── */
export const BreathingDot = React.memo(function BreathingDot({ color }: { color: string }) {
  return (
    <span className="relative inline-flex shrink-0">
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.4 }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative w-2 h-2 rounded-full block" style={{ backgroundColor: color }} />
    </span>
  );
});
