# `linkToResources` Activity Field — Frontend Integration Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the existing `linkToResources: string[]` field from the Activity form state into the tour creation/update payload and wire it to backend contract, add URL validation, and improve UX.

**Architecture:**
- The form state (`ActivityForm` in the create page) already has `linkToResources: string[]`
- The UI block already renders dynamic link inputs
- **Missing pieces:** (1) `ActivityPayloadInput` interface in `tourCreatePayload.ts` lacks the field, (2) mapping in `buildClassificationsPayload()` omits it, (3) `TourDayActivityDto` lacks the field, (4) no URL validation, (5) no edit/populate logic, (6) no test coverage

**Tech Stack:** TypeScript, Next.js, Vitest

---

## File Map

| File | Role |
|------|------|
| `src/api/services/tourCreatePayload.ts` | Add `linkToResources` to interface + mapping + filter |
| `src/types/tour.ts` | Add `linkToResources` to `TourDayActivityDto` |
| `src/app/(dashboard)/tour-management/create/page.tsx` | URL validation + error display + edit population |
| `src/api/services/__tests__/tourCreatePayload.test.ts` | Add 3 test cases for linkToResources payload |
| `src/app/__tests__/tourTranslationFormWiring.test.ts` | Add wiring assertion for linkToResources |

---

## Chunk 1: Payload Builder — `tourCreatePayload.ts`

### Task 1: Add `linkToResources` to `ActivityPayloadInput` interface

**Files:** `src/api/services/tourCreatePayload.ts:27-39`

- [ ] **Step 1: Add field to interface**

```typescript
interface ActivityPayloadInput {
  activityType: string;
  title: string;
  enTitle: string;
  description: string;
  enDescription: string;
  note: string;
  enNote: string;
  estimatedCost: string;
  isOptional: boolean;
  startTime: string;
  endTime: string;
  linkToResources: string[]; // ← ADD THIS
}
```

### Task 2: Map `linkToResources` in `buildClassificationsPayload()`

**Files:** `src/api/services/tourCreatePayload.ts:256-275`

- [ ] **Step 1: Map the field, filter empty strings**

Find the activity object inside `dayPlan.activities.map()` (around line 256-275). Add `linkToResources` after `endTime`:

```typescript
activities: dayPlan.activities.map((activity) => ({
  activityType: activity.activityType,
  title: activity.title,
  description: toOptionalString(activity.description),
  note: toOptionalString(activity.note),
  estimatedCost: parseDecimal(activity.estimatedCost, 0),
  isOptional: activity.isOptional,
  startTime: toOptionalString(activity.startTime),
  endTime: toOptionalString(activity.endTime),
  // ADD: filter out empty/whitespace-only strings, keep original order
  linkToResources: activity.linkToResources
    .map((l) => l.trim())
    .filter((l) => l.length > 0),
  routes: [],
  accommodation: null,
  translations: buildActivityTranslations(
    activity.title,
    activity.description,
    activity.note,
    activity.enTitle,
    activity.enDescription,
    activity.enNote,
  ),
})),
```

Note: Remove `routes: []` and `accommodation: null` only if those are no-ops that existed before. The focus is adding `linkToResources`.

---

## Chunk 2: Type Definition — `tour.ts`

### Task 3: Add `linkToResources` to `TourDayActivityDto`

**Files:** `src/types/tour.ts:67-81`

- [ ] **Step 1: Add optional field to DTO**

```typescript
export interface TourDayActivityDto {
  id: string;
  tourDayId: string;
  order: number;
  activityType: number;
  title: string;
  description: string | null;
  note: string | null;
  estimatedCost: number | null;
  isOptional: boolean;
  startTime: string | null;
  endTime: string | null;
  linkToResources: string[] | null; // ← ADD THIS
  routes: TourPlanRouteDto[];
  accommodation: TourPlanAccommodationDto | null;
}
```

---

## Chunk 3: Create Page — URL Validation + Edit Population + UX

**Files:** `src/app/(dashboard)/tour-management/create/page.tsx`

### Task 4: Add URL validation function

- [ ] **Step 1: Add `isValidUrl` helper near top of component (around line 200)**

```typescript
const isValidUrl = (value: string): boolean => {
  if (!value.trim()) return true; // empty is valid (field is optional)
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
```

### Task 5: Add `linkErrors` state + integrate into validation

- [ ] **Step 1: Add error state near other error states (around line 659)**

