using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Data;
using System.Text.Json.Serialization;

namespace Application.Features.BookingCancellation.Commands;

public sealed record RejectCancellationRequestCommand(
    [property: JsonPropertyName("requestId")] Guid RequestId,
    [property: JsonPropertyName("managerNote")] string ManagerNote,
    Guid ManagerId) : ICommand<ErrorOr<Success>>;

public sealed class RejectCancellationRequestCommandValidator
    : AbstractValidator<RejectCancellationRequestCommand>
{
    public RejectCancellationRequestCommandValidator()
    {
        RuleFor(x => x.RequestId).NotEmpty();
        RuleFor(x => x.ManagerId).NotEmpty();
        RuleFor(x => x.ManagerNote)
            .NotEmpty()
            .WithMessage("Ghi chú từ chối không được để trống.")
            .MaximumLength(1000)
            .WithMessage("Ghi chú không được vượt quá 1000 ký tự.");
    }
}

public sealed class RejectCancellationRequestCommandHandler(
    IBookingCancellationRequestRepository cancellationRequestRepository,
    IBookingRepository bookingRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<RejectCancellationRequestCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        RejectCancellationRequestCommand request,
        CancellationToken cancellationToken)
    {
        var performedBy = request.ManagerId.ToString();
        List<Error> errors = [];

        await unitOfWork.ExecuteTransactionAsync(IsolationLevel.RepeatableRead, async () =>
        {
            var cancellationRequest = await cancellationRequestRepository.GetById(request.RequestId, cancellationToken);
            if (cancellationRequest is null)
            {
                errors.Add(Error.NotFound(
                    BookingCancellationErrors.RequestNotFoundCode,
                    BookingCancellationErrors.RequestNotFoundDescription.Vi));
                return;
            }

            // Idempotency: already rejected is a no-op
            if (cancellationRequest.Status == Domain.Enums.BookingCancellationRequestStatus.Rejected)
                return;

            // Must be pending
            if (cancellationRequest.Status != Domain.Enums.BookingCancellationRequestStatus.PendingManagerReview)
            {
                errors.Add(Error.Conflict(
                    BookingCancellationErrors.RequestNotPendingCode,
                    BookingCancellationErrors.RequestNotPendingDescription.Vi));
                return;
            }

            var booking = await bookingRepository.GetByIdWithDetailsAsync(cancellationRequest.BookingId, cancellationToken);
            if (booking is null)
            {
                errors.Add(Error.NotFound(
                    ErrorConstants.Booking.NotFoundCode,
                    ErrorConstants.Booking.NotFoundDescription.Vi));
                return;
            }

            if (booking.Status != Domain.Enums.BookingStatus.PendingCancellation)
            {
                errors.Add(Error.Conflict(
                    "BookingCancellation.NotPendingCancellation",
                    "Yêu cầu hủy không hợp lệ: Booking hiện không ở trạng thái chờ hủy."));
                return;
            }

            // Reject the request — restores booking to previous status
            cancellationRequest.Reject(request.ManagerId, request.ManagerNote);

            // Transition booking back from PendingCancellation to the previous status
            booking.RejectCancellation(cancellationRequest.PreviousBookingStatus, performedBy);

            await bookingRepository.UpdateWithoutSaveAsync(booking);
            await unitOfWork.SaveChangeAsync(cancellationToken);
        });

        if (errors.Count > 0)
            return errors;

        return Result.Success;
    }
}
