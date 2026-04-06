# Tour Route Location Reference + Bilingual Transportation — Design

**Date:** 2026-03-25
**Author:** Claude Opus
**Status:** v2 — Pending User Approval

## 1. Root-Cause & Current Architecture

### 1.1 The Gap

Two parallel location storage paths exist with no cross-linkage:

| Storage | Entity | Used by |
|---------|--------|---------|
| Step Locations (tour-level) | `TourResourceEntity` (Type=Location) | `LocationDto` in CreateTour |
| Route from/to (activity-level) | `TourPlanLocationEntity` | `RouteDto.FromLocationName` / `ToLocationName` (plain strings) |

When a tour step defines "Hanoi" as a location, and 5 activities each travel "from Hanoi to...", each creates its own `TourPlanLocationEntity` named "Hanoi" — no deduplication, no reference.

Additionally, `TransportationDto` (standalone tour resource) stores from/to as plain strings with no translation model for `TransportationName`, `TicketInfo`, or `Note`.

### 1.2 Current Flow

```
CreateTourCommand
├── LocationDto[] → TourResourceEntity (Type=Location)     ← SEPARATE TABLE
└── Classifications[].Plans[].Activities[].Routes[]
    └── RouteDto.FromLocationName (string) → TourPlanLocationEntity.Create(LocationType.Other)
        RouteDto.ToLocationName (string)   → TourPlanLocationEntity.Create(LocationType.Other)
```

`TourPlanRouteEntity` already has navigation properties `FromLocation` / `ToLocation` pointing to `TourPlanLocationEntity` — but the Create flow never uses them. Instead it creates new entities every time.

### 1.3 Key Current Entity Properties

**`TourPlanLocationEntity`** has:
- `TourDayActivityId` (Guid, **required** FK → `TourDayActivityEntity`)
- `LocationName`, `LocationType`, `City`, `Country`, `Address`, `Latitude`, `Longitude`, `EntranceFee`, `OpeningHours`, `ClosingHours`, `EstimatedDurationMinutes`
- `Translations` (Dictionary<string, TourPlanLocationTranslationData>)

**`TourResourceEntity`** has:
- `Type` enum: Accommodation, Location, Transportation, Service
- `Translations` (Dictionary<string, TourResourceTranslationData>) — `name`, `description`, `note`

**`TourPlanRouteEntity`** has shadow FKs (configured but columns may not exist in DB):
- `FromLocationId` → `TourPlanLocationEntity`
- `ToLocationId` → `TourPlanLocationEntity`
- `TourDayActivityId` → `TourDayActivityEntity`

---

## 2. New Design

### 2.1 Unify: LocationDto → TourPlanLocationEntity

Step Locations (`LocationDto`) will now create `TourPlanLocationEntity` entities (same type as route from/to locations). This enables deduplication and reference by ID.

### 2.2 Route Reference via FK

`RouteDto` gains optional `FromLocationId` / `ToLocationId` fields. If provided, the route links to an existing `TourPlanLocationEntity` (deduplication). If null, fallback to text `FromLocationName` / `ToLocationName` creates a new entity.

### 2.3 Transportation Reference + Bilingual

`TransportationDto` gains optional `FromLocationId` / `ToLocationId` + bilingual translation for all 5 fields: `FromLocationName`, `ToLocationName`, `TransportationName`, `TicketInfo`, `Note`.

### 2.4 Breaking Change: Remove TourResourceEntity.Type=Location

`TourResourceEntity` will no longer store Type=Location. Existing data is deleted via migration.

---

## 3. DTO Changes

### 3.1 LocationDto (input — creates TourPlanLocationEntity)

Current `LocationDto` shape (no changes needed to match existing DTO):

```csharp
public sealed record LocationDto(
    string LocationName,
    LocationType LocationType,
    string? Description,
    string? City,
    string? Country,
    string? Address,
    decimal? EntranceFee,
    Dictionary<string, TourPlanLocationTranslationData>? Translations = null
);
```

> Note: `Latitude`, `Longitude`, `OpeningHours`, `ClosingHours`, `EstimatedDurationMinutes` exist on `TourPlanLocationEntity` but not on the input DTO — they can be set via translation dict or added separately. This spec does NOT expand LocationDto beyond its current shape. Additional fields can be added in a follow-up.

### 3.2 RouteDto (input — creates TourPlanRouteEntity)

