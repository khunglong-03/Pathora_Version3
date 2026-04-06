"use client";

import { useState, type ReactNode } from "react";
import Icon from "@/components/ui/Icon";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className = "",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-[1.5rem] border border-stone-200 bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.06)] ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4 text-start transition-colors hover:bg-stone-50 rounded-[1.5rem]"
      >
        <h3 className="text-base font-bold text-stone-900">{title}</h3>
        <Icon
          icon="heroicons:chevron-down"
          className={`size-5 text-stone-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="px-5 pb-5">{children}</div>
      )}
    </div>
  );
}
