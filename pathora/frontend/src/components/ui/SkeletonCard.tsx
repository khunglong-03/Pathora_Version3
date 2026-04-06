import React from "react";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className = "", lines = 3 }: SkeletonCardProps) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-5 ${className}`}>
      <div className="skeleton h-4 w-1/3 rounded mb-3" />
      <div className="skeleton h-8 w-1/2 rounded mb-2" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="skeleton h-3 w-full rounded mb-2" />
      ))}
    </div>
  );
}

export default SkeletonCard;
