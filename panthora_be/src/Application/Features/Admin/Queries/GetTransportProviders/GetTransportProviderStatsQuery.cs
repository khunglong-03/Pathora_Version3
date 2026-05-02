using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Features.Admin.Queries.GetTransportProviders;

public sealed record GetTransportProviderStatsQuery(
    [property: JsonPropertyName("search")] string? Search = null,
    [property: JsonPropertyName("continents")] List<string>? Continents = null)
    : IRequest<ErrorOr<TransportProviderStatsDto>>;


public sealed class GetTransportProviderStatsQueryHandler(
    IUserRepository userRepository)
    : IRequestHandler<GetTransportProviderStatsQuery, ErrorOr<TransportProviderStatsDto>>
{
    private const int TransportProviderRoleId = (int)AssignedRole.TransportProvider;

    public async Task<ErrorOr<TransportProviderStatsDto>> Handle(
        GetTransportProviderStatsQuery request,
        CancellationToken cancellationToken)
    {
        var total = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, null, request.Continents, cancellationToken);

        var active = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, "Active", request.Continents, cancellationToken);

        var inactive = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, "Inactive", request.Continents, cancellationToken);

        var pending = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, "Pending", request.Continents, cancellationToken);

        var banned = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, "Banned", request.Continents, cancellationToken);

        return new TransportProviderStatsDto(total, active, inactive, pending, banned);
    }
}
