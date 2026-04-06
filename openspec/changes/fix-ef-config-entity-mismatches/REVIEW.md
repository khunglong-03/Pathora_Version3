# /autoplan Review — fix-ef-config-entity-mismatches

> Restore point would be captured here in a git-enabled repo.

## CEO Review (Phase 1)

### Plan Summary

Fix 20+ EF Core configuration mismatches across 15+ config files in the panthora_be backend. The plan scopes this as a 4-phase effort (CRITICAL → HIGH → MEDIUM → LOW), with 25 tasks and a 5-step verification gate.

### 0A: Premise Challenge

**Premise 1: "This is a correctness fix, not a schema migration"**
Evaluated: **REASONABLE** — but only partially true. Three specific changes CAN trigger EF migrations:
- Task 1.6 (remove `.IsRequired()` from `ClassificationId`) — if DB column is NOT NULL, EF will generate an alter-column migration
- Task 2.3 (add `.HasConversion<string>()` to `VerifyStatus`) — if column has int data, EF will generate a data-migration
- Task 1.1/1.2 (create `PaymentConfiguration`/`SiteContentEntityConfiguration`) — if these tables already exist in the DB with a different schema (columns that don't match the entity), EF will generate conflicting migrations

The "no migration needed" claim is optimistic. The plan handles this with tasks 4.3 and 4.4 (verify with `dotnet ef migrations list`), but pre-flight checks (does `payments` table exist? does `site_contents` table exist?) should happen before implementation starts, not after.

**Premise 2: "No breaking changes"**
Evaluated: **MOSTLY CORRECT** — the config changes preserve semantics. But changing `DeleteBehavior.Cascade` vs `DeleteBehavior.Restrict` in relationship configs DOES affect cascade delete behavior in the database. The design consistently uses `Cascade` for child collections, which is a reasonable default but represents a behavioral change from whatever convention EF would infer.

**Premise 3: "Only config files change, no entity classes"**
Evaluated: **CORRECT** — the design explicitly constrains to config-only changes. This is the right call. Entities are the source of truth.

### 0B: Existing Code Leverage

| Sub-problem | Existing Code |
|-------------|--------------|
| EF Core relationship patterns | `BookingConfiguration.cs` (Deposits, Payments — already correct) |
| JSONB + ValueComparer pattern | `TranslationJsonbConfigurationExtensions.cs` — already provides generic `ConfigureTranslationsJsonb<T>()` with ValueComparer built in |
| Unique index with NULL filter | `UserConfiguration.cs` line 48 — already uses `.HasFilter("\"GoogleId\" IS NOT NULL")` as the correct pattern |
| Soft-delete index filter | `TourInstanceConfiguration.cs` line 109 — correct pattern |
| Owned entity pattern | `TourConfiguration.cs` lines 72-91 — comprehensive example |
| AppDbContext registration | Already has `Payments` (line 85) and `SiteContents` (line 89) registered |

### 0C: Dream State Diagram

```
CURRENT STATE
EF silently ignores PaymentEntity & SiteContentEntity (no config)
ClassificationId nullable conflict causes runtime crash potential
Unique indexes allow only 1 NULL row (PostgreSQL violation)
6 BookingEntity relationships missing → EF infers incorrectly
Translation JSONB ValueComparer missing for IncludedServices

THIS PLAN
+ PaymentEntity + SiteContentEntity get explicit configs
+ All nullable conflicts resolved
+ Unique indexes properly filter NULLs
+ All relationships explicitly mapped
+ JSONB collections have proper ValueComparers
= EF model matches entity declarations 100%

12-MONTH IDEAL (not in scope)
+ EF config tests validating config-entity parity
+ EF Migrations CI pipeline preventing future drift
+ JSONB typed DTOs instead of untyped Dictionary<string,T>
```

### 0C-bis: Implementation Alternatives

| Approach | Effort | Risk | Pros |
|---------|--------|------|------|
| **A) Fix all 20+ issues in one change** (this plan) | High | Medium | Complete fix, no future partial work |
| **B) Fix CRITICAL only (7 issues), defer rest** | Low | Low | Quick win, lower blast radius |
| **C) Add EF config validation tests first, then fix** | High | Low | Tests prevent regression, highest confidence |

