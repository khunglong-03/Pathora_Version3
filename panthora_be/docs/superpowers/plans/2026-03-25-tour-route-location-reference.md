# Tour Route Location Reference + Bilingual Transportation — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Tour Create flow to support: (1) route linking to step locations via FK, (2) bilingual VI/EN for all Transportation fields.

**Architecture:** Add optional `FromLocationId`/`ToLocationId` FK to `RouteDto` and `TransportationDto`. `LocationDto` creates `TourPlanLocationEntity` (not `TourResourceEntity`). `TourPlanLocationEntity` gets `TourId` FK + `TourDayActivityId` becomes nullable. New `TourTransportationTranslationData` record for bilingual transportation.

**Tech Stack:** ASP.NET Core 10, EF Core 10, FluentValidation, xUnit + NSubstitute, AutoMapper.

---

## Chunk 1: DTO Changes (Domain + Application)

**Files:**
- Modify: `src/Domain/Entities/TourPlanLocationEntity.cs`
- Modify: `src/Domain/Entities/TourResourceEntity.cs`
- Modify: `src/Application/Features/Tour/Commands/CreateTourDtos.cs`

### Task 1.1: TourPlanLocationEntity — Add TourId FK, make TourDayActivityId nullable, update factory

**Files:**
- Modify: `src/Domain/Entities/TourPlanLocationEntity.cs`

- [ ] **Step 1: Read current entity and factory**

Read: `src/Domain/Entities/TourPlanLocationEntity.cs`

- [ ] **Step 2: Add TourId property and Tour navigation**

Add after existing properties:
```csharp
public Guid TourId { get; private set; }
public virtual TourEntity? Tour { get; set; }
```

- [ ] **Step 3: Change TourDayActivityId from Guid to Guid?**

Change line: `public Guid TourDayActivityId { get; private set; }` → `public Guid? TourDayActivityId { get; private set; }`

- [ ] **Step 4: Update Create() factory to accept tourId and tourDayActivityId**

Change signature from:
```csharp
public static TourPlanLocationEntity Create(string locationName, LocationType locationType, string createdBy)
```
To:
```csharp
public static TourPlanLocationEntity Create(
    string locationName,
    LocationType locationType,
    string createdBy,
    Guid tourId,
    Guid? tourDayActivityId = null)
```

Update body to set both `TourId` and `TourDayActivityId`.

- [ ] **Step 5: Update Update() method**

Add `tourDayActivityId` parameter, update body accordingly.

- [ ] **Step 6: Verify build**

Run: `dotnet build src/Domain/Domain.csproj`
Expected: Build succeeds

### Task 1.2: TourResourceEntity — Add FromLocationId/ToLocationId FKs + navigations + update factory

**Files:**
- Modify: `src/Domain/Entities/TourResourceEntity.cs`

- [ ] **Step 1: Read current entity and factory**

Read: `src/Domain/Entities/TourResourceEntity.cs`

- [ ] **Step 2: Add FK properties and navigations**

Add after existing properties:
```csharp
public Guid? FromLocationId { get; private set; }
public virtual TourPlanLocationEntity? FromLocation { get; set; }
public Guid? ToLocationId { get; private set; }
public virtual TourPlanLocationEntity? ToLocation { get; set; }
```

- [ ] **Step 3: Add Backing fields and Set methods**

```csharp
private Guid? _fromLocationId;
private Guid? _toLocationId;

public void SetFromLocationId(Guid? id) => _fromLocationId = id;
public void SetToLocationId(Guid? id) => _toLocationId = id;
```

- [ ] **Step 4: Update Create() factory**

Add `Guid? fromLocationId = null, Guid? toLocationId = null` parameters. Call `SetFromLocationId` and `SetToLocationId` in body.

- [ ] **Step 5: Verify build**

Run: `dotnet build src/Domain/Domain.csproj`
Expected: Build succeeds

### Task 1.3: CreateTourDtos — Add FromLocationId/ToLocationId to RouteDto and TransportationDto, add TourTransportationTranslationData

**Files:**
- Modify: `src/Application/Features/Tour/Commands/CreateTourDtos.cs`

- [ ] **Step 1: Read current DTOs**

