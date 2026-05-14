using Application.Common.Constant;
using Application.Common.Localization;
using Application.Common;
using Application.Dtos;
using AutoMapper;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities.Translations;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Public.Queries;

public sealed record GetPublicTourDetailQuery(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("language")] string? Language = null) : IQuery<ErrorOr<TourDto>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.Tour}:public:detail:{Id}:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetPublicTourDetailQueryHandler(
    ITourRepository tourRepository,
    IDepositPolicyRepository depositPolicyRepository,
    IPricingPolicyRepository pricingPolicyRepository,
    IMapper mapper)
    : IQueryHandler<GetPublicTourDetailQuery, ErrorOr<TourDto>>
{
    public async Task<ErrorOr<TourDto>> Handle(GetPublicTourDetailQuery request, CancellationToken cancellationToken)
    {
        var tour = await tourRepository.FindById(request.Id, asNoTracking: true, cancellationToken);

        if (tour is null || tour.IsDeleted || tour.Status != TourStatus.Active)
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.PublicNotFoundDescription);

        tour.ApplyResolvedTranslations(request.ResolvedLanguage);
        var dto = mapper.Map<TourDto>(tour);

        var pricingPolicy = await pricingPolicyRepository.GetActivePolicyByTourType(TourType.Private, cancellationToken)
            ?? await pricingPolicyRepository.GetDefaultPolicy(cancellationToken);

        var depositPolicies = await depositPolicyRepository.GetAllActiveAsync(cancellationToken);
        var depositPolicy = depositPolicies.FirstOrDefault(p => p.TourScope == tour.TourScope);

        return dto with
        {
            PricingPolicy = pricingPolicy is null ? null : mapper.Map<PricingPolicyDto>(pricingPolicy),
            DepositPolicy = depositPolicy is null ? null : mapper.Map<DepositPolicyDto>(depositPolicy)
        };
    }
}
