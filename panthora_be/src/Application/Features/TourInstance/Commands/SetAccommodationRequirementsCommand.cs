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

public sealed record SetAccommodationRequirementsCommand(
    Guid InstanceId,
    Guid AccommodationActivityId,
    string RoomType,
    int Quantity
) : ICommand<ErrorOr<Success>>;

public sealed class SetAccommodationRequirementsCommandValidator : AbstractValidator<SetAccommodationRequirementsCommand>
{
    public SetAccommodationRequirementsCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.AccommodationActivityId).NotEmpty();
        RuleFor(x => x.RoomType).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0).LessThanOrEqualTo(1000);
    }
}

public sealed class SetAccommodationRequirementsCommandHandler(
    IRoomBlockRepository roomBlockRepository,
    ITourInstanceRepository tourInstanceRepository,
    IUnitOfWork unitOfWork,
    IUser user
) : ICommandHandler<SetAccommodationRequirementsCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(SetAccommodationRequirementsCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        // Verify role: TourOperator, Manager or Admin
        if (!user.Roles.Any(r => r == "TourOperator" || r == "Manager" || r == "Admin"))
        {
             return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, "Only Tour Operators and Managers can set accommodation requirements.");
        }

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

        if (activity.Accommodation == null)
            return Error.Validation("TourInstanceActivity.NoAccommodation", "Accommodation details not found on this activity.");

        if (!Enum.TryParse<RoomType>(request.RoomType, true, out var roomType))
            return Error.Validation("RoomType.Invalid", "Invalid room type.");

        await unitOfWork.ExecuteTransactionAsync(async () =>
        {
            activity.Accommodation.Update(
                roomType: roomType,
                quantity: request.Quantity,
                checkInTime: activity.Accommodation.CheckInTime,
                checkOutTime: activity.Accommodation.CheckOutTime,
                supplierId: activity.Accommodation.SupplierId
            );

            // If a supplier is assigned, setting requirements resets approval to Pending
            if (activity.Accommodation.SupplierId.HasValue)
            {
                 activity.Accommodation.SupplierApprovalStatus = ProviderApprovalStatus.Pending;
                 activity.Accommodation.SupplierApprovalNote = null;
            }

            // Delete any existing room blocks since the requirements have changed
            await roomBlockRepository.DeleteByTourInstanceDayActivityIdAsync(request.AccommodationActivityId, cancellationToken);
            
            await unitOfWork.SaveChangeAsync(cancellationToken);
        });

        return Result.Success;
    }
}