Read: `src/Application/Features/Tour/Commands/CreateTourDtos.cs` — focus on RouteDto (lines ~43-56) and TransportationDto (lines ~102-114)

- [ ] **Step 2: Update RouteDto**

Add after existing fields:
```csharp
Guid? FromLocationId = null,
Guid? ToLocationId = null,
```

Change `string FromLocationName` → `string? FromLocationName = null`
Change `string ToLocationName` → `string? ToLocationName = null`

Note: `TransportationType` remains required (non-nullable).

- [ ] **Step 3: Update TransportationDto**

Change `string FromLocationName` → `string? FromLocationName = null`
Change `string ToLocationName` → `string? ToLocationName = null`
Add after existing fields:
```csharp
Guid? FromLocationId = null,
Guid? ToLocationId = null,
Dictionary<string, TourTransportationTranslationData>? Translations = null
```

- [ ] **Step 4: Add TourTransportationTranslationData record**

Add after existing translation data records in the file:
```csharp
public sealed record TourTransportationTranslationData(
    string? FromLocationName,
    string? ToLocationName,
    string? TransportationName,
    string? TicketInfo,
    string? Note
);
```

- [ ] **Step 5: Verify build**

Run: `dotnet build src/Application/Application.csproj`
Expected: Build succeeds

---

## Chunk 2: EF Configuration + Migrations (Infrastructure)

**Files:**
- Modify: `src/Infrastructure/Data/Configurations/TourPlanLocationConfiguration.cs`
- Modify: `src/Infrastructure/Data/Configurations/TourResourceConfiguration.cs`
- Modify: `src/Infrastructure/Data/Configurations/TourPlanRouteConfiguration.cs`
- Modify: `src/Infrastructure/Data/AppDbContext.cs`

### Task 2.1: TourPlanLocationConfiguration — TourId FK (cascade), TourDayActivityId nullable (setnull)

**Files:**
- Modify: `src/Infrastructure/Data/Configurations/TourPlanLocationConfiguration.cs`

- [ ] **Step 1: Read current config**

Read: `src/Infrastructure/Data/Configurations/TourPlanLocationConfiguration.cs`

- [ ] **Step 2: Make TourDayActivityId nullable**

Change existing `IsRequired()` → `IsRequired(false)`. Change the `OnDelete` from `Cascade` → `SetNull`.

- [ ] **Step 3: Add TourId FK with cascade**

```csharp
builder.HasOne(l => l.Tour)
    .WithMany()
    .HasForeignKey(l => l.TourId)
    .OnDelete(DeleteBehavior.Cascade);

builder.Property(l => l.TourId)
    .IsRequired();

builder.HasIndex(l => l.TourId);
```

- [ ] **Step 4: Verify build**

Run: `dotnet build src/Infrastructure/Infrastructure.csproj`
Expected: Build succeeds

### Task 2.2: TourResourceConfiguration — Add FromLocationId/ToLocationId FKs

**Files:**
- Modify: `src/Infrastructure/Data/Configurations/TourResourceConfiguration.cs`

- [ ] **Step 1: Read current config**

Read: `src/Infrastructure/Data/Configurations/TourResourceConfiguration.cs`

- [ ] **Step 2: Add FromLocation navigation**

After existing property configurations, add:
```csharp
builder.HasOne(r => r.FromLocation)
    .WithMany()
    .HasForeignKey(r => r.FromLocationId)
    .OnDelete(DeleteBehavior.Restrict);

builder.Property(r => r.FromLocationId)
    .IsRequired(false);

builder.HasOne(r => r.ToLocation)
    .WithMany()
    .HasForeignKey(r => r.ToLocationId)
    .OnDelete(DeleteBehavior.Restrict);

builder.Property(r => r.ToLocationId)
    .IsRequired(false);

builder.HasIndex(r => r.FromLocationId);
builder.HasIndex(r => r.ToLocationId);
```

- [ ] **Step 3: Verify build**

Run: `dotnet build src/Infrastructure/Infrastructure.csproj`
Expected: Build succeeds

### Task 2.3: TourPlanRouteConfiguration — Ensure FromLocationId/ToLocationId are nullable

