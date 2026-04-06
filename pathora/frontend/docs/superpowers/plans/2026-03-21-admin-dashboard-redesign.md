# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the admin dashboard with clean grid layout, split into focused component files, and simplified visual design.

**Architecture:** Extract chart utilities, atomic components, data hook, and section components from the 930-line monolithic file. Rewrite `AdminDashboardPage` as a thin orchestration layer. Remove all heavy animations (ShimmerSkeleton, FloatIcon, PulseRing, Reveal, SpringCard).

**Tech Stack:** Next.js 16, React 19, Tailwind v4, ApexCharts, Framer Motion (minimal)

---

## File Map

```
src/features/dashboard/
├── components/
│   ├── AdminDashboardPage.tsx           # MODIFY: rewrite as orchestrator
│   ├── DashboardHeader.tsx              # CREATE
│   ├── DashboardStats.tsx               # CREATE
│   ├── DashboardCharts.tsx             # CREATE
│   ├── DashboardSidebarPanel.tsx       # CREATE
│   ├── DashboardVisaPanel.tsx          # CREATE
│   ├── DashboardAlerts.tsx             # CREATE
│   ├── StatCard.tsx                    # CREATE: atomic
│   ├── ChartCard.tsx                   # CREATE: atomic
│   ├── TopToursTable.tsx               # CREATE
│   ├── DashboardSkeleton.tsx            # CREATE
│   └── ui/
│       ├── MetricLegend.tsx            # CREATE: atomic
│       ├── VisaStatusBadge.tsx         # CREATE: atomic
│       └── AlertItem.tsx               # CREATE: atomic
├── utils/
│   └── chartOptions.ts                 # CREATE: extracted factory functions
└── hooks/
    └── useDashboardData.ts             # CREATE
```

---

## Chunk 1: Utility Layer

### Task 1: Create chartOptions.ts

**Files:**
- Create: `pathora/frontend/src/features/dashboard/utils/chartOptions.ts`

- [ ] **Step 1: Create the file**

```typescript
import type { ApexOptions } from "apexcharts";

const TEXT_MUTED = "#9CA3AF";
const TEXT_SECONDARY = "#6B7280";
const BORDER_SUB = "#E5E7EB";
const SURFACE = "#FFFFFF";
const ACCENT = "#F97316";
const SUCCESS = "#10B981";

export function createLineOptions(categories: string[], yFormatter: (v: number) => string): ApexOptions {
  return {
    chart: { type: "line", toolbar: { show: false }, fontFamily: "inherit", background: "transparent" },
    stroke: { curve: "smooth", width: 2.5 },
    colors: [ACCENT],
    xaxis: {
      categories,
      labels: { style: { colors: TEXT_MUTED, fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: yFormatter, style: { colors: TEXT_MUTED, fontSize: "12px" } },
    },
    grid: { borderColor: BORDER_SUB, strokeDashArray: 5 },
    markers: { size: 4, colors: [ACCENT], strokeWidth: 2, strokeColors: SURFACE },
    tooltip: { y: { formatter: yFormatter } },
    theme: { mode: "light" },
  };
}

export function createAreaOptions(categories: string[]): ApexOptions {
  return {
    chart: { type: "area", toolbar: { show: false }, fontFamily: "inherit", background: "transparent" },
    stroke: { curve: "smooth", width: 2 },
    colors: [ACCENT],
    fill: { type: "gradient", gradient: { opacityFrom: 0.12, opacityTo: 0.008, stops: [0, 100] } },
    xaxis: {
      categories,
      labels: { style: { colors: TEXT_MUTED, fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: TEXT_MUTED, fontSize: "12px" } },
    },
    grid: { borderColor: BORDER_SUB, strokeDashArray: 5 },
    tooltip: { shared: true },
    legend: { show: false },
    theme: { mode: "light" },
  };
}

export function createBarOptions(categories: string[], color: string): ApexOptions {
  return {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit", background: "transparent" },
    colors: [color],
    plotOptions: { bar: { borderRadius: 8, columnWidth: "50%" } },
    xaxis: {
      categories,
      labels: { style: { colors: TEXT_MUTED, fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: TEXT_MUTED, fontSize: "12px" } },
    },
    grid: { borderColor: BORDER_SUB, strokeDashArray: 5 },
    dataLabels: { enabled: false },
    theme: { mode: "light" },
  };
}

export function createDonutOptions(labels: string[], colors: string[]): ApexOptions {
  return {
    chart: { type: "donut", fontFamily: "inherit", background: "transparent" },
    colors,
    labels,
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "68%" } } },
    stroke: { width: 2, colors: [SURFACE] },
    theme: { mode: "light" },
  };
}

export function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/DoAn/pathora/frontend
git add src/features/dashboard/utils/chartOptions.ts
git commit -m "feat(dashboard): extract chart options to utility file

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Create useDashboardData.ts

**Files:**
- Create: `pathora/frontend/src/features/dashboard/hooks/useDashboardData.ts`
- Reference: `pathora/frontend/src/api/services/adminService.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useCallback, useEffect, useState } from "react";
import { adminService } from "@/api/services/adminService";
import type { AdminDashboard } from "@/types/admin";

