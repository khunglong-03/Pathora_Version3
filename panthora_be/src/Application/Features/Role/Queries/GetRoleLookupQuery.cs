using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using Contracts;

namespace Application.Features.Role.Queries;

public sealed record GetRoleLookupQuery()
    : IQuery<ErrorOr<List<LookupVm>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Role}:lookup";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetRoleLookupQueryHandler(
    Domain.Common.Repositories.IRoleRepository roleRepository)
    : IQueryHandler<GetRoleLookupQuery, ErrorOr<List<LookupVm>>>
{
    public async Task<ErrorOr<List<LookupVm>>> Handle(GetRoleLookupQuery request, CancellationToken cancellationToken)
    {
        var rolesResult = await roleRepository.GetAll(cancellationToken);
        if (rolesResult.IsError) return rolesResult.Errors;

        return rolesResult.Value
            .Select(r => new LookupVm(r.Id.ToString(), r.Name))
            .ToList();
    }
}