**Files:**
- Modify: `src/Infrastructure/Data/Configurations/TourPlanRouteConfiguration.cs`

- [ ] **Step 1: Read current config**

Read: `src/Infrastructure/Data/Configurations/TourPlanRouteConfiguration.cs`

- [ ] **Step 2: Verify/set nullable on existing FKs**

Confirm `FromLocationId` and `ToLocationId` are configured as nullable. The spec notes columns already exist in DB as non-nullable — after Migration 1 they will be nullable.

- [ ] **Step 3: Verify build**

Run: `dotnet build src/Infrastructure/Infrastructure.csproj`
Expected: Build succeeds

### Task 2.4: Create EF Migrations

- [ ] **Step 1: Migration 1 — Make TourPlanRoute FKs nullable**

Run: `dotnet ef migrations add MakeTourPlanRouteLocationFkNullable --project src/Infrastructure --startup-project src/Api`
Expected: Migration generated

Check the migration file — it should have `AlterColumn` for `FromLocationId` and `ToLocationId` on `TourPlanRoutes` to drop NOT NULL.

- [ ] **Step 2: Migration 2 — TourId FK + TourDayActivityId nullable + TourResources FKs**

Run: `dotnet ef migrations add AddTourIdAndLocationFkToTourPlanLocations --project src/Infrastructure --startup-project src/Api`
Expected: Migration generated

This should include:
- Add `TourId` column to `TourPlanLocations`
- Backfill `TourId` from `TourDayActivities`
- Add `TourId` NOT NULL + FK with cascade
- Make `TourDayActivityId` nullable with SetNull
- Add `FromLocationId`/`ToLocationId` columns to `TourResources`

**NOTE:** EF migrations use C# code, not raw SQL. The migration will use `AlterColumn`, `AddColumn`, `Sql()` for backfill, etc. Review the generated migration to ensure the backfill SQL is included.

- [ ] **Step 3: Migration 3 — Remove TourResource Type=Location**

Run: `dotnet ef migrations add RemoveTourResourceLocationType --project src/Infrastructure --startup-project src/Api`
Expected: Migration generated with raw SQL `DELETE FROM "TourResources" WHERE "Type" = 3`

---

## Chunk 3: Validation Rules (Application)

**Files:**
- Modify: `src/Application/Features/Tour/Validators/TourCommandValidators.cs`

### Task 3.1: RouteDtoValidator — Replace NotEmpty with nullable-or-reference rules

**Files:**
- Modify: `src/Application/Features/Tour/Validators/TourCommandValidators.cs`

- [ ] **Step 1: Read current RouteDtoValidator**

Read: `src/Application/Features/Tour/Validators/TourCommandValidators.cs` — focus on RouteDtoValidator (around line 100-130)

- [ ] **Step 2: Replace NotEmpty rules with nullable-or-reference**

Remove:
```csharp
RuleFor(x => x.FromLocationName)
    .NotEmpty().WithMessage("From location is required.");
RuleFor(x => x.ToLocationName)
    .NotEmpty().WithMessage("To location is required.");
```

Replace with:
```csharp
RuleFor(x => x)
    .Must(r => r.FromLocationId != null || !string.IsNullOrWhiteSpace(r.FromLocationName))
    .WithMessage("Route must specify FromLocation via Id or Name.");

RuleFor(x => x)
    .Must(r => r.ToLocationId != null || !string.IsNullOrWhiteSpace(r.ToLocationName))
    .WithMessage("Route must specify ToLocation via Id or Name.");
```

- [ ] **Step 3: Verify build**

Run: `dotnet build src/Application/Application.csproj`
Expected: Build succeeds

### Task 3.2: TransportationDtoValidator — Remove NotEmpty, add new numeric/text rules

**Files:**
- Modify: `src/Application/Features/Tour/Validators/TourCommandValidators.cs`

- [ ] **Step 1: Read current TransportationDtoValidator**

Read: `src/Application/Features/Tour/Validators/TourCommandValidators.cs` — focus on TransportationDtoValidator (around line 225-245)

- [ ] **Step 2: Remove NotEmpty rules for FromLocationName/ToLocationName**

Remove `FromLocationName.NotEmpty()` and `ToLocationName.NotEmpty()` rules.

