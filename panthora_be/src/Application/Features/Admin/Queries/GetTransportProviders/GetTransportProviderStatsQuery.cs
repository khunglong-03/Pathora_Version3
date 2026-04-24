namespace Application.Features.Admin.Queries.GetTransportProviders;

using Application.Features.Admin.DTOs;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;

public sealed record GetTransportProviderStatsQuery(
    [property: JsonPropertyName("search")] string? Search = null,
    [property: JsonPropertyName("continents")] List<string>? Continents = null)
    : IRequest<ErrorOr<TransportProviderStatsDto>>;
