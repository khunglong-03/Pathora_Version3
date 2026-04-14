"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import Card from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/api/services/adminService";
import type { TourManagerStaffDto, StaffMemberDto, StaffTourAssignment } from "@/types/admin";

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

function TourBadge({ tour }: { tour: StaffTourAssignment }) {
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
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${badgeColor}`}>
      <Icon icon="heroicons:map" className="size-3.5 shrink-0" />
      <span className="truncate max-w-[180px]" title={tour.tourName}>
        {tour.tourName}
      </span>
      <span className="text-[10px] opacity-70">({statusLabel})</span>
    </div>
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

export function StaffTrackingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dataState, setDataState] = useState<DataState>("loading");
  const [staffData, setStaffData] = useState<TourManagerStaffDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
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
        const result = await adminService.getTourManagerStaff(user.id);
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
          err instanceof Error ? err.message : t("staffTracking.error.fallback", "Failed to load staff data"),
        );
      }
    };

    void loadStaff();

    return () => {
      active = false;
    };
  }, [user?.id, reloadToken, t]);

  const staff = useMemo(() => staffData?.staff ?? [], [staffData]);

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
          s.activeTours.some((tour) => tour.tourName.toLowerCase().includes(query)),
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

    return { total, busyCount, availableCount, totalTourAssignments };
  }, [staff]);

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  return (
    <main id="main-content" className="p-6 lg:p-8 max-w-[87.5rem] mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        variants={itemVariants}
        initial="hidden"
        animate="show"
      >
        <div className="pl-px">
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">
            {t("staffTracking.pageTitle", "Staff Tracking")}
          </h1>
          <p className="text-sm text-stone-500 mt-1.5">
            {t("staffTracking.pageSubtitle", "Monitor your team members and their active tour assignments")}
          </p>
        </div>
        <button
          onClick={() => setReloadToken((v) => v + 1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.98] transition-all duration-200"
        >
          <Icon icon="heroicons:arrow-path" className="size-4" />
          {t("common.refresh", "Refresh")}
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
                  {t("staffTracking.error.title", "Failed to Load Staff")}
                </h2>
                <p className="text-sm text-red-700/80 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all duration-200 shrink-0"
            >
              {t("common.retry", "Retry")}
            </button>
          </div>
        </motion.div>
      )}

      {canShowData && (
        <>
          {/* Stats */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}>
              <Card
                className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 border-l-4 border-l-amber-300 !p-0"
                bodyClass="p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-stone-500">{t("staffTracking.stat.total", "Total Staff")}</p>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Icon icon="heroicons:users" className="size-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-stone-900 tracking-tight data-value">{metrics.total}</p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card
                className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 border-l-4 border-l-red-300 !p-0"
                bodyClass="p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-stone-500">{t("staffTracking.stat.busy", "Currently Busy")}</p>
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <Icon icon="heroicons:clock" className="size-5 text-red-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-stone-900 tracking-tight data-value">{metrics.busyCount}</p>
                <p className="text-xs mt-1 text-stone-400">
                  {t("staffTracking.stat.onTour", "on active tours")}
                </p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card
                className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 border-l-4 border-l-emerald-300 !p-0"
                bodyClass="p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-stone-500">{t("staffTracking.stat.available", "Available")}</p>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Icon icon="heroicons:check-circle" className="size-5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-stone-900 tracking-tight data-value">{metrics.availableCount}</p>
                <p className="text-xs mt-1 text-stone-400">
                  {t("staffTracking.stat.ready", "ready to assign")}
                </p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card
                className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 border-l-4 border-l-sky-300 !p-0"
                bodyClass="p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-stone-500">{t("staffTracking.stat.assignments", "Tour Assignments")}</p>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Icon icon="heroicons:map" className="size-5 text-sky-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-stone-900 tracking-tight data-value">
                  {metrics.totalTourAssignments}
                </p>
                <p className="text-xs mt-1 text-stone-400">
                  {t("staffTracking.stat.acrossStaff", "across all staff")}
                </p>
              </Card>
            </motion.div>
          </motion.div>

          {/* Search & Filters */}
          <motion.div className="flex flex-col sm:flex-row sm:items-center gap-3" variants={itemVariants} initial="hidden" animate="show">
            <div className="relative flex-1 max-w-sm">
              <Icon
                icon="heroicons:magnifying-glass"
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400"
              />
              <label htmlFor="staff-search" className="sr-only">
                {t("common.search", "Search")}
              </label>
              <input
                id="staff-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("staffTracking.searchPlaceholder", "Search staff or tours...")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-2">
              {(["all", "active", "inactive"] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
                    statusFilter === status
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                  }`}
                >
                  {status === "all"
                    ? t("staffTracking.filterAll", "All")
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Staff Table */}
          {isEmpty ? (
            <motion.div
              className="bg-white border border-stone-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-16 text-center"
              variants={itemVariants}
              initial="hidden"
              animate="show"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="heroicons:user-group" className="size-7 text-stone-300" />
              </div>
              <h2 className="text-lg font-semibold text-stone-700">
                {t("staffTracking.empty.title", "No Staff Members")}
              </h2>
              <p className="text-sm text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
                {t("staffTracking.empty.description", "Your team doesn't have any staff members yet.")}
              </p>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} initial="hidden" animate="show">
              <div className="rounded-[2.5rem] bg-white border border-stone-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="px-6 pt-5 pb-3 border-b border-stone-100 flex items-center justify-between">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">
                    {t("staffTracking.tableTitle", "Staff Members")} &middot; {filteredStaff.length}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-stone-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {t("staffTracking.liveData", "Live data")}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                          {t("staffTracking.column.name", "Staff Member")}
                        </th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                          {t("staffTracking.column.role", "Role")}
                        </th>
                        <th className="text-center px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                          {t("staffTracking.column.status", "Status")}
                        </th>
                        <th className="text-center px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                          {t("staffTracking.column.availability", "Availability")}
                        </th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                          {t("staffTracking.column.activeTours", "Active Tours")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredStaff.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-sm text-stone-500">
                            {t("staffTracking.noMatch", "No staff members match your search or filter.")}
                          </td>
                        </tr>
                      ) : (
                        filteredStaff.map((member) => (
                          <StaffRow key={member.id} member={member} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </main>
  );
}

function StaffRow({ member }: { member: StaffMemberDto }) {
  const initials = member.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <tr className="group hover:bg-stone-50/50 transition-colors duration-150">
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
            <div className="w-9 h-9 bg-gradient-to-br from-amber-100 to-amber-50 rounded-full flex items-center justify-center text-sm font-bold text-amber-700 border border-amber-200/50">
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
          <Icon
            icon={member.role === "TourGuide" ? "heroicons:map-pin" : "heroicons:pencil-square"}
            className="size-3.5"
          />
          {member.roleInTeam || member.role}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <StaffStatusBadge status={member.status} />
      </td>
      <td className="px-6 py-4 text-center">
        <BusyIndicator activeTours={member.activeTours} />
      </td>
      <td className="px-6 py-4">
        {member.activeTours.length === 0 ? (
          <span className="text-xs text-stone-400 italic">No active tours</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {member.activeTours.map((tour) => (
              <TourBadge key={tour.tourInstanceId} tour={tour} />
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}

export default StaffTrackingPage;
