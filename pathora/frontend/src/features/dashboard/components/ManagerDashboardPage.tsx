"use client";

import React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  GlobeHemisphereWestIcon,
  CalendarDotsIcon,
  TicketIcon,
  AirplaneTakeoffIcon,
  UsersThreeIcon,
  TrendUpIcon,
  ArrowsClockwiseIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react";
import { AdminSidebar, TopBar } from "./AdminSidebar";
import { useManagerDashboardData } from "../hooks/useManagerDashboardData";
import type {
  ManagerDashboardStats,
  ManagerTopTour,
  ManagerUpcomingDeparture,
  ManagerRecentBooking,
  ManagerStaffMember,
  ManagerCategoryMetric,
} from "@/types/manager";

/* ═══════════════════════════════════════════════════════════════
   Design Tokens — Bento 2.0
   ═══════════════════════════════════════════════════════════════ */
const T = {
  bg: "#F8F8F6",
  card: "#FFFFFF",
  cardHover: "#FAFAF8",
  border: "#E8E5E0",
  borderSubtle: "#F0EDE8",
  text: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textMuted: "#9CA3AF",
  accent: "#E8A849",
  accentSoft: "rgba(232,168,73,0.10)",
  success: "#16A34A",
  successSoft: "rgba(22,163,74,0.08)",
  warning: "#F59E0B",
  warningSoft: "rgba(245,158,11,0.08)",
  info: "#3B82F6",
  infoSoft: "rgba(59,130,246,0.08)",
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
  shadowHover: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
  radius: "16px",
  radiusSm: "12px",
} as const;

/* Motion presets */
const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
  } as Variants,
  item: {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 28 } },
  } as Variants,
};

/* ═══════════════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════════════ */

/* ─── Animated Number Tick ─── */
function AnimatedNum({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace" }}
    >
      {value.toLocaleString()}{suffix}
    </motion.span>
  );
}

/* ─── Stat Card (Bento tile) ─── */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
}

