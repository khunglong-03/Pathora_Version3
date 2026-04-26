"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
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
  SparkleIcon,
  ChartLineUpIcon,
} from "@phosphor-icons/react";
import { useManagerDashboardData } from "../hooks/useManagerDashboardData";
import type {
  ManagerDashboardStats,
  ManagerTopTour,
  ManagerUpcomingDeparture,
  ManagerRecentBooking,
  ManagerStaffMember,
  ManagerCategoryMetric,
} from "@/types/manager";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   Design Tokens — Bento 2.0 (The Hieu Design)
   ═══════════════════════════════════════════════════════════════ */
const T = {
  bg: "#f9fafb",
  card: "#ffffff",
  border: "rgba(226, 232, 240, 0.5)", // slate-200/50
  text: "#0f172a", // slate-900
  textSecondary: "#64748b", // slate-500
  accent: "#10b981", // Emerald
  accentSoft: "rgba(16, 185, 129, 0.1)",
  info: "#3b82f6", // Electric Blue
  infoSoft: "rgba(59, 130, 246, 0.1)",
  warning: "#f59e0b",
  shadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
  radius: "2.5rem", // 40px
  radiusSm: "1.5rem",
} as const;

/* Motion Presets (Spring Physics) */
const STIFFNESS = 100;
const DAMPING = 20;

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: STIFFNESS, damping: DAMPING },
  },
};

/* ═══════════════════════════════════════════════════════════════
   Components
   ═══════════════════════════════════════════════════════════════ */

/* ─── Animated Number Tick ─── */
function AnimatedNum({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: STIFFNESS, damping: DAMPING }}
      style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace", letterSpacing: "-0.05em" }}
    >
      {prefix}{value.toLocaleString()}{suffix}
    </motion.span>
  );
}

/* ─── Premium Card Wrapper ─── */
function BentoCard({ children, title, description, colSpan = 1, className = "" }: { children: React.ReactNode, title?: string, description?: string, colSpan?: number, className?: string }) {
  return (
    <motion.div
      variants={staggerItem}
      style={{ gridColumn: `span ${colSpan}` }}
      className={`flex flex-col ${className}`}
    >
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: T.card,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.8), ${T.shadow}`,
          padding: "2.5rem",
          flexGrow: 1,
        }}
      >
        {children}
      </div>
      {title && (
        <div className="mt-5 px-4">
          <h3 style={{ color: T.text, fontSize: "15px", fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</h3>
          {description && <p style={{ color: T.textSecondary, fontSize: "13px", marginTop: "2px" }}>{description}</p>}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Perpetual Pulse ─── */
function LiveStatus() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2.5 w-2.5">
        <motion.span
          animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
        />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </div>
      <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Live Tracker</span>
    </div>
  );
}

/* ─── Booking Trend Chart ─── */
function BookingTrendChartCard({ data }: { data: ManagerCategoryMetric[] | undefined }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { categories: [], series: [] };
    return {
      categories: data.map((d) => d.label),
      series: [{ name: "Volume", data: data.map((d) => d.value) }],
    };
  }, [data]);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        speed: 800,
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    colors: [T.info],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.0,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: {
      categories: chartData.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: T.textSecondary, fontSize: "12px", fontFamily: "inherit", fontWeight: 500 } },
    },
    yaxis: {
      labels: { style: { colors: T.textSecondary, fontSize: "12px", fontFamily: "inherit", fontWeight: 500 } },
    },
    grid: {
      borderColor: "rgba(226, 232, 240, 0.4)",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
      padding: { left: 0, right: 0 },
    },
    tooltip: { theme: "light" },
  };

  return (
    <BentoCard title="Booking Velocity" description="30-day trailing conversion volume" colSpan={4}>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
          <ChartLineUpIcon size={24} weight="duotone" />
        </div>
        <LiveStatus />
      </div>
      <div className="h-[280px] w-full -ml-3">
        {chartData.series[0]?.data.length > 0 ? (
          <Chart options={options} series={chartData.series} type="area" height="100%" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">Waiting for telemetry...</div>
        )}
      </div>
    </BentoCard>
  );
}

/* ─── Top Tours (The Intelligent List) ─── */
function TopToursList({ tours }: { tours: ManagerTopTour[] }) {
  if (!tours || tours.length === 0) return null;
  return (
    <BentoCard title="High-Performance Vectors" description="Ranked by total conversion volume" colSpan={2}>
      <div className="flex flex-col gap-6 mt-2">
        <AnimatePresence>
          {tours.slice(0, 4).map((tour, idx) => (
            <motion.div
              key={tour.name}
              layoutId={`tour-${tour.name}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: STIFFNESS, damping: DAMPING, delay: idx * 0.1 }}
              className="flex items-center gap-4 group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 text-xs font-bold font-mono group-hover:bg-slate-100 transition-colors">
                0{idx + 1}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="text-[14px] font-semibold text-slate-900 truncate">{tour.name}</h4>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max((tour.bookings / (tours[0]?.bookings || 1)) * 100, 5)}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.5 + idx * 0.1 }}
                    className="h-full bg-slate-800 rounded-full"
                  />
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="font-mono text-[14px] font-bold text-slate-900">{tour.bookings}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </BentoCard>
  );
}

