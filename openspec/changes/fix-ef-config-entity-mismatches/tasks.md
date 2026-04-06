## 0. Pre-flight DB Checks

- [ ] 0a Pre-flight: query DB to check if `payments` table already exists in the database. If yes, verify its schema (columns, types, constraints) matches `PaymentEntity` declaration. If schema conflicts exist, note them before creating config.
- [ ] 0b Pre-flight: query DB to check if `site_contents` table already exists in the database. If yes, verify its schema matches `SiteContentEntity` declaration. If schema conflicts exist, note them before creating config.

## 1. CRITICAL Fixes — Phase 1 (No DB migration risk expected)

- [ ] 1.1 Create `PaymentConfiguration.cs` in `Configurations/` — map all `PaymentEntity` properties (Id, PaidUser FK→User, BookingId FK→Booking nullable, TransactionId nullable, Amount numeric(18,2), Currency maxlen 10, PaymentDescription, TransactionTimestamp, SenderName/AccountNumber, ReceiverName/AccountNumber, BeneficiaryBank, TaxCode, BillingAddress, TaxAmount, TaxRate). Register via `ApplyConfigurationsFromAssembly` (no explicit call needed). **Skip if pre-flight in 0a reveals schema conflict.**
- [ ] 1.2 Create `SiteContentEntityConfiguration.cs` in `Configurations/` — map `SiteContentEntity` properties (Id, PageKey maxlen 100, ContentKey maxlen 100, ContentValue, Language maxlen 10, CreatedOnUtc, LastModifiedOnUtc). Add unique composite index on (PageKey, ContentKey, Language). Register via `ApplyConfigurationsFromAssembly`. **Skip if pre-flight in 0b reveals schema conflict.**
- [ ] 1.3 Create `CollectionJsonbConfigurationExtensions.cs` in `Configurations/` — add a `ConfigureCollectionJsonb()` extension method for `List<string>` properties, following the exact same pattern as `TranslationJsonbConfigurationExtensions.cs` (JsonSerializer with CamelCase, ValueComparer using serialization equality). This keeps the pattern consistent across the codebase.
- [ ] 1.4 Add `ValueComparer` for `IncludedServices` (`List<string>`) in `TourInstanceConfiguration.cs` — replace the bare `.HasColumnType("jsonb")` with `.ConfigureCollectionJsonb()`. This ensures EF correctly tracks changes to the list.
- [ ] 1.5 Fix `TourDayConfiguration.cs` — remove `.IsRequired()` from `ClassificationId` property (entity declares `Guid?`). **Run `dotnet ef migrations list` after this change to verify no migration is generated.** If a migration appears, inspect it carefully before applying — it should only be an alter-column-nullability if the DB column is NOT NULL.
- [ ] 1.6 Add 5 missing relationships to `BookingConfiguration.cs`:
  - `BookingActivityReservations` — `HasMany(b => b.BookingActivityReservations).WithOne(r => r.Booking).HasForeignKey(r => r.BookingId).OnDelete(DeleteBehavior.Cascade)`
  - `BookingParticipants` — `HasMany(b => b.BookingParticipants).WithOne(p => p.Booking).HasForeignKey(p => p.BookingId).OnDelete(DeleteBehavior.Cascade)`
  - `BookingTourGuides` — `HasMany(b => b.BookingTourGuides).WithOne(g => g.Booking).HasForeignKey(g => g.BookingId).OnDelete(DeleteBehavior.Cascade)`
  - `SupplierPayables` — `HasMany(b => b.SupplierPayables).WithOne(p => p.Booking).HasForeignKey(p => p.BookingId).OnDelete(DeleteBehavior.Cascade)`
  - `PaymentTransactions` — `HasMany(b => b.PaymentTransactions).WithOne(t => t.Booking).HasForeignKey(t => t.BookingId).OnDelete(DeleteBehavior.Restrict)`
- [ ] 1.7 Add `TourRequest` forward-side relationship to `BookingConfiguration.cs` — `HasOne(b => b.TourRequest).WithMany(t => t.Bookings).HasForeignKey(b => b.TourRequestId).OnDelete(DeleteBehavior.SetNull)`
- [ ] 1.8 Add explicit `CancelledAt` column configuration in `BookingConfiguration.cs` — nullable DateTimeOffset, no additional config needed (nullable by default)

## 2. HIGH Fixes — Phase 2 (DB migration check recommended)

