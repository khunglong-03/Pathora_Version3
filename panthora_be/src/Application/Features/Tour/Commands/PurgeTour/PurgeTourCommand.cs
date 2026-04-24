using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Tour.Commands.PurgeTour;

public sealed record PurgeTourCommand([property: JsonPropertyName("tourId")] Guid TourId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Tour];
}
