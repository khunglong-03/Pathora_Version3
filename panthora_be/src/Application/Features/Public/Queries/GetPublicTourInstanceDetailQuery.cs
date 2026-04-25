using Application.Common.Localization;
using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Public.Queries;
public sealed record GetPublicTourInstanceDetailQuery(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("language")] string? Language = null) : IQuery<ErrorOr<TourInstanceDto>>, ICacheable
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

