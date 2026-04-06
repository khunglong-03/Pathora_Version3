# CancellationPolicy Tiers Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Redesign CancellationPolicy to use tiered structure — each policy contains `List<CancellationPolicyTier>` with day ranges and penalty percentages.

**Architecture:** Backend-only redesign following Clean Architecture + CQRS. Add `CancellationPolicyTier` value object, replace flat fields with `Tiers` JSONB, update all commands/queries/services, and fix `CalculateRefund` to find matching tier by days before departure.

**Tech Stack:** ASP.NET Core 10, EF Core, MediatR, FluentValidation, PostgreSQL (JSONB)

---

## File Map

```
Domain/
├── Entities/CancellationEntity.cs          # MODIFY: replace flat fields with Tiers
├── ValueObjects/                         # CREATE: CancellationPolicyTier.cs
└── Common/Repositories/ICancellationPolicyRepository.cs  # MODIFY: add FindByTourScope

Application/
├── Contracts/CancellationPolicy/
│   └── Request.cs                       # MODIFY: update records
│   └── Response.cs                      # MODIFY: update records
├── Services/CancellationPolicyService.cs  # MODIFY: update all methods + CalculateRefund
├── Features/CancellationPolicy/
│   ├── Commands/                       # MODIFY: Create, Update, Delete
│   └── Queries/                        # CREATE: GetByScope, CalculateRefund query
└── Common/Constant/ErrorConstants.cs    # MODIFY: add new error codes

Infrastructure/
├── Data/Configurations/
│   └── CancellationEntityConfiguration.cs  # MODIFY: Tiers JSONB, remove old columns
└── Repositories/CancellationRepository.cs  # MODIFY: FindByTourScope

Api/
├── Controllers/CancellationPolicyController.cs  # MODIFY: add new endpoints
└── Endpoint/CancellationPolicyEndpoint.cs     # MODIFY: add new route constants
```

---

## Chunk 1: Domain — CancellationPolicyTier value object

### Task 1: Create CancellationPolicyTier value object

**Files:**
- Create: `src/Domain/ValueObjects/CancellationPolicyTier.cs`
- Reference: `src/Domain/Entities/CancellationEntity.cs` (existing pattern for value objects)

- [ ] **Step 1: Create the file**

```csharp
using System.Text.Json.Serialization;

namespace Domain.ValueObjects;

[JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
public sealed record CancellationPolicyTier(
    int MinDaysBeforeDeparture,
    int MaxDaysBeforeDeparture,
    decimal PenaltyPercentage)
{
    public static CancellationPolicyTier? Create(int min, int max, decimal penalty)
    {
        if (min < 0 || max < min || penalty < 0 || penalty > 100)
            return null;
        return new CancellationPolicyTier(min, max, penalty);
    }
}
```

Note: `CancellationPolicyEntity` currently uses `CancellationEntity.cs` not `CancellationPolicyEntity.cs`. Create the value object in `Domain/ValueObjects/`.

Working from: D:\DoAn\panthora_be

- [ ] **Step 2: Commit**

```bash
cd D:/DoAn/panthora_be
git add src/Domain/ValueObjects/CancellationPolicyTier.cs
git commit -m "feat(domain): add CancellationPolicyTier value object

CancellationPolicyTier with Create factory for invariant enforcement.
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Modify CancellationEntity (rename to CancellationPolicyEntity if needed, update fields)

**Files:**
- Modify: `src/Domain/Entities/CancellationEntity.cs`
- Check: `AppDbContext.cs` for table name registration

First, check if the class file is named `CancellationEntity` but references `CancellationPolicy` elsewhere:
```bash
grep -r "CancellationPolicyEntity\|CancellationPolicy" D:/DoAn/panthora_be/src/Domain/ | grep -v ".cs:.*//\|*.Designer" | head -20
```

Then modify `CancellationEntity.cs`:

**Remove fields:**
- `MinDaysBeforeDeparture` (int)
- `MaxDaysBeforeDeparture` (int)
- `PenaltyPercentage` (decimal)
- `ApplyOn` (string)

**Add fields:**
- `Tiers` (List<CancellationPolicyTier>) — initialize to `[]`

**Update methods:**
- `Create()` — replace flat params with `List<CancellationPolicyTier> tiers`
- `Update()` — replace flat params with `List<CancellationPolicyTier> tiers`
- Update `CalculateRefund(decimal paidAmount)` → remove since this logic moves to service
- Add `FindMatchingTier(int daysBeforeDeparture)` method:
```csharp
public CancellationPolicyTier? FindMatchingTier(int daysBeforeDeparture)
{
    return Tiers
        .OrderByDescending(t => t.MinDaysBeforeDeparture)
        .FirstOrDefault(t => t.MinDaysBeforeDeparture <= daysBeforeDeparture && t.MaxDaysBeforeDeparture >= daysBeforeDeparture);
}
```

- [ ] **Step 1: Modify the entity**

Working from: D:\DoAn\panthora_be

- [ ] **Step 2: Commit**

```bash
git add src/Domain/Entities/CancellationEntity.cs
git commit -m "refactor(domain): replace flat cancellation fields with Tiers list

