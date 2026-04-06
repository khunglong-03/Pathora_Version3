# Transportation + Itineraries Upgrade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add activity routes (from/to) to the Itineraries step with location picker from Step Locations, plus fix the Transportation step's bilingual fields and payload mapping.

**Architecture:** Routes live inside `dayPlans[i].activities[j].routes[]` as `ActivityRouteForm[]`. Location references are index-based into the top-level `locations[]` array. Payload builder resolves references to `TourPlanRouteDto` with nested `TourPlanLocationDto`. Combobox UI uses manual state management (no external library).

**Tech Stack:** Next.js 16, React 19, Tailwind v4, TypeScript (strict off), Vitest

---

## File Map

```
src/app/(dashboard)/tour-management/create/page.tsx          # MODIFY: data model + UI + CRUD
src/app/(dashboard)/tour-management/[id]/edit/page.tsx       # MODIFY: edit page routes
src/api/services/tourCreatePayload.ts                        # MODIFY: wire routes in payload
src/i18n/locales/en.json                                     # MODIFY: validation i18n
src/i18n/locales/vi.json                                     # MODIFY: validation i18n
src/api/services/__tests__/tourCreatePayload.test.ts         # MODIFY: add route payload tests
src/app/__tests__/tourTranslationFormWiring.test.ts           # MODIFY: add route wiring tests
```

**Reference:** `docs/superpowers/specs/2026-03-25-transportation-itineraries-upgrade.md`

---

## Chunk 1: Data Model — ActivityRouteForm + State in Create Page

**Files:**
- Modify: `src/app/(dashboard)/tour-management/create/page.tsx`

- [ ] **Step 1: Add `ActivityRouteForm` interface** (near `ActivityForm` interface, ~line 35)

```typescript
interface ActivityRouteForm {
  id: string;
  fromLocationIndex: string;
  fromLocationCustom: string;
  enFromLocationCustom: string;
  toLocationIndex: string;
  toLocationCustom: string;
  enToLocationCustom: string;
  transportationType: string;
  enTransportationType: string;
  transportationName: string;
  enTransportationName: string;
  durationMinutes: string;
  price: string;
  note: string;
  enNote: string;
}
```

- [ ] **Step 2: Add `routes: ActivityRouteForm[]` to `ActivityForm` interface**

Add after `linkToResources: string[]`:

```typescript
routes: ActivityRouteForm[];
```

- [ ] **Step 3: Update `emptyActivity()` to return `routes: []`**

- [ ] **Step 4: Add `emptyRoute()` factory** (near `emptyActivity`)

```typescript
const emptyRoute = (): ActivityRouteForm => ({
  id: crypto.randomUUID(),
  fromLocationIndex: "",
  fromLocationCustom: "",
  enFromLocationCustom: "",
  toLocationIndex: "",
  toLocationCustom: "",
  enToLocationCustom: "",
  transportationType: "0",
  enTransportationType: "",
  transportationName: "",
  enTransportationName: "",
  durationMinutes: "",
  price: "",
  note: "",
  enNote: "",
});
```

- [ ] **Step 5: Add route CRUD helpers** (near `addActivity`/`removeActivity` helpers)

```typescript
const addRoute = (pi: number, di: number, ai: number) => {
  setDayPlans((prev) => {
    const updated = [...prev];
    updated[pi].days[di].activities[ai].routes.push(emptyRoute());
    return updated;
  });
};

const removeRoute = (pi: number, di: number, ai: number, ri: number) => {
  setDayPlans((prev) => {
    const updated = [...prev];
    updated[pi].days[di].activities[ai].routes.splice(ri, 1);
    return updated;
  });
};

const updateRoute = (pi: number, di: number, ai: number, ri: number, field: keyof ActivityRouteForm, value: string) => {
  setDayPlans((prev) => {
    const updated = [...prev];
    (updated[pi].days[di].activities[ai].routes[ri] as any)[field] = value;
    return updated;
  });
};
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\\(dashboard\\)/tour-management/create/page.tsx
git commit -m "feat(tour): add ActivityRouteForm data model and CRUD helpers"
```

---

## Chunk 2: UI — Route Section in Itineraries Activity Card

**Files:**
- Modify: `src/app/(dashboard)/tour-management/create/page.tsx`

> **Note:** Before adding the route section, first find where the activity card renders its footer (delete button area). The route section goes between the Link to Resources section and the activity footer. Also find the `activity.linkToResources` map block to know the exact structure to insert after.

- [ ] **Step 1: Find the activity card rendering code**

Search for `linkToResources` in the itinerary step to find the closing of the activity card. The route section should be inserted after `linkToResources` and before the activity footer (which has the delete button).

- [ ] **Step 2: Add collapsible Route section header**

After the Link to Resources section (inside the activity card), add:

