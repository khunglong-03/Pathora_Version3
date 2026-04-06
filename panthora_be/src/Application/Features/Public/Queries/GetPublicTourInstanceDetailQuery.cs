using Application.Common;
using Application.Common.Localization;
using Application.Dtos;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.Public.Queries;

public sealed record GetPublicTourInstanceDetailQuery(Guid Id, string? Language = null) : IQuery<ErrorOr<TourInstanceDto>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.TourInstance}:public:detail:{Id}:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetPublicTourInstanceDetailQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<GetPublicTourInstanceDetailQuery, ErrorOr<TourInstanceDto>>
{
    public async Task<ErrorOr<TourInstanceDto>> Handle(GetPublicTourInstanceDetailQuery request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.GetPublicDetail(request.Id, request.ResolvedLanguage);
    }
}

