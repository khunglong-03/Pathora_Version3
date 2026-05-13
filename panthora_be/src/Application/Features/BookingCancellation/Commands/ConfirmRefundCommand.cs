using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Data;
using System.Text.Json.Serialization;

namespace Application.Features.BookingCancellation.Commands;

public sealed record ConfirmRefundCommand(
    [property: JsonPropertyName("requestId")] Guid RequestId,
    [property: JsonPropertyName("refundNote")] string? RefundNote,
    Guid ManagerId) : ICommand<ErrorOr<Success>>;

public sealed class ConfirmRefundCommandValidator : AbstractValidator<ConfirmRefundCommand>
{
    public ConfirmRefundCommandValidator()
    {
        RuleFor(x => x.RequestId).NotEmpty();
        RuleFor(x => x.ManagerId).NotEmpty();
        RuleFor(x => x.RefundNote)
            .MaximumLength(1000)
            .When(x => x.RefundNote is not null)
            .WithMessage("Ghi chú hoàn tiền không được vượt quá 1000 ký tự.");
    }
}

public sealed class ConfirmRefundCommandHandler(
    IBookingCancellationRequestRepository cancellationRequestRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<ConfirmRefundCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        ConfirmRefundCommand request,
        CancellationToken cancellationToken)
    {
        var performedBy = request.ManagerId.ToString();
        List<Error> errors = [];

        await unitOfWork.ExecuteTransactionAsync(IsolationLevel.ReadCommitted, async () =>
        {
            var cancellationRequest = await cancellationRequestRepository.GetById(request.RequestId, cancellationToken);
            if (cancellationRequest is null)
            {
                errors.Add(Error.NotFound(
                    BookingCancellationErrors.RequestNotFoundCode,
                    BookingCancellationErrors.RequestNotFoundDescription.Vi));
                return;
            }

            // Idempotency: already confirmed is a no-op
            if (cancellationRequest.RefundConfirmedAt.HasValue)
                return;

            // Must be Approved to confirm refund
            if (cancellationRequest.Status != Domain.Enums.BookingCancellationRequestStatus.Approved)
            {
                errors.Add(Error.Conflict(
                    BookingCancellationErrors.RequestNotApprovedCode,
                    BookingCancellationErrors.RequestNotApprovedDescription.Vi));
                return;
            }

            // Record refund confirmation (idempotent — entity guards against double-confirm)
            cancellationRequest.ConfirmRefundPaid(request.ManagerId, request.RefundNote);

            await unitOfWork.SaveChangeAsync(cancellationToken);
        });

        if (errors.Count > 0)
            return errors;

        return Result.Success;
    }
}
