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

        if (request.Continent.HasValue)
        {
            return await HandleWithContinentFilterAsync(request, pageNumber, pageSize, cancellationToken);
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
        var accommodationData = await supplierRepository.GetAccommodationDataGroupedByOwnerAsync(userIds, cancellationToken);

        var items = users.Select(user =>
        {
            var hasData = accommodationData.TryGetValue(user.Id, out var data);
            return new HotelProviderListItemDto(
                user.Id,
                user.FullName ?? string.Empty,
                user.Email,
                user.PhoneNumber,
                user.AvatarUrl,
                user.Status,
                hasData ? data.Count : 0,
                hasData ? data.Continents.Select(c => c.ToString()).ToList() : []);
        }).ToList();

        return new PaginatedList<HotelProviderListItemDto>(total, items, pageNumber, pageSize);
    }

    private async Task<ErrorOr<PaginatedList<HotelProviderListItemDto>>> HandleWithContinentFilterAsync(
        GetHotelProvidersQuery request,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var continent = request.Continent!.Value;
        var userIdsWithInventory = await supplierRepository
            .FindOwnerUserIdsWithAccommodationInContinentAsync(continent, cancellationToken);

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
        var accommodationData = await supplierRepository.GetAccommodationDataGroupedByOwnerAsync(userIds, cancellationToken);

        var items = users.Select(user =>
        {
            var hasData = accommodationData.TryGetValue(user.Id, out var data);
            return new HotelProviderListItemDto(
                user.Id,
                user.FullName ?? string.Empty,
                user.Email,
                user.PhoneNumber,
                user.AvatarUrl,
                user.Status,
                hasData ? data.Count : 0,
                hasData ? data.Continents.Select(c => c.ToString()).ToList() : []);
        }).ToList();

        return new PaginatedList<HotelProviderListItemDto>(total, items, pageNumber, pageSize);
    }
}
