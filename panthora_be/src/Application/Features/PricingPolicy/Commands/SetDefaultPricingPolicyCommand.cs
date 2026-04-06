using Application.Services;
using BuildingBlocks.CORS;
using Contracts;
using ErrorOr;

namespace Application.Features.PricingPolicy.Commands;

public sealed record SetDefaultPricingPolicyCommand(Guid Id) : ICommand<ErrorOr<Success>>;

public sealed class SetDefaultPricingPolicyCommandHandler(IPricingPolicyService pricingPolicyService)
    : ICommandHandler<SetDefaultPricingPolicyCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(SetDefaultPricingPolicyCommand request, CancellationToken cancellationToken)
    {
        return await pricingPolicyService.SetAsDefault(request.Id);
    }
}
