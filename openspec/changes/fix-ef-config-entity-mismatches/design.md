## Context

### Current State

EF Core configuration in `panthora_be/src/Infrastructure/Data/Configurations/` contains 46 configuration files mapping to ~52 Entity classes in `panthora_be/src/Domain/Entities/`. A systematic audit revealed multiple categories of mismatches:

1. **Nullable conflicts**: entity property is `Guid?` but config declares `.IsRequired()` (TourDayEntity.ClassificationId)
2. **Wrong JSONB types**: config references `DepositPolicyTranslationData` but entity uses `TourClassificationTranslationData` (TourInsuranceEntity)
3. **Unconfigured entities**: PaymentEntity and SiteContentEntity have zero configuration files → EF Core silently ignores them
4. **Missing relationships**: 6+ navigation properties on BookingEntity have no HasOne/HasMany configuration
5. **Missing ValueComparers**: JSONB collections without comparers cause EF Core change-tracking failures
6. **Unique index NULL bugs**: PostgreSQL unique indexes on nullable columns without `WHERE IS NOT NULL` filter allow only 1 NULL row
7. **Asymmetric relationships**: relationship configured only from one side, creating fragile inferred behavior

### Constraints

- **No schema migration for most changes**: config-only changes should not trigger EF migrations. Only nullable-column changes (ClassificationId) and enum conversion changes (VerifyStatus) may require DB migration.
- **Preserve existing data**: all fixes must be backward-compatible with existing data.
- **No breaking changes**: no API contracts, business logic, or service contracts should change.
- **Read existing patterns**: use the existing well-configured entities (TourEntity, BookingEntity deposits, etc.) as reference implementations.

## Goals / Non-Goals

**Goals:**
- Make all 46+ config files consistent and correct with their entity declarations
- Ensure EF Core correctly tracks, persists, and queries all entities
- Fix PostgreSQL unique index NULL filter bugs that block valid multi-row NULL data
- Establish a **config audit standard** so future config changes are validated against entity types
- Zero runtime crashes, zero silent data loss, zero incorrect schema inference

**Non-Goals:**
- Do NOT refactor entity classes themselves (only config files change)
- Do NOT create database migrations for config-only changes
- Do NOT add new entities or new relationships — only fix existing declared ones
- Do NOT change business logic or service layer behavior

## Decisions

### 1. Fix ClassificationId nullability: nullable wins

**Decision**: Change `TourDayConfiguration.cs` to remove `.IsRequired()` and keep entity as `Guid?`.

**Rationale**: The entity type `Guid?` is the source of truth — it was declared nullable intentionally. The config's `.IsRequired()` is an error. Removing `.IsRequired()` means:
- EF will allow NULL in the column
- No DB migration needed (column is already nullable or has a default)
- Business logic that sets `ClassificationId = null` will work

**Alternative**: Change entity to non-nullable `Guid`. Rejected — entity change is higher risk and might break business code that sets it to null.

**Verification**: After fix, run `dotnet ef migrations list` to confirm no new migration is generated.

### 2. Fix TourInsuranceEntity.Translations: entity type wins

**Decision**: Change `TourInsuranceConfiguration.cs` line 44 to use `TourClassificationTranslationData` instead of `DepositPolicyTranslationData`.

**Rationale**: The entity declares `Dictionary<string, TourClassificationTranslationData>`. This is the runtime truth — EF's JSONB serializer will fail if config says the wrong type. Use the entity type as authoritative.

**Alternative**: Change entity to `DepositPolicyTranslationData`. Rejected — likely entity was correct, config was copy-pasted from another entity.

### 3. Add PaymentEntity and SiteContentEntity configs

**Decision**: Create two new config files following the existing pattern.

**Implementation**:

```
PaymentConfiguration.cs:
- Table name: "payments"
- Columns: Id, PaidUserId (FK→User), BookingId (FK→Booking), Amount (numeric(18,2)), Currency (string), PaymentMethod (enum→string), Status (enum→string), ExternalTransactionId (nullable string, indexed), ReferenceCode (nullable string, unique), PaidAt (DateTimeOffset), CreatedOnUtc
- Relationships: HasOne(PaidUser), HasMany(PaymentTransactions)
- Indexes: PaidUserId, BookingId, Status

SiteContentEntityConfiguration.cs:
- Table name: "site_contents"
- Columns: Id, PageKey (string, required, maxlen 100), ContentKey (string, required, maxlen 100), ContentValue (string, required), Language (string, required, maxlen 10), CreatedOnUtc, LastModifiedOnUtc
- Unique constraint: (PageKey, ContentKey, Language) — prevents duplicate content keys per page per language
```

### 4. Add ValueComparers for JSONB collections

**Decision**: Use EF Core's `ValueComparer<T>` with collection-aware triggers.

