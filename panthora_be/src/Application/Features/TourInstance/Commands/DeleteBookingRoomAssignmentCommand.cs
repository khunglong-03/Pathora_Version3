using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;

namespace Application.Features.TourInstance.Commands;

public sealed record DeleteBookingRoomAssignmentCommand(
    Guid TourInstanceId,
    Guid ActivityId,
    Guid AssignmentId) : ICommand<ErrorOr<Success>>;

public sealed class DeleteBookingRoomAssignmentCommandValidator : AbstractValidator<DeleteBookingRoomAssignmentCommand>
{
    public DeleteBookingRoomAssignmentCommandValidator()
    {
        RuleFor(x => x.TourInstanceId).NotEmpty();
        RuleFor(x => x.ActivityId).NotEmpty();
        RuleFor(x => x.AssignmentId).NotEmpty();
    }
}

public sealed class DeleteBookingRoomAssignmentCommandHandler(
    ITourInstanceBookingRoomAssignmentRepository assignmentRepository,
    ITourInstanceRepository instanceRepository,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : ICommandHandler<DeleteBookingRoomAssignmentCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteBookingRoomAssignmentCommand request, CancellationToken cancellationToken)
    {
        var activity = await instanceRepository.FindActivityByIdAsync(request.ActivityId, true, cancellationToken);
        if (activity == null || activity.TourInstanceDay.TourInstanceId != request.TourInstanceId)
        {
            return Error.NotFound("TourInstance.ActivityNotFound", "Activity không tồn tại.");
        }

        var assignment = await assignmentRepository.GetByIdAsync(request.AssignmentId, cancellationToken);
        if (assignment is null || assignment.TourInstanceDayActivityId != request.ActivityId)
        {
            return Error.NotFound("TourInstance.RoomAssignmentNotFound", "Phân bổ phòng không tồn tại.");
        }

        assignmentRepository.Delete(assignment);
        await unitOfWork.SaveChangeAsync(cancellationToken);
        return Result.Success;
    }
}