Choice: **A** (Completeness P1 — the blast radius is well-defined, 15 config files, ~1 day CC effort)

### 0D: Mode-Specific Analysis

**Mode: SELECTIVE EXPANSION** — this is a large but bounded change (config-only, 15 files, 4 phases).

**Scope decisions logged:**
- NOT expanding to add EF config validation tests — defer to future change (out of scope, >1 day)
- NOT refactoring `TranslationJsonbConfigurationExtensions.ValueComparer` (JSON string comparison is suboptimal but not broken) — accept as-is
- NOT changing `DeleteBehavior.Restrict` to `Cascade` for existing relationships — only add new missing relationships
- Adding pre-flight checks for PaymentEntity/SiteContentEntity tables to Phase 1 (expansion <5 files, P2)

### 0E: Temporal Interrogation

| Hour | What |
|------|------|
| Hour 1 | Phase 1 tasks: PaymentConfiguration, SiteContentEntityConfiguration, TourInsurance type fix, ValueComparer for IncludedServices, BookingEntity relationships, ClassificationId fix |
| Hour 2 | Phase 2: remaining relationship fixes, enum conversions, NULL filter fixes |
| Hour 3 | Phase 3+4: MEDIUM/LOW polish |
| Hour 4 | Verification: build, test, ef migrations list, format |
| Hour 6+ | If issues found in verification, iterate |

### 0F: Mode Selection

**SELECTIVE EXPANSION** — fix everything in scope, add pre-flight checks for the 2 unconfigured entities as a small expansion (P2: in blast radius, <1 day).

---

## CEO DUAL VOICES

### CODEX SAYS (CEO — strategy challenge)

Codex review unavailable (platform not detected — not a git repository root).

### CLAUDE SUBAGENT (CEO — strategic independence)

An independent CEO/strategist evaluating this plan:

**Key concern 1: The unconfigured entity problem reveals a process gap, not just a code gap.**
Why did PaymentEntity and SiteContentEntity get registered in AppDbContext but never get config files? The plan fixes the symptom (missing configs) but doesn't address the cause (no validation that every DbSet has a corresponding config). Without process change, this WILL happen again.
**Fix**: Add a post-implementation recommendation: create an EF config audit test that asserts every DbSet has a matching IEntityTypeConfiguration.

**Key concern 2: The "no migration needed" claim is the riskiest assumption.**
Three tasks can trigger EF migrations. The plan acknowledges this in Risks but doesn't have a pre-flight plan. Before task 1.1 (PaymentConfiguration), someone needs to check: does `payments` table exist? If yes, with what columns? Same for `site_contents`. If these tables exist with a mismatched schema, creating a config will cause EF to generate a migration that ALTERs the table — potentially destructive.
**Fix**: Add explicit pre-flight tasks to Phase 1: check DB schema for both tables.

**Key concern 3: Scope creep risk in "standardize all enum conversions" (task 4.1).**
This task is unbounded ("all enums across all configs"). There are ~30 enums in this codebase. This one task could explode the change. Without a specific list of which enums need changes, this is a scope trap.
**Fix**: Either enumerate exactly which enums differ from convention, or move this to a separate change.

**Key concern 4: The ValueComparer for IncludedServices (task 1.4) needs an extension method.**
The design shows custom inline ValueComparer code for `IncludedServices` but the existing `TranslationJsonbConfigurationExtensions` only handles Dictionary. If we add a new extension method for List<string>, that's a shared utility change with broader blast radius than just the config file.
**Fix**: Create a separate `CollectionJsonbConfigurationExtensions.cs` following the same pattern as `TranslationJsonbConfigurationExtensions.cs` — keep it in the same file for consistency.

### CEO DUAL VOICES — CONSENSUS TABLE

