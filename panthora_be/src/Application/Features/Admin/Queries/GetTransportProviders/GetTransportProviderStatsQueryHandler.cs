namespace Application.Features.Admin.Queries.GetTransportProviders;

using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using MediatR;

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
            TransportProviderRoleId, request.Search, null, cancellationToken);

        var active = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, "Active", cancellationToken);

        var inactive = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, "Inactive", cancellationToken);

        var pending = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, "Pending", cancellationToken);

        return new TransportProviderStatsDto(total, active, inactive, pending);
    }
}
