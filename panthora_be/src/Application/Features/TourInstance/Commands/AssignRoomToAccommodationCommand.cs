using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public sealed record AssignRoomToAccommodationCommand(
    Guid InstanceId,
    Guid AccommodationActivityId,
    string RoomType,
    int RoomCount
) : ICommand<ErrorOr<AssignRoomToAccommodationResponse>>;

public sealed record AssignRoomToAccommodationResponse(
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("availabilityWarning")] bool AvailabilityWarning,
    [property: JsonPropertyName("availableAfter")] int AvailableAfter,
    [property: JsonPropertyName("totalRooms")] int TotalRooms
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
    IResourceAvailabilityService availabilityService,
    IUnitOfWork unitOfWork,
    IUser user
) : ICommandHandler<AssignRoomToAccommodationCommand, ErrorOr<AssignRoomToAccommodationResponse>>
{
    public async Task<ErrorOr<AssignRoomToAccommodationResponse>> Handle(AssignRoomToAccommodationCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var ownerSuppliers = await supplierRepository.FindAllByOwnerUserIdAsync(currentUserId, cancellationToken);
        if (ownerSuppliers.Count == 0)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Current user is not associated with any supplier.");
        var ownerSupplierIds = ownerSuppliers.Select(s => s.Id).ToHashSet();

        var instance = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");

        var activity = instance.InstanceDays
            .Where(d => !d.IsDeleted)
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.AccommodationActivityId);

        if (activity is null)
            return Error.NotFound("TourInstanceActivity.NotFound", "Accommodation activity not found.");

        if (activity.ActivityType != TourDayActivityType.Accommodation)
            return Error.Validation("TourInstanceActivity.InvalidType", "Activity is not an accommodation.");

        if (activity.Accommodation?.SupplierId is null || !ownerSupplierIds.Contains(activity.Accommodation.SupplierId.Value))
            return Error.Validation("TourInstance.ProviderNotAssigned", "You are not assigned as the Hotel provider for this accommodation activity.");

        var supplier = ownerSuppliers.First(s => s.Id == activity.Accommodation.SupplierId.Value);

        if (activity.TourInstanceDay == null)
            return Error.Validation("TourInstanceActivity.NoDay", "Activity is not correctly linked to an instance day.");

        if (!Enum.TryParse<RoomType>(request.RoomType, true, out var roomType))
            return Error.Validation("RoomType.Invalid", "Invalid room type.");

        // Hard capacity check
        var availabilityCheck = await availabilityService.CheckRoomAvailabilityAsync(
            supplier.Id,
            roomType,
            activity.TourInstanceDay.ActualDate,
            request.RoomCount,
            request.AccommodationActivityId,
            cancellationToken);

        if (availabilityCheck.IsError) return availabilityCheck.Errors;
        if (!availabilityCheck.Value)
        {
            return Error.Validation("RoomBlock.InsufficientInventory", "Không đủ phòng trống cho loại phòng này vào ngày đã chọn.");
        }

        var inventory = await inventoryRepository.FindByHotelAndRoomTypeAsync(supplier.Id, roomType, cancellationToken);
        var blockedDate = activity.TourInstanceDay.ActualDate;

        await unitOfWork.ExecuteTransactionAsync(async () =>
        {
            await roomBlockRepository.DeleteByTourInstanceDayActivityIdAsync(request.AccommodationActivityId, cancellationToken);

            var block = RoomBlockEntity.Create(
                supplierId: supplier.Id,
                roomType: roomType,
                blockedDate: blockedDate,
                roomCountBlocked: request.RoomCount,
                performedBy: currentUserId.ToString(),
                tourInstanceDayActivityId: request.AccommodationActivityId,
                holdStatus: HoldStatus.Hard); // Hard hold since it's provider assignment

            roomBlockRepository.Add(block);
            await unitOfWork.SaveChangeAsync(cancellationToken);
        });

        return new AssignRoomToAccommodationResponse(
            Success: true,
            AvailabilityWarning: false, // Now it's a hard error if insufficient
            AvailableAfter: 0, // Not used anymore for warnings
            TotalRooms: inventory?.TotalRooms ?? 0);
    }
}