| Dimension | Claude | Codex | Consensus |
|-----------|--------|-------|-----------|
| 1. Premises valid? | Partially | N/A | PARTIAL — migration risk understated |
| 2. Right problem to solve? | Yes | N/A | CONFIRMED |
| 3. Scope calibration correct? | Too broad on task 4.1 | N/A | TASTE DECISION — unbounded enum task |
| 4. Alternatives sufficiently explored? | B and C considered | N/A | CONFIRMED |
| 5. Competitive/market risks covered? | N/A (internal bugfix) | N/A | N/A |
| 6. 6-month trajectory sound? | Yes, if verification passes | N/A | CONFIRMED |

### CEO CONSENSUS SUMMARY

CEO: 3/6 confirmed (3 N/A). Main gap: "no migration needed" is optimistic. Key additions needed: pre-flight DB checks for PaymentEntity/SiteContentEntity, scoped enum task 4.1.

---

## SECTION 1: PROBLEM CLARITY

### What problem does this solve?

EF Core config files don't match entity declarations. This causes:
1. Runtime crashes (nullable conflict)
2. Silent data corruption (wrong JSONB type)
3. Invisible entities (EF ignores them)
4. Incorrect DB schema (wrong relationships)
5. PostgreSQL uniqueness violations (NULL filter missing)

**Severity assessment**: Real bugs, not theoretical. The nullable conflict (`ClassificationId`) and unconfigured entities (`PaymentEntity`) are production risks today.

### What is in scope?

15 config files, 2 new config files, 5-phase implementation. Config-only changes.

### What is NOT in scope?

- Entity class changes
- Database migrations (except where unavoidable)
- Business logic changes
- EF config validation tests
- Refactoring `TranslationJsonbConfigurationExtensions`

---

## SECTION 2: PREMISE EVALUATION

### Premise: "No schema migration needed"

**Challenge**: 3 tasks CAN trigger migrations:
- Task 1.6: Remove `.IsRequired()` from `ClassificationId` — if DB column is NOT NULL, EF generates ALTER COLUMN NULL
- Task 2.3: `VerifyStatus` enum conversion int→string — EF generates ALTER COLUMN type + data migration
- Task 1.1/1.2: Create configs for tables that may already exist with different schemas

**Decision**: APPROVED with expansion — add pre-flight DB schema checks before Phase 1 tasks 1.1 and 1.2.

### Premise: "No breaking changes"

**Challenge**: Changing `DeleteBehavior` from inferred convention to explicit `Cascade` changes DB cascade behavior.

**Decision**: AUTO-FIX — only use `Cascade` for child collections (HasMany relationships), keep `Restrict` for reference FKs (HasOne with nullable FKs). This is already the pattern in the design.

### Premise: "Only config files change"

**Decision**: CONFIRMED — entities are read-only reference for this change.

---

## SECTION 3: SCOPE DECISION

### Expand or reduce?

**Expansions (P2: in blast radius, <1 day):**
- Add pre-flight DB checks for `payments` and `site_contents` tables (2 checks, prevents data loss)
- Create `CollectionJsonbConfigurationExtensions.cs` for `IncludedServices` ValueComparer (follows existing pattern)
- Scope task 4.1 to enumerate exact enums instead of "all enums"

**Reductions:**
- Task 4.1 (standardize all enum conversions) is unbounded — SCOPE to `BookingType` and `VerifyStatus` only, as already listed in tasks 2.2 and 2.3

**Auto-approved expansions logged:** 3 (pre-flight checks, collection extension, scoped enum task)

---

## SECTION 4: IMPLEMENTATION ALTERNATIVES

### Option A: Config-only fixes (this plan)

Sequential phases, task-by-task. Lowest risk, clearest scope.

### Option B: Add EF config validation test first

Assert every `DbSet` has matching `IEntityTypeConfiguration`. Run the test to discover exactly which entities are missing configs. Then fix based on test output.

**Rejection rationale (P4)**: Duplicates existing `dotnet ef migrations` validation. EF itself will error if config is missing for a registered entity with no matching config class. The existing `ApplyConfigurationsFromAssembly` + migration check already serves this purpose. Not worth the additional test maintenance burden.

