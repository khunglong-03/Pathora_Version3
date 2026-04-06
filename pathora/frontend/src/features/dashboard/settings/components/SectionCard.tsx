"use client";

import React from "react";

export function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[2rem] border border-border shadow-card overflow-hidden">
      {children}
    </div>
  );
}
