using Application.Common;
using Application.Dtos;
using Application.Services;
using AutoMapper;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Queries;

public sealed record GetTourInstanceDetailQuery([property: JsonPropertyName("id")] Guid Id) : IQuery<ErrorOr<TourInstanceDto>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourInstance}:detail:{Id}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetTourInstanceDetailQueryHandler(
    ITourInstanceService tourInstanceService,
    ITourRepository tourRepository,
    IPricingPolicyRepository pricingPolicyRepository,
    ICancellationPolicyRepository cancellationPolicyRepository,
    IDepositPolicyRepository depositPolicyRepository,
    IMapper mapper)
    : IQueryHandler<GetTourInstanceDetailQuery, ErrorOr<TourInstanceDto>>
{
    public async Task<ErrorOr<TourInstanceDto>> Handle(GetTourInstanceDetailQuery request, CancellationToken cancellationToken)
    {
        var result = await tourInstanceService.GetDetail(request.Id);
        if (result.IsError) return result.Errors;

        var dto = result.Value;
        var tour = await tourRepository.FindById(dto.TourId, asNoTracking: true, cancellationToken);
        if (tour is null) return dto;

        var instanceType = Enum.Parse<TourType>(dto.InstanceType, true);

        // Fetch system-wide policies
        var pricingPolicy = await pricingPolicyRepository.GetActivePolicyByTourType(instanceType, cancellationToken);
        
        var cancelPolicies = await cancellationPolicyRepository.FindByTourScope(tour.TourScope, cancellationToken);
        var cancellationPolicy = cancelPolicies.FirstOrDefault(p => p.Status == CancellationPolicyStatus.Active);
        
        var depositPolicies = await depositPolicyRepository.GetAllActiveAsync(cancellationToken);
        var depositPolicy = depositPolicies.FirstOrDefault(p => p.TourScope == tour.TourScope);

        // Map and inject into DTO
        return dto with 
        { 
            PricingPolicy = mapper.Map<PricingPolicyDto>(pricingPolicy),
            CancellationPolicy = mapper.Map<CancellationPolicyDto>(cancellationPolicy),
            DepositPolicy = mapper.Map<DepositPolicyDto>(depositPolicy)
        };
    }
}

