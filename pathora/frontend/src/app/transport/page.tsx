"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  TruckIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  WarningCircleIcon,
  CarProfileIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CalendarCheckIcon,
  TrafficConeIcon,
  XCircleIcon,
  SteeringWheelIcon,
} from "@phosphor-icons/react";
import { transportProviderService } from "@/api/services/transportProviderService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import type { NormalizedTourInstanceVm } from "@/types/tour";
import UpcomingToursSection from "@/features/dashboard/components/UpcomingToursSection";
import VehicleScheduleSection from "@/features/dashboard/components/VehicleScheduleSection";
import dayjs from "dayjs";
import type {
  Vehicle,
  TripAssignment,
  TripStatus,
  RevenueSummary,
} from "@/api/services/transportProviderService";

// --- Design Tokens (Taste Frontend) ---
const T = {
  bg: "#F8F8F6",
  cardBg: "#FFFFFF",
  border: "rgba(0, 0, 0, 0.06)",
  text: "#1A1A1A",
  textMuted: "#737373",
  accent: "#10B981", // Emerald
  accentSoft: "rgba(16, 185, 129, 0.08)",
  blue: "#3B82F6",
  blueSoft: "rgba(59, 130, 246, 0.08)",
  orange: "#F59E0B",
  orangeSoft: "rgba(245, 158, 11, 0.08)",
  red: "#EF4444",
  redSoft: "rgba(239, 68, 68, 0.08)",
  purple: "#8B5CF6",
  purpleSoft: "rgba(139, 92, 246, 0.08)",
  shadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
  radius: "24px",
};

const TRIP_STATUS_CONFIG: Record<TripStatus, { label: string; color: string; bg: string }> = {
  Pending: { label: "Pending", color: T.orange, bg: T.orangeSoft },
  InProgress: { label: "In Progress", color: T.blue, bg: T.blueSoft },
  Completed: { label: "Completed", color: T.accent, bg: T.accentSoft },
  Rejected: { label: "Rejected", color: T.red, bg: T.redSoft },
  Cancelled: { label: "Cancelled", color: T.red, bg: T.redSoft },
};

// --- Framer Motion Config ---
const variants = {
  container: { animate: { transition: { staggerChildren: 0.08 } } } as Variants,
  item: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 28 },
    },
  } as Variants,
};

// --- Sub-components ---
function AnimatedNum({ value, prefix = "" }: { value: number | string, prefix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={value}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ display: "inline-block" }}
    >
      {prefix}{value}
    </motion.span>
  );
}