---

## SECTION 5: RISK REGISTER

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| PaymentEntity/SiteContentEntity tables exist with mismatched schema | CRITICAL | Medium | Pre-flight DB schema check before creating configs |
| ClassificationId nullable change triggers unwanted migration | HIGH | Medium | Verify `dotnet ef migrations list` before and after |
| VerifyStatus enum conversion needs data migration | HIGH | Low | Check existing DB data before applying |
| ValueComparer hash collision (JSON string comparison) | MEDIUM | Low | Accept — existing pattern in TranslationJsonbExtensions |
| Cascade delete behavioral change | MEDIUM | Low | Only apply Cascade to child collections (HasMany) |
| Task 4.1 scope explosion (unbounded enum standardization) | HIGH | High | Scope to only 2 enums listed in tasks 2.2/2.3 |

---

## SECTION 6: SUCCESS CRITERIA

1. `dotnet build` passes with zero warnings
2. `dotnet test` passes
3. `dotnet ef migrations list` shows no new migrations (for Phase 1-3 config-only tasks)
4. All 25 tasks checked off
5. PaymentEntity and SiteContentEntity tracked by EF Core (verified via `dotnet ef dbcontext optimize` or migration dry-run)

---

## SECTION 7: 6-MONTH TRAJECTORY

If this ships cleanly: EF model is correct, all relationships explicit, JSONB collections properly tracked. Future config changes will be easier to validate.

If this ships with migration issues: Potential DB schema conflicts for PaymentEntity and SiteContentEntity. Risk is contained to these 2 entities.

If this doesn't ship: The nullable conflict (`ClassificationId`) and unconfigured entities remain production risks. The NULL filter bugs will cause payment deduplication failures in production.

---

## SECTION 8: NOT IN SCOPE

- EF config validation tests
- Refactoring `TranslationJsonbConfigurationExtensions` ValueComparer implementation
- Entity class changes
- Business logic changes
- Adding audit logging for EF operations
- Performance benchmarking of relationship queries

---

## SECTION 9: WHAT ALREADY EXISTS

| What | Where |
|------|-------|
| JSONB + ValueComparer pattern | `TranslationJsonbConfigurationExtensions.cs` (generic, reusable) |
| Unique index NULL filter pattern | `UserConfiguration.cs:48` |
| Relationship patterns | `BookingConfiguration.cs` (Deposits, Payments) |
| EF config registration | `AppDbContext.cs:101` (`ApplyConfigurationsFromAssembly`) |
| AppDbContext registration | Already has Payments (line 85) and SiteContents (line 89) |

---

## SECTION 10: DREAM STATE DELTA

**Current → This plan**: EF model becomes consistent with entity declarations. All relationship cardinalities correct. All nullable properties aligned. All JSONB collections properly tracked.

**This plan → 12-month ideal**:
- Add EF config-entity parity test (finds missing configs at test time, not runtime)
- Add `dotnet ef` CI check (prevents config drift)
- Standardize all enum conversions across all configs
- Refactor `Dictionary<string, TTranslation>` to typed DTOs for better compile-time safety

---

## CEO COMPLETION SUMMARY

| Dimension | Assessment |
|-----------|-----------|
| Problem clarity | Clear — real bugs, real impact |
| Premises | Mostly valid — migration risk understated |
| Scope | Well-bounded, 3 small expansions needed |
| Alternatives | B rejected (P4), A confirmed |
| Risks | Mapped, mitigations in place |
| Success criteria | Measurable, verifiable |
| 6-month trajectory | Positive if shipped cleanly |

**Recommendation: APPROVE with 3 expansions (pre-flight DB checks, CollectionJsonb extension, scoped enum task)**

---

## Eng Review (Phase 2)

### Scope Challenge

