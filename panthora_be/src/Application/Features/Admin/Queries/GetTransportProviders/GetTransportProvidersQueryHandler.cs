namespace Application.Features.Admin.Queries.GetTransportProviders;

using Application.Common.Interfaces;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using global::Contracts;
using MediatR;

public sealed class GetTransportProvidersQueryHandler(IUserRepository userRepository)
    : IRequestHandler<GetTransportProvidersQuery, ErrorOr<PaginatedList<TransportProviderListItemDto>>>
{
    private const int TransportProviderRoleId = 6; // RoleId for "TransportProvider"

    public async Task<ErrorOr<PaginatedList<TransportProviderListItemDto>>> Handle(
        GetTransportProvidersQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var users = await userRepository.FindProvidersByRoleAsync(
            TransportProviderRoleId,
            request.Search,
            request.Status,
            pageNumber,
            pageSize,
            cancellationToken);

        var total = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId,
            request.Search,
            request.Status,
            cancellationToken);

        var items = users.Select(user => new TransportProviderListItemDto(
            user.Id,
            user.FullName ?? string.Empty,
            user.Email,
            user.PhoneNumber,
            user.AvatarUrl,
            user.Status,
            0 // bookingCount not available in data model
        )).ToList();

        return new PaginatedList<TransportProviderListItemDto>(total, items, pageNumber, pageSize);
    }
}