- [ ] **Step 3: Add nullable-or-reference rules**

```csharp
RuleFor(x => x)
    .Must(t => t.FromLocationId != null || !string.IsNullOrWhiteSpace(t.FromLocationName))
    .When(t => t.ToLocationId == null && string.IsNullOrWhiteSpace(t.ToLocationName))
    .WithMessage("Transportation must specify FromLocation via Id or Name when ToLocation is also not specified.");

RuleFor(x => x)
    .Must(t => t.ToLocationId != null || !string.IsNullOrWhiteSpace(t.ToLocationName))
    .When(t => t.FromLocationId == null && string.IsNullOrWhiteSpace(t.FromLocationName))
    .WithMessage("Transportation must specify ToLocation via Id or Name when FromLocation is also not specified.");
```

- [ ] **Step 4: Add numeric/length rules**

```csharp
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

- [ ] **Step 5: Verify build**

Run: `dotnet build src/Application/Application.csproj`
Expected: Build succeeds

---

## Chunk 4: Service Mapping (Application — TourService)

**Files:**
- Modify: `src/Application/Services/TourService.cs`
- Modify: `src/Application/Features/Tour/Commands/UpdateTourCommand.cs` (if needed for Locations/Transportations)

### Task 4.1: TourService.Create — Rewrite location creation + location resolution + Transportation FK

**Files:**
- Modify: `src/Application/Services/TourService.cs`

- [ ] **Step 1: Read TourService.Create() and location creation sections**

Read: `src/Application/Services/TourService.cs` — focus on:
- Lines ~140-185 (current Route location creation)
- Lines ~287-305 (current Transportation creation)

- [ ] **Step 2: Add location resolution helper method**

Add as private method in TourService:
```csharp
private TourPlanLocationEntity ResolveLocation(
    Guid? locationId,
    string? locationName,
    List<TourPlanLocationEntity> stepLocations,
    Guid tourId,
    Guid tourDayActivityId,
    string userId)
{
    // Priority 1: ID lookup
    if (locationId != null)
    {
        var byId = stepLocations.FirstOrDefault(l => l.Id == locationId);
        if (byId != null) return byId;
        throw new ArgumentException($"Referenced location Id '{locationId}' not found in step locations.");
    }

    // Priority 2: Name lookup (case-insensitive)
    if (!string.IsNullOrWhiteSpace(locationName))
    {
        var byName = stepLocations.FirstOrDefault(
            l => l.LocationName.Equals(locationName.Trim(), StringComparison.OrdinalIgnoreCase));
        if (byName != null) return byName;

        // Create new
        return TourPlanLocationEntity.Create(
            locationName.Trim(),
            LocationType.Other,
            userId,
            tourId,
            tourDayActivityId);
    }

    throw new ArgumentException("Location must specify Id or Name.");
}
```

- [ ] **Step 3: Rewrite LocationDto processing (Step 1 of Create)**

Currently `Locations` creates `TourResourceEntity`. Change to create `TourPlanLocationEntity`:
```csharp
// Build step locations lookup
var stepLocations = new List<TourPlanLocationEntity>();
if (command.Locations?.Count > 0)
{
    foreach (var loc in command.Locations)
    {
        var existing = stepLocations.FirstOrDefault(
            l => l.LocationName.Equals(loc.LocationName.Trim(), StringComparison.OrdinalIgnoreCase));
        if (existing == null)
        {
            var entity = TourPlanLocationEntity.Create(
                loc.LocationName,
                loc.LocationType,
                _user.Id ?? string.Empty,
                tourId: tour.Id);
            entity.Translations = NormalizeTranslations(loc.Translations);
            stepLocations.Add(entity);
        }
    }
    tour.AddPlanLocations(stepLocations);
}
```

- [ ] **Step 4: Rewrite Route location creation (Step 2 of Create)**

Currently creates new `TourPlanLocationEntity` for each route. Replace with:
```csharp
// In the RouteDto loop:
var fromLocation = ResolveLocation(
    route.FromLocationId,
    route.FromLocationName,
    stepLocations,
    tourId: tour.Id,
    tourDayActivityId: dayActivity.Id,
    userId: _user.Id ?? string.Empty);

