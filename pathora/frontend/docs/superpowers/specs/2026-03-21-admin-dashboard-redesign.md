# Admin Dashboard Redesign

## Overview

Redesign the admin dashboard page at `/dashboard` with a clean, professional layout. The current implementation has ~930 lines in a single file with excessive animations, inconsistent grid layouts, and non-uniform card heights.

## Problem Statement

1. **Single file bloat** — 930 lines with ~20 inline sub-components, impossible to maintain
2. **Layout inconsistency** — Cards have non-uniform heights, grid columns don't align across rows (e.g., Row 4: 5+3+4 cols, Row 7: 8+4 cols)
3. **Excessive animations** — ShimmerSkeleton, FloatIcon, PulseRing, Reveal (scroll-driven), SpringCard (spring physics) — all cause lag and add no real UX value
4. **Over-engineered CardShell** — Double-bezel nested shells with linear-gradient overlays create visual noise without clarity
5. **Sidebar issues** — Width mismatch between sidebar and content area

## Design

### 1. File Structure

Split the monolithic file into focused modules:

```
src/features/dashboard/
├── components/
│   ├── AdminDashboardPage.tsx       # Orchestration only, ~80 lines
│   ├── DashboardHeader.tsx          # Title, subtitle, refresh button
│   ├── DashboardStats.tsx           # Row 1 (4 stats) + Row 2 (2 KPIs)
│   ├── DashboardCharts.tsx          # All chart rows (3, 5, 6)
│   ├── DashboardSidebarPanel.tsx    # Row 4: Region + Booking + Quick Actions
│   ├── DashboardVisaPanel.tsx       # Row 7: Visa processing + summary
│   ├── DashboardAlerts.tsx         # Row 8: Operational alerts
│   ├── StatCard.tsx                 # Atomic: single stat card
│   ├── ChartCard.tsx                # Atomic: chart wrapper with title
│   ├── TopToursTable.tsx           # Top selling tours table
│   └── ui/
│       ├── MetricLegend.tsx
│       ├── VisaStatusBadge.tsx
│       └── AlertItem.tsx
└── hooks/
    └── useDashboardData.ts          # Data fetching, loading, error state
```

Each file ≤ 150 lines. `AdminDashboardPage` only composes sections.

### 2. Grid System

Use CSS Grid 12-col consistently:

| Row | Layout | Components |
|-----|--------|-----------|
| 1 | [3] [3] [3] [3] | 4 stat cards (equal width) |
| 2 | [6] [6] | 2 KPI cards (Cancellation, Visa) |
| 3 | [8] [4] | Revenue line chart + Tour Type donut |
| 4 | [5] [3] [4] | Region donut + Booking donut + Quick Actions |
| 5 | [7] [5] | Booking trend area + Top Tours table |
| 6 | [4] [8] | Top Destinations bar + Customer Growth bar |
| 7 | [8] [4] | Visa Processing panel + (Visa Summary + Nationalities stacked) |
| 8 | [12] | Operational Alerts full width |

**Minimum heights (no stretching):**
- Stat/KPI card: `min-h-[130px]`
- Chart card: `min-h-[300px]`
- Alert card: `min-h-[60px]`

**Gap:** `gap-5` (20px) between all cards.

### 3. Visual Design

**Color tokens:**
- Background: `#F1F5F9` (slate-100)
- Card surface: `#FFFFFF`
- Accent: `#F97316` (Pathora orange)
- Success: `#10B981`, Danger: `#EF4444`, Info: `#3B82F6`, Warning: `#F59E0B`
- Text primary: `#111827`, secondary: `#6B7280`, muted: `#9CA3AF`
- Border: `#E5E7EB`

**Card style:**
```
background: #FFFFFF
border: 1px solid #E5E7EB
border-radius: 12px
padding: 20px 24px
box-shadow: 0 1px 3px rgba(0,0,0,0.05)
```

**Typography:**
- Page title: 2rem, bold, `#111827`
- Card eyebrow: 10px, semibold, uppercase, accent color
- Stat value: 2.25rem, bold, `#111827`
- Card title: 14px, semibold, `#111827`
- Label: 12px, medium, `#6B7280`

### 4. Animations

Only two animations:

1. **Fade-in on mount** — `opacity: 0 → 1`, `transition: opacity 300ms ease-out`, staggered 50ms per card via CSS animation delay
2. **Hover shadow** — `box-shadow` tăng nhẹ, `transition: 200ms ease`

**Remove all:**
- ShimmerSkeleton (loading)
- FloatIcon
- PulseRing
- Reveal (scroll-driven blur-fade)
- SpringCard (spring hover physics)

### 5. Sidebar

Keep existing `AdminSidebar.tsx` and `TopBar.tsx`. No changes needed unless layout issue is traced to sidebar width.

### 6. Data Fetching

Extract to `useDashboardData.ts` hook:

```typescript
// Returns: { data, isLoading, error, refetch }
```

- Use the existing `adminService.getDashboard()`
- Keep existing 5-minute cache from backend
- Show skeleton loading state (simple `animate-pulse`) during load
- Error state with retry button

### 7. i18n

Keep existing translation keys unchanged. No changes needed.

## Out of Scope

- No new API endpoints
- No new backend types or models
- No new i18n translation keys
- No changes to `AdminSidebar.tsx` or `TopBar.tsx` layout
- No new chart types — reuse existing ApexCharts

## Loading Skeleton

During `isLoading`, show a simple pulse skeleton that matches the grid layout:
- Same grid structure as the actual dashboard
- Each card slot has `animate-pulse bg-gray-100 rounded-xl min-h-[130px]` (stats) or `min-h-[300px]` (charts)
- Single unified skeleton in `DashboardSkeleton.tsx` — not per-section

## Responsive Collapse

Grid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-12`.
On tablet (md), 12-col grid becomes 6-col effective:
- `[5] [3] [4]` → tablet collapses to stacked (each full width)
- `[8] [4]` → tablet: stacked (8 on top, 4 below)
- Charts always get `min-h-[300px]` regardless of viewport

## Hover Shadow

Default: `shadow-[0_1px_3px_rgba(0,0,0,0.05)]`
Hover: `hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]`
Transition: `transition-shadow duration-200`

## Fade-in Pattern

Use Tailwind's `animate-in fade-in` via the `@tailwindcss/animate` plugin if available, otherwise:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in-card {
  animation: fadeIn 300ms ease-out forwards;
  opacity: 0;
}
```

Stagger via inline `style={{ animationDelay: '${index * 50}ms' }}` or `--index` CSS var.

## Chart Utilities

Move chart factory functions to `src/features/dashboard/utils/chartOptions.ts`:
- `createLineOptions(categories, formatter)` → ApexOptions
- `createAreaOptions(categories)` → ApexOptions
- `createBarOptions(categories, color)` → ApexOptions
- `createDonutOptions(labels, colors)` → ApexOptions

Import from the new file in `DashboardCharts.tsx`.

## Implementation Notes

- Tailwind v4 is in use — use standard utility classes
- ApexCharts already installed for charts
- ApexCharts is used without Framer Motion for hover (CSS-only)
- Do NOT use CSS variables for colors — use Tailwind arbitrary values
- Responsive: grid collapses to 1-col on mobile, 2-col on tablet
- `AdminDashboardPage` stays as a child of `<AdminSidebar>` — no structural change
