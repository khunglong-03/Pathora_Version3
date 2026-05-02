using Application.Common;
using Application.Dtos;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Queries;

public sealed record GetMyAssignedTourInstanceDetailQuery([property: JsonPropertyName("id")] Guid Id) : IQuery<ErrorOr<TourInstanceDto>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourInstance}:my-assigned-detail:{Id}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}
