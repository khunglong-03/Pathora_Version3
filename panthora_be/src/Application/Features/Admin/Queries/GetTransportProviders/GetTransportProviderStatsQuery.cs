namespace Application.Features.Admin.Queries.GetTransportProviders;

using Application.Features.Admin.DTOs;
using ErrorOr;
using MediatR;

public sealed record GetTransportProviderStatsQuery(string? Search = null)
    : IRequest<ErrorOr<TransportProviderStatsDto>>;
