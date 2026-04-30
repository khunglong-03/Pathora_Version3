"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SquaresFourIcon,
  GlobeHemisphereWestIcon,
  CalendarDotsIcon,
  ClipboardTextIcon,
  TicketIcon,
  CreditCardIcon,
  UsersThreeIcon,
  ShieldCheckIcon,
  CertificateIcon,
  GearIcon,
  XIcon,
  ListIcon,
  BellIcon,
  BuildingsIcon,
  VanIcon,
  BedIcon,
  PaintBrushIcon,
  TruckIcon,
  CarIcon,
  ListChecksIcon,
  BuildingOfficeIcon,
  HouseIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { tourRequestService } from "@/api/services/tourRequestService";
import { transportProviderService } from "@/api/services/transportProviderService";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { useTranslation } from "react-i18next";

/* ══════════════════════════════════════════════════════════════
   Navigation Items - Single Source of Truth
   ══════════════════════════════════════════════════════════════ */
export const MANAGER_NAV_ITEMS = [
  { label: "Dashboard", icon: SquaresFourIcon, href: "/manager/dashboard" },
  {
    label: "Tours",
    icon: GlobeHemisphereWestIcon,
    href: "/manager/tour-management",
  },
  {
    label: "Tour Instances",
    icon: CalendarDotsIcon,
    href: "/manager/tour-instances",
  },
  {
    label: "Tour Requests",
    icon: ClipboardTextIcon,
    href: "/manager/dashboard/tour-requests",
  },
  {
    label: "Custom Tour Requests",
    icon: ClipboardTextIcon,
    href: "/manager/dashboard/custom-tour-requests",
  },
  { label: "Bookings", icon: TicketIcon, href: "/manager/dashboard/bookings" },
  {
    label: "Payments",
    icon: CreditCardIcon,
    href: "/manager/dashboard/payments",
  },
  {
    label: "Staff Schedule",
    icon: CalendarDotsIcon,
    href: "/manager/staff-schedule",
  },
  {
    label: "Insurance",
    icon: ShieldCheckIcon,
    href: "/manager/dashboard/insurance",
  },
  {
    label: "Visa Applications",
    icon: CertificateIcon,
    href: "/manager/dashboard/visa",
  },
  {
    label: "Bank Accounts",
    icon: BuildingsIcon,
    href: "/manager/bank-accounts",
  },
] as const;

export const ADMIN_BASIC_NAV_ITEMS = [
  { label: "Quản lý Người dùng", icon: SquaresFourIcon, href: "/admin/users" },
  { label: "Settings", icon: GearIcon, href: "/dashboard/settings" },
] as const;

// Admin navigation groups with section labels
export const ADMIN_USER_ITEMS = [
  { label: "Quản lý Người dùng", icon: UsersThreeIcon, href: "/admin/users" },
] as const;

export const ADMIN_PROVIDER_ITEMS = [
  {
    label: "Nhà cung cấp Vận tải",
    icon: VanIcon,
    href: "/admin/transport-providers",
  },
  {
    label: "Nhà cung cấp Khách sạn",
    icon: BedIcon,
    href: "/admin/hotels/suppliers",
  },
] as const;

export const ADMIN_TOUR_ITEMS = [
  {
    label: "Quản lý Tour Manager",
    icon: UsersThreeIcon,
    href: "/admin/tour-managers",
  },
] as const;

export const ADMIN_SETTINGS_ITEMS = [
  { label: "Cấu hình hệ thống", icon: GearIcon, href: "/admin/settings" },
] as const;

// Flat nav items list (used by the component)
export const ADMIN_NAV_ITEMS = [
  ...ADMIN_USER_ITEMS,
  ...ADMIN_PROVIDER_ITEMS,
  ...ADMIN_TOUR_ITEMS,
  ...ADMIN_SETTINGS_ITEMS,
];

export const NAV_ITEMS = MANAGER_NAV_ITEMS;

