"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui";
import { tourRequestService } from "@/api/services/tourRequestService";
import { AdminLogoutButton } from "./AdminLogoutButton";

type TourRequestAdminLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  pendingRefreshKey?: number;
};

type NavItem = {
  label: string;
  icon: string;
  href: string;
  showPendingBadge?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: "heroicons:squares-2x2", href: "/dashboard" },
  { label: "Tours", icon: "heroicons:globe-alt", href: "/tour-management" },
  {
    label: "Tour Instances",
    icon: "heroicons:calendar-days",
    href: "/manager/tour-instances",
  },
  {
    label: "Tour Requests",
    icon: "heroicons:clipboard-document-list",
    href: "/dashboard/tour-requests",
    showPendingBadge: true,
  },
  { label: "Bookings", icon: "heroicons:ticket", href: "/dashboard/bookings" },
  { label: "Payments", icon: "heroicons:credit-card", href: "/dashboard/payments" },
  { label: "Customers", icon: "heroicons:user-group", href: "/dashboard/customers" },
  {
    label: "Insurance",
    icon: "heroicons:shield-check",
    href: "/dashboard/insurance",
  },
  {
    label: "Visa Applications",
    icon: "heroicons:document-check",
    href: "/dashboard/visa",
  },
  {
    label: "Policies",
    icon: "heroicons:clipboard-document-list",
    href: "/dashboard/policies",
  },
  {
    label: "Visa Policies",
    icon: "heroicons:document-text",
    href: "/visa-policies",
  },
  {
    label: "Pricing Policies",
    icon: "heroicons:currency-dollar",
    href: "/pricing-policies",
  },
  {
    label: "Deposit Policies",
    icon: "heroicons:currency-dollar",
    href: "/deposit-policies",
  },
  {
    label: "Tax Config",
    icon: "heroicons:wallet",
    href: "/tax-configs",
  },
  { label: "Settings", icon: "heroicons:cog-6-tooth", href: "/dashboard/settings" },
];

const isRouteActive = (pathname: string, href: string): boolean => {
  return pathname === href || pathname.startsWith(`${href}/`);
};

const sidebarVariants = {
  open: { x: 0 },
  closed: { x: "-100%" },
};

const overlayVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

export function TourRequestAdminLayout({
  title,
  subtitle,
  children,
  pendingRefreshKey,
}: TourRequestAdminLayoutProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPendingCount();
  }, [loadPendingCount, pendingRefreshKey]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Sidebar Overlay (mobile) ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        <motion.aside
          variants={sidebarVariants}
          initial="closed"
          animate={sidebarOpen ? "open" : "closed"}
          transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-white flex flex-col lg:translate-x-0`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-linear-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-transform group-hover:scale-105">
                P
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Pathora
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="text-stone-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <Icon icon="heroicons:x-mark" className="size-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              initial="hidden"
              animate="show"
            >
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(pathname, item.href);

                return (
                  <motion.div key={item.href} variants={navItemVariants}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                          : "text-stone-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <Icon icon={item.icon} className="size-5" />
                        <span>
                          {item.showPendingBadge
                            ? t("tourRequest.page.adminRequests.title")
                            : item.label}
                        </span>
                      </span>

                      {item.showPendingBadge && pendingCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" as const, stiffness: 200, damping: 15 }}
                          className="inline-flex min-w-6 justify-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white"
                        >
                          {pendingCount > 99 ? "99+" : pendingCount}
                        </motion.span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </nav>

          {/* User Profile */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2">
              <div className="w-9 h-9 bg-linear-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">Administrator</p>
                <p className="text-xs text-stone-400 truncate">Admin account</p>
              </div>
            </div>
            <AdminLogoutButton />
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                className="lg:hidden text-stone-500 hover:text-stone-700 transition-colors p-2 rounded-xl hover:bg-stone-100"
              >
                <Icon icon="heroicons:bars-3" className="size-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900">{title}</h1>
                <p className="text-sm text-stone-500">{subtitle}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
