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
        className={`${width} ${height} relative rounded-2xl overflow-hidden cursor-pointer group`}
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
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

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