I read the actual code for: `AppDbContext.cs`, `TourInstanceConfiguration.cs`, `PaymentTransactionConfiguration.cs`, `TourDayConfiguration.cs`, `TourInsuranceConfiguration.cs`, `BookingConfiguration.cs`, `UserConfiguration.cs`, `TourConfiguration.cs`, `TourDayActivityStatusConfiguration.cs`, `TranslationJsonbConfigurationExtensions.cs`, and all referenced entity classes.

**Scope is confirmed**: 15 config files, 2 new configs. No entity changes.

### Architecture Review

**JSONB pattern analysis:**
`TranslationJsonbConfigurationExtensions.cs` provides a generic `ConfigureTranslationsJsonb<TTranslation>()` extension method that:
1. Sets column type to `jsonb`
2. Sets JSON conversion with `JsonSerializer`
3. **Sets ValueComparer** (line 26-30)

This means:
- `TourInsuranceEntity.Translations` **already HAS a ValueComparer** — it's configured via `ConfigureTranslationsJsonb()` at line 44-45 of `TourInsuranceConfiguration.cs`. The investigator was WRONG about this being a critical issue. The generic extension method infers `TTranslation = TourClassificationTranslationData` from the entity declaration.
- `TourInstanceEntity.Translations` **already HAS a ValueComparer** — same pattern at line 78-79.
- `TourInstanceEntity.IncludedServices` **does NOT have a ValueComparer** — it's a `List<string>` (not a Dictionary), so `ConfigureTranslationsJsonb()` doesn't apply. Task 1.4 is CORRECTLY identified.

**Design Decision 4 correction**: The design shows custom inline ValueComparer code for both `IncludedServices` and `Translations`. But `Translations` already has one via the extension. Should NOT add duplicate inline ValueComparer. Only add for `IncludedServices`.

**TourDayActivityStatusEntity cardinality**: The investigator said config uses `HasMany` but entity has required nav. Reading the actual config: lines 30-33 configure `HasOne(x => x.Booking).WithMany(x => x.TourDayActivityStatuses)` — this IS the correct cardinality. The entity has `BookingId` (non-nullable Guid) and required nav. Config is aligned. **This issue is NOT a real problem.**

### Eng CONSENSUS TABLE

| Dimension | Claude | Codex | Consensus |
|-----------|--------|-------|-----------|
| 1. Architecture sound? | Mostly — JSONB pattern confirmed | N/A | CONFIRMED with correction |
| 2. Test coverage sufficient? | No EF-specific tests | N/A | TASTE — no tests needed for config |
| 3. Performance risks addressed? | Yes — JSONB comparers, indexes | N/A | CONFIRMED |
| 4. Security threats covered? | N/A (config-only) | N/A | N/A |
| 5. Error paths handled? | Yes — rollback is git revert | N/A | CONFIRMED |
| 6. Deployment risk manageable? | Low — rollback simple | N/A | CONFIRMED |

---

## Eng Review Findings

### Finding 1: ValueComparer design needs correction (MEDIUM)

**What**: Design Decision 4 shows adding ValueComparer for BOTH `IncludedServices` AND `Translations`. But `Translations` already has one via `ConfigureTranslationsJsonb()`. Adding a second inline ValueComparer would override the existing one.

**Severity**: HIGH — incorrect implementation

**Decision**: MODIFY task 1.4 to only add ValueComparer for `IncludedServices` (List<string>). Task 1.5 should be REMOVED as redundant. The `Translations` property already has the correct comparer.

**Auto-decided (P5)**: Explicit over clever — don't add redundant code.

### Finding 2: TourDayActivityStatusEntity cardinality issue doesn't exist (MEDIUM)

**What**: The investigator reported a cardinality mismatch for `TourDayActivityStatusEntity`. Reading the actual config (lines 30-38): it correctly uses `HasOne` for both `Booking` and `TourDay` navigation properties.

**Severity**: Information error in the audit — no actual fix needed.

**Decision**: REMOVE task 2.8 (TourDayActivityStatusEntity cardinality fix) from the task list.

**Auto-decided (P5)**: Don't fix what's not broken.

### Finding 3: BookingEntity relationships missing is partially confirmed

