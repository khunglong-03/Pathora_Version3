# Runtime Literal Centralization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove hardcoded runtime validation and business-error literals from `src/Application/**` by centralizing them in existing constants classes without touching `appsettings*` or test fixture literals.

**Architecture:** Reuse the repository's current constants pattern: all FluentValidation text goes through `Application.Common.Constant.ValidationMessages`, and all business error codes/descriptions go through `Application.Common.Constant.ErrorConstants`. Execute in small TDD batches so each validator or service keeps the same behavior while replacing inline literals with centralized constants.

**Tech Stack:** .NET 10, xUnit, FluentValidation, FluentValidation.TestHelper, ErrorOr, GitNexus impact analysis

---

## Chunk 1: Validation message centralization

### Task 1: Extend shared validation constants for public booking and tour validators

**Files:**
- Modify: `src/Application/Common/Constant/ValidationMessages.cs`
- Modify: `src/Application/Features/Public/Commands/CreatePublicBookingCommand.cs`
- Modify: `src/Application/Features/Tour/Commands/CreateTourCommand.cs`
- Modify: `src/Application/Features/Tour/Validators/TourCommandValidators.cs`
- Test: `tests/Domain.Specs/Application/Validators/CreatePublicBookingCommandValidatorTests.cs`
- Test: `tests/Domain.Specs/Application/Validators/CreateTourCommandValidatorTests.cs`

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public void Validate_WhenTourScopeIsInvalid_ShouldUseCentralizedMessage()
{
    var validator = new CreateTourCommandValidator();
    var command = CreateValidCommand() with { TourScope = (TourScope)999 };

    var result = validator.Validate(command);

    Assert.Contains(result.Errors, e => e.ErrorMessage == ValidationMessages.TourScopeInvalid);
}

