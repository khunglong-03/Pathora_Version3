namespace Application.Features.Admin.Queries.GetTransportProviders;

using Application.Features.Admin.DTOs;
using ErrorOr;
using MediatR;

public sealed record GetTransportProviderStatsQuery(string? Search = null, List<string>? Continents = null)
    : IRequest<ErrorOr<TransportProviderStatsDto>>;
