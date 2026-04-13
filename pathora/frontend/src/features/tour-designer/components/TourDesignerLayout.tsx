"use client";

import React, { useState } from "react";
import { TourDesignerSidebar } from "./TourDesignerSidebar";

interface Props {
  children: React.ReactNode;
}

export function TourDesignerLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <TourDesignerSidebar />
      <main className="flex-1 p-6 lg:py-8 lg:pr-8 lg:pl-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}