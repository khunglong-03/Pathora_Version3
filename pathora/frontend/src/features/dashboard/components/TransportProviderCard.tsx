"use client";

import React from "react";
import { VanIcon, PhoneIcon, EnvelopeSimpleIcon, MapPinIcon, ProhibitIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import type { TransportProviderListItem } from "@/types/admin";

interface TransportProviderCardProps {
  provider: TransportProviderListItem;
  onToggleBan?: (id: string, currentStatus: string) => void;
}

export function TransportProviderCard({ provider, onToggleBan }: TransportProviderCardProps) {
  const isActive = provider.status === "Active";
  const isBanned = provider.status === "Banned";

  const handleToggleBan = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleBan?.(provider.id, provider.status);
  };

  return (
    <div
      data-testid="transport-provider-card"
      className="group relative flex flex-col h-full rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
      }}
    >
      {/* Ban Action Button */}
      {onToggleBan && (
        <button
          onClick={handleToggleBan}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          title={isBanned ? "Mở khóa tài khoản" : "Khóa tài khoản"}
        >
          {isBanned ? <ShieldCheckIcon size={20} weight="bold" className="text-green-500" /> : <ProhibitIcon size={20} weight="bold" />}
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: isBanned ? "#FEE2E2" : "#CCFBF1" }}
        >
          <VanIcon size={24} weight="fill" style={{ color: isBanned ? "#EF4444" : "#0D9488" }} />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="text-sm font-semibold truncate" style={{ color: "#111827" }}>
            {provider.fullName}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: isBanned ? "#FEE2E2" : isActive ? "#DCFCE7" : "#F3F4F6",
                color: isBanned ? "#991B1B" : isActive ? "#16A34A" : "#6B7280",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isBanned ? "#EF4444" : isActive ? "#22C55E" : "#9CA3AF" }}
              />
              {isBanned ? "Bị cấm" : isActive ? "Hoạt động" : "Ngừng"}
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
        {provider.phoneNumber && (
          <div className="flex items-center gap-2">
            <PhoneIcon size={14} style={{ color: "#9CA3AF" }} />
            <span className="text-xs" style={{ color: "#6B7280" }}>
              {provider.phoneNumber}
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