[Fact]
public void Validate_WhenCustomerPhoneIsInvalid_ShouldUseCentralizedMessage()
{
    var validator = new CreatePublicBookingCommandValidator();
    var command = CreateValidCommand() with { CustomerPhone = "invalid" };

    var result = validator.Validate(command);

    Assert.Contains(result.Errors, e => e.ErrorMessage == ValidationMessages.PublicBookingCustomerPhoneInvalid);
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~CreateTourCommandValidatorTests|FullyQualifiedName~CreatePublicBookingCommandValidatorTests"`
Expected: FAIL because the constants/tests do not yet exist or validators still emit inline literals.

- [ ] **Step 3: Write minimal implementation**

```csharp
public const string TourScopeInvalid = "Tour scope must be a valid value.";
public const string CustomerSegmentInvalid = "Customer segment must be a valid value.";
public const string PublicBookingCustomerPhoneInvalid = "Số điện thoại không hợp lệ.";
```

Then replace inline `WithMessage("...")` calls in the three validator files with the new `ValidationMessages` members.

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~CreateTourCommandValidatorTests|FullyQualifiedName~CreatePublicBookingCommandValidatorTests"`
Expected: PASS.

### Task 2: Centralize remaining validator literals in other Application validators

**Files:**
- Modify: `src/Application/Common/Constant/ValidationMessages.cs`
- Modify: `src/Application/Features/TourRequest/Queries/GetMyTourRequestsQuery.cs`
- Modify: `src/Application/Features/CancellationPolicy/Commands/CreateCancellationPolicyCommand.cs`
- Modify: `src/Application/Features/CancellationPolicy/Commands/UpdateCancellationPolicyCommand.cs`
- Modify: `src/Application/Features/VisaPolicy/Commands/VisaPolicyCommands.cs`
- Test: `tests/Domain.Specs/Application/Validators/*Tests.cs`

- [ ] **Step 1: Write the failing tests**

Add targeted assertions for representative invalid cases in each validator to assert exact messages come from `ValidationMessages`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~CancellationPolicy|FullyQualifiedName~VisaPolicy|FullyQualifiedName~TourRequests"`
Expected: FAIL for new exact-message assertions.

- [ ] **Step 3: Write minimal implementation**

Add only the missing constants to `ValidationMessages` and swap the remaining inline `.WithMessage("...")` calls in the listed files.

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~CancellationPolicy|FullyQualifiedName~VisaPolicy|FullyQualifiedName~TourRequests"`
Expected: PASS.

## Chunk 2: Business error centralization

### Task 3: Extend shared error constants for public booking and identity flows

**Files:**
- Modify: `src/Application/Common/Constant/ErrorConstants.cs`
- Modify: `src/Application/Features/Public/Commands/CreatePublicBookingCommand.cs`
- Modify: `src/Application/Services/IdentityService.cs`
- Test: `tests/Domain.Specs/Application/**/*Tests.cs`

- [ ] **Step 1: Write the failing tests**

Add handler/service tests that assert the returned `Error.Code` and `Error.Description` use centralized constants for:
- unavailable tour instance
- not enough capacity
- invalid password for login/reset flows
- password reset token failures

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~IdentityService|FullyQualifiedName~CreatePublicBooking"`
Expected: FAIL because inline `Error.*("...", "...")` values are still present or the exact constants do not exist.

- [ ] **Step 3: Write minimal implementation**

Create nested groups under `ErrorConstants` for the missing error domains (for example `PasswordReset`, `Register`, `PublicBooking` or `TourInstance` variants) and replace inline `Error.*` literals in the target files.

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~IdentityService|FullyQualifiedName~CreatePublicBooking"`
Expected: PASS.

### Task 4: Centralize remaining service/query error literals

**Files:**
- Modify: `src/Application/Common/Constant/ErrorConstants.cs`
- Modify: `src/Application/Features/BookingManagement/Queries/GetCheckoutPriceQuery.cs`
- Modify: `src/Application/Features/BookingManagement/Queries/GetRecentBookingsQuery.cs`
- Modify: `src/Application/Services/CancellationPolicyService.cs`
- Modify: `src/Application/Services/VisaPolicyService.cs`
- Modify: `src/Application/Services/TaxConfigService.cs`
- Modify: `src/Application/Services/DepositPolicyService.cs`
- Modify: `src/Application/Services/PayOSClient.cs`
- Test: `tests/Domain.Specs/Application/**/*Tests.cs`

- [ ] **Step 1: Write the failing tests**

For each service/query family, add or extend one test that checks exact centralized code/description values for one representative failure path.

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~CancellationPolicy|FullyQualifiedName~VisaPolicy|FullyQualifiedName~TaxConfig|FullyQualifiedName~DepositPolicy|FullyQualifiedName~PayOS|FullyQualifiedName~CheckoutPrice|FullyQualifiedName~RecentBookings"`
Expected: FAIL for the new exact-message assertions.

- [ ] **Step 3: Write minimal implementation**

Add only the missing `ErrorConstants` entries and replace the remaining inline `Error.*` literals in the listed files.

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~CancellationPolicy|FullyQualifiedName~VisaPolicy|FullyQualifiedName~TaxConfig|FullyQualifiedName~DepositPolicy|FullyQualifiedName~PayOS|FullyQualifiedName~CheckoutPrice|FullyQualifiedName~RecentBookings"`
Expected: PASS.

## Chunk 3: Final verification

### Task 5: Verify no disallowed runtime literals remain in Application layer

**Files:**
- Modify: `src/Application/Common/Constant/ValidationMessages.cs`
- Modify: `src/Application/Common/Constant/ErrorConstants.cs`
- Modify: `src/Application/**/*.cs`
- Test: `tests/Domain.Specs/Domain.Specs.csproj`

- [ ] **Step 1: Run literal inventory search**

Run: `rg "WithMessage\(\"|Error\.(Validation|Failure|NotFound|Conflict|Unauthorized|Custom)\(\s*\"" src/Application -g "*.cs"`
Expected: only approved dynamic cases remain.

- [ ] **Step 2: Remove leftover inline literals if any remain**

Replace any remaining runtime hardcoded literals with centralized constants unless they are explicitly dynamic passthrough cases (for example exception-driven transition text that must preserve domain message content).

- [ ] **Step 3: Run targeted and broad verification**

Run: `dotnet test tests/Domain.Specs/Domain.Specs.csproj`
Expected: PASS.

- [ ] **Step 4: Run formatting/build verification**

Run: `dotnet build LocalService.slnx`
Expected: BUILD SUCCEEDED.