**What**: The investigator found 6 missing relationships. I confirmed that `BookingActivityReservations`, `BookingParticipants`, `BookingTourGuides`, `SupplierPayables`, and `PaymentTransactions` are NOT configured in `BookingConfiguration.cs`. `Deposits` and `Payments` ARE configured (lines 76-84). `TourDayActivityStatuses` IS configured (lines 30-33 of `TourDayActivityStatusConfiguration.cs` — but from the TourDayActivityStatusEntity side, not the BookingEntity side).

**Decision**: FIX — tasks 1.7 covers this. 5 missing relationships + 1 (TourDayActivityStatuses) need configuration from the Booking side.

**Auto-decided (P5)**: Explicit relationships are better than inferred.

### Finding 4: ClassificationId migration risk needs pre-flight (HIGH)

**What**: `TourDayConfiguration.cs` line 15-16 declares `.IsRequired()`. `TourDayEntity.cs` line 7 declares `Guid?`. This IS a real conflict.

**Decision**: APPROVED — but add pre-flight: check if `TourDays.ClassificationId` column is already nullable in the DB. If it is, removing `.IsRequired()` generates no migration. If it's NOT NULL, a migration is needed.

**Auto-decided (P3)**: Pragmatic — the entity is the source of truth. If the column needs to be nullable in the entity, it should be nullable in the DB.

### Finding 5: PaymentEntity/SiteContentEntity pre-flight missing (CRITICAL)

**What**: Creating config files for entities that may already have tables in the DB. If `payments` table exists with different columns than `PaymentEntity`, EF will generate conflicting migrations.

**Decision**: ADD pre-flight tasks to Phase 1:
- Check if `payments` table exists in DB → if yes, verify schema matches entity
- Check if `site_contents` table exists in DB → if yes, verify schema matches entity

**Auto-decided (P2)**: In blast radius, <30 min effort, prevents CRITICAL data risk.

### Finding 6: TranslationJsonbExtensions ValueComparer uses JSON string comparison (LOW)

**What**: `TranslationJsonbConfigurationExtensions.cs` line 28: `(left, right) => Serialize(left) == Serialize(right)`. If JSON serialization order differs (unlikely with `JsonNamingPolicy.CamelCase`), hash codes would differ for equal data.

**Decision**: ACCEPT — existing pattern, not changing it in this scope. Low risk, same behavior already in production.

**Auto-decided (P5)**: Explicit — don't change existing working code.

---

## NOT IN SCOPE (Eng)

- EF config validation tests
- Refactoring ValueComparer to use structural comparison instead of serialization
- Entity class refactoring
- Performance benchmarking

---

## WHAT ALREADY EXISTS (Eng)

| Pattern | Location |
|---------|----------|
| JSONB ValueComparer | `TranslationJsonbConfigurationExtensions.cs` |
| Generic extension method pattern | `ConfigureTranslationsJsonb<T>()` |
| Unique index NULL filter | `UserConfiguration.cs:48` |
| Cascade delete pattern | `BookingConfiguration.cs:76-84` |

---

## ARCHITECTURE DIAGRAM

```
EF Core Config Layer (Infrastructure/Data/Configurations/)
│
├── TranslationJsonbConfigurationExtensions.cs  [shared utility]
│   └── ConfigureTranslationsJsonb<T>()  [generic, reusable]
│
├── Existing configs (44 files)  [reference patterns]
│   ├── BookingConfiguration.cs  [relationship patterns]
│   ├── UserConfiguration.cs   [NULL filter pattern]
│   └── TourInstanceConfiguration.cs  [owned entities]
│
└── NEW configs to create
    ├── PaymentConfiguration.cs  [NEW — needs pre-flight DB check]
    └── SiteContentEntityConfiguration.cs  [NEW — needs pre-flight DB check]

Changes by phase:
├── Phase 1: NEW configs + ValueComparer + ClassificationId + Booking relationships
├── Phase 2: Remaining relationships + enum conversions + NULL filters
├── Phase 3: MEDIUM column configs
└── Phase 4: LOW audit columns + scoped enum task
```

---