**Implementation for TourInstanceConfiguration.cs**:
```csharp
// For List<string> IncludedServices
var stringListComparer = new ValueComparer<List<string>>(
    (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
    c => c.ToList()
);
builder.Property(x => x.IncludedServices)
    .HasColumnType("jsonb")
    .HasConversion(
        v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
        v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
    .Metadata.SetValueComparer(stringListComparer);

// For Dictionary<string, TourInstanceTranslationData>
var dictComparer = new ValueComparer<Dictionary<string, TourInstanceTranslationData>>(
    (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.Key.GetHashCode(), v.Value.GetHashCode())),
    c => new Dictionary<string, TourInstanceTranslationData>(c)
);
builder.Property(x => x.Translations)
    .HasColumnType("jsonb")
    .HasConversion(
        v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
        v => JsonSerializer.Deserialize<Dictionary<string, TourInstanceTranslationData>>(v, (JsonSerializerOptions?)null) ?? new())
    .Metadata.SetValueComparer(dictComparer);
```

### 5. Fix PaymentTransactionEntity unique index NULL bugs

**Decision**: Add `HasFilter("\"ExternalTransactionId\" IS NOT NULL")` and `HasFilter("\"ReferenceCode\" IS NOT NULL")` to both unique indexes.

**Rationale**: PostgreSQL unique constraints treat `NULL` as a distinct value — the standard SQL behavior means multiple rows with `NULL` would violate uniqueness. The fix is to add a partial index/filter that only enforces uniqueness when the column is non-null.

**Implementation**:
```csharp
// Before (broken):
.HasIndex(x => x.ExternalTransactionId).IsUnique()

// After (fixed):
.HasIndex(x => x.ExternalTransactionId)
    .IsUnique()
    .HasFilter("\"ExternalTransactionId\" IS NOT NULL")

// Same for ReferenceCode
.HasIndex(x => x.ReferenceCode)
    .IsUnique()
    .HasFilter("\"ReferenceCode\" IS NOT NULL")
```

### 6. Fix BookingEntity relationships

**Decision**: Add all 6 missing navigation relationships to `BookingConfiguration.cs`.

**Implementation** — each `HasOne` or `HasMany` based on entity cardinality:

```csharp
// BookingActivityReservations (HasMany → BookingActivityReservationEntity)
.HasMany(b => b.BookingActivityReservations)
    .WithOne(r => r.Booking)
    .HasForeignKey(r => r.BookingId)
    .OnDelete(DeleteBehavior.Cascade);

// BookingParticipants
.HasMany(b => b.BookingParticipants)
    .WithOne(p => p.Booking)
    .HasForeignKey(p => p.BookingId)
    .OnDelete(DeleteBehavior.Cascade);

// BookingTourGuides
.HasMany(b => b.BookingTourGuides)
    .WithOne(g => g.Booking)
    .HasForeignKey(g => g.BookingId)
    .OnDelete(DeleteBehavior.Cascade);

// TourDayActivityStatuses (booking can have many statuses per activity)
.HasMany(b => b.TourDayActivityStatuses)
    .WithOne(s => s.Booking)
    .HasForeignKey(s => s.BookingId)
    .OnDelete(DeleteBehavior.Cascade);

// SupplierPayables
.HasMany(b => b.SupplierPayables)
    .WithOne(p => p.Booking)
    .HasForeignKey(p => p.BookingId)
    .OnDelete(DeleteBehavior.Cascade);

// PaymentTransactions
.HasMany(b => b.PaymentTransactions)
    .WithOne(t => t.Payment)
    .HasForeignKey(t => t.PaymentId)
    .OnDelete(DeleteBehavior.Cascade);
```

### 7. Fix TourDayActivityStatusEntity cardinality

**Decision**: Entity declares required navigation (`public virtual BookingEntity Booking { get; set; } = null!;`) but config uses `HasMany`. Align config to entity's required-nav pattern.

**Implementation**: Change from `HasMany(x => x.TourDayActivityStatuses).WithOne(s => s.Booking)` to:
```csharp
.HasOne(s => s.Booking)
    .WithMany(b => b.TourDayActivityStatuses)
    .HasForeignKey(s => s.BookingId)
    .OnDelete(DeleteBehavior.Cascade);
```
Same for TourDay relationship.

### 8. Fix asymmetric relationships

**Decision**: For each asymmetric relationship, add the missing forward-side configuration (not remove existing reverse-side config).

**Changes**:
- `BookingConfiguration.cs`: Add `.HasOne(b => b.TourRequest).WithMany(t => t.Bookings).HasForeignKey(b => b.TourRequestId).OnDelete(DeleteBehavior.SetNull)` — complementing the existing reverse config in TourRequestConfiguration
- `TourConfiguration.cs`: Add `.HasOne(t => t.VisaPolicy).WithMany().HasForeignKey(t => t.VisaPolicyId).OnDelete(DeleteBehavior.SetNull)` and same for DepositPolicy
- `TourPlanRouteConfiguration.cs`: Add `.HasOne(r => r.TourDayActivity).WithMany().HasForeignKey(r => r.TourDayActivityId).IsRequired()`
- `VisaApplicationConfiguration.cs`: Add `.HasOne(v => v.Visa).WithOne(a => a.VisaApplication).HasForeignKey<VisaApplicationEntity>(v => v.VisaId).OnDelete(DeleteBehavior.Cascade)`
- `UserConfiguration.cs`: Add `.HasOne(u => u.UserSetting).WithOne(s => s.User).HasForeignKey<UserSettingEntity>(s => s.UserId).OnDelete(DeleteBehavior.Cascade)`

