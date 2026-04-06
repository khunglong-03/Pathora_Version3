using System.Text.Json.Serialization;
using Application.Contracts.CancellationPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;
using Application.Common.Constant;
using ErrorOr;
using FluentValidation;

namespace Application.Features.CancellationPolicy.Commands;

public sealed record UpdateCancellationPolicyCommand(
    Guid Id,
    TourScope TourScope,
    List<CancellationPolicyTier> Tiers,
    CancellationPolicyStatus Status = CancellationPolicyStatus.Active,
    [property: JsonPropertyName("translations")]
    Dictionary<string, CancellationPolicyTranslationData>? Translations = null
) : ICommand<ErrorOr<CancellationPolicyResponse>>;

public sealed class UpdateCancellationPolicyCommandValidator : AbstractValidator<UpdateCancellationPolicyCommand>
{
    public UpdateCancellationPolicyCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CancellationPolicyIdRequired);

        RuleFor(x => x.TourScope)
            .IsInEnum().WithMessage(ValidationMessages.CancellationPolicyTourScopeInvalid);

        RuleFor(x => x.Tiers)
            .NotNull().WithMessage(ValidationMessages.CancellationPolicyTiersRequired)
            .NotEmpty().WithMessage(ValidationMessages.CancellationPolicyTiersMinOne);

        RuleForEach(x => x.Tiers).ChildRules(tier =>
        {
            tier.RuleFor(t => t.MinDaysBeforeDeparture)
                .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.CancellationPolicyTierMinDaysNonNegative);
            tier.RuleFor(t => t.MaxDaysBeforeDeparture)
                .GreaterThanOrEqualTo(t => t.MinDaysBeforeDeparture)
                .WithMessage(ValidationMessages.CancellationPolicyTierMaxDaysGreaterThanMinDays);
            tier.RuleFor(t => t.PenaltyPercentage)
                .InclusiveBetween(0, 100).WithMessage(ValidationMessages.CancellationPolicyTierPenaltyPercentageRange);
        });

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage(ValidationMessages.CancellationPolicyStatusInvalid);
    }
}

public sealed class UpdateCancellationPolicyCommandHandler(ICancellationPolicyService service)
    : ICommandHandler<UpdateCancellationPolicyCommand, ErrorOr<CancellationPolicyResponse>>
{
    public async Task<ErrorOr<CancellationPolicyResponse>> Handle(
        UpdateCancellationPolicyCommand request,
        CancellationToken cancellationToken)
    {
        var updateRequest = new UpdateCancellationPolicyRequest(
            request.Id,
            request.TourScope,
            request.Tiers,
            request.Status,
            request.Translations
        );

        return await service.Update(updateRequest);
    }
}