```csharp
public sealed record RouteDto(
    Guid? FromLocationId,         // NEW: optional FK reference
    Guid? ToLocationId,           // NEW: optional FK reference
    string? FromLocationName,     // Fallback if FromLocationId null
    string? ToLocationName,       // Fallback if ToLocationId null
    string TransportationType,
    string? TransportationName,
    int? DurationMinutes,
    string? PricingType,
    decimal? Price,
    bool RequiresIndividualTicket,
    string? TicketInfo,
    string? Note,
    Dictionary<string, TourPlanLocationTranslationData>? Translations = null,
    Dictionary<string, TourPlanRouteTranslationData>? RouteTranslations = null
);
```

**Validation rules:**
- Must have from: `FromLocationId != null` OR `!string.IsNullOrEmpty(FromLocationName)`
- Must have to: `ToLocationId != null` OR `!string.IsNullOrEmpty(ToLocationName)`
- If both Id and Name provided → Id takes precedence

### 3.3 TransportationDto (input — creates TourResourceEntity)

```csharp
public sealed record TransportationDto(
    Guid? FromLocationId,
    Guid? ToLocationId,
    string? FromLocationName,
    string? ToLocationName,
    string TransportationType,
    string? TransportationName,
    int? DurationMinutes,
    string? PricingType,
    decimal? Price,
    bool RequiresIndividualTicket,
    string? TicketInfo,
    string? Note,
    Dictionary<string, TourTransportationTranslationData>? Translations = null
);
```

> **Breaking change:** `FromLocationName` and `ToLocationName` are now nullable. The current validator requires them non-null — these `NotEmpty` rules must be removed and replaced with the nullable-or-has-reference rules below. If one endpoint is provided (e.g., `FromLocationId`), the other endpoint may use text-only. At least one endpoint must have a value.

### 3.4 New Translation DTO

```csharp
public sealed record TourTransportationTranslationData(
    string? FromLocationName,
    string? ToLocationName,
    string? TransportationName,
    string? TicketInfo,
    string? Note
);
```

> `TourTransportationTranslationData` is a **new record** used exclusively for `TransportationDto.Translations`. It does NOT replace `TourResourceTranslationData` — `TourResourceEntity.Translations` retains its type for other resource types (Accommodation, Service).

---

## 4. Entity & EF Changes

### 4.1 TourPlanRouteEntity

- FK columns `FromLocationId` / `ToLocationId` are shadow properties (may already be in migration snapshot — **verify before creating migration 1**)
- EF config: ensure `IsRequired(false)` (nullable)
- Indexes already exist on these columns

### 4.2 TourResourceEntity

- Add nullable FK: `FromLocationId`, `ToLocationId` → `TourPlanLocationEntity`
- Add navigation: `FromLocation`, `ToLocation` (TourPlanLocationEntity)
- Update `Create()` factory: add optional `fromLocationId`, `toLocationId` parameters
- EF config: `HasForeignKey`, `OnDelete(ReferentialAction.Restrict)`

### 4.3 TourPlanLocationEntity

**Critical architecture change:**
- `TourDayActivityId` FK: **change from required to nullable** (`IsRequired(false)`)
- Add FK: `TourId` (Guid, **required**) → `TourEntity`
- Add navigation: `Tour` (TourEntity)
- EF config:
  - `HasOne(l => l.Tour).WithMany().HasForeignKey(l => l.TourId).OnDelete(DeleteBehavior.Cascade)`
  - `TourDayActivityId` → `OnDelete(DeleteBehavior.SetNull)` — nullable, set null when parent activity deleted
- Two FK paths coexist: `TourId` (tour-level) and `TourDayActivityId` (optional, activity-level)
- Step locations: `TourId` set, `TourDayActivityId` = null
- Route inline locations: `TourDayActivityId` set, `TourId` set (same tour)

### 4.4 TourDayActivityEntity

- No structural changes needed — navigation to `Routes` already exists

---

## 5. Service Mapping Flow

### 5.1 Create Tour — Execution Order

