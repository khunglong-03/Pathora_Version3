using Application.Common.Constant;
using Application.Contracts.PricingPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts;
using Domain.Entities.Translations;
using Domain.ValueObjects;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.PricingPolicy.Commands;

public sealed record UpdatePricingPolicyCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("tourType")] Domain.Enums.TourType TourType,
    [property: JsonPropertyName("tiers")] List<Domain.ValueObjects.PricingPolicyTier> Tiers,
    [property: JsonPropertyName("status")] Domain.Enums.PricingPolicyStatus? Status = null,
    [property: JsonPropertyName("translations")] Dictionary<string, PricingPolicyTranslationData>? Translations = null) : ICommand<ErrorOr<Success>>;

public sealed class UpdatePricingPolicyCommandValidator : AbstractValidator<UpdatePricingPolicyCommand>
{
    public UpdatePricingPolicyCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.PricingPolicyIdRequired);

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationMessages.PricingPolicyNameRequired);

        RuleFor(x => x.Tiers)
            .NotEmpty().WithMessage(ValidationMessages.PricingPolicyTiersMinOne)
            .ForEach(tier => tier.SetValidator(new PricingPolicyTierValidator()));
    }
}

public sealed class UpdatePricingPolicyCommandHandler(IPricingPolicyService pricingPolicyService)
    : ICommandHandler<UpdatePricingPolicyCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdatePricingPolicyCommand request, CancellationToken cancellationToken)
    {
        return await pricingPolicyService.Update(new UpdatePricingPolicyRequest(
            request.Id,
            request.Name,
            request.TourType,
            request.Tiers,
            request.Status,
            request.Translations));
    }
}
