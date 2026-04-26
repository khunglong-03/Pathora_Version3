"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  CaretLeftIcon,
  CaretRightIcon,
  CalendarDotsIcon,
  TruckIcon,
  WarningCircleIcon,
  FunnelIcon,
} from "@phosphor-icons/react";
import {
  transportProviderService,
  type VehicleScheduleItem,
  type Vehicle,
} from "@/api/services/transportProviderService";
import VehicleScheduleDetail from "./VehicleScheduleDetail";
import { handleApiError } from "@/utils/apiResponse";

// --- Design Tokens (must match transport dashboard T) ---
const T = {
  bg: "#F8F8F6",
  cardBg: "#FFFFFF",
  border: "rgba(0, 0, 0, 0.06)",
  text: "#1A1A1A",
  textMuted: "#737373",
  accent: "#10B981",
  accentSoft: "rgba(16, 185, 129, 0.08)",
  orange: "#F59E0B",
  orangeSoft: "rgba(245, 158, 11, 0.08)",
  blue: "#3B82F6",
  blueSoft: "rgba(59, 130, 246, 0.08)",
  red: "#EF4444",
  redSoft: "rgba(239, 68, 68, 0.08)",
  shadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
  radius: "24px",
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const variants = {
  item: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 28 },
    },
  } as Variants,
};

interface VehicleScheduleSectionProps {
  /** Full vehicle list (for the dropdown filter) */
  vehicles?: Vehicle[];
  /** Framer motion item variants from parent page */
  itemVariants?: Variants;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateOnly(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function getMonthLabel(y: number, m: number) {
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();

  // Mon=0, Tue=1 ... Sun=6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  // Pad to full weeks
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function VehicleScheduleSection({
  vehicles = [],
  itemVariants,
}: VehicleScheduleSectionProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [blocks, setBlocks] = useState<VehicleScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterVehicleId, setFilterVehicleId] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const fetchSchedule = useCallback(
    async (y: number, m: number, vId?: string) => {
      // Abort previous request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      const daysInMonth = new Date(y, m, 0).getDate();
      const fromDate = toDateOnly(y, m, 1);
      const toDate = toDateOnly(y, m, daysInMonth);

      try {
        const result = await transportProviderService.getVehicleSchedule(
          fromDate,
          toDate,
          vId || undefined,
        );
        if (controller.signal.aborted) return;
        setBlocks(result ?? []);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const apiErr = handleApiError(err);
        setError(apiErr.message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchSchedule(year, month, filterVehicleId || undefined);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [year, month, filterVehicleId, fetchSchedule]);

  // Navigation
  const goToPreviousMonth = () => {
    setSelectedDay(null);
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Group blocks by day-of-month
  const blocksByDay = useMemo(() => {
    const map: Record<number, VehicleScheduleItem[]> = {};
    for (const b of blocks) {
      const d = new Date(b.blockedDate);
      const dayNum = d.getDate();
      if (!map[dayNum]) map[dayNum] = [];
      map[dayNum].push(b);
    }
    return map;
  }, [blocks]);

  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

  // Utilization metric: X/Y vehicle-days (6.6)
  const utilization = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const totalVehicleDays = vehicles.length * daysInMonth;
    // Count unique (vehicleId, date) combinations
    const uniqueBlocked = new Set<string>();
    for (const b of blocks) {
      uniqueBlocked.add(`${b.vehicleId}:${b.blockedDate}`);
    }
    return { booked: uniqueBlocked.size, total: totalVehicleDays };
  }, [blocks, vehicles.length, year, month]);

  const selectedDayBlocks = selectedDay ? (blocksByDay[selectedDay] ?? []) : [];
  const selectedDateLabel = selectedDay
    ? `${pad2(selectedDay)}/${pad2(month)}/${year}`
    : "";

  const motionVariants = itemVariants ?? variants.item;

  return (
    <motion.div
      variants={motionVariants}
      style={{
        backgroundColor: T.cardBg,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: "32px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              backgroundColor: T.blueSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CalendarDotsIcon size={22} weight="duotone" color={T.blue} />
          </div>
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: T.text,
                margin: 0,
              }}
            >
              Lịch xe tháng
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: T.textMuted,
                margin: 0,
                marginTop: 2,
              }}
            >
              Các ngày có dấu chấm = xe đang bị đặt
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Utilization stat (6.6) */}
          {vehicles.length > 0 && !isLoading && (
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: T.textMuted,
                backgroundColor: T.accentSoft,
                padding: "6px 12px",
                borderRadius: "8px",
                whiteSpace: "nowrap",
              }}
            >
              Đã đặt:{" "}
              <strong style={{ color: T.accent }}>
                {utilization.booked}/{utilization.total}
              </strong>{" "}
              xe-ngày
            </span>
          )}