interface UseDashboardDataReturn {
  data: AdminDashboard | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminService.getDashboard();
      setData(result);
    } catch {
      setData(null);
      setError("error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { data, isLoading, error, refetch: load };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/hooks/useDashboardData.ts
git commit -m "feat(dashboard): add useDashboardData hook

Extracts data fetching logic from AdminDashboardPage.
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 2: Atomic UI Components

### Task 3: Create StatCard.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/StatCard.tsx`
- Reference: `pathora/frontend/src/features/dashboard/components/AdminDashboardPage.tsx:331-368`

- [ ] **Step 1: Create StatCard.tsx**

```tsx
"use client";

import React from "react";
import { Icon } from "@/components/ui";

interface StatCardProps {
  labelKey: string;
  value: string;
  icon: string;
  accent: string;
  eyebrow?: string;
  subtext?: string;
  delay?: number;
}

export function StatCard({ labelKey, value, icon, accent, eyebrow, subtext, delay = 0 }: StatCardProps) {
  return (
    <div
      className="fade-in-card bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[130px] flex flex-col justify-between transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      style={{ animationDelay: `${delay * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full mb-3" style={{ color: accent, backgroundColor: `${accent}10`, border: `1px solid ${accent}18` }}>
              {eyebrow}
            </span>
          )}
          <p className="text-xs font-medium" style={{ color: TEXT_MUTED }}>{labelKey}</p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ml-3"
          style={{ backgroundColor: `${accent}12` }}
        >
          <Icon icon={icon} className="size-5" style={{ color: accent }} />
        </div>
      </div>
      <p className="text-[2.25rem] font-bold tracking-tight leading-none" style={{ color: "#111827", letterSpacing: "-0.03em" }}>
        {value}
      </p>
      {subtext && (
        <p className="text-xs mt-2" style={{ color: TEXT_MUTED }}>{subtext}</p>
      )}
    </div>
  );
}

const TEXT_MUTED = "#9CA3AF";
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/StatCard.tsx
git commit -m "feat(dashboard): add StatCard atomic component

Clean card with eyebrow, icon, value, and optional subtext.
Hover shadow animation. No spring physics.
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Create ChartCard.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/ChartCard.tsx`
- Reference: `AdminDashboardPage.tsx:370-403`

- [ ] **Step 1: Create ChartCard.tsx**

```tsx
"use client";

import React from "react";

interface ChartCardProps {
  title: string;
  eyebrow?: string;
  period?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ChartCard({ title, eyebrow, period, children, delay = 0, className = "" }: ChartCardProps) {
  return (
    <div
      className={`fade-in-card bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[300px] flex flex-col transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${className}`}
      style={{ animationDelay: `${delay * 50}ms` }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full mb-3" style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}18` }}>
              {eyebrow}
            </span>
          )}
          <h3 className="text-sm font-semibold tracking-tight" style={{ color: "#111827" }}>{title}</h3>
        </div>
        {period && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ml-3"
            style={{ color: TEXT_MUTED, backgroundColor: "#F3F4F6" }}
          >
            {period}
          </span>
        )}
      </div>
      <div className="flex-1 mt-4">{children}</div>
    </div>
  );
}

const ACCENT = "#F97316";
const TEXT_MUTED = "#9CA3AF";
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/ChartCard.tsx
git commit -m "feat(dashboard): add ChartCard atomic component

Chart wrapper with eyebrow, title, period badge.
Min-height 300px, flex column layout.
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Create ui/MetricLegend.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/ui/MetricLegend.tsx`
- Reference: `AdminDashboardPage.tsx:268-284`

- [ ] **Step 1: Create MetricLegend.tsx**

```tsx
"use client";

import React from "react";
import type { AdminDashboardCategoryMetric } from "@/types/admin";

interface MetricLegendProps {
  items: AdminDashboardCategoryMetric[];
  colors: readonly string[];
}