- Remove: MinDaysBeforeDeparture, MaxDaysBeforeDeparture, PenaltyPercentage, ApplyOn
- Add: Tiers (List<CancellationPolicyTier>) as JSONB
- Add: FindMatchingTier() method
- Update: Create() and Update() factory methods accept tiers list

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 2: Application Contracts — Update Request/Response records

### Task 3: Update CancellationPolicy Contracts

**Files:**
- Modify: `src/Application/Contracts/CancellationPolicy/Request.cs`
- Modify: `src/Application/Contracts/CancellationPolicy/Response.cs`

**Request.cs changes:**

1. `CreateCancellationPolicyRequest` — replace flat fields with `List<CancellationPolicyTier>`:
```csharp
public sealed record CreateCancellationPolicyRequest(
    TourScope TourScope,
    List<CancellationPolicyTier> Tiers,
    Dictionary<string, CancellationPolicyTranslationData>? Translations = null);
```

2. `UpdateCancellationPolicyRequest` — replace flat fields, keep `Id` and `Status`:
```csharp
public sealed record UpdateCancellationPolicyRequest(
    Guid Id,
    TourScope TourScope,
    List<CancellationPolicyTier> Tiers,
    CancellationPolicyStatus? Status = null,
    Dictionary<string, CancellationPolicyTranslationData>? Translations = null);
```

3. `CancellationPolicyResponse` — replace flat fields with tiers + add `Tiers`:
```csharp
public sealed record CancellationPolicyResponse(
    Guid Id,
    string PolicyCode,
    TourScope TourScope,
    string TourScopeName,
    List<CancellationPolicyTier> Tiers,
    CancellationPolicyStatus Status,
    string StatusName,
    Dictionary<string, CancellationPolicyTranslationData> Translations,
    DateTimeOffset CreatedOnUtc,
    DateTimeOffset? LastModifiedOnUtc);
```

4. `CalculateRefundRequest` — update signature:
```csharp
public sealed record CalculateRefundRequest(
    Guid TourId,
    DateTimeOffset CancellationDate,
    decimal DepositAmount);
```

5. `CalculateRefundResponse` — update with new fields:
```csharp
public sealed record CalculateRefundResponse(
    decimal DepositAmount,
    int DaysBeforeDeparture,
    CancellationPolicyTier? MatchingTier,
    string? PolicyCode,
    decimal RefundAmount,
    decimal PenaltyAmount,
    CalculationStatus Status);

public enum CalculationStatus
{
    Calculated,
    NoPolicyAssigned,
    NoTierMatch,
    AfterDeparture
}
```

- [ ] **Step 1: Update Request.cs**

- [ ] **Step 2: Update Response.cs** (may be in a separate file — check `Application/Contracts/CancellationPolicy/`)

- [ ] **Step 3: Commit**

