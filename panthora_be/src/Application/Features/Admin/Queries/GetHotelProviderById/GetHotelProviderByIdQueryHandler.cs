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
        Domain.Entities.SupplierEntity? supplier = null;

        if (user is null)
        {
            // Fallback: The ID might be a SupplierId (used by the tour instance creator)
            supplier = await supplierRepository.GetByIdAsync(request.Id, cancellationToken);
            if (supplier is not null && supplier.OwnerUserId.HasValue)
            {
                user = await userRepository.FindById(supplier.OwnerUserId.Value, cancellationToken);
            }
        }
        else
        {
            supplier = await supplierRepository.FindByOwnerUserIdAsync(user.Id, cancellationToken);
        }

        if (user is null && supplier is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Hotel provider not found.");

        var (bookingCount, activeBookingCount, completedBookingCount) = user is not null
            ? await supplierRepository.GetHotelBookingCountsByOwnerAsync(user.Id, cancellationToken)
            : (0, 0, 0);

        var accommodationSummaries = new List<HotelAccommodationSummaryDto>();
        var roomOptions = new List<HotelProviderRoomOptionDto>();
        var totalRooms = 0;
        var continents = new List<string>();

        if (supplier is not null)
        {
            var inventories = await inventoryRepository.GetByHotelAsync(supplier.Id, cancellationToken);
            accommodationSummaries = inventories
                .Select(inv => new HotelAccommodationSummaryDto(
                    inv.Id,
                    inv.RoomType.ToString(),
                    inv.TotalRooms,
                    inv.Name,
                    inv.LocationArea?.ToString()))
                .ToList();
            roomOptions = inventories
                .GroupBy(inv => inv.RoomType)
                .Select(group => new HotelProviderRoomOptionDto(
                    group.Key.ToString(),
                    group.Key.ToString(),
                    group.Sum(inv => inv.TotalRooms)))
                .OrderBy(option => option.Label)
                .ToList();
            totalRooms = inventories.Sum(inv => inv.TotalRooms);
            continents = accommodationSummaries
                .Select(summary => summary.LocationArea)
                .Where(locationArea => !string.IsNullOrWhiteSpace(locationArea))
                .Distinct()
                .Cast<string>()
                .ToList();
        }

        var primaryContinent = supplier?.Continent?.ToString();
        if (continents.Count == 0 && primaryContinent is not null)
        {
            continents = [primaryContinent];
        }

        return new HotelProviderDetailDto(
            user?.Id ?? supplier!.Id,
            supplier?.Name ?? user?.FullName ?? string.Empty,
            supplier?.SupplierCode ?? string.Empty,
            supplier?.Address,
            supplier?.Phone ?? user?.PhoneNumber,
            supplier?.Email ?? user?.Email,
            user?.AvatarUrl,
            user?.Status ?? UserStatus.Active,
            user?.CreatedOnUtc ?? supplier?.CreatedOnUtc,
            primaryContinent,
            continents,
            accommodationSummaries,
            roomOptions,
            accommodationSummaries.Count,
            totalRooms,
            bookingCount,
            activeBookingCount,
            completedBookingCount);
    }
}
