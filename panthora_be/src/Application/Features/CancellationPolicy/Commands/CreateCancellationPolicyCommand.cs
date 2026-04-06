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

public sealed record CreateCancellationPolicyCommand(
    TourScope TourScope,
    List<CancellationPolicyTier> Tiers,
    [property: JsonPropertyName("translations")]
    Dictionary<string, CancellationPolicyTranslationData>? Translations = null
) : ICommand<ErrorOr<CancellationPolicyResponse>>;

public sealed class CreateCancellationPolicyCommandValidator : AbstractValidator<CreateCancellationPolicyCommand>
{
    public CreateCancellationPolicyCommandValidator()
    {
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
    }
}

public sealed class CreateCancellationPolicyCommandHandler(ICancellationPolicyService service)
    : ICommandHandler<CreateCancellationPolicyCommand, ErrorOr<CancellationPolicyResponse>>
{
    public async Task<ErrorOr<CancellationPolicyResponse>> Handle(
        CreateCancellationPolicyCommand request,
        CancellationToken cancellationToken)
    {
        var createRequest = new CreateCancellationPolicyRequest(
            request.TourScope,
            request.Tiers,
            request.Translations
        );

        return await service.Create(createRequest);
    }
}
