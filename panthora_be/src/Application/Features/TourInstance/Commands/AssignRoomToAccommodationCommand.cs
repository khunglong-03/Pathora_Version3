using Application.Common;
using Application.Common.Constant;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using BuildingBlocks.CORS;

namespace Application.Features.TourInstance.Commands;

public sealed record AssignRoomToAccommodationCommand(
    Guid InstanceId,
    Guid AccommodationActivityId,
    string RoomType,
    int RoomCount
) : ICommand<ErrorOr<AssignRoomToAccommodationResponse>>;

public sealed record AssignRoomToAccommodationResponse(
    bool Success,
    bool AvailabilityWarning,
    int AvailableAfter,
    int TotalRooms
);

public sealed class AssignRoomToAccommodationCommandValidator : AbstractValidator<AssignRoomToAccommodationCommand>
{
    public AssignRoomToAccommodationCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.AccommodationActivityId).NotEmpty();
        RuleFor(x => x.RoomType).NotEmpty();
        RuleFor(x => x.RoomCount).GreaterThan(0).LessThanOrEqualTo(1000);
    }
}

public sealed class AssignRoomToAccommodationCommandHandler(
    IRoomBlockRepository roomBlockRepository,
    IHotelRoomInventoryRepository inventoryRepository,
    ISupplierRepository supplierRepository,
    ITourInstanceRepository tourInstanceRepository,
    IUnitOfWork unitOfWork,
    IUser user
) : ICommandHandler<AssignRoomToAccommodationCommand, ErrorOr<AssignRoomToAccommodationResponse>>
{
    public async Task<ErrorOr<AssignRoomToAccommodationResponse>> Handle(AssignRoomToAccommodationCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var supplier = await supplierRepository.FindByOwnerUserIdAsync(currentUserId, cancellationToken);
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Current user is not associated with any supplier.");

        var instance = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");

        if (instance.HotelProviderId != supplier.Id)
            return Error.Validation("TourInstance.ProviderNotAssigned", "You are not assigned as the Hotel provider for this tour instance.");

        var activity = instance.InstanceDays
            .Where(d => !d.IsDeleted)
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.AccommodationActivityId);

        if (activity is null)
            return Error.NotFound("TourInstanceActivity.NotFound", "Accommodation activity not found.");

        if (activity.ActivityType != TourDayActivityType.Accommodation)
            return Error.Validation("TourInstanceActivity.InvalidType", "Activity is not an accommodation.");

        if (activity.TourInstanceDay == null)
            return Error.Validation("TourInstanceActivity.NoDay", "Activity is not correctly linked to an instance day.");

        if (!Enum.TryParse<RoomType>(request.RoomType, true, out var roomType))
            return Error.Validation("RoomType.Invalid", "Invalid room type.");

        var inventory = await inventoryRepository.FindByHotelAndRoomTypeAsync(supplier.Id, roomType, cancellationToken);
        if (inventory is null)
            return Error.Validation("Inventory.NotFound", "Khách sạn không có loại phòng này.");

        var blockedDate = activity.TourInstanceDay.ActualDate;

        var existingBlocked = await roomBlockRepository.GetBlockedRoomCountAsync(supplier.Id, roomType, blockedDate, cancellationToken);
        var selfBlocksList = await roomBlockRepository.GetByTourInstanceDayActivityIdAsync(request.AccommodationActivityId, cancellationToken);
        var selfBlocks = selfBlocksList.Where(r => r.RoomType == roomType).Sum(r => r.RoomCountBlocked);

        var netBlocked = existingBlocked - selfBlocks;
        var available = inventory.TotalRooms - netBlocked;

        await unitOfWork.ExecuteTransactionAsync(async () =>
        {
            await roomBlockRepository.DeleteByTourInstanceDayActivityIdAsync(request.AccommodationActivityId, cancellationToken);

            var block = RoomBlockEntity.Create(
                supplierId: supplier.Id,
                roomType: roomType,
                blockedDate: blockedDate,
                roomCountBlocked: request.RoomCount,
                performedBy: currentUserId.ToString(),
                tourInstanceDayActivityId: request.AccommodationActivityId);

            roomBlockRepository.Add(block);
            await unitOfWork.SaveChangeAsync(cancellationToken);
        });

        return new AssignRoomToAccommodationResponse(
            Success: true,
            AvailabilityWarning: request.RoomCount > available,
            AvailableAfter: available - request.RoomCount,
            TotalRooms: inventory.TotalRooms);
    }
}