- [ ] 2.1 Configure `BookingType` enum in `BookingConfiguration.cs` — add `.HasConversion<string>()` for consistency with other BookingEntity enums (PaymentMethod, Status already use string).
- [ ] 2.2 Configure `VerifyStatus` enum in `UserConfiguration.cs` — add `.HasConversion<string>()`. **Before applying**, run `SELECT DISTINCT "VerifyStatus" FROM "Users"` to check for existing int values. If non-zero values exist, a data migration may be needed to convert 0→"Unverified", 1→"Pending", 2→"Verified".
- [ ] 2.3 Add max length for `UserEntity.PhoneNumber` and `UserEntity.Address` in `UserConfiguration.cs` — PhoneNumber maxlen 20, Address maxlen 500. **Note**: These properties are not currently configured — no IsRequired() means nullable by EF convention.
- [ ] 2.4 Add `VisaPolicy` relationship to `TourConfiguration.cs` — `HasOne(t => t.VisaPolicy).WithMany().HasForeignKey(t => t.VisaPolicyId).OnDelete(DeleteBehavior.SetNull)`
- [ ] 2.5 Add `DepositPolicy` relationship to `TourConfiguration.cs` — `HasOne(t => t.DepositPolicy).WithMany().HasForeignKey(t => t.DepositPolicyId).OnDelete(DeleteBehavior.SetNull)`
- [ ] 2.6 Add `TourDayActivity` required FK to `TourPlanRouteConfiguration.cs` — `HasOne(r => r.TourDayActivity).WithMany().HasForeignKey(r => r.TourDayActivityId).IsRequired()`
- [ ] 2.7 Add `VisaApplication.Visa` relationship to `VisaApplicationConfiguration.cs` — `HasOne(v => v.Visa).WithOne(a => a.VisaApplication).HasForeignKey<VisaApplicationEntity>(v => v.VisaId).OnDelete(DeleteBehavior.Cascade)`
- [ ] 2.8 Add `UserSetting` forward-side relationship to `UserConfiguration.cs` — `HasOne(u => u.UserSetting).WithOne(s => s.User).HasForeignKey<UserSettingEntity>(s => s.UserId).OnDelete(DeleteBehavior.Cascade)`
- [ ] 2.9 Fix `PaymentTransactionConfiguration.cs` — add `.HasFilter("\"ExternalTransactionId\" IS NOT NULL")` to unique index on `ExternalTransactionId` (line 28-30)
- [ ] 2.10 Fix `PaymentTransactionConfiguration.cs` — add `.HasFilter("\"ReferenceCode\" IS NOT NULL")` to unique index on `ReferenceCode` (line 76-78)

## 3. MEDIUM Fixes — Phase 3

- [ ] 3.1 Add explicit `DateOfBirth` column configuration to `BookingParticipantConfiguration.cs` — nullable DateTimeOffset, no additional config needed
- [ ] 3.2 Add explicit `DueAt` column configuration to `SupplierPayableConfiguration.cs` — nullable DateTimeOffset, no additional config needed
- [ ] 3.3 Add `PaidAmount` explicit `IsRequired()` in `SupplierPayableConfiguration.cs` — non-nullable decimal, explicit is clearer
- [ ] 3.4 Add `TourRequestId` performance index to `BookingConfiguration.cs` — `builder.HasIndex(b => b.TourRequestId)`

## 4. LOW / Convention Fixes — Phase 4

- [ ] 4.1 Audit column explicit configuration: for configs >50 lines that don't already have explicit audit column config, add `CreatedOnUtc`, `LastModifiedOnUtc`, `CreatedBy` (maxlen 256), `IsDeleted` (default false). **Skip** for minimal configs (<50 lines) to avoid over-engineering. Focus on: `BookingParticipantConfiguration.cs`, `BookingTourGuideConfiguration.cs`, `TourInsuranceConfiguration.cs`.

## 5. Verification

- [ ] 5.1 Run `dotnet build panthora_be/LocalService.slnx` — must pass with zero warnings
- [ ] 5.2 Run `dotnet test panthora_be/tests/Domain.Specs/Domain.Specs.csproj` — all tests must pass
- [ ] 5.3 Run `dotnet ef migrations list` — verify no unexpected migrations are auto-generated from config changes. If migrations appear, inspect each carefully before applying.
- [ ] 5.4 Run `dotnet format panthora_be/LocalService.slnx --verify-no-changes` — no formatting regressions

---

## Review Corrections Applied

This task list has been updated based on the /autoplan review:

- **Tasks 0a, 0b added**: Pre-flight DB checks for PaymentEntity and SiteContentEntity tables
- **Task 1.4 added**: Create `CollectionJsonbConfigurationExtensions.cs` (follows existing `TranslationJsonbConfigurationExtensions.cs` pattern)
- **Task 1.5 removed**: `Translations` on TourInstance/TourInsurance already has ValueComparer via `ConfigureTranslationsJsonb()` — adding inline duplicate would override it
- **Task 2.8 removed**: `TourDayActivityStatusConfiguration.cs` already correctly uses `HasOne` for Booking and TourDay — the audit was incorrect
- **Task 4.1 scoped**: Enum standardization limited to `BookingType` and `VerifyStatus` only (covered by tasks 2.1 and 2.2)
- **Net change**: 25 tasks → 23 tasks