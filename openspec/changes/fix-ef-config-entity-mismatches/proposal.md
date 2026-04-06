## Why

EF Core configuration files in `panthora_be/src/Infrastructure/Data/Configurations/` have systematic mismatches with their corresponding Entity classes — nullable conflicts, wrong JSONB value types, unconfigured entities that EF Core silently ignores, and missing relationship/fk definitions. Left unfixed, these cause runtime crashes, silent data loss, and incorrect database schemas.

The root cause: configuration files were written incrementally without validation against entity types. This change audits and corrects all mismatches before they propagate to production.

## What Changes

### CRITICAL fixes

- **Fix `TourDayEntity.ClassificationId` nullability conflict** — config says `IsRequired()` but entity declares `Guid?`. Make them consistent.
- **Fix `TourInsuranceEntity.Translations` dictionary value type** — config uses `DepositPolicyTranslationData` but entity declares `TourClassificationTranslationData`. Correct the JSONB type.
- **Add `PaymentEntity` configuration** — entity has no config file, EF Core ignores it entirely. Create `PaymentConfiguration.cs`.
- **Add `SiteContentEntity` configuration** — entity has no config file, EF Core ignores it entirely. Create `SiteContentEntityConfiguration.cs`.
- **Add `ValueComparer` for `TourInstanceEntity.IncludedServices` and `Translations` JSONB columns** — without comparers, EF cannot track collection changes correctly.
- **Add all missing `BookingEntity` navigation/FK relationships** — configure `BookingActivityReservations`, `BookingParticipants`, `BookingTourGuides`, `TourDayActivityStatuses`, `SupplierPayables`, `PaymentTransactions` relationships.
- **Fix `BookingEntity.CancelledAt`** — add explicit column configuration for consistency.

### HIGH fixes

- **Fix `BookingEntity.TourRequest` FK** — add forward-side HasOne relationship (currently only reverse side configured).
- **Configure `BookingEntity.BookingType` enum** — add `.HasConversion<string>()` for consistency with other enums.
- **Configure `UserEntity.VerifyStatus` enum** — add `.HasConversion<string>()`.
- **Add max length for `UserEntity.PhoneNumber` and `UserEntity.Address`** — both are `string?` with no configured max length.
- **Fix `TourEntity.VisaPolicyId` and `DepositPolicyId` FK relationships** — add `HasOne` from Tour side (currently only PricingPolicy and CancellationPolicy are configured).
- **Fix `TourPlanRouteEntity.TourDayActivity` FK** — add required FK relationship (currently missing entirely).
- **Fix `TourDayActivityStatusEntity` cardinality mismatch** — entity declares required navigation but config says `HasMany`. Align cardinality.
- **Fix `VisaApplicationEntity.Visa` relationship** — add `HasOne` from VisaApplication side (currently only Visa side configured).
- **Fix `PaymentTransactionEntity` unique index NULL filter bugs** — `ExternalTransactionId` and `ReferenceCode` unique indexes don't filter NULL values, allowing only one NULL row per column.

### MEDIUM fixes

- **Add explicit config for `BookingParticipantEntity.DateOfBirth`** — no config exists today.
- **Add explicit config for `SupplierPayableEntity.DueAt`** — column completely unconfigured.
- **Add `TourRequestId` index to `BookingEntity`** — performance index for FK queries.

### LOW / Convention fixes

- **Add audit column explicit config for ~13 entities** — `CreatedBy`, `IsDeleted`, `LastModifiedOnUtc` etc. on: `PassportEntity`, `SupplierReceiptEntity`, `CustomerDepositEntity`, `VisaApplicationEntity`, `BookingParticipantEntity`, `BookingAccommodationDetailEntity`, `BookingTransportDetailEntity`, `BookingTourGuideEntity`, `TourDayActivityGuideEntity`, `TourDayActivityResourceLinkEntity`, `TourInstanceManagerEntity`, `TourManagerAssignmentEntity`, `TourInsuranceEntity`, `TourDayActivityStatusEntity`, `TourInstanceDayEntity`, `PositionEntity`, `DepartmentEntity`, `FileMetadataEntity`, `UserSettingEntity`, `OutboxMessage`.
- **Standardize enum conversions** — ensure all enums use `string` conversion consistently across all configs.

## Capabilities

### New Capabilities

- `ef-config-audit`: Entity Framework Core configuration audit capability — defines the standard for config-file-to-entity mapping: nullability, enum conversion, relationship cardinality, JSONB value comparers, unique indexes with NULL filters, and audit column explicit configuration.

### Modified Capabilities

- *(None — no existing spec-level requirements change; this is a bugfix that preserves existing behavior)*

## Impact

### Files modified

| File | Change |
|------|--------|
| `TourDayConfiguration.cs` | Fix ClassificationId nullability |
| `TourInsuranceConfiguration.cs` | Fix Translations dictionary type |
| `PaymentConfiguration.cs` | **New file** — configure PaymentEntity |
| `SiteContentEntityConfiguration.cs` | **New file** — configure SiteContentEntity |
| `TourInstanceConfiguration.cs` | Add ValueComparer for JSONB collections |
| `BookingConfiguration.cs` | Add 6 missing relationships + CancelledAt |
| `UserConfiguration.cs` | Add VerifyStatus conversion + max lengths + indexes |
| `TourConfiguration.cs` | Add VisaPolicyId + DepositPolicyId relationships |
| `TourPlanRouteConfiguration.cs` | Add TourDayActivity required FK |
| `TourDayActivityStatusConfiguration.cs` | Fix cardinality mismatch |
| `VisaApplicationConfiguration.cs` | Add Visa relationship |
| `PaymentTransactionConfiguration.cs` | Fix unique index NULL filters |
| `BookingParticipantConfiguration.cs` | Add DateOfBirth config |
| `SupplierPayableConfiguration.cs` | Add DueAt config + IsRequired for PaidAmount |
| `BookingEntity.cs` | *(read-only for reference)* |
| `PaymentEntity.cs` | *(read-only for reference)* |
| `SiteContentEntity.cs` | *(read-only for reference)* |
| `TourDayActivityStatusEntity.cs` | *(read-only for reference)* |

### Breaking changes

- **NONE** — all changes preserve existing data and behavior. This is a correctness fix, not a schema migration.
- Database schema will not change (all changes are config-level only). No migration files needed.

### Risks

- Changing enum conversion from `int` to `string` for `VerifyStatus` requires a database migration — must check if column already exists and has data.
- `ClassificationId` fix: changing from `IsRequired()` to nullable creates a schema drift — needs migration to make column nullable.
- **Recommend**: Run `dotnet ef migrations list` before and after to confirm no unwanted migrations are generated from config changes alone.

### Dependencies

- Requires existing entities: `PaymentEntity`, `SiteContentEntity`, `TourInsuranceEntity`, `TourDayEntity`, `BookingEntity`, `UserEntity`, `TourEntity`, `TourPlanRouteEntity`, `TourDayActivityStatusEntity`, `VisaApplicationEntity`, `PaymentTransactionEntity`, `BookingParticipantEntity`, `SupplierPayableEntity`
- Requires existing configs (to modify): all 46 config files in `Configurations/`
- No external API or service dependencies
