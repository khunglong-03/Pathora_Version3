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
    <div className="bg-linear-to-r from-[#fa8b02] to-[#ff9f2d] rounded-xl p-5 text-white">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Icon icon="heroicons-outline:sparkles" className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-base mb-1">
            {safeT("landing.tourDiscovery.customizeYourTour", "Customize Your Tour")}
          </h3>
          <p className="text-sm text-white/80">
            {safeT("landing.tourDiscovery.customizeDescription", "Can't find what you're looking for? Let us arrange a personalized tour just for you!")}
          </p>
        </div>
      </div>
      <Link
        href="/tours/custom"
        className="inline-flex items-center gap-2 bg-white text-[#fa8b02] font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-white/90 transition-colors"
      >
        {safeT("landing.tourDiscovery.createCustomTour", "Create Custom Tour")}
        <Icon icon="heroicons-outline:arrow-right" className="w-4 h-4" />
      </Link>
    </div>
  );
};
