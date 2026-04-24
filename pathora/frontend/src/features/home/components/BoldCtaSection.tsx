"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

export const BoldCtaSection = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.3 });

  return (
    <section
      ref={ref}
      className={`relative py-32 md:py-48 overflow-hidden transition-all duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0"
      } bg-stone-950 text-white`}
    >
      {/* Background gradients for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-stone-950/0 to-stone-950/0" />
        <div className="absolute top-1/2 right-0 w-[80%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-stone-950/0 to-stone-950/0" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
        <h2
          suppressHydrationWarning
          className={`text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter mb-8 leading-[1.05] transition-all duration-1000 delay-100 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {t("landing.cta.title") || "Ready for Your Next Adventure?"}
        </h2>
        
        <p 
          className={`text-stone-300 text-xl md:text-2xl font-medium mb-16 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {t("landing.cta.subtitle") || "Join thousands of travelers discovering the world's hidden gems with Pathora."}
        </p>
        
        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-5 transition-all duration-1000 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <Link
            href="/tours"
            className="flex items-center justify-center gap-3 px-10 py-4 bg-white text-stone-950 font-bold rounded-[1.5rem] hover:bg-stone-200 hover:scale-105 active:scale-95 transition-all duration-300 text-[17px] shadow-xl shadow-white/10 w-full sm:w-auto group"
          >
            {t("landing.cta.ctaButton") || "Explore Tours"}
            <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            href="/about"
            className="flex items-center justify-center px-10 py-4 bg-stone-900 text-white font-bold rounded-[1.5rem] border border-white/10 hover:bg-stone-800 hover:border-white/30 transition-all duration-300 text-[17px] w-full sm:w-auto"
          >
            {t("landing.cta.secondaryButton") || "Learn More"}
          </Link>
        </div>
      </div>
    </section>
  );
};