### 9. Enum conversion standardization

**Decision**: Use `.HasConversion<string>()` for ALL enums throughout the codebase.

**Affected changes**:
- `BookingConfiguration.cs`: Add `HasConversion<string>()` for `BookingType`
- `UserConfiguration.cs`: Add `HasConversion<string>()` for `VerifyStatus`

**Note**: If `VerifyStatus` column already has int data in the database, the migration must handle the conversion. Verify with `SELECT DISTINCT VerifyStatus FROM "Users"` before applying.

### 10. Audit column explicit configuration

**Decision**: For ~13 entities that inherit from `Aggregate<T>` (which provides audit columns), add explicit column configuration to match the base class defaults.

**Pattern** to add to each config:
```csharp
builder.Property(e => e.CreatedOnUtc).HasColumnName("CreatedOnUtc");
builder.Property(e => e.LastModifiedOnUtc).HasColumnName("LastModifiedOnUtc");
builder.Property(e => e.CreatedBy).HasMaxLength(256).HasColumnName("CreatedBy");
builder.Property(e => e.IsDeleted).HasColumnName("IsDeleted").HasDefaultValue(false);
```

But only add if the config is already comprehensive (50+ lines) — for configs that are minimal, skip to avoid over-engineering.

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `ClassificationId` fix triggers unwanted EF migration | Medium | Medium | Verify with `dotnet ef migrations list` before and after. If migration is generated for nullable column, inspect carefully — it should be a no-op if column is already nullable |
| `VerifyStatus` enum conversion (int→string) needs DB migration | Low | High | Check existing data first. If column has non-zero values, add migration to convert values to string representation |
| `PaymentEntity` / `SiteContentEntity` are untracked — adding config might conflict with existing table schema | Medium | High | Verify tables don't already exist with different schema. If they do, compare and merge |
| Adding `ValueComparer` changes how EF tracks changes (more granular) | Low | Low | This is a correctness improvement. Existing data unaffected. |
| Changing relationship cardinalities (HasMany→HasOne) may affect existing queries | Medium | Medium | Verify in Domain.Specs tests that relationship navigation still works. Run full test suite after changes |
| Unique index filter may cause PostgreSQL to use a different query plan | Low | Low | Test queries that filter by `ExternalTransactionId IS NULL` before and after |

## Migration Plan

### Phase 1: CRITICAL fixes (do first, no DB migration risk)

1. Add `PaymentConfiguration.cs` and `SiteContentEntityConfiguration.cs`
2. Fix `TourInsuranceEntity.Translations` type
3. Add ValueComparers to `TourInstanceConfiguration.cs`
4. Add missing BookingEntity relationships
5. Fix `PaymentTransactionEntity` unique index NULL filters

### Phase 2: HIGH fixes (may need DB migration check)

6. Fix `TourDayEntity.ClassificationId` nullability — verify no migration is auto-generated
7. Fix `BookingEntity.TourRequest` FK
8. Add `UserEntity` enum conversion + max lengths
9. Fix `TourEntity` VisaPolicyId/DepositPolicyId relationships
10. Fix `TourPlanRouteEntity` TourDayActivity FK
11. Fix `TourDayActivityStatusEntity` cardinality
12. Fix `VisaApplicationEntity` Visa relationship

### Phase 3: MEDIUM/LOW fixes

13. Add explicit configs for `DateOfBirth`, `DueAt`
14. Add `TourRequestId` index
15. Add audit column configs for comprehensive configs
16. Standardize all enum conversions

### Rollback

Rollback is simple: revert the config file changes. No data migration, no schema change. If a bad config causes runtime issue, `git checkout` the file.

### Verification

After all changes:
1. `dotnet build panthora_be/LocalService.slnx` — must pass
2. `dotnet test panthora_be/tests/Domain.Specs/Domain.Specs.csproj` — must pass
3. `dotnet ef migrations list` — verify no unexpected migrations
4. If migrations appear, inspect each one carefully before applying

## Open Questions

1. **Does PaymentEntity table already exist in the DB?** If yes, what is its current schema? Need to verify against actual DB before creating config, to avoid schema conflict.
2. **Does SiteContentEntity table already exist?** Same question.
3. **What is the current data in `TourDay.ClassificationId` column?** Are there NULL values already in production? If yes, removing `IsRequired()` is safe. If no existing NULLs, the fix is still safe but confirm no business rule expects it to be non-null.
4. **VerifyStatus enum conversion**: Are there existing `VerifyStatus` values stored as int in the `Users` table? If so, a migration converting 0→"Unverified", 1→"Pending", 2→"Verified" is needed.
5. **Should the audit column explicit configuration be applied to all configs or only comprehensive ones?** Decision: only apply to configs that are already >50 lines and don't already have explicit audit column config.