var toLocation = ResolveLocation(
    route.ToLocationId,
    route.ToLocationName,
    stepLocations,
    tourId: tour.Id,
    tourDayActivityId: dayActivity.Id,
    userId: _user.Id ?? string.Empty);

// Create route entity
var routeEntity = TourPlanRouteEntity.Create(...);
// Link FK
routeEntity.SetFromLocationId(fromLocation.Id);
routeEntity.SetToLocationId(toLocation.Id);
routeEntity.FromLocation = fromLocation;
routeEntity.ToLocation = toLocation;
```

- [ ] **Step 5: Rewrite Transportation creation with FK**

Update transportation creation to pass `fromLocationId`/`toLocationId`:
```csharp
// Resolve transportation locations
var fromLoc = ResolveLocation(
    trans.FromLocationId, trans.FromLocationName, stepLocations,
    tour.Id, dayActivityId: Guid.Empty, _user.Id ?? string.Empty);
var toLoc = ResolveLocation(
    trans.ToLocationId, trans.ToLocationName, stepLocations,
    tour.Id, dayActivityId: Guid.Empty, _user.Id ?? string.Empty);

var resource = TourResourceEntity.Create(
    type: TourResourceType.Transportation,
    name: $"{trans.FromLocationName ?? fromLoc.LocationName} -> {trans.ToLocationName ?? toLoc.LocationName}",
    // ... existing params
    fromLocationId: fromLoc.Id,
    toLocationId: toLoc.Id);

resource.Translations = NormalizeTransportationTranslations(trans.Translations);
```

- [ ] **Step 6: Verify build**

Run: `dotnet build src/Application/Application.csproj`
Expected: Build succeeds (may have errors — fix incrementally)

### Task 4.2: TourService.UpdateActivitiesAsync — Add route upsert

**Files:**
- Modify: `src/Application/Services/TourService.cs`

- [ ] **Step 1: Read UpdateActivitiesAsync**

Read: `src/Application/Services/TourService.cs` — focus on `UpdateActivitiesAsync` method (~lines 553-603)

- [ ] **Step 2: Add route upsert logic**

After updating basic activity fields, before updating accommodation:
```csharp
// Remove existing routes
var existingRoutes = activity.Routes.ToList();
foreach (var route in existingRoutes)
{
    activity.Routes.Remove(route);
    await _dbContext.Entry(route).Collection(r => r.FromLocation!).LoadAsync(cancellationToken);
    await _dbContext.Entry(route).Collection(r => r.ToLocation!).LoadAsync(cancellationToken);
}