function PulseDot({ color }: { color: string }) {
  return (
    <div style={{ position: "relative", width: 8, height: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div
        animate={{ scale: [1, 2], opacity: [0.8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        style={{
          position: "absolute",
          width: 8, height: 8, borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, position: "relative", zIndex: 1 }} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, span = 1, prefix = "" }: any) {
  return (
    <motion.div
      variants={variants.item}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
      style={{
        gridColumn: `span ${span}`,
        backgroundColor: T.cardBg,
        borderRadius: T.radius,
        padding: "24px",
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "160px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: "14px",
            backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon size={22} weight="bold" color={color} />
        </div>
        {(label.includes("hôm nay") || label.includes("đang chạy")) && Number(value) > 0 && (
          <PulseDot color={color} />
        )}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "16px" }}>
        <div style={{ fontSize: "36px", fontWeight: 700, color: T.text, lineHeight: 1, letterSpacing: "-0.02em" }}>
          <AnimatedNum value={value} prefix={prefix} />
        </div>
        <div style={{ fontSize: "14px", fontWeight: 500, color: T.textMuted, marginTop: "8px" }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}

function FleetHeroCard({ total, active }: { total: number; active: number }) {
  const percentage = total > 0 ? (active / total) * 100 : 0;

  return (
    <motion.div
      variants={variants.item}
      style={{
        gridColumn: "span 2",
        backgroundColor: T.cardBg,
        borderRadius: T.radius,
        padding: "32px",
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative Background Blob */}
      <div style={{
        position: "absolute", top: -50, right: -50, width: 250, height: 250,
        background: `radial-gradient(circle, ${T.purpleSoft} 0%, rgba(255,255,255,0) 70%)`,
        borderRadius: "50%", pointerEvents: "none"
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "16px", backgroundColor: T.purpleSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TruckIcon size={24} weight="duotone" color={T.purple} />
          </div>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: T.text, margin: 0 }}>Đội xe & Phương tiện</h3>
            <p style={{ fontSize: "13px", color: T.textMuted, margin: 0, marginTop: 2 }}>Trạng thái hoạt động đội xe</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "32px", fontWeight: 700, color: T.text }}>{Math.round(percentage)}%</span>
          <span style={{ fontSize: "14px", fontWeight: 500, color: T.textMuted, display: "block" }}>Tỷ lệ hoạt động</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", marginTop: "auto" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: T.textMuted }}>Đang có sẵn / Đang chạy</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>{active}</span>
          </div>
          <div style={{ height: 6, backgroundColor: "rgba(0,0,0,0.04)", borderRadius: 4, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, type: "spring", damping: 30 }}
              style={{ height: "100%", backgroundColor: T.purple, borderRadius: 4 }}
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: T.textMuted }}>Hiện tại bảo trì / Ngừng</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>{total - active}</span>
          </div>
          <div style={{ height: 6, backgroundColor: "rgba(0,0,0,0.04)", borderRadius: 4, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? ((total - active) / total) * 100 : 0}%` }}
              transition={{ duration: 1.5, type: "spring", damping: 30, delay: 0.1 }}
              style={{ height: "100%", backgroundColor: T.red, borderRadius: 4 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Page ---
export default function TransportDashboardPage() {
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [activeVehicles, setActiveVehicles] = useState(0);
  const [trips, setTrips] = useState<TripAssignment[]>([]);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [upcomingTours, setUpcomingTours] = useState<NormalizedTourInstanceVm[]>([]);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehiclesData, activeVehiclesData, tripsData, revenueData, allVehiclesData] = await Promise.all([
        transportProviderService.getVehicles(1, 1),
        transportProviderService.getVehicles(1, 1, true),
        transportProviderService.getTripAssignments(),
        transportProviderService.getRevenueSummary(new Date().getFullYear()),
        transportProviderService.getVehicles(1, 100),
      ]);
      setTotalVehicles(vehiclesData?.total || 0);
      setActiveVehicles(activeVehiclesData?.total || 0);
      setTrips((tripsData || []).sort((a, b) => new Date(b.tripDate).getTime() - new Date(a.tripDate).getTime()));
      setVehiclesList(allVehiclesData?.items || []);
      setRevenue(revenueData);

      // Fetch upcoming tours separately to avoid cascading failures
      try {
        const tourResult = await tourInstanceService.getProviderAssigned(1, 50);
        const todayDate = dayjs().startOf("day");
        const upcoming = (tourResult?.data ?? [])
          .filter(i => {
            const tourStart = dayjs(i.startDate).startOf("day");
            return tourStart.isAfter(todayDate) || tourStart.isSame(todayDate, "day");
          })
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setUpcomingTours(upcoming);
      } catch {
        // Silently fail — upcoming tours is supplementary, not critical
        setUpcomingTours([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Derived Stats
  const todayStr = new Date().toISOString().split("T")[0];
  const tripsToday = trips.filter(t => t.tripDate.startsWith(todayStr)).length;
  const tripsInProgress = trips.filter(t => t.status === "InProgress").length;
  const totalRevenue = revenue?.totalRevenue ?? 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100dvh", padding: "40px", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Header Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.03em" }}>Nhà cung cấp vận tải</h1>
            <p style={{ fontSize: "15px", color: T.textMuted, margin: 0, marginTop: 4 }}>Quản lý phương tiện và điều phối chuyến đi</p>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/transport/vehicles">
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: 44, padding: "0 20px", display: "flex", alignItems: "center", gap: 8,
                  backgroundColor: T.cardBg, color: T.text, borderRadius: "12px",
                  border: `1px solid ${T.border}`, fontWeight: 600, fontSize: "14px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                }}
              >
                <CarProfileIcon size={18} />
                Đội xe
              </motion.button>
            </Link>
            <Link href="/transport/trips">
              <motion.button
                whileHover={{ y: -2, scale: 1.02, backgroundColor: "#2563EB" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: 44, padding: "0 20px", display: "flex", alignItems: "center", gap: 8,
                  backgroundColor: T.blue, color: "#fff", borderRadius: "12px",
                  border: "none", fontWeight: 600, fontSize: "14px",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
                  cursor: "pointer"
                }}
              >
                <SteeringWheelIcon size={18} />
                Lịch trình chuyến đi
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: "160px", backgroundColor: "rgba(0,0,0,0.03)", borderRadius: T.radius, animation: "pulse 2s infinite" }} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
           <div style={{ padding: "32px", backgroundColor: T.redSoft, borderRadius: T.radius, border: `1px solid rgba(239, 68, 68, 0.2)` }}>
             <WarningCircleIcon size={32} color={T.red} style={{ marginBottom: 16 }} />
             <h3 style={{ color: T.red, fontWeight: 600, fontSize: "18px", margin: 0 }}>Lỗi tải dữ liệu</h3>
             <p style={{ color: "rgba(239, 68, 68, 0.8)", fontSize: "14px", margin: "8px 0 0 0" }}>{error}</p>
             <button onClick={loadData} style={{ marginTop: 16, padding: "8px 16px", backgroundColor: T.red, color: "#fff", border: "none", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}>
               Thử lại
             </button>
           </div>
        )}

        {/* Main Dashboard Content */}
        {!isLoading && !error && (
          <motion.div variants={variants.container} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Upper Grid (4 Columns) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
              <FleetHeroCard total={totalVehicles} active={activeVehicles} />
              
              <StatCard
                label="Số chuyến chạy tiếp"
                value={tripsToday}
                icon={ClockIcon}
                color={T.orange}
                bg={T.orangeSoft}
              />
              <StatCard
                label="Doanh thu năm nay"
                value={totalRevenue.toLocaleString()}
                prefix="$"
                icon={CurrencyDollarIcon}
                color={T.accent}
                bg={T.accentSoft}
              />
            </div>

            {/* Vehicle Schedule Calendar (6.3) */}
            <VehicleScheduleSection
              vehicles={vehiclesList}
              itemVariants={variants.item}
            />

            {/* Lower Grid (Trips Table) */}
            <motion.div
              variants={variants.item}
              style={{
                backgroundColor: T.cardBg,
                borderRadius: T.radius,
                padding: "32px",
                border: `1px solid ${T.border}`,
                boxShadow: T.shadow,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: T.text, margin: 0 }}>Các chuyến đi gần nhất</h3>
                  <p style={{ fontSize: "14px", color: T.textMuted, margin: 0, marginTop: 4 }}>Theo dõi trạng thái lịch trình vận chuyển</p>
                </div>
                <Link href="/transport/trips" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "14px", fontWeight: 600, color: T.blue, textDecoration: "none" }}>
                  Xem tất cả
                  <ArrowRightIcon weight="bold" />
                </Link>
              </div>

              {trips.length === 0 ? (
                <div style={{ padding: "64px 0", textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, backgroundColor: "rgba(0,0,0,0.03)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                    <MapPinIcon size={32} color={T.textMuted} />
                  </div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600, color: T.text, margin: 0 }}>Chưa có chuyến đi nào</h4>
                  <p style={{ fontSize: "14px", color: T.textMuted, marginTop: 8 }}>Các chuyến đặt xe (Trip Assignments) sẽ hiện ở đây.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                    <thead>
                      <tr style={{ color: T.textMuted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "left" }}>
                        <th style={{ padding: "0 16px 8px 16px" }}>Mã Trip</th>
                        <th style={{ padding: "0 16px 8px 16px" }}>Tuyến đường</th>
                        <th style={{ padding: "0 16px 8px 16px" }}>Thời gian</th>
                        <th style={{ padding: "0 16px 8px 16px" }}>Phương tiện & Tài xế</th>
                        <th style={{ padding: "0 16px 8px 16px", textAlign: "right" }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {trips.slice(0, 8).map((trip, index) => {
                          const statusConf = TRIP_STATUS_CONFIG[trip.status] || TRIP_STATUS_CONFIG.Pending;
                          return (
                            <motion.tr
                              key={trip.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 0.995, backgroundColor: "rgba(0,0,0,0.01)" }}
                              style={{ cursor: "default" }}
                            >
                              <td style={{ padding: "16px", borderRadius: "12px 0 0 12px", border: `1px solid ${T.border}`, borderRight: "none", fontSize: "13px", fontFamily: "monospace", color: T.textMuted }}>
                                {trip.id.slice(0, 8)}...
                              </td>
                              <td style={{ padding: "16px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, fontSize: "14px", fontWeight: 500, color: T.text }}>
                                {trip.route}
                              </td>
                              <td style={{ padding: "16px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, fontSize: "14px", color: T.text }}>
                                {formatDate(trip.tripDate)}
                              </td>
                              <td style={{ padding: "16px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`}}>
                                <div style={{ fontSize: "14px", color: T.text, fontWeight: 500 }}>{trip.vehicleType}</div>
                                <div style={{ fontSize: "12px", color: T.textMuted }}>{trip.driverName}</div>
                              </td>
                              <td style={{ padding: "16px", borderRadius: "0 12px 12px 0", border: `1px solid ${T.border}`, borderLeft: "none", textAlign: "right" }}>
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  padding: "4px 10px", borderRadius: "100px",
                                  backgroundColor: statusConf.bg, color: statusConf.color,
                                  fontSize: "12px", fontWeight: 600, letterSpacing: "-0.01em"
                                }}>
                                  {trip.status === "Pending" && <ClockIcon weight="bold" />}
                                  {trip.status === "InProgress" && <TrafficConeIcon weight="bold" />}
                                  {trip.status === "Completed" && <CheckCircleIcon weight="bold" />}
                                  {(trip.status === "Cancelled" || trip.status === "Rejected") && <XCircleIcon weight="bold" />}
                                  {statusConf.label}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            <UpcomingToursSection
              tours={upcomingTours}
              providerType="transport"
              viewAllHref="/transport/tour-approvals"
              itemVariants={variants.item}
              tokens={T}
            />

          </motion.div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        table { text-indent: initial; }
      `}} />
    </div>
  );
}