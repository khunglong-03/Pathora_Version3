using Application.Contracts.PricingPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.PricingPolicy.Queries;
public sealed record GetPricingPolicyByIdQuery([property: JsonPropertyName("id")] Guid Id) : IQuery<ErrorOr<PricingPolicyResponse>>;

public sealed class GetPricingPolicyByIdQueryHandler(IPricingPolicyService pricingPolicyService)
    : IQueryHandler<GetPricingPolicyByIdQuery, ErrorOr<PricingPolicyResponse>>
{
    public async Task<ErrorOr<PricingPolicyResponse>> Handle(GetPricingPolicyByIdQuery request, CancellationToken cancellationToken)
    {
        return await pricingPolicyService.GetById(request.Id);
    }
}
