"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import Card from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { extractResult } from "@/utils/apiResponse";
import type { TourManagerStaffDto, StaffMemberDto, StaffTourAssignment } from "@/types/admin";
import type { ApiResponse } from "@/types/home";

type DataState = "loading" | "ready" | "empty" | "error";
type StatusFilter = "all" | "active" | "inactive";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

/* ══════════════════════════════════════════════════════════════
   Helpers & Constants
   ══════════════════════════════════════════════════════════════ */
const COLORS = [
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-lime-100 text-lime-700 border-lime-200",
  "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  "bg-teal-100 text-teal-700 border-teal-200",
];

const getStaffColorClass = (staffId: string) => {
  let hash = 0;
  for (let i = 0; i < staffId.length; i++) {
    hash = staffId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

const getDotColorClass = (staffId: string) => {
  const styles = getStaffColorClass(staffId);
  const colorName = styles.split(" ")[1].split("-")[1]; // e.g., 'amber' from 'text-amber-700'
  return `bg-${colorName}-500`;
};

// Utilities for dates
const formatIsoObj = (d: Date) => {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
};

const normalizeDate = (d: string | Date) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

/* ══════════════════════════════════════════════════════════════
   Sub-Components
   ══════════════════════════════════════════════════════════════ */
function StaffStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const styles =
    normalized === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
      : "bg-stone-100 text-stone-500 border-stone-200/60";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${normalized === "active" ? "bg-emerald-500" : "bg-stone-400"}`}
      />
      {status}
    </span>
  );
}

function BusyIndicator({ activeTours }: { activeTours: StaffTourAssignment[] }) {
  const now = new Date();
  const ongoingTours = activeTours.filter((t) => {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    return now >= start && now <= end;
  });

  if (ongoingTours.length > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200/60">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        Busy
      </span>
    );
  }

  const hasUpcoming = activeTours.some((t) => now < new Date(t.startDate));
  if (hasUpcoming) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200/60">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        Scheduled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      Available
    </span>
  );
}

function TourBadgeCard({ tour }: { tour: StaffTourAssignment }) {
  const startDate = new Date(tour.startDate);
  const endDate = new Date(tour.endDate);
  const now = new Date();
  const isOngoing = now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;

  const badgeColor = isOngoing
    ? "bg-sky-50 text-sky-700 border-sky-200"
    : isUpcoming
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-stone-50 text-stone-600 border-stone-200";

  const statusLabel = isOngoing ? "Ongoing" : isUpcoming ? "Upcoming" : tour.instanceStatus;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-stone-200 bg-stone-50 gap-3">
      <div>
        <h4 className="text-sm font-semibold text-stone-800">{tour.tourName}</h4>
        <p className="text-xs text-stone-500 mt-1 font-mono">{tour.tourInstanceId.slice(0, 8)}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-medium text-stone-600">
            {startDate.toLocaleDateString("vi-VN")} - {endDate.toLocaleDateString("vi-VN")}
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 ${badgeColor}`}>
          {statusLabel}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */
export default function StaffScheduleCalendar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const safeT = (key: string, fallback: string) =>
    mounted ? t(key, fallback) : fallback;
  
  const [dataState, setDataState] = useState<DataState>("loading");
  const [staffData, setStaffData] = useState<TourManagerStaffDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  
  const [selectedStaff, setSelectedStaff] = useState<StaffMemberDto | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    const loadStaff = async () => {
      setDataState("loading");
      setErrorMessage(null);

      try {
        const response = await api.get<ApiResponse<TourManagerStaffDto>>(
          API_ENDPOINTS.MANAGER.GET_TOUR_MANAGER_STAFF(user.id),
        );
        const result = extractResult<TourManagerStaffDto>(response.data);
        if (!active) return;

        if (!result || result.staff.length === 0) {
          setStaffData(result ?? null);
          setDataState("empty");
        } else {
          setStaffData(result);
          setDataState("ready");
        }
      } catch (err) {
        if (!active) return;
        setStaffData(null);
        setDataState("error");
        setErrorMessage(
          err instanceof Error ? err.message : safeT("staffSchedule.error.fallback", "Failed to load staff schedule data")
        );
      }
    };

    void loadStaff();

    return () => {
      active = false;
    };
  }, [user?.id, reloadToken, t]);

  const staff = useMemo(() => staffData?.staff ?? [], [staffData]);

  // Derived Grid Logic
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of this month
    const firstDay = new Date(year, month, 1);
    // Find the previous Monday. getDay(): Sun=0, Mon=1...Sat=6.
    // If Sun(0), offset is 6. If Mon(1), offset is 0. If Tue(2), offset is 1.
    const dayOfWeek = firstDay.getDay();
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - offset);
    
    const gridDays = [];
    for (let i = 0; i < 42; i++) { // 6 rows * 7 cols
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      gridDays.push(d);
    }
    
    // If row 6 is entirely in the next month, we can just use 35 days (5 rows)
    const isRow6NextMonth = gridDays[35].getMonth() !== month && gridDays[35] > firstDay;
    if (isRow6NextMonth) {
      gridDays.length = 35;
    }
    return gridDays;
  }, [currentMonth]);

  // Derived Hash Map
  const staffByDay = useMemo(() => {
    const map = new Map<string, { staff: StaffMemberDto; tour: StaffTourAssignment }[]>();
    
    staff.forEach(s => {
      s.activeTours.forEach(tour => {
        const tStart = normalizeDate(tour.startDate);
        const tEnd = normalizeDate(tour.endDate);
        
        const cursor = new Date(tStart);
        while (cursor <= tEnd) {
          const key = formatIsoObj(cursor);
          const list = map.get(key) || [];
          // Avoid duplicates if multiple tours overlap for same staff (rare but possible)
          if (!list.some(x => x.staff.id === s.id)) {
             list.push({ staff: s, tour });
             map.set(key, list);
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      });
    });
    
    return map;
  }, [staff]);

  const filteredStaff = useMemo(() => {
    let result = staff;
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status.toLowerCase() === statusFilter);
    }
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.role.toLowerCase().includes(query) ||
          s.activeTours.some((tour) => tour.tourName.toLowerCase().includes(query))
      );
    }
    return result;
  }, [staff, statusFilter, debouncedSearch]);

  const metrics = useMemo(() => {
    const total = staff.length;
    const now = new Date();
    const busyCount = staff.filter((s) =>
      s.activeTours.some((tour) => {
        const start = new Date(tour.startDate);
        const end = new Date(tour.endDate);
        return now >= start && now <= end;
      }),
    ).length;
    const availableCount = total - busyCount;
    const totalTourAssignments = staff.reduce((sum, s) => sum + s.activeTours.length, 0);

    // Calculate tours this month
    const currentM = currentMonth.getMonth();
    const currentY = currentMonth.getFullYear();
    const uniqueToursThisMonth = new Set<string>();
    
    staff.forEach(s => {
      s.activeTours.forEach(t => {
        const start = new Date(t.startDate);
        const end = new Date(t.endDate);
        // Overlaps with current month
        if ((start.getMonth() === currentM && start.getFullYear() === currentY) ||
            (end.getMonth() === currentM && end.getFullYear() === currentY) ||
            (start < currentMonth && end > new Date(currentY, currentM + 1, 0))) {
          uniqueToursThisMonth.add(t.tourInstanceId);
        }
      });
    });

    return { total, busyCount, availableCount, totalTourAssignments, toursThisMonth: uniqueToursThisMonth.size };
  }, [staff, currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleToday = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setCurrentMonth(d);
  };
  
  const openDetail = (member: StaffMemberDto) => {
    setSelectedStaff(member);
    setShowDetail(true);
  };
  const closeDetail = () => {
    setShowDetail(false);
  };

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  return (
    <main id="main-content" className="p-6 lg:p-8 max-w-[87.5rem] mx-auto space-y-6 pb-20">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        variants={itemVariants}
        initial="hidden"
        animate="show"
      >
        <div className="pl-px">
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">
            {safeT("staffSchedule.pageTitle", "Staff Schedule")}
          </h1>
          <p className="text-sm text-stone-500 mt-1.5">
            {safeT("staffSchedule.pageSubtitle", "Monitor team assignments via calendar grid")}
          </p>
        </div>
        <button
          onClick={() => setReloadToken((v) => v + 1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.98] transition-all duration-200"
        >
          <Icon icon="heroicons:arrow-path" className="size-4" />
          {safeT("common.refresh", "Refresh")}
        </button>
      </motion.div>

      {isLoading && <SkeletonTable rows={4} columns={6} />}

      {isError && (
        <motion.div
          className="bg-white border border-red-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6"
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Icon icon="heroicons:exclamation-circle" className="size-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-red-800">
                  {safeT("staffSchedule.error.title", "Failed to Load Schedule")}
                </h2>
                <p className="text-sm text-red-700/80 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all duration-200 shrink-0"
            >
              {safeT("common.retry", "Retry")}
            </button>
          </div>
        </motion.div>
      )}

      {canShowData && (
        <>
          {/* Stats */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}>
              <Card className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 border-l-4 border-l-amber-300 !p-0" bodyClass="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-stone-500">{safeT("staffTracking.stat.total", "Total Staff")}</p>
                </div>
                <p className="text-2xl font-bold text-stone-900 tracking-tight">{metrics.total}</p>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 border-l-4 border-l-red-300 !p-0" bodyClass="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-stone-500">{safeT("staffTracking.stat.busy", "Currently Busy")}</p>
                </div>
                <p className="text-2xl font-bold text-stone-900 tracking-tight">{metrics.busyCount}</p>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 border-l-4 border-l-emerald-300 !p-0" bodyClass="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-stone-500">{safeT("staffTracking.stat.available", "Available")}</p>
                </div>
                <p className="text-2xl font-bold text-stone-900 tracking-tight">{metrics.availableCount}</p>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 border-l-4 border-l-sky-300 !p-0" bodyClass="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-stone-500">{safeT("staffTracking.stat.assignments", "Tour Assignments")}</p>
                </div>
                <p className="text-2xl font-bold text-stone-900 tracking-tight">{metrics.totalTourAssignments}</p>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 border-l-4 border-l-violet-300 !p-0" bodyClass="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-stone-500">{safeT("staffSchedule.stat.toursThisMonth", "Tours This Month")}</p>
                </div>
                <p className="text-2xl font-bold text-stone-900 tracking-tight">{metrics.toursThisMonth}</p>
              </Card>
            </motion.div>
          </motion.div>

          {/* Calendar Block */}
          {!isEmpty && (
            <motion.div variants={itemVariants} className="bg-white border border-stone-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
               {/* Calendar Header */}
               <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                 <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors">
                      <Icon icon="heroicons:chevron-left" className="size-5" />
                    </button>
                    <h2 className="text-lg font-bold text-stone-800 tabular-nums w-32 text-center">
                      Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors">
                      <Icon icon="heroicons:chevron-right" className="size-5" />
                    </button>
                 </div>
                 <button onClick={handleToday} className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                   {safeT("staffSchedule.calendar.today", "Hôm nay")}
                 </button>
               </div>
               
               {/* Grid */}
               <div className="hidden md:grid grid-cols-7 border-b border-stone-100 bg-stone-50/50">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
                    <div key={d} className="py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-widest border-r border-stone-100 last:border-r-0">
                      {d}
                    </div>
                  ))}
               </div>
               
               <div className="hidden md:grid grid-cols-7 bg-stone-100 gap-px border-t border-stone-100">
                 {calendarDays.map((d) => {
                   const dateKey = formatIsoObj(d);
                   const isSameMonth = d.getMonth() === currentMonth.getMonth();
                   const now = new Date();
                   const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                   const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                   
                   const assignments = staffByDay.get(dateKey) || [];
                   const displayLimit = 3;
                   const hasMore = assignments.length > displayLimit;
                   const visiblePills = assignments.slice(0, displayLimit);
                   
                   return (
                     <div 
                        key={dateKey} 
                        className={`min-h-[120px] bg-white p-2 transition-colors
                          ${!isSameMonth ? "opacity-50" : ""}
                          ${isWeekend && isSameMonth && !isToday ? "bg-stone-50/30" : ""}
                          ${isToday ? "ring-2 ring-amber-400 ring-inset bg-amber-50/10" : ""}
                        `}
                     >
                       <div className="flex items-center justify-between mb-1.5">
                         <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                           ${isToday ? "bg-amber-500 text-white" : "text-stone-500"}
                         `}>
                           {d.getDate()}
                         </span>
                         {assignments.length > 0 && (
                           <span className="text-[10px] font-medium text-stone-400">{assignments.length}</span>
                         )}
                       </div>
                       
                       <div className="space-y-1">
                         {visiblePills.map((a, i) => {
                           const colorClass = getStaffColorClass(a.staff.id);
                           const label = `${a.staff.fullName} - ${a.tour.tourName}`;
                           return (
                             <div 
                               key={a.staff.id + i}
                               title={label}
                               className={`px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded truncate cursor-help border ${colorClass}`}
                             >
                               {a.staff.fullName}
                             </div>
                           )
                         })}
                         {hasMore && (
                           <div className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded text-stone-500 bg-stone-100 cursor-pointer hover:bg-stone-200 truncate">
                             +{assignments.length - displayLimit} {safeT("staffSchedule.calendar.more", "khác")}
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
               
               {/* Mobile list view override */}
               <div className="md:hidden divide-y divide-stone-100">
                 {calendarDays.filter(d => d.getMonth() === currentMonth.getMonth() && (staffByDay.get(formatIsoObj(d))?.length || 0) > 0).map(d => {
                   const dateKey = formatIsoObj(d);
                   const assignments = staffByDay.get(dateKey) || [];
                   const now = new Date();
                   const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                   
                   return (
                     <div key={dateKey} className="p-4 flex gap-4">
                       <div className="shrink-0 w-12 text-center">
                         <div className={`text-xs font-semibold mb-1 ${isToday ? "text-amber-500" : "text-stone-400"}`}>
                           {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()]}
                         </div>
                         <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-bold
                           ${isToday ? "bg-amber-500 text-white" : "text-stone-800 bg-stone-100"}
                         `}>
                           {d.getDate()}
                         </div>
                       </div>
                       <div className="flex-1 space-y-1.5 pt-1">
                         {assignments.map(a => {
                           const colorClass = getStaffColorClass(a.staff.id);
                           return (
                             <div key={a.staff.id} className={`px-2 py-1.5 text-xs font-medium rounded border flex flex-col gap-0.5 ${colorClass}`}>
                               <span className="font-bold">{a.staff.fullName}</span>
                               <span className="opacity-80 truncate">{a.tour.tourName}</span>
                             </div>
                           )
                         })}
                       </div>
                     </div>
                   )
                 })}
               </div>
               
            </motion.div>
          )}

          {/* Search & Filters */}
          {!isEmpty && (
          <motion.div className="flex flex-col flex-wrap sm:flex-row sm:items-center gap-3 mt-8" variants={itemVariants} initial="hidden" animate="show">
            <h3 className="text-lg font-bold text-stone-800 sm:mr-auto">
              {safeT("staffSchedule.list.title", "Danh sách nhân viên")} ({filteredStaff.length})
            </h3>
            <div className="relative w-full sm:max-w-sm">
              <Icon
                icon="heroicons:magnifying-glass"
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400"
              />
              <label htmlFor="staff-search" className="sr-only">
                {safeT("common.search", "Search")}
              </label>
              <input
                id="staff-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={safeT("staffTracking.searchPlaceholder", "Search staff or tours...")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {(["all", "active", "inactive"] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${
                    statusFilter === status
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                  }`}
                >
                  {status === "all"
                    ? safeT("staffTracking.filterAll", "All")
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>
          )}

          {/* Staff Table */}
          {isEmpty ? (
            <motion.div
              className="bg-white border border-stone-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-16 text-center mt-6"
              variants={itemVariants}
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="heroicons:user-group" className="size-7 text-stone-300" />
              </div>
              <h2 className="text-lg font-semibold text-stone-700">
                {safeT("staffTracking.empty.title", "No Staff Members")}
              </h2>
              <p className="text-sm text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
                {safeT("staffTracking.empty.description", "Your team doesn't have any staff members yet.")}
              </p>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="mt-4">
              <div className="rounded-[2.5rem] bg-white border border-stone-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="w-4"></th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest min-w-[200px]">
                          {safeT("staffTracking.column.name", "Staff Member")}
                        </th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest whitespace-nowrap">
                          {safeT("staffTracking.column.role", "Role")}
                        </th>
                        <th className="text-center px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest whitespace-nowrap">
                          {safeT("staffTracking.column.status", "Status")}
                        </th>
                        <th className="text-center px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest whitespace-nowrap">
                          {safeT("staffTracking.column.availability", "Availability")}
                        </th>
                        <th className="text-right px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest w-24">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredStaff.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-sm text-stone-500">
                            {safeT("staffTracking.noMatch", "No staff members match your search or filter.")}
                          </td>
                        </tr>
                      ) : (
                        filteredStaff.map((member) => {
                           const dotColor = getDotColorClass(member.id);
                           const initials = member.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2);
                           
                           return (
                            <tr key={member.id} className="group hover:bg-stone-50/50 transition-colors duration-150">
                              <td className="pl-6 w-4">
                                <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {member.avatarUrl ? (
                                    <Image
                                      src={member.avatarUrl}
                                      alt={member.fullName}
                                      width={36}
                                      height={36}
                                      className="w-9 h-9 rounded-full object-cover border border-stone-200/50"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-sm font-bold text-stone-600 border border-stone-200/50">
                                      {initials}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-stone-800">{member.fullName}</p>
                                    <p className="text-xs text-stone-400">{member.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-xs font-medium text-stone-600">
                                  <Icon icon={member.role === "TourGuide" ? "heroicons:map-pin" : "heroicons:pencil-square"} className="size-3.5" />
                                  {member.roleInTeam || member.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <StaffStatusBadge status={member.status} />
                              </td>
                              <td className="px-6 py-4 text-center">
                                <BusyIndicator activeTours={member.activeTours} />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => openDetail(member)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100 text-stone-500 hover:bg-amber-100 hover:text-amber-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                  title={safeT("staffSchedule.list.viewDetail", "Xem chi tiết")}
                                >
                                  <Icon icon="heroicons:eye" className="size-4" />
                                </button>
                              </td>
                            </tr>
                           )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Staff Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedStaff && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100]"
               onClick={closeDetail}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden outline-none flex flex-col max-h-[85vh]"
               role="dialog"
               aria-modal="true"
               tabIndex={-1}
               // Quick keydown trap on div instead of full useEffect to ensure focus is managed easily
               onKeyDown={(e) => { if (e.key === 'Escape') closeDetail() }}
            >
               <div className="p-6 border-b border-stone-100 flex items-start gap-4 shrink-0 relative">
                 <button onClick={closeDetail} className="absolute right-4 top-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-full transition-colors outline-none focus-visible:ring-2">
                   <Icon icon="heroicons:x-mark" className="size-5" />
                 </button>
                 
                 <div className="relative shrink-0">
                    {selectedStaff.avatarUrl ? (
                      <Image
                        src={selectedStaff.avatarUrl}
                        alt={selectedStaff.fullName}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-2xl object-cover border border-stone-200/50"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-xl font-bold text-stone-600 border border-stone-200/50">
                        {selectedStaff.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getDotColorClass(selectedStaff.id)}`} />
                 </div>
                 
                 <div className="pt-1 pr-6 flex-1 min-w-0">
                   <h3 className="text-xl font-bold text-stone-900 truncate">{selectedStaff.fullName}</h3>
                   <p className="text-sm text-stone-500 mb-2 truncate">{selectedStaff.email}</p>
                   <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-xs font-medium text-stone-600">
                        <Icon icon={selectedStaff.role === "TourGuide" ? "heroicons:map-pin" : "heroicons:pencil-square"} className="size-3.5" />
                        {selectedStaff.roleInTeam || selectedStaff.role}
                      </span>
                      <StaffStatusBadge status={selectedStaff.status} />
                   </div>
                 </div>
               </div>
               
               <div className="p-6 overflow-y-auto bg-stone-50/50 flex-1 relative">
                 <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                   <span>Lịch trình được phân công</span>
                   <span className="px-2 py-0.5 rounded-full bg-stone-200/50 text-stone-500">{selectedStaff.activeTours.length} tours</span>
                 </h4>
                 
                 <div className="space-y-3">
                   {selectedStaff.activeTours.length === 0 ? (
                      <div className="text-center py-8 text-sm text-stone-500">
                        {safeT("staffSchedule.detail.noTours", "Nhân viên này hiện chưa được gán tour nào.")}
                      </div>
                   ) : (
                      // Sort ongoing first, then upcoming, then past
                      [...selectedStaff.activeTours].sort((a, b) => {
                         const n = new Date().getTime();
                         const isAOngoing = new Date(a.startDate).getTime() <= n && new Date(a.endDate).getTime() >= n;
                         const isBOngoing = new Date(b.startDate).getTime() <= n && new Date(b.endDate).getTime() >= n;
                         if (isAOngoing && !isBOngoing) return -1;
                         if (!isAOngoing && isBOngoing) return 1;
                         return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                      }).map((tour, idx) => (
                        <TourBadgeCard key={tour.tourInstanceId + idx} tour={tour} />
                      ))
                   )}
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