function BentoStatCard({ label, value, icon: Icon, accentColor, accentBg }: StatCardProps) {
  return (
    <motion.div
      variants={stagger.item}
      whileHover={{ scale: 0.98, boxShadow: T.shadowHover }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      style={{
        backgroundColor: T.card,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: "24px",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent strip */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div
          style={{
            width: 42, height: 42,
            borderRadius: T.radiusSm,
            backgroundColor: accentBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon size={20} weight="duotone" color={accentColor} />
        </div>
      </div>

      <div style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: T.text, marginBottom: "6px" }}>
        <AnimatedNum value={value} />
      </div>
      <div style={{ fontSize: "13px", fontWeight: 500, color: T.textSecondary, letterSpacing: "0.01em" }}>
        {label}
      </div>
    </motion.div>
  );
}

/* ─── Live Pulse Dot ─── */
function PulseDot({ color }: { color: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
      <motion.span
        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color }} />
    </span>
  );
}

/* ─── Top Tours Leaderboard ─── */
function TopToursCard({ tours }: { tours: ManagerTopTour[] }) {
  if (!tours.length) return null;
  const maxBookings = Math.max(...tours.map((t) => t.bookings), 1);

  return (
    <motion.div
      variants={stagger.item}
      style={{
        backgroundColor: T.card,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: "24px",
        gridColumn: "span 2",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "20px" }}>
        <TrendUpIcon size={18} weight="bold" color={T.accent} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: T.text, letterSpacing: "-0.01em" }}>Top Tours</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tours.slice(0, 5).map((tour, i) => (
          <div key={tour.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              width: 24, height: 24, borderRadius: "50%",
              backgroundColor: i === 0 ? T.accentSoft : T.borderSubtle,
              color: i === 0 ? T.accent : T.textSecondary,
              fontSize: "11px", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {i + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 500, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {tour.name}
              </div>
              <div style={{ marginTop: 4, height: 4, borderRadius: 2, backgroundColor: T.borderSubtle, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(tour.bookings / maxBookings) * 100}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 30, delay: i * 0.08 }}
                  style={{ height: "100%", borderRadius: 2, backgroundColor: T.accent }}
                />
              </div>
            </div>
            <span style={{
              fontSize: "12px", fontWeight: 600, color: T.textSecondary,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {tour.bookings}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Upcoming Departures ─── */
function UpcomingDeparturesCard({ departures }: { departures: ManagerUpcomingDeparture[] }) {
  return (
    <motion.div
      variants={stagger.item}
      style={{
        backgroundColor: T.card,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: "24px",
        gridColumn: "span 2",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "20px" }}>
        <AirplaneTakeoffIcon size={18} weight="bold" color={T.info} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>Upcoming Departures</span>
        <PulseDot color={T.success} />
      </div>

      {departures.length === 0 ? (
        <div style={{ padding: "20px 0", textAlign: "center", fontSize: "13px", color: T.textMuted }}>
          No upcoming departures
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {departures.slice(0, 5).map((dep, i) => {
            const fillPct = dep.maxParticipation > 0
              ? Math.round((dep.currentParticipation / dep.maxParticipation) * 100)
              : 0;
            return (
              <motion.div
                key={dep.tourInstanceId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 28 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: T.radiusSm,
                  border: `1px solid ${T.borderSubtle}`,
                  transition: "background-color 0.15s",
                }}
                whileHover={{ backgroundColor: T.cardHover }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: T.radiusSm,
                  backgroundColor: T.infoSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <CalendarDotsIcon size={16} weight="duotone" color={T.info} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {dep.title}
                  </div>
                  <div style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>
                    {new Date(dep.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" })}
                    {" · "}
                    <span style={{ fontFamily: "monospace" }}>{dep.currentParticipation}/{dep.maxParticipation}</span>
                    {" "}({fillPct}%)
                  </div>
                </div>
                <span style={{
                  fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
                  padding: "3px 8px", borderRadius: 6,
                  backgroundColor: dep.status === "Active" ? T.successSoft : T.warningSoft,
                  color: dep.status === "Active" ? T.success : T.warning,
                }}>
                  {dep.status}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Recent Bookings ─── */
function RecentBookingsCard({ bookings }: { bookings: ManagerRecentBooking[] }) {
  return (
    <motion.div
      variants={stagger.item}
      style={{
        backgroundColor: T.card,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: "24px",
        gridColumn: "span 2",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "20px" }}>
        <TicketIcon size={18} weight="bold" color={T.accent} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>Recent Bookings</span>
      </div>

      {bookings.length === 0 ? (
        <div style={{ padding: "20px 0", textAlign: "center", fontSize: "13px", color: T.textMuted }}>
          No recent bookings
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {bookings.slice(0, 6).map((bk, i) => {
            const statusColor = bk.status === "Confirmed" ? T.success : bk.status === "Pending" ? T.warning : T.textSecondary;
            return (
              <motion.div
                key={bk.bookingId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 12px", borderRadius: T.radiusSm,
                  borderBottom: `1px solid ${T.borderSubtle}`,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${T.accentSoft}, ${T.borderSubtle})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: 700, color: T.accent,
                  flexShrink: 0,
                }}>
                  {bk.customerName?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {bk.customerName}
                  </div>
                  <div style={{ fontSize: "11px", color: T.textMuted, marginTop: 1 }}>
                    {bk.tourName}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: T.text, fontFamily: "monospace" }}>
                    {bk.amount.toLocaleString("vi-VN")}₫
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: statusColor, textTransform: "uppercase", marginTop: 2 }}>
                    {bk.status}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Staff Overview ─── */
function StaffOverviewCard({ staff }: { staff: ManagerStaffMember[] }) {
  return (
    <motion.div
      variants={stagger.item}
      style={{
        backgroundColor: T.card,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: "24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "20px" }}>
        <UsersThreeIcon size={18} weight="bold" color={T.accent} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>Your Staff</span>
        <span style={{
          fontSize: "11px", fontWeight: 600, color: T.accent,
          backgroundColor: T.accentSoft, padding: "2px 8px", borderRadius: 6,
          marginLeft: "auto",
        }}>
          {staff.length}
        </span>
      </div>

      {staff.length === 0 ? (
        <div style={{ padding: "20px 0", textAlign: "center", fontSize: "13px", color: T.textMuted }}>
          No staff assigned
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {staff.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "8px 0",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.accentSoft}, ${T.borderSubtle})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, color: T.accent,
                flexShrink: 0,
              }}>
                {s.fullName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: T.text }}>
                  {s.fullName}
                </div>
                <div style={{ fontSize: "11px", color: T.textMuted }}>
                  {s.role} · {s.tourCount} tours
                </div>
              </div>
              <PulseDot color={T.success} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Tour Instances By Status (mini donut-style bars) ─── */
function StatusDistributionCard({ data, title }: { data: ManagerCategoryMetric[]; title: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const palette = [T.accent, T.info, T.success, T.warning, "#8B5CF6", "#EC4899"];

  return (
    <motion.div
      variants={stagger.item}
      style={{
        backgroundColor: T.card,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: "24px",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 600, color: T.text, marginBottom: "16px" }}>
        {title}
      </div>

      {/* Segmented bar */}
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 16, gap: 2 }}>
        {data.map((d, i) => (
          <motion.div
            key={d.label}
            initial={{ width: 0 }}
            animate={{ width: `${(d.value / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30, delay: i * 0.08 }}
            style={{ backgroundColor: palette[i % palette.length], borderRadius: 4, minWidth: d.value > 0 ? 4 : 0 }}
          />
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {data.map((d, i) => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: palette[i % palette.length] }} />
            <span style={{ fontSize: "12px", color: T.textSecondary }}>
              {d.label}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: T.text, fontFamily: "monospace" }}>
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════════════════════════ */
function DashboardSkeleton() {
  const shimmer = {
    background: `linear-gradient(90deg, ${T.borderSubtle} 25%, ${T.border} 50%, ${T.borderSubtle} 75%)`,
    backgroundSize: "200% 100%",
    animation: "shimmer 1.6s ease-in-out infinite",
  } as React.CSSProperties;

  return (
    <div suppressHydrationWarning>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} style={{ ...shimmer, height: 130, borderRadius: T.radius }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{ ...shimmer, height: 260, borderRadius: T.radius }} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */
export function ManagerDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { data: dashboard, isLoading, error, refetch } = useManagerDashboardData();

  return (
    <>
      <main
        id="manager-dashboard-main"
        className="p-6 lg:py-8 lg:pr-8 lg:pl-6"
        style={{
          backgroundColor: T.bg,
          minHeight: "100vh",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h1 style={{
              fontSize: "28px", fontWeight: 700,
              color: T.text, letterSpacing: "-0.03em",
              lineHeight: 1.2, margin: 0,
            }}>
              Dashboard
            </h1>
            <p style={{ fontSize: "13px", color: T.textSecondary, marginTop: 4, letterSpacing: "0.01em" }}>
              Overview of your managed tours, bookings & staff
            </p>
          </div>
          <motion.button
            onClick={refetch}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            disabled={isLoading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: T.radiusSm,
              backgroundColor: T.card, border: `1px solid ${T.border}`,
              boxShadow: T.shadow, cursor: "pointer",
              fontSize: "13px", fontWeight: 500, color: T.textSecondary,
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <CircleNotchIcon size={16} weight="bold" />
              </motion.span>
            ) : (
              <ArrowsClockwiseIcon size={16} weight="bold" />
            )}
            Refresh
          </motion.button>
        </div>

        {/* Loading */}
        {isLoading && <DashboardSkeleton />}

        {/* Error */}
        <AnimatePresence>
          {!isLoading && error && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{
                padding: "32px",
                textAlign: "center",
                backgroundColor: T.card,
                borderRadius: T.radius,
                border: `1px solid ${T.border}`,
                boxShadow: T.shadow,
              }}
            >
              <p style={{ fontSize: "14px", fontWeight: 500, color: T.text, marginBottom: 12 }}>{error}</p>
              <motion.button
                onClick={refetch}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: "8px 20px", borderRadius: T.radiusSm,
                  backgroundColor: T.text, color: "#FFFFFF",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  border: "none",
                }}
              >
                Retry
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty */}
        {!isLoading && !error && !dashboard && (
          <div style={{
            padding: "48px", textAlign: "center",
            backgroundColor: T.card, borderRadius: T.radius,
            border: `1px solid ${T.border}`,
          }}>
            <p style={{ fontSize: "14px", color: T.textSecondary }}>No dashboard data available</p>
          </div>
        )}

        {/* Data */}
        {!isLoading && !error && dashboard && (
          <motion.div variants={stagger.container} initial="hidden" animate="show">
            {/* Stat Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              <BentoStatCard label="Total Tours" value={dashboard.stats.totalTours} icon={GlobeHemisphereWestIcon} accentColor={T.accent} accentBg={T.accentSoft} />
              <BentoStatCard label="Tour Instances" value={dashboard.stats.totalTourInstances} icon={CalendarDotsIcon} accentColor={T.info} accentBg={T.infoSoft} />
              <BentoStatCard label="Active Instances" value={dashboard.stats.activeTourInstances} icon={CalendarDotsIcon} accentColor={T.success} accentBg={T.successSoft} />
              <BentoStatCard label="Total Bookings" value={dashboard.stats.totalBookings} icon={TicketIcon} accentColor="#8B5CF6" accentBg="rgba(139,92,246,0.08)" />
              <BentoStatCard label="Upcoming Departures" value={dashboard.stats.upcomingDepartures} icon={AirplaneTakeoffIcon} accentColor={T.warning} accentBg={T.warningSoft} />
              <BentoStatCard label="Total Staff" value={dashboard.stats.totalStaff} icon={UsersThreeIcon} accentColor="#EC4899" accentBg="rgba(236,72,153,0.08)" />
            </div>

            {/* Bento Grid — 4 columns */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}>
              {/* Top Tours — span 2 */}
              <TopToursCard tours={dashboard.topTours} />

              {/* Tour Instances by Status — span 1 */}
              <StatusDistributionCard data={dashboard.tourInstancesByStatus} title="Instance Status" />

              {/* Staff — span 1 */}
              <StaffOverviewCard staff={dashboard.staff} />

              {/* Upcoming Departures — span 2 */}
              <UpcomingDeparturesCard departures={dashboard.upcomingDepartures} />

              {/* Recent Bookings — span 2 */}
              <RecentBookingsCard bookings={dashboard.recentBookings} />
            </div>
          </motion.div>
        )}
      </main>
    </>
  );
}

export default ManagerDashboardPage;
