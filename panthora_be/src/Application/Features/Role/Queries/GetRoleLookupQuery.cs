using Application.Common;
using Application.Services;
using Contracts;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Role.Queries;

public sealed record GetRoleLookupQuery() : IQuery<ErrorOr<List<LookupVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Role}:lookup";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetRoleLookupQueryHandler(IRoleService roleService)
    : IQueryHandler<GetRoleLookupQuery, ErrorOr<List<LookupVm>>>
{
    public async Task<ErrorOr<List<LookupVm>>> Handle(GetRoleLookupQuery request, CancellationToken cancellationToken)
    {
        return await roleService.GetAll();
    }
}
