using Application.Common.Constant;
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
    IRoomBlockRepository roomBlockRepository,
    IBookingRepository bookingRepository,
    IUser user,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : ICommandHandler<SaveBookingRoomAssignmentCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(SaveBookingRoomAssignmentCommand request, CancellationToken cancellationToken)
    {
        var activity = await instanceRepository.FindActivityByIdAsync(request.ActivityId, true, cancellationToken);
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

        var booking = await bookingRepository.GetByIdAsync(request.BookingId, cancellationToken);
        if (booking is null || booking.TourInstanceId != request.TourInstanceId)
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        var guestCount = booking.TotalParticipants();

        var blocks = await roomBlockRepository.GetByTourInstanceDayActivityIdAsync(
            request.ActivityId, cancellationToken);
        var blockedTotal = blocks.Sum(b => b.RoomCountBlocked);

        if (blockedTotal <= 0)
        {
            return Error.Validation(
                "TourInstance.RoomAssignmentNoBlocks",
                "Activity chưa có phòng nào được block bởi supplier — không thể phân bổ.");
        }

        var existingLine = await assignmentRepository.GetByActivityBookingAndRoomTypeAsync(
            request.ActivityId,
            request.BookingId,
            request.RoomType,
            cancellationToken);

        var bookingRoomTotal = await assignmentRepository.GetTotalRoomsForBookingAsync(
            request.ActivityId,
            request.BookingId,
            cancellationToken);
        var newBookingRoomTotal = bookingRoomTotal - (existingLine?.RoomCount ?? 0) + request.RoomCount;

        if (newBookingRoomTotal > guestCount)
        {
            return Error.Validation(
                TourInstanceBookingRoomErrors.RoomCountExceedsGuestCountCode,
                TourInstanceBookingRoomErrors.RoomCountExceedsGuestCountDescription
                    .Replace("{guestCount}", guestCount.ToString(), StringComparison.Ordinal)
                    .Replace("{roomCount}", newBookingRoomTotal.ToString(), StringComparison.Ordinal));
        }

        var activityRoomTotal = await assignmentRepository.GetTotalRoomsAssignedAsync(
            request.ActivityId,
            cancellationToken: cancellationToken);
        var newActivityRoomTotal = activityRoomTotal - (existingLine?.RoomCount ?? 0) + request.RoomCount;

        if (newActivityRoomTotal > blockedTotal)
        {
            return Error.Validation(
                "TourInstance.RoomAssignmentExceedsBlocked",
                $"Tổng số phòng phân bổ vượt quá số phòng đã block ({newActivityRoomTotal}/{blockedTotal}).");
        }

        if (existingLine == null)
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
            existingLine.Update(
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