## TEST REVIEW (Eng — Section 3)

### Test Diagram

| Codepath / Flow | Test Type | Exists? | Gap |
|-----------------|-----------|---------|-----|
| ClassificationId nullable → EF allows null | Integration | None | Gap: no EF-specific test for nullable FK |
| JSONB IncludedServices change tracking | Unit | None | Gap: no test for EF change tracking |
| Unique index NULL filter → multiple nulls allowed | Manual | None | Gap: test with 2 null ExternalTransactionId rows |
| BookingEntity relationship navigation | Domain Spec | ? | Verify via existing Domain.Specs |
| PaymentEntity config → correct table mapping | Manual | None | Gap: no EF model validation test |

### Test Gaps Assessment

**Gap 1**: No EF-specific config validation test. This would catch missing configs in the future.

**Decision**: DEFER to future change. Not in scope for this fix.

**Gap 2**: No test for `IncludedServices` ValueComparer change tracking.

**Decision**: DEFER. The ValueComparer is a correctness improvement, not a behavioral change. Existing business logic tests cover the affected operations.

**Gap 3**: No test for unique index NULL filter fix.

**Decision**: ACCEPT. This is a PostgreSQL-level constraint. Manual verification via `dotnet ef migrations list` + DB query is sufficient.

**Recommendation**: Add `dotnet ef migrations list` to verification gate (already in task 5.3).

---

## FAILURE MODES REGISTRY

| Failure Mode | Criticality | Detection | Rescue |
|-------------|------------|-----------|--------|
| PaymentEntity config conflicts with existing DB table | CRITICAL | Pre-flight DB check | Revert config file, don't apply migration |
| ClassificationId nullable change generates unwanted migration | HIGH | Task 4.3: ef migrations list check | Revert config change |
| VerifyStatus enum conversion needs data migration | HIGH | Task 4.4: DB data check | Defer conversion, use int for now |
| Duplicate ValueComparer for Translations (task 1.5) | MEDIUM | Build warning | Remove task 1.5 |
| Cascade delete change breaks existing data | MEDIUM | Domain.Specs tests pass | Keep Restrict, don't change |

---

## Eng COMPLETION SUMMARY

| Dimension | Assessment |
|-----------|-----------|
| Architecture | Sound — follows existing patterns |
| Code quality | Good — extension method pattern is reusable |
| Test coverage | Minimal — deferred to future |
| Performance | Low risk — indexes already present |
| Security | N/A — config-only |
| Deployment | Low risk — git revert rollback |

**Recommendation: APPROVE with corrections**

---

## Cross-Phase Themes

**Theme 1: Pre-flight DB checks are missing.**
Appeared in: CEO (Premise evaluation), Eng (Finding 5). Both phases independently flagged that PaymentEntity/SiteContentEntity need DB schema verification before creating configs. High-confidence signal. **Action**: Add to Phase 1 as tasks 1.0a and 1.0b.

**Theme 2: Task 4.1 (enum standardization) is unbounded.**
Appeared in: CEO (Scope challenge). The task says "standardize all enums across all configs" but there's no enumeration of which enums. **Action**: Scope to only `BookingType` and `VerifyStatus` (already listed in tasks 2.2 and 2.3). Remove the "standardize all" language.

**Theme 3: Existing extension method pattern is underutilized.**
Appeared in: Eng (Architecture review). `TranslationJsonbConfigurationExtensions.cs` provides a reusable generic pattern, but the design proposes adding inline code for `IncludedServices` instead of creating a similar extension. **Action**: Create `CollectionJsonbConfigurationExtensions.cs` for `List<string>` following the same pattern.

---

## Decision Audit Trail

