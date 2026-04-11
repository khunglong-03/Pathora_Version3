"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SquaresFour,
  GlobeHemisphereWest,
  CalendarDots,
  ClipboardText,
  Ticket,
  CreditCard,
  UsersThree,
  ShieldCheck,
  Certificate,
  Gear,
  X,
  List,
  Bell,
  Buildings,
  Van,
  Bed,
  PaintBrush,
  Truck,
  Car,
  ListChecks,
  BuildingOffice,
} from "@phosphor-icons/react";
import { tourRequestService } from "@/api/services/tourRequestService";
import { transportProviderService } from "@/api/services/transportProviderService";
import { AdminLogoutButton } from "./AdminLogoutButton";

/* ══════════════════════════════════════════════════════════════
   Navigation Items - Single Source of Truth
   ══════════════════════════════════════════════════════════════ */
export const MANAGER_NAV_ITEMS = [
  { label: "Dashboard", icon: SquaresFour, href: "/manager/dashboard" },
  { label: "Tours", icon: GlobeHemisphereWest, href: "/manager/tour-management" },
  { label: "Tour Instances", icon: CalendarDots, href: "/manager/tour-instances" },
  { label: "Tour Requests", icon: ClipboardText, href: "/manager/dashboard/tour-requests" },
  { label: "Bookings", icon: Ticket, href: "/manager/dashboard/bookings" },
  { label: "Payments", icon: CreditCard, href: "/manager/dashboard/payments" },
  { label: "Customers", icon: UsersThree, href: "/manager/dashboard/customers" },
  { label: "Insurance", icon: ShieldCheck, href: "/manager/dashboard/insurance" },
  { label: "Visa Applications", icon: Certificate, href: "/manager/dashboard/visa" },
] as const;

export const ADMIN_BASIC_NAV_ITEMS = [
  { label: "Quản lý Người dùng", icon: SquaresFour, href: "/admin/users" },
  { label: "Settings", icon: Gear, href: "/dashboard/settings" },
] as const;

// Admin navigation groups with section labels
export const ADMIN_USER_ITEMS = [
  { label: "Quản lý Người dùng", icon: UsersThree, href: "/admin/users" },
] as const;

export const ADMIN_PROVIDER_ITEMS = [
  { label: "Nhà cung cấp Vận tải", icon: Van, href: "/admin/transport-providers" },
  { label: "Nhà cung cấp Khách sạn", icon: Bed, href: "/admin/hotels/suppliers" },
] as const;

export const ADMIN_TOUR_ITEMS = [
  { label: "Quản lý Tour Manager", icon: UsersThree, href: "/admin/tour-managers" },
] as const;

export const ADMIN_SETTINGS_ITEMS = [
  { label: "Cấu hình hệ thống", icon: Gear, href: "/admin/settings" },
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
  { label: "KS của tôi", icon: Bed, href: "/hotel" },
  { label: "Quản lý phòng", icon: Bed, href: "/hotel/rooms" },
  { label: "Nhận khách", icon: Buildings, href: "/hotel/arrivals" },
  { label: "Công ty", icon: BuildingOffice, href: "/hotel/profile" },
] as const;

export const TOURDESIGNER_NAV_ITEMS = [
  { label: "Trang chủ", icon: SquaresFour, href: "/tour-designer" },
] as const;

export const TOURGUIDE_NAV_ITEMS = [
  { label: "Trang chủ", icon: SquaresFour, href: "/tour-guide" },
] as const;

export const TRANSPORT_PROVIDER_NAV_ITEMS = [
  { label: "VT của tôi", icon: Truck, href: "/transport" },
  { label: "Quản lý xe", icon: Car, href: "/transport/vehicles" },
  { label: "Quản lý tài xế", icon: UsersThree, href: "/transport/drivers" },
  { label: "Phân công chuyến", icon: ListChecks, href: "/transport/trips" },
  { label: "Công ty", icon: BuildingOffice, href: "/transport/profile" },
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
  variant?: "manager" | "admin" | "provider" | "tour-designer" | "tour-guide";
  isAdmin?: boolean;
  providerPortal?: "hotel" | "transport" | "tour-designer" | "tour-guide";
}


/* ══════════════════════════════════════════════════════════════
   AdminSidebar Component
   ══════════════════════════════════════════════════════════════ */
