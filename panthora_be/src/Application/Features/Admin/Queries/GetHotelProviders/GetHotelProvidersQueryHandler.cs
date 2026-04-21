namespace Application.Features.Admin.Queries.GetHotelProviders;

using Application.Common.Interfaces;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using global::Contracts;
using MediatR;

public sealed class GetHotelProvidersQueryHandler(
    ISupplierRepository supplierRepository,
    IUserRepository userRepository)
    : IRequestHandler<GetHotelProvidersQuery, ErrorOr<PaginatedList<HotelProviderListItemDto>>>
{
    private const int HotelServiceProviderRoleId = (int)AssignedRole.HotelServiceProvider;

    public async Task<ErrorOr<PaginatedList<HotelProviderListItemDto>>> Handle(
        GetHotelProvidersQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;
        var requestedContinents = request.Continents?.Count > 0
            ? request.Continents.Distinct().ToList()
            : request.Continent.HasValue
                ? [request.Continent.Value]
                : [];

        if (requestedContinents.Count > 0)
        {
            return await HandleWithContinentFilterAsync(request, requestedContinents, pageNumber, pageSize, cancellationToken);
        }

        var users = await userRepository.FindProvidersByRoleAsync(
            HotelServiceProviderRoleId,
            request.Search,
            request.Status,
            pageNumber,
            pageSize,
            cancellationToken);

        var total = await userRepository.CountProvidersByRoleAsync(
            HotelServiceProviderRoleId,
            request.Search,
            request.Status,
            cancellationToken);

        var userIds = users.Select(u => u.Id).ToList();
        var supplierData = await supplierRepository.GetHotelProviderAdminDataGroupedByOwnerAsync(userIds, cancellationToken);

        var items = users.Select(user =>
        {
            var hasData = supplierData.TryGetValue(user.Id, out var properties) && properties!.Count > 0;
            var primaryProperty = hasData ? properties![0] : null;
            var propertyCount = hasData ? properties!.Count : 0;
            var roomCount = hasData ? properties!.Sum(p => p.RoomCount) : 0;
            var continents = hasData
                ? properties!
                    .SelectMany(p => p.Continents)
                    .Distinct()
                    .Select(c => c.ToString())
                    .ToList()
                : [];
            return new HotelProviderListItemDto(
                user.Id,
                hasData ? primaryProperty!.SupplierName : user.FullName ?? string.Empty,
                hasData ? primaryProperty!.SupplierCode : string.Empty,
                hasData ? primaryProperty!.Email ?? user.Email : user.Email,
                hasData ? primaryProperty!.Phone ?? user.PhoneNumber : user.PhoneNumber,
                hasData ? primaryProperty!.Address : null,
                user.AvatarUrl,
                user.Status,
                hasData ? propertyCount : 0,
                hasData ? propertyCount : 0,
                roomCount,
                hasData ? primaryProperty!.CreatedOnUtc : user.CreatedOnUtc,
                hasData ? primaryProperty!.PrimaryContinent?.ToString() : null,
                continents);
        }).ToList();

        return new PaginatedList<HotelProviderListItemDto>(total, items, pageNumber, pageSize);
    }

    private async Task<ErrorOr<PaginatedList<HotelProviderListItemDto>>> HandleWithContinentFilterAsync(
        GetHotelProvidersQuery request,
        List<Continent> requestedContinents,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var userIdsWithInventory = await supplierRepository
            .FindOwnerUserIdsByHotelProviderContinentsAsync(requestedContinents, cancellationToken);

        if (userIdsWithInventory.Count == 0)
        {
            return new PaginatedList<HotelProviderListItemDto>(0, [], pageNumber, pageSize);
        }

        var total = await userRepository.CountProvidersByRoleWithIdsAsync(
            HotelServiceProviderRoleId,
            request.Search,
            request.Status,
            userIdsWithInventory,
            cancellationToken);

        var users = await userRepository.FindProvidersByRoleWithIdsAsync(
            HotelServiceProviderRoleId,
            request.Search,
            request.Status,
            userIdsWithInventory,
            pageNumber,
            pageSize,
            cancellationToken);

        var userIds = users.Select(u => u.Id).ToList();
        var supplierData = await supplierRepository.GetHotelProviderAdminDataGroupedByOwnerAsync(userIds, cancellationToken);

        var items = users.Select(user =>
        {
            var hasData = supplierData.TryGetValue(user.Id, out var properties) && properties!.Count > 0;
            var primaryProperty = hasData ? properties![0] : null;
            var propertyCount = hasData ? properties!.Count : 0;
            var roomCount = hasData ? properties!.Sum(p => p.RoomCount) : 0;
            var continents = hasData
                ? properties!
                    .SelectMany(p => p.Continents)
                    .Distinct()
                    .Select(c => c.ToString())
                    .ToList()
                : [];
            return new HotelProviderListItemDto(
                user.Id,
                hasData ? primaryProperty!.SupplierName : user.FullName ?? string.Empty,
                hasData ? primaryProperty!.SupplierCode : string.Empty,
                hasData ? primaryProperty!.Email ?? user.Email : user.Email,
                hasData ? primaryProperty!.Phone ?? user.PhoneNumber : user.PhoneNumber,
                hasData ? primaryProperty!.Address : null,
                user.AvatarUrl,
                user.Status,
                hasData ? propertyCount : 0,
                hasData ? propertyCount : 0,
                roomCount,
                hasData ? primaryProperty!.CreatedOnUtc : user.CreatedOnUtc,
                hasData ? primaryProperty!.PrimaryContinent?.ToString() : null,
                continents);
        }).ToList();

        return new PaginatedList<HotelProviderListItemDto>(total, items, pageNumber, pageSize);
    }
}
