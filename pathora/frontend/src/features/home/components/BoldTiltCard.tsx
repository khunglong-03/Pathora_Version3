"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

interface BoldTiltCardProps {
  image: string;
  title: string;
  subtitle?: string;
  badge?: string;
  visaRequired?: boolean;
  visaLabel?: string;
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
  visaRequired = false,
  visaLabel,
  price,
  href,
  height = "h-[360px]",
  width = "w-[280px]",
}: BoldTiltCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={href} className={cn("block group")}>
      <div
        className={`${width} ${height} relative rounded-[1.5rem] overflow-hidden bg-stone-100 transition-all duration-500`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background Image */}
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className={cn("object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105")}
          />
        ) : (
          <div className={cn("absolute inset-0 bg-stone-200 transition-transform duration-[1.5s] group-hover:scale-105")} />
        )}

        {/* Gradient Overlay for legibility */}
        <div className={cn("absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent transition-opacity duration-500 group-hover:opacity-90")} />

        {/* Top Badges */}
        <div className={cn("absolute top-4 left-4 right-4 flex justify-between items-start")}>
          <div className={cn("v-stack gap-2")}>
            {badge && (
              <span className={cn("inline-flex items-center px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-stone-900 text-[11px] font-bold uppercase tracking-wider shadow-sm")}>
                {badge}
              </span>
            )}
            {visaRequired && visaLabel && (
              <span className={cn("inline-flex items-center px-3 py-1 rounded-full bg-orange-50/95 backdrop-blur-md text-orange-700 text-[11px] font-bold uppercase tracking-wider shadow-sm")}>
                {visaLabel}
              </span>
            )}
          </div>
          {price && (
            <span className={cn("inline-flex items-center px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-bold tracking-wider border border-white/10 shadow-sm")}>
              {price}
            </span>
          )}
        </div>

        {/* Content */}
        <div className={cn("absolute bottom-0 left-0 right-0 p-6 v-stack justify-end")}>
          <h3 className={cn("text-2xl font-bold text-white mb-2 leading-tight tracking-tight drop-shadow-sm")}>
            {title}
          </h3>
          
          <div className={cn("flex items-center justify-between")}>
            {subtitle && (
              <p className={cn("text-stone-300 text-[13px] font-medium flex items-center gap-1.5 uppercase tracking-wide")}>
                <MapPinIcon size={14} weight="bold" className={cn("text-stone-400")} /> {subtitle}
              </p>
            )}
            
            {/* CTA Arrow */}
            <div
              className={`center w-8 h-8 rounded-full bg-white text-stone-900 transition-all duration-300 ease-out ${
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
            >
              <ArrowRight size={14} weight="bold" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