```bash
git add src/Application/Contracts/CancellationPolicy/Request.cs src/Application/Contracts/CancellationPolicy/Response.cs
git commit -m "refactor(contracts): update CancellationPolicy records with Tiers

- Create/Update: replace flat fields with List<CancellationPolicyTier>
- Response: include tiers list, add CalculationStatus enum
- CalculateRefund: new response shape with status tracking

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 3: Application Service — Update CancellationPolicyService

### Task 4: Rewrite CancellationPolicyService

**Files:**
- Modify: `src/Application/Services/CancellationPolicyService.cs`

**Changes:**

1. **Interface** — `Create` and `Update` now accept `List<CancellationPolicyTier>` instead of flat params. `CalculateRefund` uses `CalculateRefundRequest` directly (not the old flat signature).

2. **Create** — validate all tiers before creating entity:
```csharp
public async Task<ErrorOr<CancellationPolicyResponse>> Create(CreateCancellationPolicyRequest request)
{
    // Validate tier count >= 1
    if (request.Tiers.Count == 0)
        return Error.Validation("MIN_TIER_COUNT", "Policy must have at least 1 tier");

    // Validate each tier
    foreach (var tier in request.Tiers)
    {
        if (tier.MinDaysBeforeDeparture < 0)
            return Error.Validation("TIER_MIN_DAYS", "Min days cannot be negative");
        if (tier.MaxDaysBeforeDeparture < tier.MinDaysBeforeDeparture)
            return Error.Validation("TIER_MAX_GE_MIN", "Max days must be >= Min days");
        if (tier.PenaltyPercentage < 0 || tier.PenaltyPercentage > 100)
            return Error.Validation("TIER_PENALTY_RANGE", "Penalty must be 0-100");
    }

    // Validate TIER_COVERS_ALL: last tier MaxDays == int.MaxValue
    var lastTier = request.Tiers[^1];
    if (lastTier.MaxDaysBeforeDeparture != int.MaxValue)
        return Error.Validation("TIER_COVERS_ALL", "Last tier must have MaxDays = int.MaxValue");

    // Validate TIER_NO_OVERLAP
    var sorted = request.Tiers.OrderBy(t => t.MinDaysBeforeDeparture).ToList();
    for (int i = 1; i < sorted.Count; i++)
    {
        if (sorted[i].MinDaysBeforeDeparture < sorted[i-1].MaxDaysBeforeDeparture)
            return Error.Conflict("TIER_NO_OVERLAP", "Tiers have overlapping day ranges");
    }

    var entity = CancellationPolicyEntity.Create(request.TourScope, request.Tiers, "system", request.Translations);
    await _repository.Create(entity);
    await _unitOfWork.SaveChangeAsync();
    return ToResponse(entity);
}
```

3. **Update** — same tier validations, plus update entity with `Tiers` instead of flat fields:
```csharp
entity.Update(request.TourScope, request.Tiers, request.Status ?? entity.Status, "system");
```

4. **CalculateRefund** — implement full algorithm from spec:
```csharp
public async Task<ErrorOr<CalculateRefundResponse>> CalculateRefund(CalculateRefundRequest request)
{
    // Step 1-3: Load tour + cancellation policy
    var tour = await _tourRepository.FindById(request.TourId);
    if (tour == null)
        return Error.NotFound("TOUR_NOT_FOUND", "Tour not found");

    if (tour.CancellationPolicyId == null)
        return Ok(new CalculateRefundResponse(
            request.DepositAmount,
            0, null, null,
            request.DepositAmount,
            0,
            CalculationStatus.NoPolicyAssigned));

    var policy = await _repository.FindById(tour.CancellationPolicyId.Value);
    if (policy == null)
        return Ok(new CalculateRefundResponse(
            request.DepositAmount, 0, null, null, request.DepositAmount, 0, CalculationStatus.NoPolicyAssigned));

    var days = (request.CancellationDate - tour.DepartureDate).Days;

    if (days < 0)
        return Ok(new CalculateRefundResponse(
            request.DepositAmount, days, null, policy.PolicyCode, 0, request.DepositAmount, CalculationStatus.AfterDeparture));

    var tier = policy.FindMatchingTier(days);

    if (tier == null)
        return Ok(new CalculateRefundResponse(
            request.DepositAmount, days, null, policy.PolicyCode, 0, request.DepositAmount, CalculationStatus.NoTierMatch));

    var penaltyAmount = request.DepositAmount * tier.PenaltyPercentage / 100;
    var refundAmount = request.DepositAmount - penaltyAmount;

    return Ok(new CalculateRefundResponse(
        request.DepositAmount, days, tier, policy.PolicyCode, refundAmount, penaltyAmount, CalculationStatus.Calculated));
}
```

**IMPORTANT:** Inject `ITourRepository` into `CancellationPolicyService` to load the tour. If `ITourRepository` doesn't exist, inject `IUnitOfWork` and query `AppDbContext.Tours` directly.

**Dependency:** The service currently does NOT have `ITourRepository`. Use `IUnitOfWork` or directly query `AppDbContext` via `IPanoramaDbContext` if available. Check existing pattern in other services like `BookingService`.

- [ ] **Step 1: Check existing patterns for tour lookup in services**

```bash
grep -r "TourRepository\|ITourRepository\|TourService" D:/DoAn/panthora_be/src/Application/Services/ | head -10
grep -r "IPanoramaDbContext\|AppDbContext" D:/DoAn/panthora_be/src/Application/Services/ | head -5
```

- [ ] **Step 2: Implement the service changes**

- [ ] **Step 3: Run build to check for errors**
```bash
cd D:/DoAn/panthora_be
dotnet build src/Application/Application.csproj 2>&1 | grep -E "(error|Build succeeded"
```

- [ ] **Step 4: Commit**

```bash
git add src/Application/Services/CancellationPolicyService.cs
git commit -m "refactor(service): update CancellationPolicyService with tiers