Find the `errors` state declaration (`const [errors, setErrors] = ...`) and add:

```typescript
const [linkErrors, setLinkErrors] = useState<Record<string, string>>({});
```

- [ ] **Step 2: Integrate link validation into `collectStepErrors()` — in the `if (step === 2)` block**

After the `plans.forEach()` loop (around line 748), add:

```typescript
// Validate linkToResources URLs
plans.forEach((plan, planIdx) => {
  plan.activities.forEach((act, actIdx) => {
    act.linkToResources.forEach((link, linkIdx) => {
      if (link.trim() && !isValidUrl(link)) {
        newErrors[`link_${planIdx}_${actIdx}_${linkIdx}`] = t(
          "tourAdmin.validation.invalidLinkUrl",
          "Please enter a valid URL starting with http:// or https://",
        );
      }
    });
  });
});
```

### Task 6: Update UI — show inline error per link input

- [ ] **Step 1: Find the link input block (lines ~2338-2377) and add error display**

Find the `<input` for `linkToResources` (the one with `value={link}`) and add error rendering below the input div, before the closing `</div>` of the map item:

```typescript
{/* Find this existing div (around line 2339): */}
<div key={li} className="flex items-center gap-2">
  <input ... />
  {/* existing remove button */}
</div>

{/* ADD after the remove button, inside the flex div: */}
{linkErrors[`link_${di}_${ai}_${li}`] && (
  <p className="text-red-500 text-xs mt-0.5">
    {linkErrors[`link_${di}_${ai}_${li}`]}
  </p>
)}
```

Actually, since the error is per-input-row, it should go inside the `flex items-center gap-2` div as a column. The input already has `flex-1`, so we can wrap input+error in a nested div:

```typescript
<div key={li} className="flex items-start gap-2">
  <div className="flex-1">
    <input ... className="w-full ..." />
    {linkErrors[`link_${di}_${ai}_${li}`] && (
      <p className="text-red-500 text-xs mt-0.5">
        {linkErrors[`link_${di}_${ai}_${li}`]}
      </p>
    )}
  </div>
  {/* remove button */}
</div>
```

Also update the input `className` to include error border when there's an error:

```typescript
className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
  linkErrors[`link_${di}_${ai}_${li}`]
    ? "border-red-400 dark:border-red-500"
    : "border-slate-300 dark:border-slate-600"
}`}
```

### Task 7: Edit population — load `linkToResources` from backend data

- [ ] **Step 1: Find the useEffect that loads dayPlans from edit data (search for `useEffect` + `setDayPlans` + backend data)**

Add `linkToResources` population. The activity object from backend DTO may have `linkToResources` as `string[] | null`. Map it to form state:

```typescript
// In the useEffect that maps backend day plans to form state
// When building each activity, add:
linkToResources: (activity as any).linkToResources?.length
  ? (activity as any).linkToResources
  : [""],
```

Or if the backend returns it directly on the DTO:

```typescript
linkToResources: act.linkToResources && act.linkToResources.length > 0
  ? act.linkToResources
  : [""],
