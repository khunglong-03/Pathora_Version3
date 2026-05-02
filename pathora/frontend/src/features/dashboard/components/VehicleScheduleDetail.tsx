"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TruckIcon,
  MapPinIcon,
  TagIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { VehicleScheduleItem } from "@/api/services/transportProviderService";

/** Design tokens — must match the parent transport dashboard page. */
const T = {
  cardBg: "#FFFFFF",
  border: "rgba(0, 0, 0, 0.06)",
  text: "#1A1A1A",
  textMuted: "#737373",
  accent: "#10B981",
  accentSoft: "rgba(16, 185, 129, 0.08)",
  orange: "#F59E0B",
  orangeSoft: "rgba(245, 158, 11, 0.08)",
  radius: "24px",
};

interface VehicleScheduleDetailProps {
  /** Selected date label (e.g. "15/05/2026") */
  dateLabel: string;
  /** Block items for that day — empty array = "nothing blocked" state. */
  items: VehicleScheduleItem[];
  /** Whether data is still loading */
  isLoading?: boolean;
  /** Close the detail panel */
  onClose: () => void;
}

export default function VehicleScheduleDetail({
  dateLabel,
  items,
  isLoading,
  onClose,
}: VehicleScheduleDetailProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ overflow: "hidden" }}
      >
        <div
          style={{
            backgroundColor: T.cardBg,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            padding: "24px",
            marginTop: "16px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h4
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: T.text,
                margin: 0,
              }}
            >
              Chi tiết ngày {dateLabel}
            </h4>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                border: `1px solid ${T.border}`,
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <XIcon size={16} color={T.textMuted} />
            </button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "64px",
                    backgroundColor: "rgba(0,0,0,0.03)",
                    borderRadius: "12px",
                    animation: "pulse 2s infinite",
                  }}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && items.length === 0 && (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                color: T.textMuted,
                fontSize: "14px",
              }}
            >
              <TruckIcon
                size={32}
                weight="duotone"
                color={T.textMuted}
                style={{ marginBottom: "8px" }}
              />
              <p style={{ margin: 0 }}>Không có xe nào bị đặt vào ngày này.</p>
            </div>
          )}

          {/* Items list */}
          {!isLoading && items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {items.map((item) => {
                const isHard =
                  item.holdStatus?.toLowerCase() === "hard" ||
                  item.holdStatus === "0";
                const holdLabel = isHard ? "Hard hold" : "Soft hold";
                const holdColor = isHard ? T.accent : T.orange;
                const holdBg = isHard ? T.accentSoft : T.orangeSoft;

                return (
                  <div
                    key={item.blockId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      border: `1px solid ${T.border}`,
                      backgroundColor: "#FAFAF9",
                    }}
                  >
                    {/* Vehicle icon */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        backgroundColor: holdBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <TruckIcon size={20} weight="duotone" color={holdColor} />
                    </div>

                    {/* Vehicle info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: T.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.vehicleBrand ?? ""} {item.vehicleModel ?? ""}{" "}
                        <span style={{ color: T.textMuted, fontWeight: 400 }}>
                          – {item.seatCapacity} chỗ
                        </span>
                      </div>

                      {/* Tour + Activity */}
                      {item.tourInstanceName && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: T.textMuted,
                            marginTop: "2px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <TagIcon size={12} />
                          {item.tourInstanceCode
                            ? `${item.tourInstanceCode} — `
                            : ""}
                          {item.tourInstanceName}
                          {item.activityTitle ? ` • ${item.activityTitle}` : ""}
                        </div>
                      )}

                      {/* Route */}
                      {(item.fromLocationName || item.toLocationName) && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: T.textMuted,
                            marginTop: "2px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <MapPinIcon size={12} />
                          {item.fromLocationName ?? "?"} →{" "}
                          {item.toLocationName ?? "?"}
                        </div>
                      )}
                    </div>

                    {/* Hold status badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        backgroundColor: holdBg,
                        color: holdColor,
                        fontSize: "11px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {holdLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