```
Step 1: Create TourPlanLocationEntity[] from LocationDto[]
        └─ Deduplicate by LocationName
        └─ Build lookup: LocationName → TourPlanLocationEntity.Id
        └─ Set TourId on each; TourDayActivityId = null (step-level location)

Step 2: Create Classifications → Plans → Activities
        └─ For each RouteDto:
            ├─ Resolve FromLocation (see 5.2)
            ├─ Resolve ToLocation (see 5.2)
            └─ Create TourPlanRouteEntity with resolved FKs

Step 3: Create Transportations[]
        └─ Resolve from/to locations (same logic as routes)
        └─ Create TourResourceEntity with FKs + translations
```

### 5.2 Location Resolution Logic

```
Priority 1: FromLocationId != null
    → Find in step locations by Id
    → If not found → ArgumentException("Referenced location Id not found in step locations")

Priority 2: FromLocationId == null && FromLocationName != null
    → Find in step locations by name (case-insensitive, trimmed)
    → If found → return (DEDUPLICATE: link to step location)
    → If not found → create new TourPlanLocationEntity(LocationType.Other)
        └─ Set TourId, TourDayActivityId (parent activity)
        └─ Set LocationName, CreatedBy

Fallback: throw ArgumentException("Route must specify FromLocation via Id or Name")
```

> **Dedup rule:** Case-insensitive, trimmed. "Hanoi" matches "hanoi" and " Hanoi ".

### 5.3 Backward Compatibility

- `FromLocationId`/`ToLocationId` nullable → routes without IDs use fallback text → behavior identical to current
- Existing tours: FK columns null → `TourDayActivityId` still set → routes accessible via navigation as before
- No data migration needed for existing route data

### 5.4 Update Tour — Route Handling

**Route update strategy: upsert (delete + recreate)**

- When updating an activity's routes: remove all existing `TourPlanRouteEntity` for that activity, then recreate from updated `RouteDto` list using the same resolution logic as Create
- Same location resolution as Create
- If step locations change in the update command: resolve references using the updated location list
- Orphan locations (not referenced by any route) remain in DB — cleanup via future background job if needed

### 5.5 TourResourceEntity.Create Factory Update

```csharp
public static TourResourceEntity Create(
    TourResourceType type,
    string name,
    string? description,
    string userId,
    // ... existing params
    Guid? fromLocationId = null,
    Guid? toLocationId = null
) {
    var entity = new TourResourceEntity { Type = type, Name = name, ... };
    entity.SetFromLocationId(fromLocationId);
    entity.SetToLocationId(toLocationId);
    return entity;
}
```

---

## 6. Validation Rules

### 6.1 RouteDtoValidator (replaces existing rules)

```csharp
RuleFor(x => x)
    .Must(r => r.FromLocationId != null || !string.IsNullOrWhiteSpace(r.FromLocationName))
    .WithMessage("Route must specify FromLocation via Id or Name.");

RuleFor(x => x)
    .Must(r => r.ToLocationId != null || !string.IsNullOrWhiteSpace(r.ToLocationName))
    .WithMessage("Route must specify ToLocation via Id or Name.");
```

> **Breaking change:** Existing `TC29_RouteFromLocationEmpty_ShouldFail` test uses `NotEmpty` rule which will be removed. Update test to use the new nullable-or-reference rule set.

### 6.2 TransportationDtoValidator (updates + additions)

```csharp
// Remove existing: FromLocationName NotEmpty, ToLocationName NotEmpty
// Replace with nullable-or-reference:
RuleFor(x => x)
    .Must(t => t.FromLocationId != null || !string.IsNullOrWhiteSpace(t.FromLocationName))
    .When(t => t.ToLocationId == null && string.IsNullOrWhiteSpace(t.ToLocationName))
    .WithMessage("Transportation must specify FromLocation via Id or Name when ToLocation is also not specified.");

RuleFor(x => x)
    .Must(t => t.ToLocationId != null || !string.IsNullOrWhiteSpace(t.ToLocationName))
    .When(t => t.FromLocationId == null && string.IsNullOrWhiteSpace(t.FromLocationName))
    .WithMessage("Transportation must specify ToLocation via Id or Name when FromLocation is also not specified.");

// New rules:
RuleFor(x => x.DurationMinutes).GreaterThanOrEqualTo(0)
    .WithMessage("Transportation duration must be greater than or equal to 0.");
RuleFor(x => x.Price).GreaterThanOrEqualTo(0)
    .WithMessage("Transportation price must be greater than or equal to 0.");
RuleFor(x => x.TicketInfo).MaximumLength(1000)
    .WithMessage("Transportation ticket info must not exceed 1000 characters.");
RuleFor(x => x.Note).MaximumLength(2000)
    .WithMessage("Transportation note must not exceed 2000 characters.");
RuleFor(x => x.TransportationName).MaximumLength(100)
    .WithMessage("Transportation name must not exceed 100 characters.");
```