```

**Note:** The exact location depends on how the edit page maps backend data to form state. Search for `setDayPlans` in the edit flow to find the exact useEffect.

---

## Chunk 4: Tests

### Task 8: Add `linkToResources` test cases to `tourCreatePayload.test.ts`

**Files:** `src/api/services/__tests__/tourCreatePayload.test.ts`

- [ ] **Step 1: Add test case — `linkToResources` present and filtered**

Add as a new `it()` inside the existing `describe("buildCreateTourFormData")` block, after the existing activity test cases. Find the activity object in the test input (around line 431-444) and add `linkToResources`:

```typescript
it("includes linkToResources in activity payload and filters empty strings", () => {
  const formData = buildCreateTourFormData({
    basicInfo: {
      tourName: "Tour",
      shortDescription: "Short",
      longDescription: "Long",
      seoTitle: "",
      seoDescription: "",
      status: "1",
    },
    thumbnail: null,
    images: [],
    vietnameseTranslation: {
      tourName: "",
      shortDescription: "",
      longDescription: "",
      seoTitle: "",
      seoDescription: "",
    },
    englishTranslation: {
      tourName: "",
      shortDescription: "",
      longDescription: "",
      seoTitle: "",
      seoDescription: "",
    },
    classifications: [
      {
        name: "Standard",
        enName: "Standard",
        description: "Desc VI",
        enDescription: "Desc EN",
        basePrice: "500",
        durationDays: "1",
      },
    ],
    dayPlans: [[{
      dayNumber: "1",
      title: "Day VI",
      enTitle: "Day EN",
      description: "Desc VI",
      enDescription: "Desc EN",
      activities: [{
        activityType: "0",
        title: "Activity VI",
        enTitle: "Activity EN",
        description: "Act Desc VI",
        enDescription: "Act Desc EN",
        note: "",
        enNote: "",
        estimatedCost: "50",
        isOptional: false,
        startTime: "08:00",
        endTime: "10:00",
        linkToResources: [
          "https://example.com/resource1",
          "",           // ← should be filtered
          "  ",         // ← should be filtered (whitespace)
          "https://example.com/resource2",
        ],
      }],
    }]],
    insurances: [[{
      insuranceName: "Ins VI",
      enInsuranceName: "Ins EN",
      insuranceType: "1",
      insuranceProvider: "Prov",
      coverageDescription: "Cov VI",
      enCoverageDescription: "Cov EN",
      coverageAmount: "1000",
      coverageFee: "50",
      isOptional: false,
      note: "",
      enNote: "",
    }]],
    accommodations: [],
    locations: [],
    transportations: [],
  });

  const classifications = JSON.parse(String(formData.get("classifications")));
  const activity = classifications[0].plans[0].activities[0];

  expect(activity.linkToResources).toEqual([
    "https://example.com/resource1",
    "https://example.com/resource2",
  ]);
  expect(activity.linkToResources).toHaveLength(2);
});
```

- [ ] **Step 2: Add test case — `linkToResources` empty array (no links provided)**

```typescript
it("omits linkToResources when all links are empty strings", () => {
  const formData = buildCreateTourFormData({
    // ... same setup as above but with linkToResources: [""]
    dayPlans: [[{
      dayNumber: "1",
      title: "Day VI",
      enTitle: "Day EN",
      description: "Desc VI",
      enDescription: "Desc EN",
      activities: [{
        activityType: "0",
        title: "Activity VI",
        enTitle: "Activity EN",
        description: "Act Desc VI",
        enDescription: "Act Desc EN",
        note: "",
        enNote: "",
        estimatedCost: "50",
        isOptional: false,
        startTime: "",
        endTime: "",
        linkToResources: [""],
      }],
    }]],
    // ... rest of setup
  });

  const classifications = JSON.parse(String(formData.get("classifications")));
  const activity = classifications[0].plans[0].activities[0];

  // Empty strings filtered → empty array
  expect(activity.linkToResources).toEqual([]);
  expect(activity.linkToResources).toHaveLength(0);
});
```

### Task 9: Add wiring test for `linkToResources`

**Files:** `src/app/__tests__/tourTranslationFormWiring.test.ts`

- [ ] **Step 1: Add assertion that `linkToResources` is in the form state interface**

```typescript
it("activity form state includes linkToResources field", () => {
  const source = readFile("src/app/(dashboard)/tour-management/create/page.tsx");

  // Check ActivityForm interface has linkToResources
  expect(source.includes("linkToResources: string[]")).toBe(true);
  // Check it is used in the payload mapping
  expect(source.includes("linkToResources:")).toBe(true);
});
```

---

## Chunk 5: Verification

### Task 10: Run tests and build

- [ ] **Step 1: Run payload tests**

```bash
cd pathora/frontend && npm run test -- --run src/api/services/__tests__/tourCreatePayload.test.ts
```

Expected: All existing tests pass + 2 new `linkToResources` tests pass.

- [ ] **Step 2: Run wiring tests**

```bash
npm run test -- --run src/app/__tests__/tourTranslationFormWiring.test.ts
```

Expected: All pass including new wiring assertion.

- [ ] **Step 3: Build**

```bash
npm run build --prefix pathora/frontend
```

Expected: Build succeeds with no TypeScript errors.

---

## Contract Notes (Backend Assumption)

| Field | Type | Notes |
|-------|------|-------|
| `activities[].linkToResources` | `string[]` | Array of absolute URLs. Empty strings and whitespace-only are filtered client-side. |

**Assumption:** Backend accepts `linkToResources` as `string[]` in the activity object of the `plans[].activities[]` array inside each `classifications[]` entry. If backend expects a different field name or nested structure, this will need coordination with the backend agent.