export function AdminSidebar({ isOpen, onClose, children, variant = "manager", providerPortal }: AdminSidebarProps) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [companyName, setCompanyName] = useState<string>("");

  const navItems = variant === "admin" ? ADMIN_NAV_ITEMS : variant === "provider" ? (providerPortal === "transport" ? TRANSPORT_PROVIDER_NAV_ITEMS : HOTEL_PROVIDER_NAV_ITEMS) : variant === "tour-designer" ? TOURDESIGNER_NAV_ITEMS : variant === "tour-guide" ? TOURGUIDE_NAV_ITEMS : MANAGER_NAV_ITEMS;

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
    type AdminNavItem = { label: string; icon: typeof ADMIN_USER_ITEMS[number]["icon"]; href: string };
    const sections: Array<{ sectionLabel?: string; items: readonly AdminNavItem[] }> = [
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
              style={{ color: "#9CA3AF" }}
            >
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
                  }
                >
                  <span
                    className="absolute inset-0 rounded-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                  />
                  <span className="relative z-10 transition-colors duration-200">
                    <IconComp size={20} weight={active ? "fill" : "regular"} />
                  </span>
                  <span className="relative z-10 transition-colors duration-200">{item.label}</span>
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
    if (href === "/manager/dashboard") {
      return pathname === "/manager/dashboard" || pathname === "/manager/dashboard/";
    }
    if (href === "/admin/users") {
      return pathname === "/admin/users" || pathname === "/admin/users/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col lg:translate-x-0"
        style={{
          backgroundColor: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 h-16 shrink-0"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <Link
            href={variant === "admin" ? "/admin/users" : variant === "provider" ? (providerPortal === "transport" ? "/transport" : "/hotel") : variant === "tour-designer" ? "/tour-designer" : variant === "tour-guide" ? "/tour-guide" : "/manager/dashboard"}
            className="flex items-center gap-3 group"
          >
            {/* Logo mark */}
            <div
              className="relative w-9 h-9 flex items-center justify-center rounded-lg font-bold text-sm text-white transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: "var(--accent)",
              }}
            >
              <Buildings weight="fill" size={18} className="text-stone-900" />
              {/* Subtle shine */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)",
                }}
              />
            </div>
            <div className="flex flex-col">
              <span
                className="text-sm font-semibold leading-none tracking-tight"
                style={{ color: "var(--sidebar-text)" }}
              >
                Pathora
              </span>
              <span
                className="text-[10px] font-medium tracking-widest uppercase mt-0.5"
                style={{ color: "var(--sidebar-text-muted)" }}
              >
                {providerPortal === "transport"
                  ? "Transport Provider"
                  : providerPortal === "hotel"
                  ? "Hotel Provider"
                  : providerPortal === "tour-designer"
                  ? "Tour Designer"
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
            style={{ color: "var(--sidebar-text-muted)" }}
          >
            <X size={18} weight="bold" />
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
                    }
                  >
                    <span
                      className="absolute inset-0 rounded-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                    />
                    <span className="relative z-10 transition-colors duration-200">
                      <IconComp size={20} weight={active ? "fill" : "regular"} />
                    </span>
                    <span className="relative z-10 transition-colors duration-200">{item.label}</span>
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
            </div>
          ) : variant === "tour-designer" || variant === "tour-guide" ? (
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
                    }
                  >
                    <span
                      className="absolute inset-0 rounded-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                    />
                    <span className="relative z-10 transition-colors duration-200">
                      <IconComp size={20} weight={active ? "fill" : "regular"} />
                    </span>
                    <span className="relative z-10 transition-colors duration-200">{item.label}</span>
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
                    }
                  >
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
                    <span className="relative z-10 transition-colors duration-200">{item.label}</span>

                    {/* Pending count badge for Tour Requests */}
                    {item.label === "Tour Requests" && pendingCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="relative z-10 inline-flex min-w-6 justify-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white ml-auto"
                      >
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
                          transition={{ type: "spring", stiffness: 100, damping: 20 }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full"
                          style={{ backgroundColor: "var(--sidebar-active-border)" }}
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
          style={{ borderTop: "1px solid var(--sidebar-border)" }}
        >
          {/* Admin card */}
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <div
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{
                backgroundColor: "var(--accent)",
              }}
            >
              {providerPortal === "transport" && companyName
                ? companyName.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase()
                : providerPortal === "tour-designer"
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
              <p className="text-sm font-medium truncate leading-none" style={{ color: "var(--sidebar-text)" }}>
                {providerPortal === "transport" && companyName
                  ? companyName
                  : providerPortal === "tour-designer"
                  ? "TourDesigner"
                  : providerPortal === "tour-guide"
                  ? "TourGuide"
                  : "Admin"}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--sidebar-text-muted)" }}>
                {providerPortal === "transport" && companyName
                  ? "TransportProvider"
                  : providerPortal === "hotel"
                  ? "HotelServiceProvider"
                  : providerPortal === "tour-designer"
                  ? "TourDesigner"
                  : providerPortal === "tour-guide"
                  ? "TourGuide"
                  : "Administrator"}
              </p>
            </div>
          </div>
          <AdminLogoutButton />
        </div>
      </motion.aside>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.button
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 cursor-default lg:hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
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
  return (
    <header
      className="sticky top-0 z-40 h-16 flex items-center px-6 gap-4 transition-shadow duration-200 border-b"
      style={{
        backgroundColor: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="lg:hidden text-stone-400 hover:text-stone-600 rounded-lg p-2 -ml-2 transition-all duration-200 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <List size={22} weight="bold" />
      </button>
      {title && (
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="ml-auto flex items-center gap-1">
        <button
          aria-label="Notifications"
          className="relative p-2 text-stone-400 hover:text-stone-600 rounded-lg transition-all duration-200 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Bell size={20} weight="regular" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </button>
      </div>
    </header>
  );
}