// Create new routes from DTOs
if (act.Routes?.Count > 0)
{
    foreach (var route in act.Routes)
    {
        var fromLoc = ResolveLocation(route.FromLocationId, route.FromLocationName, stepLocations, ...);
        var toLoc = ResolveLocation(route.ToLocationId, route.ToLocationName, stepLocations, ...);
        var routeEntity = TourPlanRouteEntity.Create(...);
        routeEntity.SetFromLocationId(fromLoc.Id);
        routeEntity.SetToLocationId(toLoc.Id);
        activity.Routes.Add(routeEntity);
    }
}
```

- [ ] **Step 3: Verify build**

Run: `dotnet build src/Application/Application.csproj`
Expected: Build succeeds

### Task 4.3: Add NormalizeTransportationTranslations helper

**Files:**
- Modify: `src/Application/Services/TourService.cs`

- [ ] **Step 1: Add helper method**

```csharp
private static Dictionary<string, TourTransportationTranslationData> NormalizeTransportationTranslations(
    Dictionary<string, TourTransportationTranslationData>? translations)
{
    if (translations is null || translations.Count == 0)
        return [];

    return translations
        .Where(kv => !string.IsNullOrWhiteSpace(kv.Key))
        .ToDictionary(kv => kv.Key.Trim(), kv => kv.Value);
}
```

---

## Chunk 5: Response DTOs (Application)

**Files:**
- Modify: `src/Application/Dtos/TourResourceDto.cs`

### Task 5.1: Add FromLocation/ToLocation to TourResourceDto

**Files:**
- Modify: `src/Application/Dtos/TourResourceDto.cs`

- [ ] **Step 1: Read current TourResourceDto**

Read: `src/Application/Dtos/TourResourceDto.cs`

- [ ] **Step 2: Add FromLocationId/ToLocationId and nested FromLocation/ToLocation**

Add properties:
```csharp
public Guid? FromLocationId { get; init; }
public Guid? ToLocationId { get; init; }
public TourPlanLocationDto? FromLocation { get; init; }
public TourPlanLocationDto? ToLocation { get; init; }
```

- [ ] **Step 3: Verify TourPlanRouteDto has FromLocationId/ToLocationId**

Read: `src/Application/Dtos/TourPlanRouteDto.cs` — confirm FK fields are exposed (they should already be through AutoMapper convention).

- [ ] **Step 4: Verify build**

Run: `dotnet build src/Application/Application.csproj`
Expected: Build succeeds

---

## Chunk 6: Tests

**Files:**
- Modify: `tests/Domain.Specs/Application/Validators/CreateTourCommandValidatorTests.cs`
- Modify: `tests/Domain.Specs/Application/Services/TourServiceTests.cs`

### Task 6.1: Validator Tests (6 cases)

**Files:**
- Modify: `tests/Domain.Specs/Application/Validators/CreateTourCommandValidatorTests.cs`

- [ ] **Step 1: Read existing test patterns**

Read the file — focus on existing RouteDto validator tests (TC28, TC29) and Transportation tests.

- [ ] **Step 2: Add V1 — Route with location reference passes**

```csharp
[Fact]
public async Task Validate_RouteWithLocationReference_ShouldPass()
{
    // Arrange
    var cmd = CreateValidCommand(
        activities: [new ActivityDto(
            Routes: [new RouteDto(
                FromLocationId: Guid.NewGuid(),
                ToLocationId: Guid.NewGuid(),
                FromLocationName: null,
                ToLocationName: null,
                TransportationType: "Bus"
            )]
        )]
    );

    // Act
    var result = await _validator.ValidateAsync(cmd);

    // Assert
    Assert.True(result.IsValid);
}
```

- [ ] **Step 3: Add V2 — Route text-only passes (update TC29)**

Update existing TC29 to use `FromLocationName: "Hanoi"` instead of empty string, and verify it still passes. Remove the "empty should fail" assertion.

- [ ] **Step 4: Add V3 — Route missing from AND to fails**

```csharp
[Fact]
public async Task Validate_RouteMissingFromAndTo_ShouldFail()
{
    var cmd = CreateValidCommand(
        activities: [new ActivityDto(
            Routes: [new RouteDto(
                FromLocationId: null,
                ToLocationId: null,
                FromLocationName: null,
                ToLocationName: null,
                TransportationType: "Bus"
            )]
        )]
    );

    var result = await _validator.ValidateAsync(cmd);

    Assert.False(result.IsValid);
    Assert.Contains(result.Errors, e =>
        e.ErrorMessage.Contains("FromLocation"));
    Assert.Contains(result.Errors, e =>
        e.ErrorMessage.Contains("ToLocation"));
}
```

- [ ] **Step 5: Add V4 — Transportation with bilingual passes**

```csharp
[Fact]
public async Task Validate_TransportationWithBilingualTranslations_ShouldPass()
{
    var cmd = CreateValidCommand(
        transportations: [new TransportationDto(
            FromLocationName: "Hanoi",
            ToLocationName: "HCM",
            TransportationType: "Flight",
            Translations: new Dictionary<string, TourTransportationTranslationData>
            {
                ["vi"] = new("Hà Nội", "TP Hồ Chí Minh", "Vietnam Airlines", "Economy", "Direct"),
                ["en"] = new("Hanoi", "Ho Chi Minh City", "Vietnam Airlines", "Economy", "Direct")
            }
        )]
    );

    var result = await _validator.ValidateAsync(cmd);

    Assert.True(result.IsValid);
}
```

- [ ] **Step 6: Add V5 — Transportation with ID reference passes**

```csharp
[Fact]
public async Task Validate_TransportationWithLocationReference_ShouldPass()
{
    var cmd = CreateValidCommand(
        transportations: [new TransportationDto(
            FromLocationId: Guid.NewGuid(),
            ToLocationId: Guid.NewGuid(),
            FromLocationName: null,
            ToLocationName: null,
            TransportationType: "Bus"
        )]
    );

    var result = await _validator.ValidateAsync(cmd);

    Assert.True(result.IsValid);
}
```

- [ ] **Step 7: Add V6 — Transportation numeric validation**

```csharp
[Fact]
public async Task Validate_TransportationNegativePrice_ShouldFail()
{
    var cmd = CreateValidCommand(
        transportations: [new TransportationDto(
            FromLocationName: "Hanoi",
            ToLocationName: "HCM",
            TransportationType: "Flight",
            Price: -10
        )]
    );

    var result = await _validator.ValidateAsync(cmd);

    Assert.False(result.IsValid);
    Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("price"));
}
```

- [ ] **Step 8: Run validator tests**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~CreateTourCommandValidatorTests"`
Expected: All validator tests pass including new ones

