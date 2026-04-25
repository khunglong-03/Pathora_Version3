using Application.Common.Constant;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.PricingPolicy.Commands;
public sealed record DeletePricingPolicyCommand([property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>;

public sealed class DeletePricingPolicyCommandValidator : AbstractValidator<DeletePricingPolicyCommand>
{
    public DeletePricingPolicyCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.PricingPolicyIdRequired);
    }
}

public sealed class DeletePricingPolicyCommandHandler(IPricingPolicyService pricingPolicyService)
    : ICommandHandler<DeletePricingPolicyCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeletePricingPolicyCommand request, CancellationToken cancellationToken)
    {
        return await pricingPolicyService.Delete(request.Id);
    }
}
