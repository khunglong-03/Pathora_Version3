using Application.Common;
using Application.Services;
using Contracts;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Position.Queries;

public sealed record GetPositionComboBoxQuery() : IQuery<ErrorOr<List<LookupVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Position}:combobox";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetPositionComboBoxQueryHandler(IPositionService positionService)
    : IQueryHandler<GetPositionComboBoxQuery, ErrorOr<List<LookupVm>>>
{
    public async Task<ErrorOr<List<LookupVm>>> Handle(GetPositionComboBoxQuery request, CancellationToken cancellationToken)
    {
        return await positionService.GetComboboxAsync();
    }
}
