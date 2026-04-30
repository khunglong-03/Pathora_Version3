using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;

namespace Application.Features.TourInstance.Commands;

public sealed record SaveBookingRoomAssignmentCommand(
    Guid TourInstanceId,
    Guid ActivityId,
    Guid BookingId,
    RoomType RoomType,
    int RoomCount,
    string? RoomNumbers,
    string? Note) : ICommand<ErrorOr<Success>>;

public sealed class SaveBookingRoomAssignmentCommandValidator : AbstractValidator<SaveBookingRoomAssignmentCommand>
{
    public SaveBookingRoomAssignmentCommandValidator()
    {
        RuleFor(x => x.TourInstanceId).NotEmpty();
        RuleFor(x => x.ActivityId).NotEmpty();
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.RoomCount).GreaterThan(0);
        RuleFor(x => x.RoomNumbers).MaximumLength(500);
        RuleFor(x => x.Note).MaximumLength(1000);
    }
}

public sealed class SaveBookingRoomAssignmentCommandHandler(
    ITourInstanceBookingRoomAssignmentRepository assignmentRepository,
    ITourInstanceRepository instanceRepository,
    IUser user,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : ICommandHandler<SaveBookingRoomAssignmentCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(SaveBookingRoomAssignmentCommand request, CancellationToken cancellationToken)
    {
        var activity = await instanceRepository.FindActivityByIdAsync(request.ActivityId, cancellationToken);
        if (activity == null || activity.TourInstanceDay.TourInstanceId != request.TourInstanceId)
        {
            return Error.NotFound("TourInstance.ActivityNotFound", "Activity không tồn tại.");
        }

        var accommodation = activity.Accommodation;
        if (accommodation == null)
        {
            return Error.Validation("TourInstance.NotAccommodationActivity", "Activity không phải accommodation.");
        }

        if (accommodation.SupplierApprovalStatus != ProviderApprovalStatus.Approved)
        {
            return Error.Validation(
                "TourInstance.AccommodationNotApproved",
                "Khách sạn chưa duyệt activity này — không thể phân bổ phòng.");
        }

        var blockedTotal = accommodation.Quantity;
        var alreadyAssigned = await assignmentRepository.GetTotalRoomsAssignedAsync(
            request.ActivityId, request.BookingId, cancellationToken);

        if (alreadyAssigned + request.RoomCount > blockedTotal)
        {
            return Error.Validation(
                "TourInstance.RoomAssignmentExceedsBlocked",
                $"Tổng số phòng phân bổ vượt quá số phòng đã giữ ({alreadyAssigned + request.RoomCount}/{blockedTotal}).");
        }

        var existing = await assignmentRepository.GetByActivityAndBookingAsync(
            request.ActivityId, request.BookingId, cancellationToken);

        if (existing == null)
        {
            var entity = TourInstanceBookingRoomAssignmentEntity.Create(
                request.ActivityId,
                request.BookingId,
                request.RoomType,
                request.RoomCount,
                request.RoomNumbers,
                request.Note,
                user.Id ?? "SYSTEM");

            await assignmentRepository.AddAsync(entity);
        }
        else
        {
            existing.Update(
                request.RoomType,
                request.RoomCount,
                request.RoomNumbers,
                request.Note,
                user.Id ?? "SYSTEM");
        }

        await unitOfWork.SaveChangeAsync(cancellationToken);
        return Result.Success;
    }
}