---

## 7. Migration

> **Pre-migration verification:** The EF migration snapshot confirms `FromLocationId`/`ToLocationId` columns **already exist** on `TourPlanRoutes` as **non-nullable**. They must be altered to nullable.

### 7.1 Migration 1: Make TourPlanRoute FK columns nullable

Columns already exist in DB as non-nullable. EF snapshot confirms this. Migration alters to nullable:

```sql
ALTER TABLE "TourPlanRoutes" ALTER COLUMN "FromLocationId" DROP NOT NULL;
ALTER TABLE "TourPlanRoutes" ALTER COLUMN "ToLocationId" DROP NOT NULL;
```
> Indexes on these columns already exist per snapshot. No new indexes needed.

### 7.2 Migration 2: Add TourId FK + Make TourDayActivityId nullable + Add TourResources FKs

```sql
-- Step A: Add TourId column (nullable first for backfill)
ALTER TABLE "TourPlanLocations" ADD COLUMN "TourId" uuid NULL;

-- Step B: Backfill TourId from TourDayActivities
UPDATE "TourPlanLocations"
SET "TourId" = "TourDayActivities"."TourId"
FROM "TourDayActivities"
WHERE "TourPlanLocations"."TourDayActivityId" = "TourDayActivities"."Id";

-- Step C: Set NOT NULL constraint
ALTER TABLE "TourPlanLocations" ALTER COLUMN "TourId" SET NOT NULL;

-- Step D: Add FK + cascade delete
ALTER TABLE "TourPlanLocations" ADD CONSTRAINT FK_TourPlanLocations_Tours_TourId
    FOREIGN KEY ("TourId") REFERENCES "Tours"("Id") ON DELETE CASCADE;
CREATE INDEX IX_TourPlanLocations_TourId ON "TourPlanLocations"("TourId");

-- Step E: Make TourDayActivityId nullable
ALTER TABLE "TourPlanLocations" ALTER COLUMN "TourDayActivityId" DROP NOT NULL;
-- EF configures ON DELETE SET NULL via model annotation

-- Step F: Add FKs to TourResources for transportation locations
ALTER TABLE "TourResources" ADD COLUMN "FromLocationId" uuid NULL
    REFERENCES "TourPlanLocations"("Id") ON DELETE RESTRICT;
ALTER TABLE "TourResources" ADD COLUMN "ToLocationId" uuid NULL
    REFERENCES "TourPlanLocations"("Id") ON DELETE RESTRICT;
CREATE INDEX IX_TourResources_FromLocationId ON "TourResources"("FromLocationId") WHERE "FromLocationId" IS NOT NULL;
CREATE INDEX IX_TourResources_ToLocationId ON "TourResources"("ToLocationId") WHERE "ToLocationId" IS NOT NULL;
```

-- Step F: Add FKs to TourResources for transportation locations
ALTER TABLE "TourResources" ADD COLUMN "FromLocationId" uuid NULL
    REFERENCES "TourPlanLocations"("Id") ON DELETE RESTRICT;
ALTER TABLE "TourResources" ADD COLUMN "ToLocationId" uuid NULL
    REFERENCES "TourPlanLocations"("Id") ON DELETE RESTRICT;
