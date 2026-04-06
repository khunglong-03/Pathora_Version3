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
              left: `${(i * 8) % 100}%`,
              top: `${(i * 13) % 100}%`,
              animation: `floatParticle ${3 + (i % 4)}s ease-in-out infinite ${(i % 3)}s`,
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
