using Application.Common;
using Contracts.Interfaces;
using Application.Dtos;
using BuildingBlocks.CORS;
using Domain.Entities.Translations;
using Domain.Enums;
using ErrorOr;
using Application.Services;
using System.Text.Json.Serialization;

namespace Application.Features.Tour.Commands;

public sealed record UpdateTourCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("shortDescription")] string ShortDescription,
    [property: JsonPropertyName("longDescription")] string LongDescription,
    [property: JsonPropertyName("seoTitle")] string? SEOTitle,
    [property: JsonPropertyName("seoDescription")] string? SEODescription,
    [property: JsonPropertyName("status")] TourStatus Status,
    [property: JsonPropertyName("thumbnail")] ImageInputDto? Thumbnail = null,
    [property: JsonPropertyName("images")] List<ImageInputDto>? Images = null,
    [property: JsonPropertyName("translations")] Dictionary<string, TourTranslationData>? Translations = null,
    [property: JsonPropertyName("classifications")] List<ClassificationDto>? Classifications = null,
    [property: JsonPropertyName("accommodations")] List<AccommodationDto>? Accommodations = null,
    [property: JsonPropertyName("locations")] List<LocationDto>? Locations = null,
    [property: JsonPropertyName("transportations")] List<TransportationDto>? Transportations = null,
    [property: JsonPropertyName("services")] List<ServiceDto>? Services = null,
    [property: JsonPropertyName("deletedClassificationIds")] List<Guid>? DeletedClassificationIds = null,
    [property: JsonPropertyName("deletedPlanIds")] List<Guid>? DeletedPlanIds = null,
    [property: JsonPropertyName("deletedActivityIds")] List<Guid>? DeletedActivityIds = null,
    [property: JsonPropertyName("tourScope")] TourScope TourScope = TourScope.Domestic,
    [property: JsonPropertyName("continent")] Continent? Continent = null,
    [property: JsonPropertyName("customerSegment")] CustomerSegment CustomerSegment = CustomerSegment.Group,
    [property: JsonPropertyName("ifUnmodifiedSince")] DateTimeOffset? IfUnmodifiedSince = null) : ICommand<ErrorOr<Success>>, ICacheInvalidator
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



