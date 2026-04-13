"use client";

import React from "react";
import { VanIcon, PhoneIcon, EnvelopeSimpleIcon, MapPinIcon } from "@phosphor-icons/react";
import type { TransportProviderListItem } from "@/types/admin";

interface TransportProviderCardProps {
  provider: TransportProviderListItem;
}

export function TransportProviderCard({ provider }: TransportProviderCardProps) {
  const isActive = provider.status === "Active";

  return (
    <div
      data-testid="transport-provider-card"
      className="flex flex-col h-full rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#CCFBF1" }}
        >
          <VanIcon size={24} weight="fill" style={{ color: "#0D9488" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate" style={{ color: "#111827" }}>
            {provider.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: isActive ? "#DCFCE7" : "#F3F4F6",
                color: isActive ? "#16A34A" : "#6B7280",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isActive ? "#22C55E" : "#9CA3AF" }}
              />
              {isActive ? "Hoạt động" : "Ngừng"}
            </span>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-2 mb-4">
        {provider.email && (
          <div className="flex items-center gap-2">
            <EnvelopeSimpleIcon size={14} style={{ color: "#9CA3AF" }} />
            <span className="text-xs truncate" style={{ color: "#6B7280" }}>
              {provider.email}
            </span>
          </div>
        )}
        {provider.phone && (
          <div className="flex items-center gap-2">
            <PhoneIcon size={14} style={{ color: "#9CA3AF" }} />
            <span className="text-xs" style={{ color: "#6B7280" }}>
              {provider.phone}
            </span>
          </div>
        )}
        {provider.address && (
          <div className="flex items-center gap-2">
            <MapPinIcon size={14} style={{ color: "#9CA3AF" }} />
            <span className="text-xs truncate" style={{ color: "#6B7280" }}>
              {provider.address}
            </span>
          </div>
        )}
      </div>

      {/* Continents */}
      {provider.continents && provider.continents.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {provider.continents.map((continent) => (
            <span key={continent} className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">{continent}</span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-3 pt-3 mt-auto" style={{ borderTop: "1px solid #F3F4F6" }}>
        <div className="flex-1 text-center">
          <p className="text-lg font-bold" style={{ color: "#111827" }}>
            {provider.bookingCount ?? 0}
          </p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Đặt xe
          </p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-lg font-bold" style={{ color: "#111827" }}>
            {provider.vehicleCount ?? 0}
          </p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Phương tiện
          </p>
        </div>
      </div>
    </div>
  );
}