          {/* Vehicle filter dropdown (6.7) */}
          {vehicles.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                position: "relative",
              }}
            >
              <FunnelIcon size={16} color={T.textMuted} />
              <select
                value={filterVehicleId}
                onChange={(e) => {
                  setFilterVehicleId(e.target.value);
                  setSelectedDay(null);
                }}
                style={{
                  appearance: "none",
                  backgroundColor: "#FAFAF9",
                  border: `1px solid ${T.border}`,
                  borderRadius: "8px",
                  padding: "6px 28px 6px 10px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: T.text,
                  cursor: "pointer",
                  minWidth: "150px",
                }}
              >
                <option value="">Tất cả xe</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand ?? ""} {v.model ?? ""} – {v.seatCapacity} chỗ
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Tháng trước"
              style={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                border: `1px solid ${T.border}`,
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <CaretLeftIcon size={16} weight="bold" color={T.textMuted} />
            </button>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: T.text,
                minWidth: "130px",
                textAlign: "center",
                textTransform: "capitalize",
              }}
            >
              {getMonthLabel(year, month)}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Tháng sau"
              style={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                border: `1px solid ${T.border}`,
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <CaretRightIcon size={16} weight="bold" color={T.textMuted} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading skeleton (6b.1) */}
      {isLoading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "8px",
          }}
        >
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "48px",
                backgroundColor: "rgba(0,0,0,0.03)",
                borderRadius: "10px",
                animation: "pulse 2s infinite",
              }}
            />
          ))}
        </div>
      )}

      {/* Error state (6b.1) */}
      {!isLoading && error && (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            backgroundColor: T.redSoft,
            borderRadius: "16px",
            border: `1px solid rgba(239, 68, 68, 0.15)`,
          }}
        >
          <WarningCircleIcon
            size={32}
            weight="duotone"
            color={T.red}
            style={{ marginBottom: "8px" }}
          />
          <p
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: T.red,
              margin: "0 0 12px 0",
            }}
          >
            Không tải được lịch xe
          </p>
          <button
            type="button"
            onClick={() => void fetchSchedule(year, month, filterVehicleId || undefined)}
            style={{
              padding: "8px 16px",
              backgroundColor: T.red,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Calendar grid */}
      {!isLoading && !error && (
        <>
          {/* Weekday headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "4px",
              marginBottom: "8px",
            }}
          >
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: T.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "8px 0",
                }}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "4px",
            }}
          >
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} style={{ height: "48px" }} />;
              }

              const dayBlocks = blocksByDay[day] ?? [];
              const hasBlocks = dayBlocks.length > 0;
              const isSelected = selectedDay === day;
              const isToday =
                day === now.getDate() &&
                month === now.getMonth() + 1 &&
                year === now.getFullYear();

              // Hold type detection for dot colors (6.5)
              const hasHard = dayBlocks.some(
                (b) =>
                  b.holdStatus?.toLowerCase() === "hard" ||
                  b.holdStatus === "0",
              );
              const hasSoft = dayBlocks.some(
                (b) =>
                  b.holdStatus?.toLowerCase() !== "hard" &&
                  b.holdStatus !== "0",
              );

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => {
                    if (hasBlocks) setSelectedDay(isSelected ? null : day);
                  }}
                  style={{
                    height: "48px",
                    borderRadius: "10px",
                    border: isSelected
                      ? `2px solid ${T.accent}`
                      : isToday
                        ? `1px solid ${T.blue}`
                        : `1px solid transparent`,
                    backgroundColor: isSelected
                      ? T.accentSoft
                      : hasBlocks
                        ? "#FAFAF9"
                        : "transparent",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    cursor: hasBlocks ? "pointer" : "default",
                    fontSize: "14px",
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? T.blue : T.text,
                    transition: "all 0.15s ease",
                  }}
                  aria-label={
                    hasBlocks
                      ? `${day} — ${dayBlocks.length} xe bị đặt`
                      : `${day}`
                  }
                >
                  <span>{day}</span>
                  {/* Dots row (6.5) */}
                  {hasBlocks && (
                    <div
                      style={{
                        display: "flex",
                        gap: "3px",
                        alignItems: "center",
                      }}
                    >
                      {hasHard && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: T.accent,
                          }}
                          title="Hard hold"
                        />
                      )}
                      {hasSoft && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: T.orange,
                          }}
                          title="Soft hold"
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Empty month state (6b.1) */}
          {blocks.length === 0 && (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                color: T.textMuted,
                fontSize: "14px",
                marginTop: "16px",
              }}
            >
              <TruckIcon
                size={32}
                weight="duotone"
                color={T.textMuted}
                style={{ marginBottom: "8px" }}
              />
              <p style={{ margin: 0 }}>
                Chưa có xe nào bị đặt trong tháng này.
              </p>
            </div>
          )}

          {/* Detail panel (6.2, 6b.2) */}
          {selectedDay !== null && (
            <VehicleScheduleDetail
              dateLabel={selectedDateLabel}
              items={selectedDayBlocks}
              onClose={() => setSelectedDay(null)}
            />
          )}
        </>
      )}
    </motion.div>
  );
}
