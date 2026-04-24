namespace Application.Features.TransportProvider.Revenue.Queries;

using Application.Features.TransportProvider.Revenue.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetRevenueSummaryQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("year")] int Year,
    [property: JsonPropertyName("quarter")] int? Quarter) : IQuery<ErrorOr<RevenueSummaryDto>>;