export const HOTEL_PROVIDER_NAV_ITEMS = [
  { label: "KS của tôi", icon: BedIcon, href: "/hotel" },
  {
    label: "Phê duyệt Tour",
    icon: ListChecksIcon,
    href: "/hotel/tour-approvals",
  },
  { label: "Quản lý phòng", icon: BedIcon, href: "/hotel/rooms" },
  { label: "Nhận khách", icon: BuildingsIcon, href: "/hotel/arrivals" },
  { label: "Công ty", icon: BuildingOfficeIcon, href: "/hotel/profile" },
] as const;

// Shared base nav items (always shown)
export const TOUROPERATOR_BASE_NAV_ITEMS = [
  { label: "Trang chủ", icon: SquaresFourIcon, href: "/tour-operator" },
  { label: "Tour Của Tôi", icon: HouseIcon, href: "/tour-operator/tours" },
  { label: "Tạo Tour", icon: PlusIcon, href: "/tour-operator/tours/create" },
] as const;

// Public tour section — xe/khách sạn đã đăng ký sẵn
export const TOUROPERATOR_PUBLIC_NAV_ITEMS = [
  {
    label: "Tour Công Cộng",
    icon: GlobeHemisphereWestIcon,
    href: "/tour-operator/tour-instances/public",
  },
] as const;

// Private tour section — cần đăng ký xe và khách sạn
export const TOUROPERATOR_PRIVATE_NAV_ITEMS = [
  {
    label: "Tour Riêng Tư",
    icon: CalendarDotsIcon,
    href: "/tour-operator/tour-instances/private",
  },
  {
    label: "Custom Tour Requests",
    icon: ClipboardTextIcon,
    href: "/tour-operator/custom-tour-requests",
  },
] as const;

// Flat list kept for backward compat
export const TOUROPERATOR_NAV_ITEMS = [
  ...TOUROPERATOR_BASE_NAV_ITEMS,
  ...TOUROPERATOR_PUBLIC_NAV_ITEMS,
  ...TOUROPERATOR_PRIVATE_NAV_ITEMS,
] as const;

export const TOURGUIDE_NAV_ITEMS = [
  { label: "Trang chủ", icon: SquaresFourIcon, href: "/tour-guide" },
] as const;

export const TRANSPORT_PROVIDER_NAV_ITEMS = [
  { label: "VT của tôi", icon: TruckIcon, href: "/transport" },
  {
    label: "Phê duyệt Tour",
    icon: ListChecksIcon,
    href: "/transport/tour-approvals",
  },
  { label: "Quản lý xe", icon: CarIcon, href: "/transport/vehicles" },
  { label: "Quản lý tài xế", icon: UsersThreeIcon, href: "/transport/drivers" },
  { label: "Phân công chuyến", icon: ListChecksIcon, href: "/transport/trips" },
  { label: "Công ty", icon: BuildingOfficeIcon, href: "/transport/profile" },
] as const;

// Keep old export for backward compat during migration
export const PROVIDER_NAV_ITEMS = HOTEL_PROVIDER_NAV_ITEMS;

export type NavItem = (typeof MANAGER_NAV_ITEMS)[number];

// Section label definitions for Admin
export interface NavSectionLabel {
  label: string;
}

/* ══════════════════════════════════════════════════════════════
   AdminSidebar Props
   ══════════════════════════════════════════════════════════════ */
interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  variant?: "manager" | "admin" | "provider" | "tour-operator" | "tour-guide";
  isAdmin?: boolean;
  providerPortal?: "hotel" | "transport" | "tour-operator" | "tour-guide";
}

/* ══════════════════════════════════════════════════════════════
   AdminSidebar Component
   ══════════════════════════════════════════════════════════════ */
