"use client";

import React from "react";
import { Warning } from "@phosphor-icons/react";

interface AdminErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export function AdminErrorCard({ message, onRetry }: AdminErrorCardProps) {
  return (
    <div
      data-testid="admin-error-card"
      className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border text-center"
      style={{
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
        color: "#DC2626",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: "#FEE2E2" }}
      >
        <Warning size={24} weight="fill" />
      </div>
      <p className="text-sm font-medium mb-4" style={{ color: "#991B1B" }}>
        {message || "Something went wrong. Please try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
          style={{
            backgroundColor: "#DC2626",
            color: "#FFFFFF",
          }}
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
