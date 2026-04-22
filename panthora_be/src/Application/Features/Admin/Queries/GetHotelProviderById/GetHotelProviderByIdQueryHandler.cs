namespace Application.Features.Admin.Queries.GetHotelProviderById;

using Application.Common.Constant;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using MediatR;

public sealed class GetHotelProviderByIdQueryHandler(
    IUserRepository userRepository,
    ISupplierRepository supplierRepository,
    IHotelRoomInventoryRepository inventoryRepository)
    : IRequestHandler<GetHotelProviderByIdQuery, ErrorOr<HotelProviderDetailDto>>
{
    public async Task<ErrorOr<HotelProviderDetailDto>> Handle(
        GetHotelProviderByIdQuery request,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.FindById(request.Id, cancellationToken);
        List<Domain.Entities.SupplierEntity> suppliers = [];

        if (user is null)
        {
            // Fallback: The ID might be a SupplierId (used by the tour instance creator)
            var supplier = await supplierRepository.GetByIdAsync(request.Id, cancellationToken);
            if (supplier is not null && supplier.OwnerUserId.HasValue)
            {
                user = await userRepository.FindById(supplier.OwnerUserId.Value, cancellationToken);
                suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(supplier.OwnerUserId.Value, cancellationToken);
            }
        }
        else if (user is not null)
        {
            suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(user.Id, cancellationToken);
        }

        if (user is null && suppliers.Count == 0)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Hotel provider not found.");

        var (bookingCount, activeBookingCount, completedBookingCount) = user is not null
            ? await supplierRepository.GetHotelBookingCountsByOwnerAsync(user.Id, cancellationToken)
            : (0, 0, 0);

        var accommodationSummaries = new List<HotelAccommodationSummaryDto>();
        var propertySummaries = new List<HotelPropertySummaryDto>();
        var roomOptions = new List<HotelProviderRoomOptionDto>();
        var totalRooms = 0;
        var continents = new HashSet<string>();

        foreach (var supplier in suppliers)
        {
            var inventories = await inventoryRepository.GetByHotelAsync(supplier.Id, cancellationToken);
            var propertyAccommodationCount = inventories.Count;
            var propertyRoomCount = inventories.Sum(inv => inv.TotalRooms);
            var propertyContinents = inventories
                .Where(inv => !string.IsNullOrWhiteSpace(inv.LocationArea?.ToString()))
                .Select(inv => inv.LocationArea!.ToString()!)
                .Distinct()
                .ToList();

            if (propertyContinents.Count == 0 && supplier.Continent.HasValue)
            {
                propertyContinents = [supplier.Continent.Value.ToString()];
            }

            propertySummaries.Add(new HotelPropertySummaryDto(
                supplier.Id,
                supplier.SupplierCode,
                supplier.Name,
                supplier.Address,
                supplier.Phone,
                supplier.Email,
                supplier.Continent?.ToString(),
                propertyContinents,
                propertyAccommodationCount,
                propertyRoomCount));

            accommodationSummaries.AddRange(inventories
                .Select(inv => new HotelAccommodationSummaryDto(
                    inv.Id,
                    supplier.Id,
                    supplier.Name,
                    inv.RoomType.ToString(),
                    inv.TotalRooms,
                    inv.Name,
                    inv.LocationArea?.ToString()))
                .ToList());

            totalRooms += propertyRoomCount;

            foreach (var continent in propertyContinents)
            {
                continents.Add(continent);
            }
        }

        roomOptions = accommodationSummaries
            .GroupBy(acc => acc.RoomType)
            .Select(group => new HotelProviderRoomOptionDto(
                group.Key,
                group.Key,
                group.Sum(acc => acc.TotalRooms)))
            .OrderBy(option => option.Label)
            .ToList();

        var primarySupplier = propertySummaries.FirstOrDefault();
        var primaryContinent = primarySupplier?.PrimaryContinent;
        var createdOnUtc = user is not null
            ? user.CreatedOnUtc
            : suppliers
                .OrderBy(s => s.CreatedOnUtc)
                .Select(s => (DateTimeOffset?)s.CreatedOnUtc)
                .FirstOrDefault();
        if (continents.Count == 0 && primaryContinent is not null)
        {
            continents.Add(primaryContinent);
        }

        return new HotelProviderDetailDto(
            user?.Id ?? primarySupplier!.Id,
            primarySupplier?.SupplierName ?? user?.FullName ?? string.Empty,
            primarySupplier?.SupplierCode ?? string.Empty,
            primarySupplier?.Address,
            primarySupplier?.Phone ?? user?.PhoneNumber,
            primarySupplier?.Email ?? user?.Email,
            user?.AvatarUrl,
            user?.Status ?? UserStatus.Active,
            user?.Id,
            createdOnUtc,
            primaryContinent,
            continents.ToList(),
            propertySummaries,
            accommodationSummaries,
            roomOptions,
            accommodationSummaries.Count,
            propertySummaries.Count,
            totalRooms,
            bookingCount,
            activeBookingCount,
            completedBookingCount);
    }
}
