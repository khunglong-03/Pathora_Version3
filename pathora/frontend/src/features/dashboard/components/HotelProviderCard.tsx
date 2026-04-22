"use client";

import React, { useState } from "react";
import { BedIcon, PhoneIcon, EnvelopeSimpleIcon, ProhibitIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import type { HotelProviderListItem } from "@/types/admin";
import { ContinentChip, ContinentChips } from "@/components/shared/ContinentChip";
import { userService } from "@/api/services/userService";
import { toast } from "react-toastify";

interface HotelProviderCardProps {
  provider: HotelProviderListItem;
  onRefresh?: () => void;
}

export function HotelProviderCard({ provider, onRefresh }: HotelProviderCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const isActive = provider.status === "Active";
  const isBanned = provider.status === "Banned";

  const handleToggleBan = async () => {
    const action = isBanned ? "mở khóa" : "khóa";
    const newStatus = isBanned ? "Active" : "Banned";

    const message = isBanned
      ? `Bạn có chắc chắn muốn mở khóa nhà cung cấp này?`
      : `CẢNH BÁO: Khóa nhà cung cấp sẽ NGỪNG HOẠT ĐỘNG tất cả khách sạn và phương tiện của họ. Bạn có chắc chắn muốn tiếp tục?`;

    if (!window.confirm(message)) return;

    setIsProcessing(true);
    try {
      const res = await userService.updateStatus({
        userId: provider.ownerUserId || provider.id,
        newStatus
      });

      if (res.success) {
        toast.success(`Đã ${action} nhà cung cấp thành công`);
        onRefresh?.();
      } else {
        toast.error(`Không thể ${action} nhà cung cấp`);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi thực hiện thao tác");
    } finally {
      setIsProcessing(false);
    }
  };

  const shouldShowOperationalContinents =
    provider.continents.length > 0 &&
    !(provider.continents.length === 1 && provider.primaryContinent && provider.continents[0] === provider.primaryContinent);

  return (
    <div
      data-testid="hotel-provider-card"
      className="flex flex-col h-full rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: isBanned ? "#FEE2E2" : "#FFEDD5" }}
        >
          <BedIcon size={24} weight="fill" style={{ color: isBanned ? "#DC2626" : "#EA580C" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate" style={{ color: "#111827" }}>
            {provider.supplierName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: isBanned ? "#FEE2E2" : (isActive ? "#DCFCE7" : "#F3F4F6"),
                color: isBanned ? "#B91C1C" : (isActive ? "#16A34A" : "#6B7280"),
              }}
            >
              {isBanned ? "Bị cấm" : (isActive ? "Hoạt động" : "Ngừng")}
            </span>
          </div>
        </div>

        <button
          onClick={handleToggleBan}
          disabled={isProcessing}
          className="p-2 rounded-lg transition-colors hover:bg-stone-100 disabled:opacity-50"
          title={isBanned ? "Mở khóa" : "Khóa nhà cung cấp"}
          style={{ color: isBanned ? "#059669" : "#DC2626" }}
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isBanned ? (
            <ShieldCheckIcon size={20} weight="bold" />
          ) : (
            <ProhibitIcon size={20} weight="bold" />
          )}
        </button>
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
      </div>

      <div className="space-y-2 mb-4">
        {provider.primaryContinent && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
              Khu vực chính
            </span>
            <ContinentChip continent={provider.primaryContinent} size="sm" />
          </div>
        )}
        {shouldShowOperationalContinents && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
              Phạm vi hoạt động
            </p>
            <ContinentChips continents={provider.continents} size="sm" />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-3 pt-3 mt-auto" style={{ borderTop: "1px solid #F3F4F6" }}>
        <div className="flex-1 text-center">
          <p className="text-lg font-bold" style={{ color: "#111827" }}>
            {provider.accommodationCount ?? 0}
          </p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Cơ sở lưu trú
          </p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-lg font-bold" style={{ color: "#111827" }}>
            {provider.roomCount ?? 0}
          </p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Phòng
          </p>
        </div>
      </div>
    </div>
  );
}