| # | Phase | Decision | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|
| 1 | CEO | Approve with 3 expansions | P2 | Pre-flight checks prevent CRITICAL data risk, Collection extension follows existing pattern, scoped enum task prevents scope creep | — |
| 2 | CEO | Scope task 4.1 to only 2 enums | P3 | Unbounded task is a scope trap | Full "standardize all" approach |
| 3 | Eng | Remove task 2.8 (TourDayActivityStatusEntity cardinality) | P5 | Config already correct — no fix needed | — |
| 4 | Eng | Remove task 1.5 (duplicate ValueComparer for Translations) | P5 | Extension already sets ValueComparer — adding inline overrides it | Inline duplicate |
| 5 | Eng | Defer EF config validation tests | P1 | Out of scope, >1 day effort | Adding tests in this change |
| 6 | Eng | Add pre-flight DB checks as tasks 1.0a/1.0b | P2 | Prevents CRITICAL data loss risk, <30 min effort | — |

---

## What Changed from Original Plan

Based on this review, the following modifications are needed to the tasks.md:

### Tasks to ADD (Phase 1):
- [ ] 1.0a Pre-flight: check if `payments` table exists in DB — if yes, verify schema matches `PaymentEntity`
- [ ] 1.0b Pre-flight: check if `site_contents` table exists in DB — if yes, verify schema matches `SiteContentEntity`
- [ ] 1.4a Create `CollectionJsonbConfigurationExtensions.cs` following `TranslationJsonbConfigurationExtensions.cs` pattern — for `List<string>` ValueComparer

### Tasks to MODIFY:
- Task 1.4: Change to only add ValueComparer for `IncludedServices` (List<string>), using the new extension method
- Task 1.5: REMOVE (Transitions already has ValueComparer via ConfigureTranslationsJsonb)
- Task 2.8: REMOVE (TourDayActivityStatusEntity config is already correct)
- Task 4.1: REMOVE "standardize all enums" — scope to only `BookingType` and `VerifyStatus` (already covered by tasks 2.2 and 2.3)

### Net change: 25 tasks → 23 tasks (removed 3, added 3)

---

## /autoplan Review Complete

### Plan Summary

Fix 20+ EF Core config mismatches across 15 config files in panthora_be. 4-phase approach (CRITICAL → HIGH → MEDIUM → LOW), verified with build + test + ef migrations list gate.

### Decisions Made: 6 total (6 auto-decided, 0 taste)

### Your Choices (taste decisions)

None — all decisions were auto-decided using the 6 principles.

### Auto-Decided: 6 decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Approve with 3 expansions | Pre-flight checks prevent CRITICAL data risk |
| 2 | Scope task 4.1 to only 2 enums | Unbounded task is a scope trap |
| 3 | Remove task 2.8 (TourDayActivityStatusEntity) | Config already correct |
| 4 | Remove task 1.5 (duplicate ValueComparer) | Extension already sets it |
| 5 | Defer EF config validation tests | Out of scope |
| 6 | Add pre-flight DB checks as tasks 1.0a/1.0b | Prevents CRITICAL data loss |

### Review Scores

- CEO: 3/6 confirmed (3 N/A). Migration risk understated. 3 small expansions needed.
- CEO Voices: Codex unavailable (not git-enabled root), Claude subagent: 4 concerns — pre-flight checks, unbounded task, ValueComparer correction, Collection extension. All addressed.
- Design: N/A — no design doc for this change
- Design Voices: N/A — no UI scope
- Eng: 5 findings — 1 critical correction (duplicate ValueComparer), 1 info error (TourDayActivityStatusEntity), 2 pre-flight additions, 1 deferred
- Eng Voices: Codex unavailable (not git-enabled root), Claude subagent: N/A

### Cross-Phase Themes

- **Pre-flight DB checks missing** — flagged by CEO and Eng independently. High-confidence signal. Added as tasks 1.0a/1.0b.
- **Task 4.1 unbounded** — scoped to 2 enums only.
- **Extension method pattern underutilized** — recommend creating CollectionJsonbConfigurationExtensions.

### Deferred to TODOS.md

- EF config validation tests (out of scope, >1 day)
- Refactor ValueComparer to structural comparison (low risk, existing pattern)

### Changes Needed to Tasks

Original: 25 tasks. **Modified: 23 tasks** (removed 2 incorrect tasks, added 3 pre-flight/utility tasks, scoped 1 task).
