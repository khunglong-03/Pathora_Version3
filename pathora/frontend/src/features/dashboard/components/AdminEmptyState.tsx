"use client";

import React from "react";
import Icon from "@/components/ui/Icon";

interface AdminEmptyStateProps {
  icon: string;
  heading: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AdminEmptyState({ icon, heading, description, action }: AdminEmptyStateProps) {
  return (
    <div
      data-testid="admin-empty-state"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: "#F3F4F6" }}
      >
        <Icon icon={icon} className="size-7" style={{ color: "#9CA3AF" }} />
      </div>
      <h3
        className="text-base font-semibold mb-2"
        style={{ color: "#374151" }}
      >
        {heading}
      </h3>
      <p className="text-sm max-w-xs" style={{ color: "#9CA3AF" }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
          style={{ backgroundColor: "#C9873A" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