```tsx
{/* Route Section */}
<div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
  <div className="flex items-center justify-between mb-2">
    <button
      type="button"
      onClick={() => toggleActivityRoute(pi, di, ai)}
      className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition"
    >
      <span>{t("tourAdmin.itineraries.route", "Route")} ({act.routes.length})</span>
      {expandedRoutes[`${pi}_${di}_${ai}`]
        ? <ChevronUp className="w-3 h-3" />
        : <ChevronDown className="w-3 h-3" />
      }
    </button>
    <button
      type="button"
      onClick={() => addRoute(pi, di, ai)}
      className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
    >
      + {t("tourAdmin.itineraries.addRoute", "Add Route")}
    </button>
  </div>
```

- [ ] **Step 3: Add expanded route content**

After the header, add:

```tsx
{expandedRoutes[`${pi}_${di}_${ai}`] && (
  <div className="space-y-3">
    {act.routes.map((route, ri) => (
      <div key={route.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        {/* From Location Combobox */}
        <div className="mb-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            {t("tourAdmin.itineraries.fromLocation", "From")}
          </label>
          <LocationCombobox
            value={route.fromLocationIndex}
            customValue={route.fromLocationCustom}
            enCustomValue={route.enFromLocationCustom}
            locations={locations}
            onSelect={(index) => updateRoute(pi, di, ai, ri, "fromLocationIndex", index)}
            onCustomChange={(val) => updateRoute(pi, di, ai, ri, "fromLocationCustom", val)}
            onEnCustomChange={(val) => updateRoute(pi, di, ai, ri, "enFromLocationCustom", val)}
            error={errors[`plan_${pi}_day_${di}_act_${ai}_route_${ri}_from`]}
          />
        </div>

        {/* To Location Combobox */}
        <div className="mb-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            {t("tourAdmin.itineraries.toLocation", "To")}
          </label>
          <LocationCombobox
            value={route.toLocationIndex}
            customValue={route.toLocationCustom}
            enCustomValue={route.enToLocationCustom}
            locations={locations}
            onSelect={(index) => updateRoute(pi, di, ai, ri, "toLocationIndex", index)}
            onCustomChange={(val) => updateRoute(pi, di, ai, ri, "toLocationCustom", val)}
            onEnCustomChange={(val) => updateRoute(pi, di, ai, ri, "enToLocationCustom", val)}
            error={errors[`plan_${pi}_day_${di}_act_${ai}_route_${ri}_to`]}
          />
        </div>

        {/* Transportation Type + Name row */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("tourAdmin.transportation.type", "Type")}
            </label>
            <select
              value={route.transportationType}
              onChange={(e) => updateRoute(pi, di, ai, ri, "transportationType", e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {transportationTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("tourAdmin.transportation.name", "Name")} (VI)
            </label>
            <input
              type="text"
              value={route.transportationName}
              onChange={(e) => updateRoute(pi, di, ai, ri, "transportationName", e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("tourAdmin.transportation.name", "Name")} (EN)
            </label>
            <input
              type="text"
              value={route.enTransportationName}
              onChange={(e) => updateRoute(pi, di, ai, ri, "enTransportationName", e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Duration + Price row */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("tourAdmin.transportation.duration", "Duration (min)")}
            </label>
            <input
              type="number"
              min={0}
              value={route.durationMinutes}
              onChange={(e) => updateRoute(pi, di, ai, ri, "durationMinutes", e.target.value)}
              className={`w-full px-2 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                errors[`plan_${pi}_day_${di}_act_${ai}_route_${ri}_duration`]
                  ? "border-red-400 dark:border-red-500"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            />
            {errors[`plan_${pi}_day_${di}_act_${ai}_route_${ri}_duration`] && (
              <p className="text-red-500 text-xs mt-0.5">{errors[`plan_${pi}_day_${di}_act_${ai}_route_${ri}_duration`]}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("tourAdmin.transportation.price", "Price")}
            </label>
            <input
              type="number"
              min={0}
              value={route.price}
              onChange={(e) => updateRoute(pi, di, ai, ri, "price", e.target.value)}
              className={`w-full px-2 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                errors[`plan_${pi}_day_${di}_act_${ai}_route_${ri}_price`]
                  ? "border-red-400 dark:border-red-500"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            />
            {errors[`plan_${pi}_day_${di}_act_${ai}_route_${ri}_price`] && (
              <p className="text-red-500 text-xs mt-0.5">{errors[`plan_${pi}_day_${di}_act_${ai}_route_${ri}_price`]}</p>
            )}
          </div>
        </div>

        {/* Note row */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("tourAdmin.transportation.note", "Note")} (VI)
            </label>
            <input
              type="text"
              value={route.note}
              onChange={(e) => updateRoute(pi, di, ai, ri, "note", e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("tourAdmin.transportation.note", "Note")} (EN)
            </label>
            <input
              type="text"
              value={route.enNote}
              onChange={(e) => updateRoute(pi, di, ai, ri, "enNote", e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Remove Route button */}
        <button
          type="button"
          onClick={() => removeRoute(pi, di, ai, ri)}
          className="text-xs text-red-500 hover:underline"
        >
          {t("tourAdmin.itineraries.removeRoute", "Remove Route")}
        </button>
      </div>
    ))}
  </div>
)}
</div>
```

- [ ] **Step 3: Add `expandedRoutes` state** (near other wizard state like `expandedDays`)

```typescript
const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});

// Helper to toggle route section
const toggleActivityRoute = (pi: number, di: number, ai: number) => {
  const key = `${pi}_${di}_${ai}`;
  setExpandedRoutes((prev) => ({ ...prev, [key]: !prev[key] }));
};
```

- [ ] **Step 4: Create `LocationCombobox` component**

Create a new file: `src/components/partials/tours/LocationCombobox.tsx`

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LocationForm {
  locationName: string;
  enLocationName: string;
}

interface LocationComboboxProps {
  value: string;            // "" = custom, "0","1",... = index
  customValue: string;      // VI custom text
  enCustomValue: string;    // EN custom text
  locations: LocationForm[];
  onSelect: (index: string) => void;
  onCustomChange: (value: string) => void;
  onEnCustomChange: (value: string) => void;
  error?: string;
}

export const LocationCombobox = ({
  value,
  customValue,
  enCustomValue,
  locations,
  onSelect,
  onCustomChange,
  onEnCustomChange,
  error,
}: LocationComboboxProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const isCustomMode = value === "";
  const selectedLocation = value !== "" && parseInt(value) < locations.length
    ? locations[parseInt(value)]
    : null;

  // Dangling reference check
  const isDangling = value !== "" && parseInt(value) >= locations.length;

  const filteredLocations = locations.filter((loc) =>
    loc.locationName.toLowerCase().includes(filter.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFilter("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayValue = isCustomMode
    ? customValue || t("tourAdmin.itineraries.customLocation", "Custom location...")
    : selectedLocation?.locationName
    || (isDangling ? t("tourAdmin.validation.locationRemoved", "Location removed") : "");

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2 py-1.5 text-xs rounded-lg border text-left bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition ${
          error || isDangling
            ? "border-red-400 dark:border-red-500"
            : "border-slate-300 dark:border-slate-600"
        } ${!value && customValue ? "text-slate-900" : ""}`}
      >
        <span className={!displayValue ? "text-slate-400" : ""}>{displayValue}</span>
        {isOpen ? <ChevronUp className="w-3 h-3 inline float-right mt-0.5" /> : <ChevronDown className="w-3 h-3 inline float-right mt-0.5" />}
      </button>

      {/* Error message */}
      {(error || isDangling) && (
        <p className="text-red-500 text-xs mt-0.5">
          {isDangling ? t("tourAdmin.validation.locationRemoved", "Referenced location was removed") : error}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
          {/* Filter input */}
          <div className="p-1 border-b border-slate-200 dark:border-slate-700">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t("tourAdmin.itineraries.searchLocation", "Search...")}
              className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              autoFocus
            />
          </div>

          {/* Location list */}
          <div className="max-h-40 overflow-y-auto">
            {filteredLocations.length === 0 && filter && (
              <div className="px-3 py-2 text-xs text-slate-400 italic">
                {t("tourAdmin.itineraries.noLocationMatch", "No locations match")}
              </div>
            )}

            {filteredLocations.map((loc, idx) => {
              const actualIndex = locations.indexOf(loc);
              return (
                <button
                  key={actualIndex}
                  type="button"
                  onClick={() => { onSelect(String(actualIndex)); setIsOpen(false); setFilter(""); }}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                >
                  {loc.locationName}
                  {loc.enLocationName && (
                    <span className="ml-1 text-slate-400">/ {loc.enLocationName}</span>
                  )}
                </button>
              );
            })}

            {/* Custom option */}
            <div className="border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { onSelect(""); setIsOpen(false); setFilter(""); }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 italic"
              >
                {t("tourAdmin.itineraries.customLocation", "Custom location...")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom text inputs (shown when in custom mode) */}
      {isCustomMode && (
        <div className="mt-1 grid grid-cols-2 gap-1">
          <input
            type="text"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder={t("tourAdmin.itineraries.locationVI", "Location (VI)")}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <input
            type="text"
            value={enCustomValue}
            onChange={(e) => onEnCustomChange(e.target.value)}
            placeholder={t("tourAdmin.itineraries.locationEN", "Location (EN)")}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 5: Import `LocationCombobox` in create page**

Add import near other component imports:

```typescript
import { LocationCombobox } from "@/components/partials/tours/LocationCombobox";
```

Also import `ChevronUp`, `ChevronDown` from `lucide-react` if not already imported.

- [ ] **Step 6: Add i18n keys for route section**

In both `en.json` and `vi.json` under `tourAdmin.itineraries`:

```json
"route": "Route",
"addRoute": "Add Route",
"removeRoute": "Remove Route",
"fromLocation": "From",
"toLocation": "To",
"customLocation": "Custom location...",
"searchLocation": "Search...",
"noLocationMatch": "No locations match",
"locationVI": "Location (VI)",
"locationEN": "Location (EN)"
```

- [ ] **Step 7: Commit**

```bash
git add src/components/partials/tours/LocationCombobox.tsx
git add "src/app/(dashboard)/tour-management/create/page.tsx"
git add src/i18n/locales/en.json src/i18n/locales/vi.json
git commit -m "feat(tour): add activity route section UI with LocationCombobox"
```

---

## Chunk 3: Payload Builder — Wire Routes + Transportation Type Fix

**Files:**
- Modify: `src/api/services/tourCreatePayload.ts`

> **Before starting:** Read the current `buildClassificationsPayload` and `buildCreateTourFormData` functions to understand their exact signatures and the exact location of `routes: []`.

- [ ] **Step 1: Add `ActivityRoutePayloadInput` interface**

After `ActivityPayloadInput` interface definition, add:

```typescript
interface ActivityRoutePayloadInput {
  fromLocationIndex: string;
  fromLocationCustom: string;
  enFromLocationCustom: string;
  toLocationIndex: string;
  toLocationCustom: string;
  enToLocationCustom: string;
  transportationType: string;
  enTransportationType: string;
  transportationName: string;
  enTransportationName: string;
  durationMinutes: string;
  price: string;
  note: string;
  enNote: string;
}
```

- [ ] **Step 2: Add `routes` field to `ActivityPayloadInput`**

In `ActivityPayloadInput`, add after `linkToResources: string[]`:

```typescript
routes: ActivityRoutePayloadInput[];
```

- [ ] **Step 3: Update `buildCreateTourFormData` signature**

Find the function signature and add `locations` as a parameter (before `transportations`):

```typescript
export const buildCreateTourFormData = (
  dayPlans: DayPlanPayloadInput[],
  images: File[],
  translations: TranslationPayloadInput[],
  classifications: ClassificationPayloadInput[],
  locations: LocationPayloadInput[],    // ADD THIS
  transportations: TransportationPayloadInput[],
  // ... rest of params
) => { ... }
```

- [ ] **Step 4: Pass `locations` to `buildClassificationsPayload`**

Inside `buildCreateTourFormData`, find where `buildClassificationsPayload` is called and add `locations` as the last argument.

- [ ] **Step 5: Update `buildClassificationsPayload` signature**

Find the function signature and add `locations` as the last parameter:

```typescript
const buildClassificationsPayload = (
  classifications: ClassificationPayloadInput[],
  dayPlans: DayPlanPayloadInput[][],
  insurances: InsurancePayloadInput[][],
  locations: LocationPayloadInput[],    // ADD THIS
) => { ... }
```

- [ ] **Step 6: Replace `routes: []` with route resolution logic**

Find the activity mapping inside `buildClassificationsPayload` where `routes: []` appears. Replace it with:

```typescript
routes: (activity.routes ?? []).map((route) => {
  const fromLoc = route.fromLocationIndex !== "" && parseInt(route.fromLocationIndex) < locations.length
    ? locations[parseInt(route.fromLocationIndex)]
    : null;

  const toLoc = route.toLocationIndex !== "" && parseInt(route.toLocationIndex) < locations.length
    ? locations[parseInt(route.toLocationIndex)]
    : null;

  return {
    transportationType: parseInt(route.transportationType) || 0,
    transportationName: route.transportationName || null,
    transportationNote: null,
    fromLocation: fromLoc
      ? { locationName: fromLoc.locationName, enLocationName: fromLoc.enLocationName, type: fromLoc.type || null, enType: fromLoc.enType || null }
      : route.fromLocationCustom.trim()
        ? { locationName: route.fromLocationCustom.trim(), enLocationName: route.enFromLocationCustom.trim(), type: null, enType: null }
        : null,
    toLocation: toLoc
      ? { locationName: toLoc.locationName, enLocationName: toLoc.enLocationName, type: toLoc.type || null, enType: toLoc.enType || null }
      : route.toLocationCustom.trim()
        ? { locationName: route.toLocationCustom.trim(), enLocationName: route.enToLocationCustom.trim(), type: null, enType: null }
        : null,
    estimatedDepartureTime: null,
    estimatedArrivalTime: null,
    durationMinutes: route.durationMinutes.trim() ? parseIntValue(route.durationMinutes, null) : null,
    distanceKm: null,
    price: route.price.trim() ? parseDecimal(route.price, null) : null,
    bookingReference: null,
    note: route.note.trim() || null,
  };
}),
```

- [ ] **Step 7: Update call site in create page**

Find where `buildCreateTourFormData` is called in `create/page.tsx`. Add `locations` as an argument (before `transportations`).

Run: `npm run build --prefix pathora/frontend`
Expected: Must compile successfully. If there are type errors (e.g., `activity.routes` not found), the `ActivityPayloadInput` update in Step 2 was not applied correctly. Check that the interface and the call site both reference `routes`.

- [ ] **Step 8: Fix transportation type enum**

In `create/page.tsx`, find the `transportationTypes` array and replace with the correct order matching `TransportationTypeMap`:

```typescript
const transportationTypes = [
  { value: "0", label: "Walking" },
  { value: "1", label: "Bus" },
  { value: "2", label: "Train" },
  { value: "3", label: "Flight" },
  { value: "4", label: "Boat" },
  { value: "5", label: "Car" },
  { value: "6", label: "Bicycle" },
  { value: "7", label: "Motorbike" },
  { value: "8", label: "Taxi" },
  { value: "99", label: "Other" },
];
```

- [ ] **Step 9: Commit**

```bash
git add src/api/services/tourCreatePayload.ts
git add "src/app/(dashboard)/tour-management/create/page.tsx"
git commit -m "feat(tour): wire activity routes in payload builder + fix transportation type enum"
```

---

## Chunk 4: Validation — Route Validation in collectStepErrors

**Files:**
- Modify: `src/app/(dashboard)/tour-management/create/page.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/vi.json`

> **Before starting:** Find `collectStepErrors` in `create/page.tsx` and locate the step 2 (Itineraries) validation block. The route validation should be added inside the `day.activities.forEach` loop.

- [ ] **Step 1: Add i18n keys for route validation**

In `en.json` under `tourAdmin.validation`:

```json
"requiredFromLocation": "From location is required",
"requiredToLocation": "To location is required",
"locationRemoved": "Referenced location was removed",
"invalidDuration": "Duration must be 0 or greater",
"invalidPrice": "Price must be 0 or greater"
```

In `vi.json` under `tourAdmin.validation`:

```json
"requiredFromLocation": "Vui lòng nhập điểm khởi hành",
"requiredToLocation": "Vui lòng nhập điểm đến",
"locationRemoved": "Địa điểm đã bị xóa",
"invalidDuration": "Thời gian phải bằng 0 hoặc lớn hơn",
"invalidPrice": "Giá phải bằng 0 hoặc lớn hơn"
```

- [ ] **Step 2: Add route validation in collectStepErrors**

Inside `act.routes.forEach` within the step 2 validation loop, add:

```typescript
// Route validation
act.routes.forEach((route, routeIdx) => {
  const prefix = `plan_${planIdx}_day_${dayIdx}_act_${actIdx}_route_${routeIdx}`;

  // From location required
  const hasFrom = route.fromLocationIndex !== "" ||
    route.fromLocationCustom.trim() !== "";
  if (!hasFrom) {
    newErrors[`${prefix}_from`] = t("tourAdmin.validation.requiredFromLocation");
  }

  // Dangling from reference
  if (route.fromLocationIndex !== "" && parseInt(route.fromLocationIndex) >= locations.length) {
    newErrors[`${prefix}_from`] = t("tourAdmin.validation.locationRemoved");
  }

  // To location required
  const hasTo = route.toLocationIndex !== "" ||
    route.toLocationCustom.trim() !== "";
  if (!hasTo) {
    newErrors[`${prefix}_to`] = t("tourAdmin.validation.requiredToLocation");
  }

  // Dangling to reference
  if (route.toLocationIndex !== "" && parseInt(route.toLocationIndex) >= locations.length) {
    newErrors[`${prefix}_to`] = t("tourAdmin.validation.locationRemoved");
  }

  // Duration >= 0
  if (route.durationMinutes.trim()) {
    const d = Number(route.durationMinutes);
    if (Number.isNaN(d) || d < 0) {
      newErrors[`${prefix}_duration`] = t("tourAdmin.validation.invalidDuration");
    }
  }

  // Price >= 0
  if (route.price.trim()) {
    const p = Number(route.price);
    if (Number.isNaN(p) || p < 0) {
      newErrors[`${prefix}_price`] = t("tourAdmin.validation.invalidPrice");
    }
  }
});
```

> **Important:** The `act` in the validation loop is typed as `ActivityForm` (the local interface), which now includes `routes`. If TypeScript complains about `act.routes` not existing, check that `ActivityForm` was correctly updated in Chunk 1.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/vi.json
git add "src/app/(dashboard)/tour-management/create/page.tsx"
git commit -m "feat(tour): add route validation in collectStepErrors"
```

---

## Chunk 5: Edit Page — Routes + Prerequisite Fixes

**Files:**
- Modify: `src/app/(dashboard)/tour-management/[id]/edit/page.tsx`

> **Before starting:** Read the edit page to find:
> - The `ActivityForm` interface definition
> - The `emptyActivity` factory
> - The activity CRUD helpers
> - The activity hydration from API (inside `useEffect` that loads tour data)
> - The `handleSubmit` / submit handler

### 5A: Prerequisite — Add bilingual fields to ActivityForm

- [ ] **Step 1: Add `enTitle`, `enDescription`, `enNote` to edit page `ActivityForm`**

Find the `ActivityForm` interface in the edit page and add:

```typescript
enTitle: string;
enDescription: string;
enNote: string;
```

- [ ] **Step 2: Update edit page activity hydration**

Find where `TourDayActivityDto` is mapped to `ActivityForm`. Add the bilingual fields:

```typescript
// In the activity mapping inside the tour data loading useEffect:
title: act.title,
enTitle: act.title || "",           // Add — fallback to VI title
description: act.description || "",
enDescription: act.description || "", // Add
note: act.note || "",
enNote: act.note || "",              // Add
```

### 5B: Activity Routes in Edit Page

- [ ] **Step 3: Add `ActivityRouteForm` interface to edit page**

Same interface as create page (copy from Chunk 1 Step 1).

- [ ] **Step 4: Add `routes: ActivityRouteForm[]` to edit page `ActivityForm`**

- [ ] **Step 5: Update edit page `emptyActivity()` to return `routes: []`**

- [ ] **Step 6: Add `emptyRoute()` factory**

Same as create page (from Chunk 1 Step 4).

- [ ] **Step 7: Add route CRUD helpers**

Same implementations as create page (from Chunk 1 Step 5), adapted to use the edit page's `setDayPlans`.

- [ ] **Step 8: Add `expandedRoutes` state + toggle helper**

Same as create page (from Chunk 2 Step 3).

- [ ] **Step 9: Import `LocationCombobox`**

```typescript
import { LocationCombobox } from "@/components/partials/tours/LocationCombobox";
```

- [ ] **Step 10: Hydrate routes from API**

In the edit page's activity hydration (inside `useEffect` loading tour data), after mapping other fields, add:

```typescript
routes: (act.routes || []).map((routeDto: any) => ({
  id: crypto.randomUUID(),
  fromLocationIndex: "",  // always "" — no locations step in edit page
  fromLocationCustom: routeDto.fromLocation?.locationName ?? "",
  enFromLocationCustom: routeDto.fromLocation?.enLocationName ?? "",
  toLocationIndex: "",    // always "" — no locations step in edit page
  toLocationCustom: routeDto.toLocation?.locationName ?? "",
  enToLocationCustom: routeDto.toLocation?.enLocationName ?? "",
  transportationType: String(routeDto.transportationType ?? 0),
  enTransportationType: "",
  transportationName: routeDto.transportationName ?? "",
  enTransportationName: "",
  durationMinutes: routeDto.durationMinutes != null ? String(routeDto.durationMinutes) : "",
  price: routeDto.price != null ? String(routeDto.price) : "",
  note: routeDto.note ?? "",
  enNote: "",
})),
```

- [ ] **Step 11: Render route section in edit page activity card**

Same collapsible route section UI as Chunk 2 (Steps 2-3). Use the same component structure with `LocationCombobox`, transportation type/name inputs, duration/price inputs, and note inputs.

- [ ] **Step 12: Send routes in update payload**

Find the edit page's `handleSubmit`. Add route resolution logic before building the classifications JSON. For each activity's routes array, map to `TourPlanRouteDto` objects:

```typescript
// In the activity payload building section, replace the part that sets activity fields.
// After the existing activity fields, add:
routes: (activity.routes ?? []).map((route) => ({
  transportationType: parseInt(route.transportationType) || 0,
  transportationName: route.transportationName || null,
  transportationNote: null,
  fromLocation: route.fromLocationCustom.trim()
    ? { locationName: route.fromLocationCustom.trim(), enLocationName: route.enFromLocationCustom.trim(), type: null, enType: null }
    : null,
  toLocation: route.toLocationCustom.trim()
    ? { locationName: route.toLocationCustom.trim(), enLocationName: route.enToLocationCustom.trim(), type: null, enType: null }
    : null,
  estimatedDepartureTime: null,
  estimatedArrivalTime: null,
  durationMinutes: route.durationMinutes.trim() ? parseIntValue(route.durationMinutes, null) : null,
  distanceKm: null,
  price: route.price.trim() ? parseDecimal(route.price, null) : null,
  bookingReference: null,
  note: route.note.trim() || null,
})),
```

> **Note:** The edit page uses custom payload building (not `buildCreateTourFormData`). Copy `parseIntValue` and `parseDecimal` imports from `tourCreatePayload.ts` if not already imported in the edit page.

- [ ] **Step 13: Commit**

```bash
git add "src/app/(dashboard)/tour-management/[id]/edit/page.tsx"
git commit -m "feat(tour): add activity routes to edit page + bilingual activity fields"
```

---

## Chunk 6: Tests

**Files:**
- Modify: `src/api/services/__tests__/tourCreatePayload.test.ts`
- Modify: `src/app/__tests__/tourTranslationFormWiring.test.ts`

- [ ] **Step 1: Read current test file**

First read `src/api/services/__tests__/tourCreatePayload.test.ts` to understand the existing test patterns.

- [ ] **Step 2: Add route payload tests**

After the existing `linkToResources` tests, add:

```typescript
it("converts activity routes with location reference to TourPlanRouteDto with nested TourPlanLocationDto", () => {
  const locations: LocationPayloadInput[] = [
    { locationName: "Ha Long Bay", enLocationName: "Ha Long Bay", type: "attraction", enType: "Attraction", description: "", enDescription: "", city: "Quang Ninh", enCity: "Quang Ninh", country: "Vietnam", enCountry: "Vietnam", entranceFee: "0", address: "", enAddress: "" },
    { locationName: "Ha Noi", enLocationName: "Hanoi", type: "city", enType: "City", description: "", enDescription: "", city: "Hanoi", enCity: "Hanoi", country: "Vietnam", enCountry: "Vietnam", entranceFee: "0", address: "", enAddress: "" },
  ];

  const dayPlans: DayPlanPayloadInput[] = [
    {
      planName: "Plan 1",
      dayName: "Day 1",
      activities: [
        {
          activityType: "0",
          title: "Visit Ha Long",
          enTitle: "Visit Ha Long",
          description: "",
          enDescription: "",
          note: "",
          enNote: "",
          estimatedCost: "",
          isOptional: false,
          startTime: "09:00",
          endTime: "12:00",
          linkToResources: [],
          routes: [
            {
              fromLocationIndex: "0",
              fromLocationCustom: "",
              enFromLocationCustom: "",
              toLocationIndex: "1",
              toLocationCustom: "",
              enToLocationCustom: "",
              transportationType: "3",
              enTransportationType: "",
              transportationName: "Limousine",
              enTransportationName: "Limousine",
              durationMinutes: "120",
              price: "300000",
              note: "Comfortable",
              enNote: "",
            },
          ],
        },
      ],
    },
  ];

  const result = buildCreateTourFormData(dayPlans, [], [], [], locations, []);
  const formData = result.get("classifications") as string;
  const parsed = JSON.parse(formData);
  const route = parsed[0].days[0].activities[0].routes[0];

  // Verify from location is resolved from locations[0]
  expect(route.fromLocation).toEqual({
    locationName: "Ha Long Bay",
    enLocationName: "Ha Long Bay",
    type: "attraction",
    enType: "Attraction",
  });

  // Verify to location is resolved from locations[1]
  expect(route.toLocation).toEqual({
    locationName: "Ha Nội",
    enLocationName: "Hanoi",
    type: "city",
    enType: "City",
  });

  // Verify other fields
  expect(route.transportationType).toBe(3);
  expect(route.transportationName).toBe("Limousine");
  expect(route.durationMinutes).toBe(120);
  expect(route.price).toBe(300000);
});

it("converts empty route from/to to null TourPlanLocationDto", () => {
  const locations: LocationPayloadInput[] = [];
  const dayPlans: DayPlanPayloadInput[] = [
    {
      planName: "Plan 1",
      dayName: "Day 1",
      activities: [
        {
          activityType: "0",
          title: "Walk",
          enTitle: "Walk",
          description: "",
          enDescription: "",
          note: "",
          enNote: "",
          estimatedCost: "",
          isOptional: false,
          startTime: "10:00",
          endTime: "11:00",
          linkToResources: [],
          routes: [
            {
              fromLocationIndex: "",
              fromLocationCustom: "",
              enFromLocationCustom: "",
              toLocationIndex: "",
              toLocationCustom: "",
              enToLocationCustom: "",
              transportationType: "0",
              enTransportationType: "",
              transportationName: "",
              enTransportationName: "",
              durationMinutes: "60",
              price: "0",
              note: "",
              enNote: "",
            },
          ],
        },
      ],
    },
  ];

  const result = buildCreateTourFormData(dayPlans, [], [], [], locations, []);
  const formData = result.get("classifications") as string;
  const parsed = JSON.parse(formData);
  const route = parsed[0].days[0].activities[0].routes[0];

  expect(route.fromLocation).toBeNull();
  expect(route.toLocation).toBeNull();
  expect(route.transportationType).toBe(0);
  expect(route.durationMinutes).toBe(60);
});

it("handles dangling location reference gracefully", () => {
  const locations: LocationPayloadInput[] = [
    { locationName: "Ha Long Bay", enLocationName: "Ha Long Bay", type: "", enType: "", description: "", enDescription: "", city: "", enCity: "", country: "", enCountry: "", entranceFee: "0", address: "", enAddress: "" },
  ];

  const dayPlans: DayPlanPayloadInput[] = [
    {
      planName: "Plan 1",
      dayName: "Day 1",
      activities: [
        {
          activityType: "0",
          title: "Tour",
          enTitle: "Tour",
          description: "",
          enDescription: "",
          note: "",
          enNote: "",
          estimatedCost: "",
          isOptional: false,
          startTime: "09:00",
          endTime: "12:00",
          linkToResources: [],
          routes: [
            {
              fromLocationIndex: "999",  // dangling — only 1 location exists
              fromLocationCustom: "",
              enFromLocationCustom: "",
              toLocationIndex: "0",
              toLocationCustom: "",
              enToLocationCustom: "",
              transportationType: "3",
              enTransportationType: "",
              transportationName: "",
              enTransportationName: "",
              durationMinutes: "120",
              price: "0",
              note: "",
              enNote: "",
            },
          ],
        },
      ],
    },
  ];

  const result = buildCreateTourFormData(dayPlans, [], [], [], locations, []);
  const formData = result.get("classifications") as string;
  const parsed = JSON.parse(formData);
  const route = parsed[0].days[0].activities[0].routes[0];

  // Dangling from reference -> null
  expect(route.fromLocation).toBeNull();
  // Valid to reference -> resolved
  expect(route.toLocation).toEqual({
    locationName: "Ha Long Bay",
    enLocationName: "Ha Long Bay",
    type: "",
    enType: "",
  });
});
```

> **Note:** The `LocationPayloadInput` interface in the payload builder needs `type` and `enType` fields. Verify they exist in the interface. If not, adjust the test to match the actual interface fields.

- [ ] **Step 3: Add wiring tests for routes**

In `src/app/__tests__/tourTranslationFormWiring.test.ts`, after the `describe("estimatedCost wiring")` block, add:

```typescript
describe("activity routes wiring", () => {
  it("create page has routes in ActivityForm interface and renders route section", () => {
    const source = readFile("src/app/(dashboard)/tour-management/create/page.tsx");
    expect(source.includes("routes: ActivityRouteForm[]")).toBe(true);
    expect(source.includes("fromLocationIndex: string")).toBe(true);
    expect(source.includes("toLocationCustom: string")).toBe(true);
    expect(source.includes("emptyRoute")).toBe(true);
    expect(source.includes("addRoute")).toBe(true);
    expect(source.includes("removeRoute")).toBe(true);
    expect(source.includes("expandedRoutes")).toBe(true);
    expect(source.includes("LocationCombobox")).toBe(true);
  });

  it("create page has LocationCombobox component imported", () => {
    const source = readFile("src/app/(dashboard)/tour-management/create/page.tsx");
    expect(source.includes("from LocationCombobox")).toBe(true);
  });

  it("create page sends routes in buildCreateTourFormData call", () => {
    const source = readFile("src/app/(dashboard)/tour-management/create/page.tsx");
    // Verify routes resolution code exists in the payload builder context
    expect(source.includes("buildCreateTourFormData(")).toBe(true);
    // Verify locations is referenced in route context
    expect(source.includes("locations")).toBe(true);
  });

  it("edit page has routes in ActivityForm and sends them in update payload", () => {
    const source = readFile("src/app/(dashboard)/tour-management/[id]/edit/page.tsx");
    expect(source.includes("routes: ActivityRouteForm[]")).toBe(true);
    expect(source.includes("emptyRoute")).toBe(true);
    expect(source.includes("addRoute")).toBe(true);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm run test --prefix pathora/frontend`
Expected: All route tests pass. If `buildCreateTourFormData` test fails, check that:
1. `locations` is passed as the 5th argument in the call site
2. `buildClassificationsPayload` receives `locations` as the 4th argument
3. `ActivityPayloadInput` has the `routes` field

- [ ] **Step 5: Run build**

Run: `npm run build --prefix pathora/frontend`
Expected: Compiles successfully with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/api/services/__tests__/tourCreatePayload.test.ts
git add src/app/__tests__/tourTranslationFormWiring.test.ts
git commit -m "test(tour): add route payload and wiring tests"
```

---

## Chunk 7: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npm run test --prefix pathora/frontend`
Expected: All tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build --prefix pathora/frontend`
Expected: Compiled successfully with 41+ static pages.

- [ ] **Step 3: Capture real payload example**

Create a temporary test snippet that logs the actual payload for 2 transportations + 2 activities with routes. Print the `classifications` JSON to console. Report this as the "real payload example" in deliverables.

---

## Deliverables Checklist

After completing all chunks:

- [ ] `ActivityRouteForm` interface added to create + edit page
- [ ] `emptyRoute()` factory added to create + edit page
- [ ] Route CRUD helpers added to create + edit page
- [ ] Route section UI rendered in create page activity card (combobox + custom fallback)
- [ ] `LocationCombobox` component created
- [ ] `locations` passed to `buildCreateTourFormData`
- [ ] Routes resolved to `TourPlanRouteDto` with nested `TourPlanLocationDto`
- [ ] Validation wired in `collectStepErrors`
- [ ] i18n keys added
- [ ] Transportation type enum fixed
- [ ] Edit page has bilingual activity fields (`enTitle/enDescription/enNote`)
- [ ] Edit page mirrors all create page changes
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Real payload example captured