- Create/Update: validate all tier rules (count, overlap, coverage, range)
- CalculateRefund: full algorithm with CalculationStatus tracking
- Added ITourRepository or UnitOfWork injection for tour lookup

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 4: Repository — Add FindByTourScope + Update FindById

### Task 5: Update CancellationPolicyRepository

**Files:**
- Modify: `src/Domain/Common/Repositories/ICancellationPolicyRepository.cs`
- Modify: `src/Infrastructure/Repositories/CancellationPolicyRepository.cs`

**Interface changes:**

Add new method:
```csharp
Task<IReadOnlyList<CancellationPolicyEntity>> FindByTourScope(TourScope tourScope);
```

**Implementation changes:**

1. `FindByTourScope` — return all non-deleted policies for scope, no status filter:
```csharp
public async Task<IReadOnlyList<CancellationPolicyEntity>> FindByTourScope(TourScope tourScope) =>
    await _context.CancellationPolicies
        .AsNoTracking()
        .Where(p => p.TourScope == tourScope && !p.IsDeleted)
        .OrderBy(p => p.CreatedOnUtc)
        .ToListAsync();
```

2. `FindAll` — keep existing logic but may need to verify it works with JSONB tiers

3. Keep existing `FindByTourScopeAndDays` method — it may be unused now but doesn't hurt to keep

- [ ] **Step 1: Update interface and implementation**

- [ ] **Step 2: Build to verify**

```bash
dotnet build src/Domain/Domain.csproj 2>&1 | grep -E "(error|Build succeeded)"
dotnet build src/Infrastructure/Infrastructure.csproj 2>&1 | grep -E "(error|Build succeeded)"
```

- [ ] **Step 3: Commit**

```bash
git add src/Domain/Common/Repositories/ICancellationPolicyRepository.cs src/Infrastructure/Repositories/CancellationPolicyRepository.cs
git commit -m "feat(repository): add FindByTourScope to CancellationPolicyRepository

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 5: CQRS Commands — Update Create + Update + Delete

### Task 6: Update CancellationPolicy Commands

**Files:**
- Modify: `src/Application/Features/CancellationPolicy/Commands/CreateCancellationPolicyCommand.cs`
- Modify: `src/Application/Features/CancellationPolicy/Commands/UpdateCancellationPolicyCommand.cs`
- Modify: `src/Application/Features/CancellationPolicy/Commands/DeleteCancellationPolicyCommand.cs`

**CreateCancellationPolicyCommand:**
```csharp
public sealed record CreateCancellationPolicyCommand(
    TourScope TourScope,
    List<CancellationPolicyTier> Tiers,
    Dictionary<string, CancellationPolicyTranslationData>? Translations = null) : ICommand<ErrorOr<CancellationPolicyResponse>>;
