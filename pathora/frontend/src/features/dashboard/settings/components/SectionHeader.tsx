"use client";

import React from "react";

export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-8 pt-6 pb-4 border-b border-border">
      <h3 className="text-lg font-bold text-stone-900 tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-stone-400 font-medium uppercase tracking-widest">{subtitle}</p>
    </div>
  );
}
