namespace Application.Features.RoomBlocking.Queries.GetHotelRoomAvailability;

using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;

public sealed class GetHotelRoomAvailabilityQueryHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    IRoomBlockRepository roomBlockRepository)
    : IQueryHandler<GetHotelRoomAvailabilityQuery, ErrorOr<List<HotelRoomAvailabilityDto>>>
{
    public async Task<ErrorOr<List<HotelRoomAvailabilityDto>>> Handle(
        GetHotelRoomAvailabilityQuery request,
        CancellationToken cancellationToken)
    {
        var inventoryEntries = await inventoryRepository.GetByHotelAsync(request.SupplierId);
        if (inventoryEntries.Count == 0)
        {
            return new List<HotelRoomAvailabilityDto>();
        }

        var result = new List<HotelRoomAvailabilityDto>();

        foreach (var inventory in inventoryEntries)
        {
            var date = request.FromDate;
            while (date < request.ToDate)
            {
                var blockedCount = await roomBlockRepository.GetBlockedRoomCountAsync(
                    request.SupplierId,
                    inventory.RoomType,
                    date,
                    null,
                    cancellationToken);

                var availableRooms = inventory.TotalRooms - blockedCount;

                result.Add(new HotelRoomAvailabilityDto(
                    date,
                    inventory.RoomType,
                    inventory.TotalRooms,
                    blockedCount,
                    availableRooms));

                date = date.AddDays(1);
            }
        }

        return result;
    }
}
