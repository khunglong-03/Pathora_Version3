using Application.Common.Constant;
using Application.Features.TourInstance.Commands;
using Domain.Enums;

namespace Domain.Specs.Application.Validators;

public sealed class UpdateTourInstanceCommandValidatorTests
{
    private readonly UpdateTourInstanceCommandValidator _validator = new();

    private static UpdateTourInstanceCommand CreateValidCommand() => new(
        Id: Guid.NewGuid(),
        Title: "Updated Tour Instance",
        StartDate: DateTimeOffset.UtcNow.AddDays(1),
        EndDate: DateTimeOffset.UtcNow.AddDays(3),
        MaxParticipation: 20,
        BasePrice: 1000);

    [Fact]
    public void Validate_WithValidPayload_ShouldPass()
    {
        var result = _validator.Validate(CreateValidCommand());
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithMissingId_ShouldFail()
    {
        var command = CreateValidCommand() with { Id = Guid.Empty };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Id");
    }

    [Fact]
    public void Validate_WithEmptyTitle_ShouldFail()
    {
        var command = CreateValidCommand() with { Title = "" };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Title");
    }

    [Fact]
    public void Validate_WithEndDateBeforeStartDate_ShouldFail()
    {
        var command = CreateValidCommand() with
        {
            StartDate = DateTimeOffset.UtcNow.AddDays(5),
            EndDate = DateTimeOffset.UtcNow.AddDays(3)
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "EndDate");
    }

    [Fact]
    public void Validate_WithZeroMaxParticipation_ShouldFail()
    {
        var command = CreateValidCommand() with { MaxParticipation = 0 };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "MaxParticipation");
    }

    [Fact]
    public void Validate_WithNegativeBasePrice_ShouldFail()
    {
        var command = CreateValidCommand() with { BasePrice = -100 };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "BasePrice");
    }

    [Fact]
    public void Validate_WithDuplicateGuideIds_ShouldFail()
    {
        var guideId = Guid.NewGuid();
        var command = CreateValidCommand() with { GuideUserIds = [guideId, guideId] };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == ValidationMessages.TourInstanceGuideIdsNotDuplicate);
    }

    [Fact]
    public void Validate_WithDuplicateManagerIds_ShouldFail()
    {
        var managerId = Guid.NewGuid();
        var command = CreateValidCommand() with { ManagerUserIds = [managerId, managerId] };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == ValidationMessages.TourInstanceManagerIdsNotDuplicate);
    }

    [Fact]
    public void Validate_WithSameUserAsGuideAndManager_ShouldFail()
    {
        var userId = Guid.NewGuid();
        var command = CreateValidCommand() with
        {
            GuideUserIds = [userId],
            ManagerUserIds = [userId]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == ValidationMessages.TourInstanceUserCannotBeBothGuideAndManager);
    }

    [Fact]
    public void Validate_UpdateCommandDoesNotHaveRowVersionParameter()
    {
        // Verify UpdateTourInstanceCommand record does NOT have a RowVersion parameter.
        // RowVersion was removed as part of removing xmin concurrency token.
        var commandType = typeof(UpdateTourInstanceCommand);
        var constructors = commandType.GetConstructors();
        Assert.Single(constructors);

        var ctorParams = constructors[0].GetParameters();
        var hasRowVersion = ctorParams.Any(p => p.Name == "RowVersion");
        Assert.False(hasRowVersion);
    }

    [Fact]
    public void Validate_ValidatorDoesNotHaveRowVersionRule()
    {
        // Verify the validator does NOT have a RuleFor(x => x.RowVersion) rule.
        // The RowVersion validation was removed along with xmin concurrency token.
        var command = CreateValidCommand();
        var result = _validator.Validate(command);

        // No RowVersion-related errors should ever appear
        Assert.DoesNotContain(result.Errors, e =>
            e.PropertyName.Contains("RowVersion", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Validate_OptionalFieldsCanBeNull()
    {
        var command = new UpdateTourInstanceCommand(
            Id: Guid.NewGuid(),
            Title: "Optional Fields Test",
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 10,
            BasePrice: 500,
            Location: null,
            ConfirmationDeadline: null,
            IncludedServices: null,
            GuideUserIds: null,
            ManagerUserIds: null,
            Thumbnail: null,
            Images: null);

        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }
}
