using Application.Dtos;
using Application.Common;
using Application.Common.Constant;
using Application.Common.Localization;
using Contracts.Interfaces;
using AutoMapper;
using Domain.Common.Repositories;
using Domain.Entities.Translations;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.Public.Queries;

public sealed record GetPublicTourDetailQuery(Guid Id, string? Language = null) : IQuery<ErrorOr<TourDto>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.Tour}:public:detail:{Id}:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetPublicTourDetailQueryHandler(ITourRepository tourRepository, IMapper mapper)
    : IQueryHandler<GetPublicTourDetailQuery, ErrorOr<TourDto>>
{
    public async Task<ErrorOr<TourDto>> Handle(GetPublicTourDetailQuery request, CancellationToken cancellationToken)
    {
        var tour = await tourRepository.FindById(request.Id, asNoTracking: true);

        if (tour is null || tour.IsDeleted || tour.Status != TourStatus.Active)
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.PublicNotFoundDescription);

        tour.ApplyResolvedTranslations(request.ResolvedLanguage);
        return mapper.Map<TourDto>(tour);
    }
}
