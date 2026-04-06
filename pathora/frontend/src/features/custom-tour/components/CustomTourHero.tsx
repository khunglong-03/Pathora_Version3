"use client";
import React from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

interface CustomTourHeroProps {
  title: string;
  subtitle: string;
  backLabel: string;
}

export function CustomTourHero({ title, subtitle, backLabel }: CustomTourHeroProps) {
  return (
    <section className="relative bg-linear-to-br from-[#05073c] via-[#1a1c5e] to-[#05073c] text-white py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#fa8b02] rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#eb662b] rounded-full blur-[150px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
          <span className="text-sm">{backLabel}</span>
        </Link>
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">{title}</h1>
        <p className="text-lg text-white/70 max-w-2xl mx-auto">{subtitle}</p>
      </div>
    </section>
  );
}