export function MetricLegend({ items, colors }: MetricLegendProps) {
  return (
    <div className="space-y-2.5">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span style={{ color: "#6B7280" }}>{item.label}</span>
          </div>
          <span className="font-medium tabular-nums" style={{ color: "#111827" }}>
            {Math.round(item.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/ui/MetricLegend.tsx
git commit -m "feat(dashboard): add MetricLegend component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Create ui/VisaStatusBadge.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/ui/VisaStatusBadge.tsx`
- Reference: `AdminDashboardPage.tsx:286-311`

- [ ] **Step 1: Create VisaStatusBadge.tsx**

```tsx
"use client";

import React from "react";
import type { AdminDashboardVisaStatus } from "@/types/admin";

interface VisaStatusBadgeProps {
  status: AdminDashboardVisaStatus;
}

export function VisaStatusBadge({ status }: VisaStatusBadgeProps) {
  const n = status.label.toLowerCase();
  const isA = n === "approved", isR = n === "rejected", isV = n === "under review";
  const bg = isA ? "#D1FAE5" : isR ? "#FEE2E2" : isV ? "#DBEAFE" : "#FEF3C7";
  const text = isA ? "#10B981" : isR ? "#EF4444" : isV ? "#3B82F6" : "#F59E0B";
  const border = isA ? "#A7F3D0" : isR ? "#FECACA" : isV ? "#BFDBFE" : "#FDE68A";

  return (
    <div
      className="rounded-xl p-4 text-center border transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <p className="text-2xl font-bold tracking-tight tabular-nums leading-none" style={{ color: "#111827" }}>
        {status.count.toLocaleString()}
      </p>
      <span
        className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
        style={{ color: text, backgroundColor: "rgba(255,255,255,0.55)" }}
      >
        {status.label}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/ui/VisaStatusBadge.tsx
git commit -m "feat(dashboard): add VisaStatusBadge component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Create ui/AlertItem.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/ui/AlertItem.tsx`
- Reference: `AdminDashboardPage.tsx:313-327`

- [ ] **Step 1: Create AlertItem.tsx**

```tsx
"use client";

import React from "react";
import { Icon } from "@/components/ui";
import type { AdminDashboardAlert } from "@/types/admin";

const SEVERITY_STYLES: Record<string, { icon: string; textColor: string; bgColor: string; borderColor: string }> = {
  info:    { icon: "heroicons:information-circle",   textColor: "#3B82F6", bgColor: "#DBEAFE",    borderColor: "#BFDBFE" },
  warning: { icon: "heroicons:exclamation-triangle", textColor: "#F59E0B", bgColor: "#FEF3C7",   borderColor: "#FDE68A" },
  danger:  { icon: "heroicons:exclamation-circle",   textColor: "#EF4444", bgColor: "#FEE2E2",    borderColor: "#FECACA" },
  success: { icon: "heroicons:check-circle",         textColor: "#10B981", bgColor: "#D1FAE5",    borderColor: "#A7F3D0" },
};

interface AlertItemProps {
  alert: AdminDashboardAlert;
}

export function AlertItem({ alert }: AlertItemProps) {
  const s = SEVERITY_STYLES[alert.severity.toLowerCase()] ?? SEVERITY_STYLES.info;
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border" style={{ backgroundColor: s.bgColor, borderColor: s.borderColor }}>
      <Icon icon={s.icon} className="size-4 shrink-0" style={{ color: s.textColor }} />
      <p className="text-sm" style={{ color: s.textColor }}>{alert.text}</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/ui/AlertItem.tsx
git commit -m "feat(dashboard): add AlertItem component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Create TopToursTable.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/TopToursTable.tsx`
- Reference: `AdminDashboardPage.tsx:719-751`

- [ ] **Step 1: Create TopToursTable.tsx**

```tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import type { AdminDashboardTopTour } from "@/types/admin";

interface TopToursTableProps {
  tours: AdminDashboardTopTour[];
  noDataText: string;
  formatMoney: (value: number) => string;
  delay?: number;
}

export function TopToursTable({ tours, noDataText, formatMoney, delay = 0 }: TopToursTableProps) {
  return (
    <div className="mt-4 space-y-1">
      {tours.length === 0 ? (
        <div className="py-10 text-center text-sm rounded-xl border" style={{ color: "#9CA3AF", borderColor: "#E5E7EB", backgroundColor: "#F3F4F6" }}>
          {noDataText}
        </div>
      ) : (
        tours.map((tour, index) => (
          <div
            key={`${tour.name}-${index}`}
            className="flex items-center justify-between py-3.5 px-4 rounded-xl border-t cursor-default transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            style={{ borderColor: "#F3F4F6", backgroundColor: "#F9FAFB" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  backgroundColor: index === 0 ? "rgba(249,115,22,0.1)" : "#F3F4F6",
                  color: index === 0 ? "#F97316" : "#9CA3AF",
                }}
              >
                {index + 1}
              </span>
              <span className="text-sm truncate max-w-[140px]" style={{ color: "#6B7280" }}>{tour.name}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-xs tabular-nums" style={{ color: "#9CA3AF" }}>{tour.bookings.toLocaleString()}</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: "#10B981" }}>{formatMoney(tour.revenue)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/TopToursTable.tsx
git commit -m "feat(dashboard): add TopToursTable component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 3: Section Components

### Task 9: Create DashboardHeader.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/DashboardHeader.tsx`
- Reference: `AdminDashboardPage.tsx:521-569`

- [ ] **Step 1: Create DashboardHeader.tsx**

```tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui";

interface DashboardHeaderProps {
  pageTitle: string;
  pageSubtitle: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ pageTitle, pageSubtitle, isLoading, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end mb-10">
      <div className="relative">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full mb-3" style={{ color: "#F97316", backgroundColor: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.18)" }}>
          Analytics
        </span>
        <h1
          className="font-bold tracking-tight leading-none"
          style={{ color: "#111827", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", letterSpacing: "-0.04em" }}
        >
          {pageTitle}
        </h1>
        <p className="text-sm mt-2" style={{ color: "#9CA3AF" }}>
          {pageSubtitle}
        </p>
        <div className="absolute -bottom-2 left-0 h-0.5 rounded-full" style={{ backgroundColor: "#F97316", width: "3rem" }} />
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#F97316" }}>
            Live
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium border transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] disabled:opacity-50"
          style={{ borderColor: "#E5E7EB", color: "#6B7280", backgroundColor: "#FFFFFF" }}
        >
          <Icon icon="heroicons:arrow-path" className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/DashboardHeader.tsx
git commit -m "feat(dashboard): add DashboardHeader component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Create DashboardStats.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/DashboardStats.tsx`

- [ ] **Step 1: Create DashboardStats.tsx**

```tsx
"use client";

import React, { useMemo } from "react";
import { StatCard } from "./StatCard";
import type { AdminDashboard } from "@/types/admin";

interface DashboardStatsProps {
  dashboard: AdminDashboard;
  t: (key: string) => string;
  ACCENT: string;
  SUCCESS: string;
  INFO: string;
  DANGER: string;
  TEXT_MUTED: string;
}

export function DashboardStats({ dashboard, t, ACCENT, SUCCESS, INFO, DANGER, TEXT_MUTED }: DashboardStatsProps) {
  const statCards = useMemo(() => [
    { labelKey: t("adminDashboard.statTotalRevenue"),    value: `$${Math.round(dashboard.stats.totalRevenue).toLocaleString()}`, icon: "heroicons:currency-dollar",     accent: ACCENT,    eyebrow: "Revenue",    subtext: t("adminDashboard.statRevenueSubtext"), delay: 0 },
    { labelKey: t("adminDashboard.statTotalBookings"),  value: dashboard.stats.totalBookings.toLocaleString(),               icon: "heroicons:clipboard-document-list", accent: SUCCESS,  eyebrow: "Bookings",  delay: 1 },
    { labelKey: t("adminDashboard.statActiveTours"),     value: dashboard.stats.activeTours.toLocaleString(),                 icon: "heroicons:globe-alt",            accent: INFO,      eyebrow: "Tours",     delay: 2 },
    { labelKey: t("adminDashboard.statTotalCustomers"),  value: dashboard.stats.totalCustomers.toLocaleString(),              icon: "heroicons:user-group",            accent: TEXT_MUTED, eyebrow: "Customers",delay: 3 },
    { labelKey: t("adminDashboard.statCancellationRate"), value: `${dashboard.stats.cancellationRate.toFixed(1)}%`,           icon: "heroicons:x-circle",              accent: DANGER,    eyebrow: "Cancellation", delay: 4 },
    { labelKey: t("adminDashboard.statVisaApproval"),   value: `${dashboard.stats.visaApprovalRate.toFixed(1)}%`,             icon: "heroicons:shield-check",          accent: ACCENT,    eyebrow: "Visa",       delay: 5 },
  ], [dashboard.stats, t, ACCENT, SUCCESS, INFO, DANGER, TEXT_MUTED]);

  return (
    <>
      {/* Row 1: 4 equal stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        {statCards.slice(0, 4).map((stat) => (
          <StatCard key={stat.labelKey} {...stat} />
        ))}
      </div>
      {/* Row 2: 2 KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {statCards.slice(4, 6).map((stat) => (
          <StatCard key={stat.labelKey} {...stat} />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/DashboardStats.tsx
git commit -m "feat(dashboard): add DashboardStats section component

Row 1: 4 equal stat cards. Row 2: 2 KPI cards.
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Create DashboardCharts.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/DashboardCharts.tsx`
- Reference: `AdminDashboardPage.tsx:662-763`
- Reference: `chartOptions.ts` utility functions

- [ ] **Step 1: Create DashboardCharts.tsx**

```tsx
"use client";

import React, { useMemo } from "react";
import Chart from "@/components/ui/Chart";
import { ChartCard } from "./ChartCard";
import { TopToursTable } from "./TopToursTable";
import { MetricLegend } from "./ui/MetricLegend";
import { createLineOptions, createAreaOptions, createBarOptions, createDonutOptions, formatMoney } from "../utils/chartOptions";
import type { AdminDashboard } from "@/types/admin";

const ACCENT = "#F97316";
const SUCCESS = "#10B981";
const PALETTE = [ACCENT, SUCCESS, "#EF4444", "#3B82F6", "#9CA3AF", "#F59E0B"] as const;

interface DashboardChartsProps {
  dashboard: AdminDashboard;
  t: (key: string) => string;
}

export function DashboardCharts({ dashboard, t }: DashboardChartsProps) {
  // Normalize empty data
  const revenueOverTime = dashboard.revenueOverTime.length > 0 ? dashboard.revenueOverTime : [{ label: "adminDashboard.noDataChart", value: 0 }];
  const revenueByTourType = dashboard.revenueByTourType.length > 0 ? dashboard.revenueByTourType : [{ label: "adminDashboard.noDataChart", value: 0 }];
  const revenueByRegion = dashboard.revenueByRegion.length > 0 ? dashboard.revenueByRegion : [{ label: "adminDashboard.noDataChart", value: 0 }];
  const bookingStatusDist = dashboard.bookingStatusDistribution.length > 0 ? dashboard.bookingStatusDistribution : [{ label: "adminDashboard.noDataChart", value: 0 }];
  const bookingTrend = dashboard.bookingTrend.length > 0 ? dashboard.bookingTrend : [{ label: "adminDashboard.noDataChart", value: 0 }];
  const topDestinations = dashboard.topDestinations.length > 0 ? dashboard.topDestinations : [{ label: "adminDashboard.noDataChart", value: 0 }];
  const customerGrowth = dashboard.customerGrowth.length > 0 ? dashboard.customerGrowth : [{ label: "adminDashboard.noDataChart", value: 0 }];

  // Chart options & series
  const revenueOverTimeOptions = useMemo(() => createLineOptions(revenueOverTime.map(i => i.label), formatMoney), [revenueOverTime]);
  const revenueOverTimeSeries = useMemo(() => [{ name: "Revenue", data: revenueOverTime.map(i => Number(i.value)) }], [revenueOverTime]);

  const revenueByTourTypeOptions = useMemo(() => createDonutOptions(revenueByTourType.map(i => i.label), [...PALETTE]), [revenueByTourType]);
  const revenueByTourTypeSeries = useMemo(() => revenueByTourType.map(i => Number(i.value)), [revenueByTourType]);

  const revenueByRegionOptions = useMemo(() => createDonutOptions(revenueByRegion.map(i => i.label), [...PALETTE]), [revenueByRegion]);
  const revenueByRegionSeries = useMemo(() => revenueByRegion.map(i => Number(i.value)), [revenueByRegion]);

  const bookingStatusOptions = useMemo(() => createDonutOptions(bookingStatusDist.map(i => i.label), [...PALETTE]), [bookingStatusDist]);
  const bookingStatusSeries = useMemo(() => bookingStatusDist.map(i => Number(i.value)), [bookingStatusDist]);

  const bookingTrendOptions = useMemo(() => createAreaOptions(bookingTrend.map(i => i.label)), [bookingTrend]);
  const bookingTrendSeries = useMemo(() => [{ name: "Bookings", data: bookingTrend.map(i => Number(i.value)) }], [bookingTrend]);

  const topDestinationsOptions = useMemo(() => createBarOptions(topDestinations.map(i => i.label), ACCENT), [topDestinations]);
  const topDestinationsSeries = useMemo(() => [{ name: "Bookings", data: topDestinations.map(i => Number(i.value)) }], [topDestinations]);

  const customerGrowthOptions = useMemo(() => createBarOptions(customerGrowth.map(i => i.label), SUCCESS), [customerGrowth]);
  const customerGrowthSeries = useMemo(() => [{ name: "New Customers", data: customerGrowth.map(i => Number(i.value)) }], [customerGrowth]);

  return (
    <>
      {/* Row 3: Revenue line [8] + Tour Type donut [4] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        <ChartCard title={t("adminDashboard.chartRevenueOverTime")} period={t("adminDashboard.chartPeriodMonthly")} delay={0} className="lg:col-span-8">
          <Chart options={revenueOverTimeOptions} series={revenueOverTimeSeries} type="line" height={240} />
        </ChartCard>
        <ChartCard title={t("adminDashboard.chartByTourType")} delay={1} className="lg:col-span-4">
          <div className="flex flex-col items-center mt-2">
            <Chart options={revenueByTourTypeOptions} series={revenueByTourTypeSeries} type="donut" height={160} width={160} />
            <div className="mt-4 w-full">
              <MetricLegend items={revenueByTourType} colors={PALETTE} />
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 5: Booking trend [7] + Top Tours [5] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        <ChartCard title={t("adminDashboard.chartBookingTrend")} period={t("adminDashboard.chartPeriodMonthly")} delay={5} className="lg:col-span-7">
          <Chart options={bookingTrendOptions} series={bookingTrendSeries} type="area" height={200} />
        </ChartCard>
        <ChartCard title={t("adminDashboard.chartTopSellingTours")} delay={6} className="lg:col-span-5">
          <TopToursTable
            tours={dashboard.topTours}
            noDataText={t("adminDashboard.noTopTourData")}
            formatMoney={formatMoney}
            delay={6}
          />
        </ChartCard>
      </div>

      {/* Row 6: Destinations [4] + Customer Growth [8] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        <ChartCard title={t("adminDashboard.chartTopDestinations")} delay={7} className="lg:col-span-4">
          <Chart options={topDestinationsOptions} series={topDestinationsSeries} type="bar" height={180} />
        </ChartCard>
        <ChartCard title={t("adminDashboard.chartCustomerGrowth")} period={t("adminDashboard.chartPeriodMonthly")} delay={8} className="lg:col-span-8">
          <Chart options={customerGrowthOptions} series={customerGrowthSeries} type="bar" height={180} />
        </ChartCard>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/DashboardCharts.tsx
git commit -m "feat(dashboard): add DashboardCharts section component

Row 3: Revenue line + Tour Type donut.
Row 5: Booking trend area + Top Tours table.
Row 6: Top Destinations bar + Customer Growth bar.
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Create DashboardSidebarPanel.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/DashboardSidebarPanel.tsx`
- Reference: `AdminDashboardPage.tsx:677-710` (Quick Actions + Region/Booking side panel)

- [ ] **Step 1: Create DashboardSidebarPanel.tsx**

```tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ChartCard } from "./ChartCard";
import { MetricLegend } from "./ui/MetricLegend";
import { createDonutOptions } from "../utils/chartOptions";
import Chart from "@/components/ui/Chart";
import type { AdminDashboard } from "@/types/admin";
import { Icon } from "@/components/ui";

const ACCENT = "#F97316";
const PALETTE = [ACCENT, "#10B981", "#EF4444", "#3B82F6", "#9CA3AF", "#F59E0B"] as const;

interface DashboardSidebarPanelProps {
  dashboard: AdminDashboard;
  t: (key: string) => string;
}

const QUICK_ACTIONS = [
  { labelKey: "adminDashboard.quickActionCreateTour",     icon: "heroicons:plus",          href: "/tour-management/create" },
  { labelKey: "adminDashboard.quickActionScheduleTour",   icon: "heroicons:calendar",       href: "/tour-instances/create" },
  { labelKey: "adminDashboard.quickActionViewBookings",   icon: "heroicons:eye",            href: "/dashboard/bookings" },
  { labelKey: "adminDashboard.quickActionEditSiteContent", icon: "heroicons:document-text", href: "/dashboard/site-content" },
  { labelKey: "adminDashboard.quickActionManageVisa",     icon: "heroicons:shield-check",   href: "/dashboard/visa" },
];

export function DashboardSidebarPanel({ dashboard, t }: DashboardSidebarPanelProps) {
  const revenueByRegion = dashboard.revenueByRegion.length > 0 ? dashboard.revenueByRegion : [{ label: "adminDashboard.noDataChart", value: 0 }];
  const bookingStatusDist = dashboard.bookingStatusDistribution.length > 0 ? dashboard.bookingStatusDistribution : [{ label: "adminDashboard.noDataChart", value: 0 }];

  const revenueByRegionOptions = useMemo(() => createDonutOptions(revenueByRegion.map(i => i.label), [...PALETTE]), [revenueByRegion]);
  const revenueByRegionSeries = useMemo(() => revenueByRegion.map(i => Number(i.value)), [revenueByRegion]);

  const bookingStatusOptions = useMemo(() => createDonutOptions(bookingStatusDist.map(i => i.label), [...PALETTE]), [bookingStatusDist]);
  const bookingStatusSeries = useMemo(() => bookingStatusDist.map(i => Number(i.value)), [bookingStatusDist]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
      {/* Row 4: Region donut [5] */}
      <ChartCard title={t("adminDashboard.chartByRegion")} delay={2} className="lg:col-span-5">
        <div className="flex items-center gap-8 mt-2">
          <Chart options={revenueByRegionOptions} series={revenueByRegionSeries} type="donut" height={160} width={160} />
          <MetricLegend items={revenueByRegion} colors={PALETTE} />
        </div>
      </ChartCard>

      {/* Row 4: Booking donut [3] */}
      <ChartCard title={t("adminDashboard.chartBookingStatus")} delay={3} className="lg:col-span-3">
        <div className="flex items-center gap-5 mt-2">
          <Chart options={bookingStatusOptions} series={bookingStatusSeries} type="donut" height={140} width={140} />
          <MetricLegend items={bookingStatusDist} colors={PALETTE} />
        </div>
      </ChartCard>

      {/* Row 4: Quick Actions [4] */}
      <div className="fade-in-card lg:col-span-4 bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[300px] flex flex-col transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]" style={{ animationDelay: "200ms" }}>
        <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-5" style={{ color: "#9CA3AF" }}>
          {t("adminDashboard.quickActions")}
        </h3>
        <div className="space-y-1.5 flex-1">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.labelKey}
              href={action.href}
              className="group flex items-center gap-3 py-3.5 px-4 rounded-xl border transition-all duration-200"
              style={{
                borderColor: "#E5E7EB",
                color: "#6B7280",
                backgroundColor: "#FFFFFF",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(249,115,22,0.2)";
                el.style.backgroundColor = "rgba(249,115,22,0.03)";
                el.style.transform = "translateX(3px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#E5E7EB";
                el.style.backgroundColor = "#FFFFFF";
                el.style.transform = "translateX(0)";
              }}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3F4F6" }}>
                <Icon icon={action.icon} className="size-4" style={{ color: "#9CA3AF" }} />
              </span>
              <span className="text-xs font-medium leading-tight">{t(action.labelKey)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/DashboardSidebarPanel.tsx
git commit -m "feat(dashboard): add DashboardSidebarPanel section component

Row 4: Region donut [5] + Booking donut [3] + Quick Actions [4].
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Create DashboardVisaPanel.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/DashboardVisaPanel.tsx`
- Reference: `AdminDashboardPage.tsx:765-888`

- [ ] **Step 1: Create DashboardVisaPanel.tsx**

```tsx
"use client";

import React from "react";
import { ChartCard } from "./ChartCard";
import { VisaStatusBadge } from "./ui/VisaStatusBadge";
import { MetricLegend } from "./ui/MetricLegend";
import type { AdminDashboard } from "@/types/admin";
import { Icon } from "@/components/ui";

const ACCENT = "#F97316";
const PALETTE = [ACCENT, "#10B981", "#EF4444", "#3B82F6", "#9CA3AF", "#F59E0B"] as const;

interface DashboardVisaPanelProps {
  dashboard: AdminDashboard;
  t: (key: string) => string;
}

export function DashboardVisaPanel({ dashboard, t }: DashboardVisaPanelProps) {
  const customerNationalities = dashboard.customerNationalities.length > 0
    ? dashboard.customerNationalities
    : [{ label: "adminDashboard.noDataChart", value: 0 }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
      {/* Visa Processing [8] */}
      <div className="fade-in-card lg:col-span-8 bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[300px] flex flex-col transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]" style={{ animationDelay: "450ms" }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full mb-3" style={{ color: ACCENT, backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}18` }}>
              Visa Processing
            </span>
            <h3 className="text-sm font-semibold tracking-tight" style={{ color: "#111827" }}>
              {t("adminDashboard.chartVisaProcessing")}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative inline-flex shrink-0"><span className="w-2 h-2 rounded-full bg-[#10B981]" /></span>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#10B981" }}>Live</span>
          </div>
        </div>

        {/* Status badges grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {dashboard.visaStatuses.map((status, index) => (
            <VisaStatusBadge key={`${status.label}-${index}`} status={status} />
          ))}
        </div>

        {/* Upcoming deadlines */}
        <h4 className="text-[10px] font-semibold uppercase tracking-widest mt-8 mb-4" style={{ color: "#9CA3AF" }}>
          {t("adminDashboard.upcomingDeadlines")}
        </h4>
        <div className="space-y-1 flex-1">
          {dashboard.upcomingVisaDeadlines.length === 0 ? (
            <div className="py-5 px-4 rounded-xl text-xs text-center border" style={{ color: "#9CA3AF", borderColor: "#E5E7EB", backgroundColor: "#F3F4F6" }}>
              {t("adminDashboard.noUpcomingDeadlines")}
            </div>
          ) : (
            dashboard.upcomingVisaDeadlines.map((deadline) => (
              <div
                key={`${deadline.tour}-${deadline.date}`}
                className="flex items-center justify-between py-3.5 px-4 rounded-xl transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                style={{ backgroundColor: "#F9FAFB" }}
              >
                <span className="text-sm truncate mr-4" style={{ color: "#6B7280" }}>{deadline.tour}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0" style={{ color: "#F59E0B", backgroundColor: "#FEF3C7" }}>
                  {deadline.date}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right side panel [4]: Visa Summary + Customer Nationalities stacked */}
      <div className="lg:col-span-4 space-y-5">
        {/* Visa Summary */}
        <div className="fade-in-card bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[160px] flex flex-col transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]" style={{ animationDelay: "500ms" }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}12` }}>
              <Icon icon="heroicons:shield-check" className="size-6" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                {t("adminDashboard.visaSuccessRate")}
              </p>
              <p className="font-bold tracking-tight leading-none" style={{ color: "#111827", fontSize: "2rem", letterSpacing: "-0.03em" }}>
                {dashboard.visaSummary.approvalRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="space-y-0">
            {[
              { label: t("adminDashboard.visaTotal"),    value: dashboard.visaSummary.totalApplications.toLocaleString(), color: "#6B7280" },
              { label: t("adminDashboard.visaApproved"), value: dashboard.visaSummary.approved.toLocaleString(),          color: "#10B981" },
              { label: t("adminDashboard.visaRejected"), value: dashboard.visaSummary.rejected.toLocaleString(),            color: "#EF4444" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 border-t" style={{ borderColor: "#F3F4F6" }}>
                <span className="text-sm" style={{ color: "#9CA3AF" }}>{row.label}</span>
                <span className="font-semibold tabular-nums" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Nationalities */}
        <div className="fade-in-card bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[130px] transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]" style={{ animationDelay: "550ms" }}>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-5" style={{ color: "#9CA3AF" }}>
            {t("adminDashboard.customerNationality")}
          </h3>
          <MetricLegend items={customerNationalities} colors={PALETTE} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/DashboardVisaPanel.tsx
git commit -m "feat(dashboard): add DashboardVisaPanel section component

Row 7: Visa Processing [8] + Visa Summary + Nationalities [4].
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Create DashboardAlerts.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/DashboardAlerts.tsx`
- Reference: `AdminDashboardPage.tsx:891-920`

- [ ] **Step 1: Create DashboardAlerts.tsx**

```tsx
"use client";

import React from "react";
import { AlertItem } from "./ui/AlertItem";
import type { AdminDashboard } from "@/types/admin";

interface DashboardAlertsProps {
  dashboard: AdminDashboard;
  t: (key: string) => string;
}

export function DashboardAlerts({ dashboard, t }: DashboardAlertsProps) {
  return (
    <div className="fade-in-card bg-white rounded-xl border border-[#E5E7EB] p-6 mb-5 transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]" style={{ animationDelay: "600ms" }}>
      <div className="flex items-center gap-3 mb-1">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full" style={{ color: "#F97316", backgroundColor: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.18)" }}>
          Live Feed
        </span>
        <span className="flex items-center gap-1.5 mb-3">
          <span className="relative inline-flex shrink-0"><span className="w-2 h-2 rounded-full bg-[#22c55e]" /></span>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#22c55e" }}>Active</span>
        </span>
      </div>
      <h3 className="text-sm font-semibold tracking-tight mb-5" style={{ color: "#111827" }}>
        {t("adminDashboard.operationalAlerts")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {dashboard.alerts.length === 0 ? (
          <div className="py-5 text-center text-sm md:col-span-3 rounded-xl border" style={{ color: "#9CA3AF", borderColor: "#E5E7EB", backgroundColor: "#F3F4F6" }}>
            {t("adminDashboard.noAlerts")}
          </div>
        ) : (
          dashboard.alerts.map((alert, index) => (
            <AlertItem key={`${alert.text}-${index}`} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/DashboardAlerts.tsx
git commit -m "feat(dashboard): add DashboardAlerts section component

Row 8: Operational alerts full width.
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 4: Loading State + Page Orchestration

### Task 15: Create DashboardSkeleton.tsx

**Files:**
- Create: `pathora/frontend/src/features/dashboard/components/DashboardSkeleton.tsx`

- [ ] **Step 1: Create DashboardSkeleton.tsx**

```tsx
"use client";

import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end mb-10">
        <div className="space-y-2">
          <div className="h-4 w-16 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-4 w-64 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-gray-200 animate-pulse" />
      </div>

      {/* Row 1: 4 stat skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[130px] rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>

      {/* Row 2: 2 KPI skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-[130px] rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>

      {/* Row 3: chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 h-[360px] rounded-xl bg-gray-100 animate-pulse" />
        <div className="lg:col-span-4 h-[360px] rounded-xl bg-gray-100 animate-pulse" />
      </div>

      {/* Row 4: donut skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
        <div className="lg:col-span-3 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
        <div className="lg:col-span-4 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
      </div>

      {/* Row 5: chart + table skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
        <div className="lg:col-span-5 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/DashboardSkeleton.tsx
git commit -m "feat(dashboard): add DashboardSkeleton loading component

Simple pulse skeletons matching the grid layout.
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Rewrite AdminDashboardPage.tsx

**Files:**
- Modify: `pathora/frontend/src/features/dashboard/components/AdminDashboardPage.tsx`
- Reference: `AdminDashboardPage.tsx` existing imports and structure (line 20: `AdminSidebar`, `TopBar`)

- [ ] **Step 1: Rewrite AdminDashboardPage.tsx**

Replace the entire 928-line file with this ~90-line orchestrator:

```tsx
"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { AdminSidebar, TopBar } from "./AdminSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardStats } from "./DashboardStats";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardSidebarPanel } from "./DashboardSidebarPanel";
import { DashboardVisaPanel } from "./DashboardVisaPanel";
import { DashboardAlerts } from "./DashboardAlerts";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { useDashboardData } from "../hooks/useDashboardData";

const ACCENT = "#F97316";
const SUCCESS = "#10B981";
const INFO = "#3B82F6";
const DANGER = "#EF4444";
const TEXT_MUTED = "#9CA3AF";

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { data: dashboard, isLoading, error, refetch } = useDashboardData();

  return (
    <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <main id="main-content" className="p-6 lg:py-8 lg:pr-8 lg:pl-6" style={{ backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
        <DashboardHeader
          pageTitle={t("adminDashboard.pageTitle")}
          pageSubtitle={t("adminDashboard.pageSubtitle")}
          isLoading={isLoading}
          onRefresh={refetch}
        />

        {/* Loading */}
        {isLoading && <DashboardSkeleton />}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{t("adminDashboard.noData")}</p>
            <button
              onClick={refetch}
              className="px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: "#111827", color: "#FFFFFF" }}
            >
              {t("adminDashboard.refresh")}
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && !dashboard && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{t("adminDashboard.noData")}</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && dashboard && (
          <>
            <DashboardStats
              dashboard={dashboard}
              t={t}
              ACCENT={ACCENT}
              SUCCESS={SUCCESS}
              INFO={INFO}
              DANGER={DANGER}
              TEXT_MUTED={TEXT_MUTED}
            />
            <DashboardCharts dashboard={dashboard} t={t} />
            <DashboardSidebarPanel dashboard={dashboard} t={t} />
            <DashboardVisaPanel dashboard={dashboard} t={t} />
            <DashboardAlerts dashboard={dashboard} t={t} />
          </>
        )}
      </main>
    </AdminSidebar>
  );
}

export default AdminDashboardPage;
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/components/AdminDashboardPage.tsx
git commit -m "refactor(dashboard): rewrite AdminDashboardPage as orchestrator

Split 930-line file into: Header, Stats, Charts, SidebarPanel,
VisaPanel, Alerts, Skeleton sections. ~90 lines total.
Removed: ShimmerSkeleton, FloatIcon, PulseRing, Reveal, SpringCard.
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 5: Global CSS — Fade-in Animation

### Task 17: Add fade-in CSS to globals

**Files:**
- Modify: `pathora/frontend/src/app/globals.css`

- [ ] **Step 1: Find where to add the CSS** (likely at the end of the file)

Add this before any closing brace or at the end of globals.css:

```css
/* Dashboard fade-in animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-card {
  animation: fadeIn 300ms ease-out forwards;
  opacity: 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "style(dashboard): add fade-in-card animation to globals

Replaces all Framer Motion scroll-reveal and spring animations.
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 6: Validation

### Task 18: Run lint + build

- [ ] **Step 1: Run lint**

```bash
npm run lint --prefix D:/DoAn/pathora/frontend
```

Expected: PASS (no errors)

- [ ] **Step 2: Run build**

```bash
npm run build --prefix D:/DoAn/pathora/frontend
```

Expected: PASS — static build completes

- [ ] **Step 3: Commit (if clean)**

```bash
git add -A
git commit -m "fix(dashboard): resolve lint/build issues

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

If build fails, diagnose and fix. Common issues:
- Missing imports — add `Icon`, `Chart` from `@/components/ui`
- Type mismatches — ensure `AdminDashboard` types match from `@/types/admin`
- Tailwind classes not found — use standard utilities

---

## Summary

| Chunk | Tasks | Files Created |
|-------|-------|---------------|
| 1 | 1-2 | chartOptions.ts, useDashboardData.ts |
| 2 | 3-8 | StatCard, ChartCard, MetricLegend, VisaStatusBadge, AlertItem, TopToursTable |
| 3 | 9-14 | DashboardHeader, DashboardStats, DashboardCharts, DashboardSidebarPanel, DashboardVisaPanel, DashboardAlerts |
| 4 | 15-16 | DashboardSkeleton, AdminDashboardPage (rewrite) |
| 5 | 17 | globals.css (fade-in) |
| 6 | 18 | Validation (lint + build) |
