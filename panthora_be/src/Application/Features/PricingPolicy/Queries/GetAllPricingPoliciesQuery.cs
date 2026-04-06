using Application.Contracts.PricingPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.PricingPolicy.Queries;

public sealed record GetAllPricingPoliciesQuery : IQuery<ErrorOr<List<PricingPolicyResponse>>>;

public sealed class GetAllPricingPoliciesQueryHandler(IPricingPolicyService pricingPolicyService)
    : IQueryHandler<GetAllPricingPoliciesQuery, ErrorOr<List<PricingPolicyResponse>>>
{
    public async Task<ErrorOr<List<PricingPolicyResponse>>> Handle(GetAllPricingPoliciesQuery request, CancellationToken cancellationToken)
    {
        return await pricingPolicyService.GetAll();
    }
}
