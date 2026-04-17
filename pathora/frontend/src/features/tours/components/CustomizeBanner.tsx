"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";

export const CustomizeBanner = () => {
  const { t } = useTranslation();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const safeT = (key: string, fallback: string) => {
    return mounted ? t(key, fallback) : fallback;
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-[2rem] p-6 text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 group">
      {/* Decorative gradient blob */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#fa8b02]/10 rounded-full blur-[3xl] group-hover:bg-[#fa8b02]/20 transition-colors duration-500" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-[1rem] bg-slate-50 flex items-center justify-center shrink-0 mb-4 border border-slate-100">
          <Icon icon="heroicons-outline:sparkles" className="w-6 h-6 text-[#fa8b02]" />
        </div>
        
        <h3 className="font-bold text-xl mb-2 tracking-tight">
          {safeT("landing.tourDiscovery.customizeYourTour", "Customize Your Tour")}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">
          {safeT("landing.tourDiscovery.customizeDescription", "Can't find what you're looking for? Let us arrange a personalized tour just for you!")}
        </p>
        
        <Link
          href="/tours/custom"
          className="inline-flex w-full items-center justify-center gap-2 bg-[#fa8b02] text-white font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#e67a00] transition-colors"
        >
          {safeT("landing.tourDiscovery.createCustomTour", "Create Custom Tour")}
          <Icon icon="heroicons-outline:arrow-right" className="w-4 h-4 text-white" />
        </Link>
      </div>
    </div>
  );
};
