using Application.Features.TourInstance.Commands;
using Domain.Enums;

namespace Domain.Specs.Application.Validators;

public sealed class CreateTourInstanceCommandValidatorTests
{
    private readonly CreateTourInstanceCommandValidator _validator = new();

    private static CreateTourInstanceCommand CreateValidCommand() => new(
        TourId: Guid.NewGuid(),
        ClassificationId: Guid.NewGuid(),
        Title: "Instance 01",
        InstanceType: TourType.Public,
        StartDate: DateTimeOffset.UtcNow.AddDays(1),
        EndDate: DateTimeOffset.UtcNow.AddDays(3),
        MaxParticipation: 20,
        BasePrice: 1000,
        IncludedServices: ["shuttle"],
        GuideUserIds: []);

    [Fact]
    public void Validate_WithValidPayload_ShouldPass()
    {
        var result = _validator.Validate(CreateValidCommand());
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithDuplicateGuideIds_ShouldPass_BecauseGuideValidationRemovedFromCreate()
    {
        var guideId = Guid.NewGuid();
        var command = CreateValidCommand() with
        {
            GuideUserIds = [guideId, guideId]
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
        Assert.DoesNotContain(result.Errors, e => e.PropertyName.Contains("GuideUserIds"));
    }

    [Fact]
    public void Validate_NoValidatorRulesExist_ForGuideUserIds()
    {
        // Task 6.4: assert validator has no rules for GuideUserIds
        // GuideUserIds is a nullable parameter used only at the service layer for auto-binding
        var guideId = Guid.NewGuid();
        var command = CreateValidCommand() with
        {
            GuideUserIds = [guideId]
        };

        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
        // No rules reference GuideUserIds in the validator
        Assert.DoesNotContain(result.Errors, e => e.PropertyName.Contains("Guide", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Validate_NoValidatorRulesExist_ForManagerUserIds()
    {
        // Task 6.4: assert validator has no rules for ManagerUserIds
        // ManagerUserIds is absent from CreateTourInstanceCommand entirely — binding is server-side
        var command = CreateValidCommand();
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
        Assert.DoesNotContain(result.Errors, e => e.PropertyName.Contains("Manager", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Validate_OptionalFieldsCanBeNull_WithoutTriggeringGuideOrManagerRules()
    {
        // Task 6.4: optional GuideUserIds null/empty should not trigger any validation
        var commandNullGuide = CreateValidCommand() with { GuideUserIds = null };
        var commandEmptyGuide = CreateValidCommand() with { GuideUserIds = [] };

        var resultNull = _validator.Validate(commandNullGuide);
        var resultEmpty = _validator.Validate(commandEmptyGuide);

        Assert.True(resultNull.IsValid);
        Assert.True(resultEmpty.IsValid);
    }
}