### Task 6.2: Service Tests (7 cases)

**Files:**
- Modify: `tests/Domain.Specs/Application/Services/TourServiceTests.cs`

- [ ] **Step 1: Read existing test patterns**

Read the file — focus on existing `CreateTour` tests.

- [ ] **Step 2: Add S1 — Route text-only backward compat**

```csharp
[Fact]
public async Task CreateTour_WithRouteTextOnly_BackwardCompat()
{
    var cmd = CreateValidCommand(
        activities: [new ActivityDto(
            Routes: [new RouteDto(
                FromLocationName: "Hanoi",
                ToLocationName: "Ha Long",
                TransportationType: "Bus"
            )]
        )]
    );

    var result = await _service.Create(cmd, CancellationToken.None);

    Assert.False(result.IsError);
    var tour = _dbContext.Tours
        .Include(t => t.PlanDays).ThenInclude(d => d.Classifications).ThenInclude(c => c.Plans).ThenInclude(p => p.Activities).ThenInclude(a => a.Routes).ThenInclude(r => r.FromLocation)
        .First(t => t.Id == result.Value);
    var route = tour.PlanDays[0].Classifications[0].Plans[0].Activities[0].Routes[0];
    Assert.Equal("Hanoi", route.FromLocation?.LocationName);
    Assert.Equal("Ha Long", route.ToLocation?.LocationName);
}
```

- [ ] **Step 3: Add S2 — Route with location reference FK correct**

```csharp
[Fact]
public async Task CreateTour_WithRouteLocationReference_FKCorrect()
{
    var stepLocationId = Guid.NewGuid();
    var cmd = CreateValidCommand(
        locations: [new LocationDto(LocationName: "Hanoi", LocationType: LocationType.TouristAttraction)],
        activities: [new ActivityDto(
            Routes: [new RouteDto(
                FromLocationName: "Hanoi",
                ToLocationName: "Ha Long",
                TransportationType: "Bus"
            )]
        )]
    );

    var result = await _service.Create(cmd, CancellationToken.None);

    Assert.False(result.IsError);
    var route = GetCreatedRoute(result.Value);
    Assert.Equal("Hanoi", route.FromLocation?.LocationName);
    Assert.Equal("Ha Long", route.ToLocation?.LocationName);
    // Both routes reference the same "Hanoi" entity (dedup by name)
    var allRoutes = GetAllRoutes(result.Value);
    var hanoiLocations = allRoutes.Where(r => r.FromLocation?.LocationName == "Hanoi").ToList();
    Assert.Single(hanoiLocations); // Only 1 entity created for "Hanoi"
}
```

- [ ] **Step 4: Add S3 — Deduplication by name**

