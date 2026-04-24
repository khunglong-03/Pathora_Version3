namespace Application.Features.TransportProvider.Revenue.Queries;

using Application.Features.TransportProvider.Revenue.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetTripHistoryQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("page")] int Page,
    [property: JsonPropertyName("pageSize")] int PageSize,
    [property: JsonPropertyName("year")] int? Year,
    [property: JsonPropertyName("quarter")] int? Quarter) : IQuery<ErrorOr<TripHistoryResponseDto>>;