export function AdminSidebar({
  isOpen,
  onClose,
  children,
  variant = "manager",
  providerPortal,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems =
    variant === "admin"
      ? ADMIN_NAV_ITEMS
      : variant === "provider"
        ? providerPortal === "transport"
          ? TRANSPORT_PROVIDER_NAV_ITEMS
          : HOTEL_PROVIDER_NAV_ITEMS
        : variant === "tour-operator"
          ? TOUROPERATOR_NAV_ITEMS
          : variant === "tour-guide"
            ? TOURGUIDE_NAV_ITEMS
            : MANAGER_NAV_ITEMS;

  const loadCompanyName = useCallback(async () => {
    if (providerPortal !== "transport") return;
    try {
      const profile = await transportProviderService.getCompanyProfile();
      if (profile?.companyName) {
        setCompanyName(profile.companyName);
      }
    } catch {
      // Silently fail — company name is optional
    }
  }, [providerPortal]);

  // For admin, build enriched nav with section labels
  const renderAdminNav = () => {
    type AdminNavItem = {
      label: string;
      icon: (typeof ADMIN_USER_ITEMS)[number]["icon"];
      href: string;
    };
    const sections: Array<{
      sectionLabel?: string;
      items: readonly AdminNavItem[];
    }> = [
      { sectionLabel: "QUẢN LÝ TÀI KHOẢN", items: ADMIN_USER_ITEMS },
      { sectionLabel: "ĐỐI TÁC", items: ADMIN_PROVIDER_ITEMS },
      { sectionLabel: "ĐIỀU HÀNH TOUR", items: ADMIN_TOUR_ITEMS },
      { sectionLabel: "HỆ THỐNG", items: ADMIN_SETTINGS_ITEMS },
    ];

    return (
      <>
        {sections.map((section) => (
          <React.Fragment key={section.sectionLabel}>
            <div
              className="px-3 py-1.5 mt-2 text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "#9CA3AF" }}>
              {section.sectionLabel}
            </div>
            {section.items.map((item) => {
              const active = isActive(item.href);
              const IconComp = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                  onClick={onClose}
                  style={
                    active
                      ? {
                          backgroundColor: "var(--sidebar-active-bg)",
                          color: "var(--sidebar-active-text)",
                        }
                      : {
                          color: "var(--sidebar-text-muted)",
                        }
                  }>
                  <span
                    className="absolute inset-0 rounded-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                  />
                  <span className="relative z-10 transition-colors duration-200">
                    <IconComp size={20} weight={active ? "fill" : "regular"} />
                  </span>
                  <span className="relative z-10 transition-colors duration-200">
                    {item.label}
                  </span>
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        layoutId="sidebar-active-indicator"
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          damping: 20,
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full"
                        style={{
                          backgroundColor: "var(--sidebar-active-border)",
                        }}
                      />
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </>
    );
  };

  const loadPendingCount = useCallback(async () => {
    try {
      const result = await tourRequestService.getAllTourRequests({
        status: "Pending",
        pageNumber: 1,
        pageSize: 1,
      });
      setPendingCount(result.total);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    if (variant === "manager") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadPendingCount();
    }
    if (variant === "provider") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadCompanyName();
    }
  }, [variant, loadPendingCount, loadCompanyName]);

  const isActive = (href: string) => {
    const exactMatchHrefs = [
      "/manager/dashboard",
      "/admin/users",
      "/tour-operator",
      "/tour-guide",
      "/hotel",
      "/transport",
      "/manager/staff-schedule",
    ];
    if (exactMatchHrefs.includes(href)) {
      return pathname === href || pathname === href + "/";
    }

    // Prevent highlighting parent "Tours" when exactly on "Create Tour"
    if (
      href === "/tour-operator/tours" &&
      pathname.startsWith("/tour-operator/tours/create")
    ) {
      return false;
    }

    // Prevent "Tour Công Cộng" from matching when inside a private sub-route
    if (
      href === "/tour-operator/tour-instances/public" &&
      pathname.startsWith("/tour-operator/tour-instances/private")
    ) {
      return false;
    }

    // Prevent "Tour Riêng Tư" from matching when inside a public sub-route
    if (
      href === "/tour-operator/tour-instances/private" &&
      pathname.startsWith("/tour-operator/tour-instances/public")
    ) {
      return false;
    }

    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Sidebar */}
      {mounted ? (
        <motion.aside
          initial={false}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col lg:translate-x-0"
          style={{
            backgroundColor: "var(--sidebar-bg)",
            borderRight: "1px solid var(--sidebar-border)",
          }}>
          {/* Logo */}
          <div
            className="flex items-center justify-between px-5 h-16 shrink-0"
            style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
            <Link
              href={
                variant === "admin"
                  ? "/admin/users"
                  : variant === "provider"
                    ? providerPortal === "transport"
                      ? "/transport"
                      : "/hotel"
                    : variant === "tour-operator"
                      ? "/tour-operator"
                      : variant === "tour-guide"
                        ? "/tour-guide"
                        : "/manager/dashboard"
              }
              className="flex items-center gap-3 group">
              {/* Logo mark */}
              <div
                className="relative w-9 h-9 flex items-center justify-center rounded-lg font-bold text-sm text-white transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: "var(--accent)",
                }}>
                <BuildingsIcon
                  weight="fill"
                  size={18}
                  className="text-stone-900"
                />
                {/* Subtle shine */}
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)",
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span
                  className="text-sm font-semibold leading-none tracking-tight"
                  style={{ color: "var(--sidebar-text)" }}>
                  Pathora
                </span>
                <span
                  className="text-[10px] font-medium tracking-widest uppercase mt-0.5"
                  style={{ color: "var(--sidebar-text-muted)" }}>
                  {providerPortal === "transport"
                    ? "Transport Provider"
                    : providerPortal === "hotel"
                      ? "Hotel Provider"
                      : providerPortal === "tour-operator"
                        ? "Tour Operator"
                        : providerPortal === "tour-guide"
                          ? "Tour Guide"
                          : "Admin"}
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              aria-label="Close sidebar"
              className="lg:hidden rounded-lg p-1.5 transition-all duration-200 hover:bg-white/5"
              style={{ color: "var(--sidebar-text-muted)" }}>
              <XIcon size={18} weight="bold" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {variant === "admin" ? (
              renderAdminNav()
            ) : variant === "provider" ? (
              <div className="space-y-0.5">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const IconComp = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                      onClick={onClose}
                      style={
                        active
                          ? {
                              backgroundColor: "var(--sidebar-active-bg)",
                              color: "var(--sidebar-active-text)",
                            }
                          : {
                              color: "var(--sidebar-text-muted)",
                            }
                      }>
                      <span
                        className="absolute inset-0 rounded-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                      />
                      <span className="relative z-10 transition-colors duration-200">
                        <IconComp
                          size={20}
                          weight={active ? "fill" : "regular"}
                        />
                      </span>
                      <span className="relative z-10 transition-colors duration-200">
                        {item.label}
                      </span>
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            layoutId="sidebar-active-indicator"
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 100,
                              damping: 20,
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full"
                            style={{
                              backgroundColor: "var(--sidebar-active-border)",
                            }}
                          />
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}
              </div>
            ) : variant === "tour-operator" ? (
              <div className="space-y-0.5">
                {/* Base items */}
                {TOUROPERATOR_BASE_NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const IconComp = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                      onClick={onClose}
                      style={
                        active
                          ? {
                              backgroundColor: "var(--sidebar-active-bg)",
                              color: "var(--sidebar-active-text)",
                            }
                          : {
                              color: "var(--sidebar-text-muted)",
                            }
                      }>
                      <span
                        className="absolute inset-0 rounded-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                      />
                      <span className="relative z-10 transition-colors duration-200">
                        <IconComp size={20} weight={active ? "fill" : "regular"} />
                      </span>
                      <span className="relative z-10 transition-colors duration-200">
                        {item.label}
                      </span>
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            layoutId="sidebar-active-indicator"
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full"
                            style={{ backgroundColor: "var(--sidebar-active-border)" }}
                          />
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}

                {/* ── Tour Công Cộng section ─────────────────── */}
                <div
                  className="px-3 py-1.5 mt-3 text-[10px] font-semibold tracking-widest uppercase"
                  style={{ color: "#9CA3AF" }}>
                  🌐 Tour Công Cộng
                </div>
                {TOUROPERATOR_PUBLIC_NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const IconComp = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                      onClick={onClose}
                      style={
                        active
                          ? {
                              backgroundColor: "rgba(16,185,129,0.12)",
                              color: "#059669",
                            }
                          : {
                              color: "var(--sidebar-text-muted)",
                            }
                      }>
                      <span
                        className="absolute inset-0 rounded-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                        style={{ backgroundColor: "rgba(16,185,129,0.06)" }}
                      />
                      <span className="relative z-10 transition-colors duration-200">
                        <IconComp size={20} weight={active ? "fill" : "regular"} />
                      </span>
                      <span className="relative z-10 transition-colors duration-200">
                        {item.label}
                      </span>
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            layoutId={`sidebar-active-indicator-${item.href}`}
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-emerald-500"
                          />
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}

                {/* ── Tour Riêng Tư section ──────────────────── */}
                <div
                  className="px-3 py-1.5 mt-3 text-[10px] font-semibold tracking-widest uppercase"
                  style={{ color: "#9CA3AF" }}>
                  🔒 Tour Riêng Tư
                </div>
                {TOUROPERATOR_PRIVATE_NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const IconComp = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                      onClick={onClose}
                      style={
                        active
                          ? {
                              backgroundColor: "rgba(139,92,246,0.12)",
                              color: "#7c3aed",
                            }
                          : {
                              color: "var(--sidebar-text-muted)",
                            }
                      }>
                      <span
                        className="absolute inset-0 rounded-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                        style={{ backgroundColor: "rgba(139,92,246,0.06)" }}
                      />
                      <span className="relative z-10 transition-colors duration-200">
                        <IconComp size={20} weight={active ? "fill" : "regular"} />
                      </span>
                      <span className="relative z-10 transition-colors duration-200">
                        {item.label}
                      </span>
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            layoutId={`sidebar-active-indicator-${item.href}`}
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-purple-500"
                          />
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}
              </div>
            ) : variant === "tour-guide" ? (
              <div className="space-y-0.5">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const IconComp = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                      onClick={onClose}
                      style={
                        active
                          ? {
                              backgroundColor: "var(--sidebar-active-bg)",
                              color: "var(--sidebar-active-text)",
                            }
                          : {
                              color: "var(--sidebar-text-muted)",
                            }
                      }>
                      <span
                        className="absolute inset-0 rounded-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                      />
                      <span className="relative z-10 transition-colors duration-200">
                        <IconComp
                          size={20}
                          weight={active ? "fill" : "regular"}
                        />
                      </span>
                      <span className="relative z-10 transition-colors duration-200">
                        {item.label}
                      </span>
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            layoutId="sidebar-active-indicator"
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 100,
                              damping: 20,
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full"
                            style={{
                              backgroundColor: "var(--sidebar-active-border)",
                            }}
                          />
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-0.5">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const IconComp = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                      onClick={onClose}
                      style={
                        active
                          ? {
                              backgroundColor: "var(--sidebar-active-bg)",
                              color: "var(--sidebar-active-text)",
                            }
                          : {
                              color: "var(--sidebar-text-muted)",
                            }
                      }>
                      {/* Hover fill */}
                      <span
                        className="absolute inset-0 rounded-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                      />

                      {/* Icon */}
                      <span className="relative z-10 transition-colors duration-200">
                        <IconComp
                          size={20}
                          weight={active ? "fill" : "regular"}
                        />
                      </span>

                      {/* Label */}
                      <span className="relative z-10 transition-colors duration-200">
                        {item.label}
                      </span>

                      {/* Pending count badge for Tour Requests */}
                      {item.label === "Tour Requests" && pendingCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                          }}
                          className="relative z-10 inline-flex min-w-6 justify-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white ml-auto">
                          {pendingCount > 99 ? "99+" : pendingCount}
                        </motion.span>
                      )}

                      {/* Active indicator — amber pill bar on the left */}
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            layoutId="sidebar-active-indicator"
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 100,
                              damping: 20,
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full"
                            style={{
                              backgroundColor: "var(--sidebar-active-border)",
                            }}
                          />
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User */}
          <div
            className="shrink-0 p-3"
            style={{ borderTop: "1px solid var(--sidebar-border)" }}>
            {/* Admin card */}
            <div
              className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              <div
                className="relative w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{
                  backgroundColor: "var(--accent)",
                }}>
                {providerPortal === "transport" && companyName
                  ? companyName
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0] ?? "")
                      .join("")
                      .toUpperCase()
                  : providerPortal === "tour-operator"
                    ? "TD"
                    : providerPortal === "tour-guide"
                      ? "TG"
                      : "AD"}
                {/* Online dot */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                  style={{
                    backgroundColor: "#22c55e",
                    borderColor: "var(--sidebar-bg)",
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-medium truncate leading-none"
                  style={{ color: "var(--sidebar-text)" }}>
                  {providerPortal === "transport" && companyName
                    ? companyName
                    : providerPortal === "tour-operator"
                      ? "TourOperator"
                      : providerPortal === "tour-guide"
                        ? "TourGuide"
                        : "Admin"}
                </p>
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: "var(--sidebar-text-muted)" }}>
                  {providerPortal === "transport" && companyName
                    ? "TransportProvider"
                    : providerPortal === "hotel"
                      ? "HotelServiceProvider"
                      : providerPortal === "tour-operator"
                        ? "TourOperator"
                        : providerPortal === "tour-guide"
                          ? "TourGuide"
                          : "Administrator"}
                </p>
              </div>
            </div>
            <AdminLogoutButton />
          </div>
        </motion.aside>
      ) : (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] lg:translate-x-0" />
      )}

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.button
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 cursor-default lg:hidden"
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
            }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>

      {/* Main content area — shifts right on lg so sidebar (fixed) doesn't cover it */}
      {children && <div className="lg:ml-64">{children}</div>}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   TopBar Component (reusable)
   ══════════════════════════════════════════════════════════════ */
