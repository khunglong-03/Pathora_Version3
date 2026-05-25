using Application.Common;
using Application.Common.Constant;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Data;
using System.Text.Json.Serialization;

namespace Application.Features.BookingCancellation.Commands;

public sealed record ApproveCancellationRequestCommand(
    [property: JsonPropertyName("requestId")] Guid RequestId,
    [property: JsonPropertyName("managerNote")] string? ManagerNote,
    Guid ManagerId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking, CacheKey.TourInstance];
}

public sealed class ApproveCancellationRequestCommandValidator
    : AbstractValidator<ApproveCancellationRequestCommand>
{
    public ApproveCancellationRequestCommandValidator()
    {
        RuleFor(x => x.RequestId).NotEmpty();
        RuleFor(x => x.ManagerId).NotEmpty();
        RuleFor(x => x.ManagerNote)
            .MaximumLength(1000)
            .When(x => x.ManagerNote is not null)
            .WithMessage("Ghi chú quản lý không được vượt quá 1000 ký tự.");
    }
}

public sealed class ApproveCancellationRequestCommandHandler(
    IBookingCancellationRequestRepository cancellationRequestRepository,
    IBookingRepository bookingRepository,
    ITourInstanceRepository tourInstanceRepository,
    IBookingTourGuideRepository bookingTourGuideRepository,
    ISupplierPayableRepository supplierPayableRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<ApproveCancellationRequestCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        ApproveCancellationRequestCommand request,
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

            // Idempotency: already approved is a no-op
            if (cancellationRequest.Status == Domain.Enums.BookingCancellationRequestStatus.Approved)
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

            // Approve the request (idempotent — throws if not PendingReview, guarded above)
            cancellationRequest.Approve(request.ManagerId, request.ManagerNote);

            // Update booking status from PendingCancellation to Cancelled
            var approvalReason = request.ManagerNote ?? cancellationRequest.CustomerReason;
            booking.ApproveCancellation(approvalReason, performedBy);
            booking.InitializeRefundTrackingWithAmount(cancellationRequest.RefundAmount, performedBy);

            // Free up participant slots
            var tourInstance = booking.TourInstance;
            if (tourInstance is not null)
            {
                var totalParticipants = booking.NumberAdult + booking.NumberChild + booking.NumberInfant;
                if (totalParticipants > 0)
                {
                    tourInstance.RemoveParticipant(totalParticipants);
                    await tourInstanceRepository.Update(tourInstance, cancellationToken);
                }
            }

            // 10.D.1 Cleanup BookingTourGuide assignments
            var tourGuides = await bookingTourGuideRepository.GetByBookingIdAsync(booking.Id, cancellationToken);
            foreach (var guide in tourGuides)
            {
                guide.Cancel(performedBy);
                bookingTourGuideRepository.Update(guide);
            }

            // 10.D.3 Cleanup SupplierPayables
            var payables = await supplierPayableRepository.GetByBookingIdAsync(booking.Id, cancellationToken);
            foreach (var payable in payables)
            {
                payable.Cancel(performedBy);
                supplierPayableRepository.Update(payable);
            }

            // 10.D.5 Per-booking blocks: Chỉ có instance-level blocks (không có per-booking block cho Room/Vehicle). Doc note vào design.md.

            await bookingRepository.UpdateWithoutSaveAsync(booking);
            await unitOfWork.SaveChangeAsync(cancellationToken);
        });

        if (errors.Count > 0)
            return errors;

        return Result.Success;
    }
}
