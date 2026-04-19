using Application.Common;
using Contracts.Interfaces;
using Application.Dtos;
using BuildingBlocks.CORS;
using Domain.Entities.Translations;
using Domain.Enums;
using ErrorOr;
using Application.Services;

namespace Application.Features.Tour.Commands;

public sealed record UpdateTourCommand(
    Guid Id,
    string TourName,
    string ShortDescription,
    string LongDescription,
    string? SEOTitle,
    string? SEODescription,
    TourStatus Status,
    ImageInputDto? Thumbnail = null,
    List<ImageInputDto>? Images = null,
    Dictionary<string, TourTranslationData>? Translations = null,
    List<ClassificationDto>? Classifications = null,
    List<AccommodationDto>? Accommodations = null,
    List<LocationDto>? Locations = null,
    List<TransportationDto>? Transportations = null,
    List<ServiceDto>? Services = null,
    Guid? VisaPolicyId = null,
    Guid? DepositPolicyId = null,
    Guid? PricingPolicyId = null,
    Guid? CancellationPolicyId = null,
    List<Guid>? DeletedClassificationIds = null,
    List<Guid>? DeletedActivityIds = null,
    TourScope TourScope = TourScope.Domestic,
    Continent? Continent = null,
    CustomerSegment CustomerSegment = CustomerSegment.Group,
    DateTimeOffset? IfUnmodifiedSince = null) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Tour];
}

public sealed class UpdateTourCommandHandler(ITourService tourService)
    : ICommandHandler<UpdateTourCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateTourCommand request, CancellationToken cancellationToken)
    {
        return await tourService.Update(request, isManager: false);
    }
}