/* ─── Metric Blocks ─── */
function QuickMetrics({ stats }: { stats: ManagerDashboardStats }) {
  return (
    <BentoCard title="Global Capacity" description="Total throughput across active vectors" colSpan={2}>
      <div className="grid grid-cols-2 gap-8 h-full">
        <div className="flex flex-col justify-center">
          <div className="text-slate-500 text-[13px] font-semibold mb-3 flex items-center gap-2 uppercase tracking-wider">
            <GlobeHemisphereWestIcon weight="duotone" className="text-emerald-500" size={18} />
            Active Tours
          </div>
          <div className="text-6xl font-semibold tracking-tighter text-slate-900">
            <AnimatedNum value={stats.activeTourInstances} />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="text-slate-500 text-[13px] font-semibold mb-3 flex items-center gap-2 uppercase tracking-wider">
            <TicketIcon weight="duotone" className="text-blue-500" size={18} />
            Conversions
          </div>
          <div className="text-6xl font-semibold tracking-tighter text-slate-900">
            <AnimatedNum value={stats.totalBookings} />
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

/* ─── Infinite Staff Carousel (Wide Data Stream) ─── */
function StaffStream({ staff }: { staff: ManagerStaffMember[] }) {
  if (!staff || staff.length === 0) return null;
  return (
    <BentoCard title="Active Operatives" description="Staff assignments deployed in the field" colSpan={4} className="overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <UsersThreeIcon size={20} weight="fill" className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{staff.length} Deployed</span>
      </div>
      {/* Infinite scrolling wrapper */}
      <div className="relative w-full overflow-hidden flex" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: staff.length * 4, repeat: Infinity }}
          className="flex gap-4 w-max"
        >
          {/* Double the array for seamless infinite scroll */}
          {[...staff, ...staff].map((s, i) => (
            <div key={`${s.id}-${i}`} className="flex-shrink-0 w-64 p-4 rounded-3xl border border-slate-100 bg-slate-50 flex items-center gap-4 hover:bg-slate-100 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 font-bold text-sm">
                {s.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-slate-900 truncate w-32">{s.fullName}</span>
                <span className="text-xs text-slate-500 mt-0.5">{s.role} • {s.tourCount} Tours</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </BentoCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */
export function ManagerDashboardPage() {
  const { data: dashboard, isLoading, error, refetch } = useManagerDashboardData();

  return (
    <main className="min-h-[100dvh] p-6 lg:px-12 lg:py-10 overflow-hidden" style={{ backgroundColor: T.bg, fontFamily: "'Geist', 'Outfit', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: STIFFNESS, damping: DAMPING }}>
          <div className="flex items-center gap-3 mb-3">
            <SparkleIcon size={24} weight="fill" className="text-slate-800" />
            <span className="text-xs font-bold tracking-widest uppercase text-slate-500">Workspace</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-slate-900 leading-none">
            Intelligence.
          </h1>
        </motion.div>
        
        <motion.button
          onClick={() => refetch()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-sm font-semibold text-slate-600"
        >
          {isLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <CircleNotchIcon size={16} weight="bold" />
            </motion.div>
          ) : (
            <ArrowsClockwiseIcon size={16} weight="bold" className="group-hover:rotate-180 transition-transform duration-500" />
          )}
          Sync Telemetry
        </motion.button>
      </div>

      {isLoading && (
        <div className="animate-pulse flex flex-col gap-12">
          <div className="h-[400px] bg-slate-200/50 rounded-[2.5rem]" />
          <div className="grid grid-cols-4 gap-10">
            <div className="col-span-2 h-80 bg-slate-200/50 rounded-[2.5rem]" />
            <div className="col-span-2 h-80 bg-slate-200/50 rounded-[2.5rem]" />
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center p-24 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="text-slate-300 mb-6"><CircleNotchIcon size={48} /></div>
          <p className="text-xl font-medium text-slate-800">Telemetry Offline</p>
          <p className="text-sm text-slate-500 mt-2 text-center max-w-md">{error}</p>
        </div>
      )}

      {!isLoading && !error && dashboard && (
        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-12"
        >
          {/* Row 1: Massive Chart */}
          <BookingTrendChartCard data={dashboard.bookingTrend || dashboard.tourInstancesByStatus} />
          
          {/* Row 2: Stats & Top Tours */}
          <QuickMetrics stats={dashboard.stats} />
          <TopToursList tours={dashboard.topTours} />

          {/* Row 3: Infinite Staff River */}
          <StaffStream staff={dashboard.staff} />
        </motion.div>
      )}
    </main>
  );
}

export default ManagerDashboardPage;