interface TopBarProps {
  onMenuClick: () => void;
  title?: string;
  subtitle?: string;
}

export function TopBar({ onMenuClick, title, subtitle }: TopBarProps) {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = (i18n.resolvedLanguage || i18n.language || "en")
    .toLowerCase()
    .split("-")[0];

  const toggleLanguage = () => {
    i18n.changeLanguage(currentLang === "en" ? "vi" : "en");
  };

  const hasTitle = Boolean(title);

  if (!hasTitle) {
    return (
      <header className="absolute top-0 right-0 z-40 w-full flex items-center justify-between px-6 py-3 pointer-events-none">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden pointer-events-auto text-stone-500 hover:text-stone-700 bg-white/80 backdrop-blur rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
          <ListIcon size={22} weight="bold" />
        </button>
        {mounted && (
          <div className="pointer-events-auto ml-auto flex items-center gap-1">
            <button
              onClick={toggleLanguage}
              aria-label="Toggle Language"
              title="Change language"
              className="relative p-2 text-stone-400 hover:text-stone-600 rounded-lg transition-all duration-200 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 font-semibold text-xs flex items-center gap-1 uppercase">
              <GlobeHemisphereWestIcon size={20} weight="regular" />
              {currentLang}
            </button>
            <button
              aria-label="Notifications"
              className="relative p-2 text-stone-400 hover:text-stone-600 rounded-lg transition-all duration-200 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
              <BellIcon size={20} weight="regular" />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ backgroundColor: "var(--accent)" }}
              />
            </button>
          </div>
        )}
      </header>
    );
  }

  return (
    <header
      className="sticky top-0 z-40 h-16 flex items-center px-6 gap-4 border-b transition-shadow duration-200"
      style={{
        backgroundColor: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}>
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="lg:hidden text-stone-400 hover:text-stone-600 rounded-lg p-2 -ml-2 transition-all duration-200 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
        <ListIcon size={22} weight="bold" />
      </button>
      {title && (
        <div className="flex-1">
          <h1
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {mounted && (
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={toggleLanguage}
            aria-label="Toggle Language"
            title="Change language"
            className="relative p-2 text-stone-400 hover:text-stone-600 rounded-lg transition-all duration-200 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 font-semibold text-xs flex items-center gap-1 uppercase">
            <GlobeHemisphereWestIcon size={20} weight="regular" />
            {currentLang}
          </button>
          <button
            aria-label="Notifications"
            className="relative p-2 text-stone-400 hover:text-stone-600 rounded-lg transition-all duration-200 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            <BellIcon size={20} weight="regular" />
            {/* Notification dot */}
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
            />
          </button>
        </div>
      )}
    </header>
  );
}