```

Handler calls service.Create() with tiers.

**UpdateCancellationPolicyCommand:**
```csharp
public sealed record UpdateCancellationPolicyCommand(
    Guid Id,
    TourScope TourScope,
    List<CancellationPolicyTier> Tiers,
    CancellationPolicyStatus? Status = null,
    Dictionary<string, CancellationPolicyTranslationData>? Translations = null) : ICommand<ErrorOr<Success>>;
```

Handler calls service.Update() with tiers.

**DeleteCancellationPolicyCommand:** Keep as-is (no changes needed).

- [ ] **Step 1: Update commands**

- [ ] **Step 2: Verify validators still compile (check FluentValidation files if any)**

```bash
find D:/DoAn/panthora_be/src -name "*CancellationPolicy*Validator*" 2>/dev/null
```

- [ ] **Step 3: Build and commit**

```bash
dotnet build src/Application/Application.csproj 2>&1 | grep -E "(error|Build succeeded"
git add src/Application/Features/CancellationPolicy/Commands/
git commit -m "refactor(commands): update CancellationPolicy commands with tiers list

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 6: CQRS Queries — Add GetByScope + CalculateRefund

### Task 7: Create GetByScopeQuery and CalculateRefundQuery

**Files:**
- Create: `src/Application/Features/CancellationPolicy/Queries/GetCancellationPoliciesByScopeQuery.cs`
- Create: `src/Application/Features/CancellationPolicy/Queries/CalculateRefundQuery.cs`

**GetCancellationPoliciesByScopeQuery.cs:**
```csharp
public sealed record GetCancellationPoliciesByScopeQuery(TourScope TourScope)
    : IQuery<ErrorOr<IReadOnlyList<CancellationPolicyResponse>>>;
```

Handler: `return _service.GetByScope(request.TourScope);`

**CalculateRefundQuery.cs:**
```csharp
public sealed record CalculateRefundQuery(CalculateRefundRequest Request)
    : IQuery<ErrorOr<CalculateRefundResponse>>;
```

Handler: `return _service.CalculateRefund(request.Request);`

**Update CancellationPolicyService interface to add `GetByScope`:**
Add to `ICancellationPolicyService`:
```csharp
Task<ErrorOr<IReadOnlyList<CancellationPolicyResponse>>> GetByScope(TourScope tourScope);
```

- [ ] **Step 1: Add GetByScope to service interface**
- [ ] **Step 2: Create queries**
- [ ] **Step 3: Build and commit**

```bash
git add src/Application/Services/CancellationPolicyService.cs
git add src/Application/Features/CancellationPolicy/Queries/
git commit -m "feat(queries): add GetByScope and CalculateRefund queries

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 7: API Endpoints — Add new routes

### Task 8: Update Controller + Endpoint constants

**Files:**
- Modify: `src/Api\Controllers\CancellationPolicyController.cs`
- Modify: `src/Api\Endpoint\CancellationPolicyEndpoint.cs`
- Check existing controller pattern for route attribute naming

**Endpoint.cs additions:**
```csharp
public const string CalculateRefund = "/calculate-refund";
public const string ByScope = "/scope/{scope}";
```

**Controller additions:**
```csharp
[HttpGet(CancellationPolicyEndpoint.ByScope)]
public async Task<IActionResult> GetByScope([FromRoute] TourScope scope)
    => HandleResult(await Sender.Send(new GetCancellationPoliciesByScopeQuery(scope)));

[HttpPost(CancellationPolicyEndpoint.CalculateRefund)]
public async Task<IActionResult> CalculateRefund([FromBody] CalculateRefundQuery query)
    => HandleResult(await Sender.Send(query.Request));
```

- [ ] **Step 1: Update endpoint constants and controller**

- [ ] **Step 2: Build**

```bash
dotnet build src/Api/Api.csproj 2>&1 | grep -E "(error|Build succeeded)" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/Api/Controllers/CancellationPolicyController.cs src/Api/Endpoint/CancellationPolicyEndpoint.cs
git commit -m "feat(api): add GetByScope and CalculateRefund endpoints

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 8: EF Core Configuration + Data Migration

