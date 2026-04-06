import React from "react";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 5, className = "" }: SkeletonTableProps) {
  const columnWidths = Array.from({ length: columns }, (_, i) => {
    if (i === 0) return "w-[20%]";
    if (i === columns - 1) return "w-[15%]";
    return "w-[15%]";
  });

  return (
    <div className={`rounded-xl border border-stone-200 bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-stone-100 bg-stone-50/50">
        {columnWidths.map((w, i) => (
          <div key={i} className={`skeleton h-3 ${w} rounded`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-stone-50 last:border-0">
          {columnWidths.map((w, colIdx) => (
            <div key={colIdx} className={`skeleton h-3 ${w} rounded`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkeletonTable;
