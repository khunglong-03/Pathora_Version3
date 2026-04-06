"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowsClockwise } from "@phosphor-icons/react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  actionButtons?: React.ReactNode;
  onRefresh?: () => void;
}

export function AdminPageHeader({
  title,
  subtitle,
  backHref,
  actionButtons,
  onRefresh,
}: AdminPageHeaderProps) {
  return (
    <div
      data-testid="admin-page-header"
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 mb-6 rounded-xl"
      style={{
        backgroundColor: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <div className="flex items-center gap-4">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm font-medium transition-colors duration-200 rounded-lg px-2.5 py-1.5"
            style={{ color: "#C9873A" }}
            aria-label="Go back"
          >
            <ArrowLeft size={16} weight="bold" />
          </Link>
        )}
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "#111827", letterSpacing: "-0.02em" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            aria-label="Refresh"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200"
            style={{
              color: "#6B7280",
              backgroundColor: "#F9FAFB",
              border: "1px solid #E5E7EB",
            }}
          >
            <ArrowsClockwise size={16} weight="bold" />
          </button>
        )}
        {actionButtons}
      </div>
    </div>
  );
}