### Task 9: Update EF Configuration

**Files:**
- Modify: `src/Infrastructure/Data/Configurations/CancellationEntityConfiguration.cs`
- Modify: `src/Infrastructure/Data/AppDbContext.cs` (check if CancellationPolicies DbSet is registered)

**Configuration changes:**

1. Remove old property mappings:
```csharp
// REMOVE these lines:
builder.Property(p => p.MinDaysBeforeDeparture)...
builder.Property(p => p.MaxDaysBeforeDeparture)...
builder.Property(p => p.ApplyOn)...

// REMOVE these indexes:
// index on MinDaysBeforeDeparture, MaxDaysBeforeDeparture, TourScope
```

2. Add Tiers JSONB mapping:
```csharp
builder.Property(p => p.Tiers)
    .HasColumnType("jsonb")
    .HasConversion(
        v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
        v => JsonSerializer.Deserialize<List<CancellationPolicyTier>>(v, (JsonSerializerOptions?)null) ?? new List<CancellationPolicyTier>());
```

3. Add index on TourScope + IsDeleted:
```csharp
builder.HasIndex(p => new { p.TourScope, p.IsDeleted });
```

4. Add index on Status + IsDeleted:
```csharp
builder.HasIndex(p => new { p.Status, p.IsDeleted });
```

- [ ] **Step 1: Update configuration**

- [ ] **Step 2: Check AppDbContext for CancellationPolicies DbSet registration**

```bash
grep -n "CancellationPolicy" D:/DoAn/panthora_be/src/Infrastructure/Data/AppDbContext.cs
```

- [ ] **Step 3: Build to check EF mappings**

```bash
dotnet build src/Infrastructure/Infrastructure.csproj 2>&1 | grep -E "(error|warning.*CancellationPolicy|Build succeeded)" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add src/Infrastructure/Data/Configurations/CancellationEntityConfiguration.cs src/Infrastructure/Data/AppDbContext.cs
git commit -m "refactor(ef): update CancellationPolicy config for Tiers JSONB

- Remove old columns: MinDays, MaxDays, PenaltyPercentage, ApplyOn
- Add Tiers as JSONB column with JSON serializer conversion
- Update indexes

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 9: Error Constants + FluentValidation + Build Check

### Task 10: Update ErrorConstants and Validators

**Files:**
- Check: `src/Application/Common/Constant/ErrorConstants.cs` — add new error codes if needed
- Check: `src/Application/Features/CancellationPolicy/Commands/Validators/` — update validators

```bash
find D:/DoAn/panthora_be/src/Application/Features/CancellationPolicy -name "*.cs" | head -10
```

Update validators to validate `List<CancellationPolicyTier>` instead of flat fields.

### Task 11: Full solution build

- [ ] **Step 1: Build full solution**
```bash
cd D:/DoAn/panthora_be
dotnet build LocalService.slnx 2>&1 | tail -5
```

Expected: `Build succeeded.`

- [ ] **Step 2: Run tests**
```bash
dotnet test LocalService.slnx --filter "FullyQualifiedName~CancellationPolicy" 2>&1 | tail -10
```

- [ ] **Step 3: Commit final fixes**
```bash
git add -A && git commit -m "fix: resolve build errors in CancellationPolicy tiers"
```

---

## Summary

| Chunk | Tasks | Files Changed |
|-------|-------|---------------|
| 1 | 1-2 | CancellationPolicyTier.cs, CancellationEntity.cs |
| 2 | 3 | Request.cs, Response.cs |
| 3 | 4 | CancellationPolicyService.cs |
| 4 | 5 | ICancellationPolicyRepository, CancellationPolicyRepository |
| 5 | 6 | Create/Update/Delete Commands |
| 6 | 7 | GetByScopeQuery, CalculateRefundQuery |
| 7 | 8 | Controller, Endpoint constants |
| 8 | 9 | EF Configuration |
| 9 | 10-11 | ErrorConstants, Validators, full build |