```csharp
[Fact]
public async Task CreateTour_RouteLocationDeduplication_ByName()
{
    var cmd = CreateValidCommand(
        locations: [new LocationDto(LocationName: "Hanoi", LocationType: LocationType.TouristAttraction)],
        activities: [new ActivityDto(
            Routes: [
                new RouteDto(FromLocationName: "Hanoi", ToLocationName: "Da Nang", TransportationType: "Bus"),
                new RouteDto(FromLocationName: "Hanoi", ToLocationName: "Hue", TransportationType: "Bus"),
                new RouteDto(FromLocationName: "Da Nang", ToLocationName: "Hanoi", TransportationType: "Bus")
            ]
        )]
    );

    var result = await _service.Create(cmd, CancellationToken.None);

    Assert.False(result.IsError);
    var routeFromHanoi = GetAllRoutes(result.Value).Where(r =>
        r.FromLocation?.LocationName == "Hanoi").ToList();
    Assert.Equal(2, routeFromHanoi.Count);
    Assert.All(routeFromHanoi, r =>
        Assert.Equal(routeFromHanoi[0].FromLocationId, r.FromLocationId));
}
```

- [ ] **Step 5: Add S4 — GetDetail returns correct FK data**

```csharp
[Fact]
public async Task CreateTour_WithLocationReference_GetDetail_ReturnsCorrectData()
{
    var cmd = CreateValidCommand(
        locations: [new LocationDto(LocationName: "Hanoi", LocationType: LocationType.TouristAttraction)],
        activities: [new ActivityDto(
            Routes: [new RouteDto(
                FromLocationName: "Hanoi",
                ToLocationName: "Ha Long",
                TransportationType: "Bus"
            )]
        )]
    );

    var createResult = await _service.Create(cmd, CancellationToken.None);
    var detail = await _tourQuery.GetById(createResult.Value, "en");

    var route = detail.Classifications[0].Plans[0].Activities[0].Routes[0];
    Assert.NotNull(route.FromLocationId);
    Assert.NotNull(route.FromLocation);
    Assert.Equal("Hanoi", route.FromLocation.LocationName);
}
```

- [ ] **Step 6: Add S5 — Invalid location ID throws**

```csharp
[Fact]
public async Task CreateTour_RouteLocationIdNotFound_Throws()
{
    var cmd = CreateValidCommand(
        activities: [new ActivityDto(
            Routes: [new RouteDto(
                FromLocationId: Guid.NewGuid(), // Not in step locations
                ToLocationName: "Ha Long",
                TransportationType: "Bus"
            )]
        )]
    );

    await Assert.ThrowsAsync<ArgumentException>(() =>
        _service.Create(cmd, CancellationToken.None));
}
```

- [ ] **Step 7: Add S6 — Transportation with location FK**

```csharp
[Fact]
public async Task CreateTour_TransportationWithLocationReference_FKCorrect()
{
    var cmd = CreateValidCommand(
        locations: [new LocationDto(LocationName: "Hanoi", LocationType: LocationType.TouristAttraction)],
        transportations: [new TransportationDto(
            FromLocationName: "Hanoi",
            ToLocationName: "HCM",
            TransportationType: "Flight"
        )]
    );

    var result = await _service.Create(cmd, CancellationToken.None);

    Assert.False(result.IsError);
    var resource = _dbContext.TourResources.First(r =>
        r.Type == TourResourceType.Transportation && r.TourId == result.Value);
    Assert.NotNull(resource.FromLocation);
    Assert.Equal("Hanoi", resource.FromLocation?.LocationName);
}
```

- [ ] **Step 8: Run all service tests**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~TourServiceTests"`
Expected: All service tests pass including new ones

---

## Chunk 7: Full Verification

- [ ] **Step 1: Full build**

Run: `dotnet build LocalService.slnx`
Expected: Build succeeds (0 errors)

- [ ] **Step 2: Full test suite**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj`
Expected: All tests pass

- [ ] **Step 3: EstimatedCost tests still pass**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~EstimatedCost"`
Expected: 7 tests pass

- [ ] **Step 4: Format check**

Run: `dotnet format LocalService.slnx --verify-no-changes`
Expected: No formatting issues

---

## Summary

| Chunk | Tasks | Focus |
|-------|-------|-------|
| 1 | 1.1-1.3 | DTO + Entity changes |
| 2 | 2.1-2.4 | EF Config + Migrations |
| 3 | 3.1-3.2 | Validation rules |
| 4 | 4.1-4.3 | Service mapping |
| 5 | 5.1 | Response DTOs |
| 6 | 6.1-6.2 | Tests |
| 7 | 7.1-7.4 | Full verification |
