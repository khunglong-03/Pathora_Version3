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

        var requestedContinentStrings = request.Continents?.Count > 0
            ? request.Continents.Select(c => c.ToString()).Distinct().ToList()
            : request.Continent.HasValue
                ? [request.Continent.Value.ToString()]
                : null;

        var users = await userRepository.FindProvidersByRoleAsync(
            HotelServiceProviderRoleId,
            request.Search,
            request.Status,
            requestedContinentStrings,
            pageNumber,
            pageSize,
            cancellationToken);

        var total = await userRepository.CountProvidersByRoleAsync(
            HotelServiceProviderRoleId,
            request.Search,
            request.Status,
            requestedContinentStrings,
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
                user.Id,
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
