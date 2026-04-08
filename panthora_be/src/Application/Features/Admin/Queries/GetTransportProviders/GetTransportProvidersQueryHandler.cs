namespace Application.Features.Admin.Queries.GetTransportProviders;

using Application.Common.Interfaces;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using global::Contracts;
using MediatR;

public sealed class GetTransportProvidersQueryHandler(
    IVehicleRepository vehicleRepository,
    IUserRepository userRepository,
    ISupplierRepository supplierRepository)
    : IRequestHandler<GetTransportProvidersQuery, ErrorOr<PaginatedList<TransportProviderListItemDto>>>
{
    private const int TransportProviderRoleId = (int)AssignedRole.TransportProvider;

    public async Task<ErrorOr<PaginatedList<TransportProviderListItemDto>>> Handle(
        GetTransportProvidersQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        if (request.Continent.HasValue)
        {
            return await HandleWithContinentFilterAsync(request, pageNumber, pageSize, cancellationToken);
        }

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

        var userIds = users.Select(u => u.Id).ToList();

        // Fetch vehicle data, supplier address data, and pending count sequentially
        // Note: Cannot run in parallel as all repositories share the same DbContext instance (scoped)
        var vehicleData = await vehicleRepository.GetVehicleDataGroupedByOwnerAsync(userIds, cancellationToken);
        var supplierAddressData = await supplierRepository.GetTransportSupplierAddressByOwnerAsync(userIds, cancellationToken);
        var pendingCount = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, "Pending", cancellationToken);

        var items = users.Select(user =>
        {
            var hasData = vehicleData.TryGetValue(user.Id, out var data);
            supplierAddressData.TryGetValue(user.Id, out var address);
            return new TransportProviderListItemDto(
                user.Id,
                user.FullName ?? string.Empty,
                user.Email,
                user.PhoneNumber,
                user.AvatarUrl,
                user.Status,
                hasData ? data.Count : 0,
                hasData ? data.Continents.Select(c => c.ToString()).ToList() : [],
                address,
                0);
        }).ToList();

        return new PaginatedList<TransportProviderListItemDto>(total, items, pageNumber, pageSize, null, pendingCount);
    }

    private async Task<ErrorOr<PaginatedList<TransportProviderListItemDto>>> HandleWithContinentFilterAsync(
        GetTransportProvidersQuery request,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        // Find users who own vehicles in the specified continent
        var continent = request.Continent!.Value;
        var userIdsWithInventory = await vehicleRepository
            .FindOwnerIdsWithVehicleInContinentAsync(continent, cancellationToken);

        if (userIdsWithInventory.Count == 0)
        {
            return new PaginatedList<TransportProviderListItemDto>(0, [], pageNumber, pageSize, null, 0);
        }

        var total = await userRepository.CountProvidersByRoleWithIdsAsync(
            TransportProviderRoleId,
            request.Search,
            request.Status,
            userIdsWithInventory,
            cancellationToken);

        var users = await userRepository.FindProvidersByRoleWithIdsAsync(
            TransportProviderRoleId,
            request.Search,
            request.Status,
            userIdsWithInventory,
            pageNumber,
            pageSize,
            cancellationToken);

        var userIds = users.Select(u => u.Id).ToList();

        // Fetch vehicle data, supplier address data, and pending count sequentially
        // Note: Cannot run in parallel as all repositories share the same DbContext instance (scoped)
        var vehicleData = await vehicleRepository.GetVehicleDataGroupedByOwnerAsync(userIds, cancellationToken);
        var supplierAddressData = await supplierRepository.GetTransportSupplierAddressByOwnerAsync(userIds, cancellationToken);
        var pendingCount = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, "Pending", cancellationToken);

        var items = users.Select(user =>
        {
            var hasData = vehicleData.TryGetValue(user.Id, out var data);
            supplierAddressData.TryGetValue(user.Id, out var address);
            return new TransportProviderListItemDto(
                user.Id,
                user.FullName ?? string.Empty,
                user.Email,
                user.PhoneNumber,
                user.AvatarUrl,
                user.Status,
                hasData ? data.Count : 0,
                hasData ? data.Continents.Select(c => c.ToString()).ToList() : [],
                address,
                0);
        }).ToList();

        return new PaginatedList<TransportProviderListItemDto>(total, items, pageNumber, pageSize, null, pendingCount);
    }
}