CREATE INDEX IX_TourResources_FromLocationId ON "TourResources"("FromLocationId") WHERE "FromLocationId" IS NOT NULL;
CREATE INDEX IX_TourResources_ToLocationId ON "TourResources"("ToLocationId") WHERE "ToLocationId" IS NOT NULL;
```

### 7.3 Migration 3: Remove TourResourceEntity.Type=Location

```sql
DELETE FROM "TourResources" WHERE "Type" = 3;  -- Location enum value
```

### 7.4 Delete Behavior Summary

| Relationship | Delete Behavior | Rationale |
|---|---|---|
| TourPlanRouteEntity.FromLocation | **Restrict** | Cannot delete a location that is referenced by a route. Must remove route first. |
| TourPlanRouteEntity.ToLocation | **Restrict** | Cannot delete a location that is referenced by a route. Must remove route first. |
| TourResourceEntity.FromLocation | Restrict | Cannot delete a location that is referenced by a transportation resource. |
| TourResourceEntity.ToLocation | Restrict | Cannot delete a location that is referenced by a transportation resource. |
| TourPlanLocationEntity.Tour | Cascade | Deleting a tour deletes all its step locations. |
| TourPlanLocationEntity.TourDayActivity | **SetNull** | When an activity is deleted, route-level locations become orphaned. They are preserved (set null) rather than deleted — they may still be referenced by other routes or become eligible for cleanup. |
| TourPlanLocationEntity.TourDayActivity | SetNull |

---

## 8. Tests

### 8.1 Validator Tests (4 cases + 2 edge cases)

| # | Test Name | Input | Expected |
|---|-----------|-------|----------|
| V1 | `CreateTourCommand_ValidRoute_WithLocationReference_Passes` | Route with valid `FromLocationId` + `ToLocationId` | Validation pass |
| V2 | `CreateTourCommand_ValidRoute_TextOnly_Passes` | Route with `FromLocationName` + `ToLocationName` only | Validation pass |
| V3 | `CreateTourCommand_RouteMissingFromAndTo_Fails` | Route without Id or Name | 2 errors: "Route must specify FromLocation" + "Route must specify ToLocation" |
| V4 | `CreateTourCommand_Transportation_ValidBilingual_Passes` | Transportation with `FromLocationId`, `ToLocationId`, `Translations` VI/EN | Validation pass |
| V5 | `CreateTourCommand_RouteWithBothIdAndName_IdTakesPrecedence` | Route with `FromLocationId: L1`, `FromLocationName: "Different Name"` | Validation pass, Id takes precedence |
| V6 | `CreateTourCommand_Transportation_NameOnly_NoId_Passes` | Transportation with `FromLocationName: "Hanoi"`, `ToLocationName: "HCM"` | Validation pass |

### 8.2 Service Tests (4 cases + 3 edge cases)

| # | Test Name | Scenario | Assertion |
|---|-----------|----------|-----------|
| S1 | `CreateTour_WithRouteTextOnly_BackwardCompat` | Route text-only | Route entity created, FromLocation/ToLocation are new entities |
| S2 | `CreateTour_WithRouteLocationReference_FKCorrect` | Step location `[{Id: L1, Name: "Hanoi"}]`, Route `FromLocationId: L1, ToLocationName: "Ha Long"` | Route FK `FromLocationId = L1`, `ToLocationId = null` (created) |
| S3 | `CreateTour_WithRouteLocationReference_Deduplication` | 3 routes same `FromLocationId: L1` | Only **1** TourPlanLocationEntity created for from location |
| S4 | `GetTourDetail_RouteWithLocationReference_ReturnsCorrectData` | Tour with route FK | Response has `FromLocation.Id`, `FromLocation.LocationName`, `FromLocation.Translations` |
| S5 | `CreateTour_RouteLocationIdNotFound_Throws` | Route `FromLocationId: invalidGUID` | `ArgumentException` with message about referenced location not found |
| S6 | `CreateTour_RouteLocationDeduplication_CaseInsensitive` | 2 locations: "Hanoi", "HANOI"; Route `FromLocationName: "hanoi"` | Route links to first matched location (case-insensitive dedup) |
| S7 | `CreateTour_TransportationWithLocationReference_FKCorrect` | Transportation `FromLocationId: L1, ToLocationId: L2` | TourResourceEntity FKs set correctly |

---

## 9. Files to Change

| File | Change |
|------|--------|
| `Application/Features/Tour/Commands/CreateTourDtos.cs` | Add `FromLocationId`/`ToLocationId` to `RouteDto` and `TransportationDto`; add `TourTransportationTranslationData` record |
| `Application/Features/Tour/Validators/TourCommandValidators.cs` | Replace `RouteDtoValidator` `NotEmpty` rules with nullable-or-reference rules; update `TransportationDtoValidator` (remove NotEmpty, add new numeric/text length rules) |
| `Application/Mapping/TourProfile.cs` | Add mappings for `FromLocationId`/`ToLocationId` on Route → TourPlanRouteEntity if needed |
| `Domain/Entities/TourPlanLocationEntity.cs` | Add `TourId` property + `Tour` navigation; make `TourDayActivityId` nullable (change property type to `Guid?`); update `Create()` factory to accept `tourId` and `tourDayActivityId` parameters |
| `Domain/Entities/TourResourceEntity.cs` | Add `FromLocationId`/`ToLocationId` FKs; add `FromLocation`/`ToLocation` navigations; update `Create()` factory |
| `Domain/Entities/TourPlanRouteEntity.cs` | No changes — verify nullable FK config |
| `Infrastructure/Data/Configurations/TourPlanLocationConfiguration.cs` | Make `TourDayActivityId` nullable; add `TourId` FK with cascade; set `OnDelete(DeleteBehavior.SetNull)` for `TourDayActivityId` |
| `Infrastructure/Data/Configurations/TourResourceConfiguration.cs` | Add `FromLocationId`/`ToLocationId` FK config with restrict |
| `Infrastructure/Data/Configurations/TourPlanRouteConfiguration.cs` | Verify nullable FK config (no changes expected) |
| `Application/Services/TourService.cs` | Rewrite location creation flow for LocationDto → TourPlanLocationEntity; add location resolution logic; update Transportation creation with FKs; extend `UpdateActivitiesAsync` with route upsert |
| `Application/Features/Tour/Commands/UpdateTourCommand.cs` | Add `List<LocationDto>? Locations` and `List<TransportationDto>? Transportations` to command for full update support |
| `Application/Dtos/TourResourceDto.cs` | Add `FromLocationId`/`ToLocationId`/`FromLocation`/`ToLocation` to response DTO for transportation resources |
| `Application/Dtos/TourPlanRouteDto.cs` | Already has nested locations — verify `FromLocationId`/`ToLocationId` FK fields are exposed |
| Migration file(s) | 3 migrations as described in section 7; verify existing snapshot before creating migration 1 |
| Test files | 10 new tests (6 validator + 7 service) as described in section 8; update affected existing tests (TC29) |

---

## 10. JSON Request/Response Samples

### 10.1 Create Tour Request (with location references — primary use case)

```json
{
  "tourName": "Northern Vietnam Adventure",
  "shortDescription": "7-day tour",
  "longDescription": "Explore the best of Northern Vietnam...",
  "locations": [
    {
      "locationName": "Hanoi Old Quarter",
      "locationType": "TouristAttraction",
      "city": "Hanoi",
      "country": "Vietnam",
      "translations": {
        "vi": { "locationName": "Phố cổ Hà Nội", "city": "Hà Nội" },
        "en": { "locationName": "Hanoi Old Quarter", "city": "Hanoi" }
      }
    },
    {
      "locationName": "Ha Long Bay",
      "locationType": "NationalPark",
      "city": "Quang Ninh",
      "country": "Vietnam",
      "translations": {
        "vi": { "locationName": "Vịnh Hạ Long", "city": "Quảng Ninh" },
        "en": { "locationName": "Ha Long Bay", "city": "Quang Ninh" }
      }
    }
  ],
  "classifications": [
    {
      "plans": [
        {
          "dayNumber": 1,
          "activities": [
            {
              "dayActivityName": "Explore Old Quarter",
              "estimatedCost": 50.00,
              "routes": [
                {
                  "fromLocationId": null,
                  "toLocationId": null,
                  "fromLocationName": "Hanoi Old Quarter",
                  "toLocationName": "Hanoi Opera House",
                  "transportationType": "Walking",
                  "durationMinutes": 30,
                  "price": 0,
                  "requiresIndividualTicket": false
                },
                {
                  "fromLocationId": null,
                  "toLocationId": null,
                  "fromLocationName": "Hanoi Opera House",
                  "toLocationName": "Ha Long Bay",
                  "transportationType": "Bus",
                  "transportationName": "Hanoi Ha Long Express",
                  "durationMinutes": 180,
                  "price": 25.00,
                  "requiresIndividualTicket": true,
                  "ticketInfo": "Ticket included in package",
                  "note": "Rest stops at 60km mark",
                  "translations": {
                    "vi": {
                      "fromLocationName": "Nhà hát Lớn Hà Nội",
                      "toLocationName": "Vịnh Hạ Long",
                      "transportationName": "Xe khách Hà Nội Hạ Long",
                      "ticketInfo": "Vé đã bao gồm trong gói",
                      "note": "Nghỉ ngơi tại km 60"
                    },
                    "en": {
                      "fromLocationName": "Hanoi Opera House",
                      "toLocationName": "Ha Long Bay",
                      "transportationName": "Hanoi Ha Long Express",
                      "ticketInfo": "Ticket included in package",
                      "note": "Rest stops at 60km mark"
                    }
                  }
                }
              ]
            }
          ],
          "translations": null
        }
      ],
      "insurances": []
    }
  ],
  "transportations": [
    {
      "fromLocationId": null,
      "toLocationId": null,
      "fromLocationName": "Hanoi",
      "toLocationName": "Ho Chi Minh City",
      "transportationType": "Flight",
      "transportationName": "Vietnam Airlines VN123",
      "durationMinutes": 120,
      "price": 150.00,
      "requiresIndividualTicket": true,
      "ticketInfo": "Economy class, 20kg luggage",
      "note": "Direct flight",
      "translations": {
        "vi": {
          "fromLocationName": "Hà Nội",
          "toLocationName": "Thành phố Hồ Chí Minh",
          "transportationName": "Hãng Hàng không Việt Nam VN123",
          "ticketInfo": "Hạng phổ thông, 20kg hành lý",
          "note": "Chuyến bay thẳng"
        },
        "en": {
          "fromLocationName": "Hanoi",
          "toLocationName": "Ho Chi Minh City",
          "transportationName": "Vietnam Airlines VN123",
          "ticketInfo": "Economy class, 20kg luggage",
          "note": "Direct flight"
        }
      }
    }
  ]
}
```

### 10.2 Create Tour Request (ID-referenced — deduplication)

```json
{
  "locations": [
    { "locationName": "Hanoi Old Quarter", "locationType": "TouristAttraction" },
    { "locationName": "Ha Long Bay", "locationType": "NationalPark" }
  ],
  "classifications": [
    {
      "plans": [
        {
          "dayNumber": 1,
          "activities": [
            {
              "routes": [
                {
                  "fromLocationName": "Hanoi Old Quarter",
                  "toLocationName": "Ha Long Bay",
                  "transportationType": "Bus"
                }
              ]
            }
          ],
          "translations": null
        }
      ],
      "insurances": []
    }
  ],
  "transportations": [
    {
      "fromLocationName": "Hanoi Old Quarter",
      "toLocationName": "Ha Long Bay",
      "transportationType": "Bus"
    }
  ]
}
```

### 10.3 Get Tour Detail Response (route with location FK)

```json
{
  "id": "...",
  "tourName": "Northern Vietnam Adventure",
  "classifications": [
    {
      "plans": [
        {
          "activities": [
            {
              "dayActivityName": "Explore Old Quarter",
              "routes": [
                {
                  "id": "R0000000-0000-0000-0000-000000000001",
                  "fromLocationId": "L0000000-0000-0000-0000-000000000001",
                  "toLocationId": "L0000000-0000-0000-0000-000000000002",
                  "transportationType": "Bus",
                  "transportationName": "Hanoi Ha Long Express",
                  "durationMinutes": 180,
                  "price": 25.00,
                  "requiresIndividualTicket": true,
                  "ticketInfo": "Ticket included in package",
                  "note": "Rest stops at 60km mark",
                  "fromLocation": {
                    "id": "L0000000-0000-0000-0000-000000000001",
                    "locationName": "Hanoi Old Quarter",
                    "locationType": "TouristAttraction",
                    "city": "Hanoi",
                    "country": "Vietnam",
                    "translations": {
                      "vi": { "locationName": "Phố cổ Hà Nội", "city": "Hà Nội" },
                      "en": { "locationName": "Hanoi Old Quarter", "city": "Hanoi" }
                    }
                  },
                  "toLocation": {
                    "id": "L0000000-0000-0000-0000-000000000002",
                    "locationName": "Ha Long Bay",
                    "locationType": "NationalPark",
                    "city": "Quang Ninh",
                    "translations": {
                      "vi": { "locationName": "Vịnh Hạ Long" },
                      "en": { "locationName": "Ha Long Bay" }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "resources": [
    {
      "id": "RESOURCE001",
      "type": "Transportation",
      "fromLocationId": "L0000000-0000-0000-0000-000000000001",
      "toLocationId": null,
      "transportationName": "Vietnam Airlines VN123",
      "translations": {
        "vi": { "fromLocationName": "Hà Nội", "transportationName": "Hãng Hàng không Việt Nam VN123" }
      }
    }
  ]
}
```
