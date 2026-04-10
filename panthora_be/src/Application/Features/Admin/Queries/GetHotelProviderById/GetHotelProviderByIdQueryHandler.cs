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
        if (user is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        var supplier = await supplierRepository.FindByOwnerUserIdAsync(user.Id, cancellationToken);
        var (bookingCount, activeBookingCount, completedBookingCount) =
            await supplierRepository.GetHotelBookingCountsByOwnerAsync(user.Id, cancellationToken);

        var accommodationSummaries = new List<HotelAccommodationSummaryDto>();
        var totalRooms = 0;

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
            totalRooms = inventories.Sum(inv => inv.TotalRooms);
        }

        return new HotelProviderDetailDto(
            user.Id,
            supplier?.Name ?? user.FullName ?? string.Empty,
            supplier?.SupplierCode ?? string.Empty,
            supplier?.TaxCode,
            supplier?.Address,
            supplier?.Phone ?? user.PhoneNumber,
            supplier?.Email ?? user.Email,
            user.AvatarUrl,
            user.Status,
            user.CreatedOnUtc,
            accommodationSummaries,
            accommodationSummaries.Count,
            totalRooms,
            bookingCount,
            activeBookingCount,
            completedBookingCount);
    }
}
