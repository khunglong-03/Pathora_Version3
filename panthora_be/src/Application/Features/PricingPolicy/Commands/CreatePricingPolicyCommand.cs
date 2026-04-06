using Application.Contracts.PricingPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using Domain.ValueObjects;
using Application.Common.Constant;
using ErrorOr;
using FluentValidation;

namespace Application.Features.PricingPolicy.Commands;

public sealed record CreatePricingPolicyCommand(
    string Name,
    Domain.Enums.TourType TourType,
    List<Domain.ValueObjects.PricingPolicyTier> Tiers,
    bool IsDefault = false) : ICommand<ErrorOr<Guid>>;

public sealed class CreatePricingPolicyCommandValidator : AbstractValidator<CreatePricingPolicyCommand>
{
    public CreatePricingPolicyCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationMessages.PricingPolicyNameRequired);

        RuleFor(x => x.Tiers)
            .NotEmpty().WithMessage(ValidationMessages.PricingPolicyTiersMinOne)
            .ForEach(tier => tier.SetValidator(new PricingPolicyTierValidator()));
    }
}

public sealed class PricingPolicyTierValidator : AbstractValidator<PricingPolicyTier>
{
    public PricingPolicyTierValidator()
    {
        RuleFor(x => x.Label)
            .NotEmpty().WithMessage(ValidationMessages.PricingPolicyTierLabelRequired);

        RuleFor(x => x.AgeFrom)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.PricingPolicyTierAgeFromNonNegative);

        RuleFor(x => x.PricePercentage)
            .InclusiveBetween(0, 100).WithMessage(ValidationMessages.PricingPolicyTierPricePercentageRange);

        RuleFor(x => x)
            .Must(tier => !tier.AgeTo.HasValue || tier.AgeTo >= tier.AgeFrom)
            .WithMessage(ValidationMessages.PricingPolicyTierAgeToGreaterThanOrEqualAgeFrom);
    }
}

public sealed class CreatePricingPolicyCommandHandler(IPricingPolicyService pricingPolicyService)
    : ICommandHandler<CreatePricingPolicyCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreatePricingPolicyCommand request, CancellationToken cancellationToken)
    {
        return await pricingPolicyService.Create(new CreatePricingPolicyRequest(
            request.Name,
            request.TourType,
            request.Tiers,
            request.IsDefault));
    }
}
