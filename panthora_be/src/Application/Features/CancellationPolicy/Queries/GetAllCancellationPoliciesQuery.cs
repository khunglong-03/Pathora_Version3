using Application.Contracts.CancellationPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.CancellationPolicy.Queries;

public sealed record GetAllCancellationPoliciesQuery : IQuery<ErrorOr<IReadOnlyList<CancellationPolicyResponse>>>;

public sealed class GetAllCancellationPoliciesQueryHandler(ICancellationPolicyService service)
    : IQueryHandler<GetAllCancellationPoliciesQuery, ErrorOr<IReadOnlyList<CancellationPolicyResponse>>>
{
    public async Task<ErrorOr<IReadOnlyList<CancellationPolicyResponse>>> Handle(
        GetAllCancellationPoliciesQuery request,
        CancellationToken cancellationToken)
    {
        return await service.GetAll();
    }
}
