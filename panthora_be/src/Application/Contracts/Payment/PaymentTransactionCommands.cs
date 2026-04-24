using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Contracts.Payment;

public sealed record CreatePaymentTransactionCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("type")] TransactionType Type,
    [property: JsonPropertyName("amount")] decimal Amount,
    [property: JsonPropertyName("paymentMethod")] PaymentMethod PaymentMethod,
    [property: JsonPropertyName("paymentNote")] string PaymentNote,
    [property: JsonPropertyName("createdBy")] string CreatedBy,
    [property: JsonPropertyName("expirationMinutes")] int ExpirationMinutes = 30
) : IRequest<ErrorOr<PaymentTransactionEntity>>;

public class CreatePaymentTransactionCommandValidator : AbstractValidator<CreatePaymentTransactionCommand>
{
    public CreatePaymentTransactionCommandValidator()
    {
        RuleFor(x => x.BookingId)
            .NotEmpty().WithMessage(ValidationMessages.PaymentBookingIdRequired);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(ValidationMessages.PaymentAmountGreaterThanZero);

        RuleFor(x => x.PaymentNote)
            .NotEmpty().WithMessage(ValidationMessages.PaymentContentRequired)
            .MaximumLength(500).WithMessage(ValidationMessages.PaymentContentMaxLength500);

        RuleFor(x => x.CreatedBy)
            .NotEmpty().WithMessage(ValidationMessages.PaymentCreatorRequired);
    }
}

public sealed class CreatePaymentTransactionCommandHandler(
    IPaymentService paymentService,
    IBookingRepository bookingRepository)
    : IRequestHandler<CreatePaymentTransactionCommand, ErrorOr<PaymentTransactionEntity>>
{
    public async Task<ErrorOr<PaymentTransactionEntity>> Handle(
        CreatePaymentTransactionCommand request,
        CancellationToken cancellationToken)
    {
        // Verify booking exists
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking == null)
        {
            return Error.NotFound(ErrorConstants.Payment.BookingNotFoundCode, ErrorConstants.Payment.BookingNotFoundDescription);
        }

        // Verify booking can accept payments
        if (booking.Status == BookingStatus.Cancelled)
        {
            return Error.Conflict(ErrorConstants.Payment.TransactionAlreadyCancelledCode, ErrorConstants.Payment.TransactionAlreadyCancelledDescription);
        }

        if (booking.Status == BookingStatus.Completed)
        {
            return Error.Conflict(ErrorConstants.Payment.TransactionAlreadyCompletedCode, ErrorConstants.Payment.TransactionAlreadyCompletedDescription);
        }

        return await paymentService.CreatePaymentTransactionAsync(
            bookingId: request.BookingId,
            type: request.Type,
            amount: request.Amount,
            paymentMethod: request.PaymentMethod,
            paymentNote: request.PaymentNote,
            createdBy: request.CreatedBy,
            expirationMinutes: request.ExpirationMinutes);
    }
}

public sealed record GetPaymentTransactionQuery([property: JsonPropertyName("transactionCode")] string TransactionCode) : IRequest<ErrorOr<PaymentTransactionEntity>>;

public sealed class GetPaymentTransactionQueryHandler(IPaymentService paymentService)
    : IRequestHandler<GetPaymentTransactionQuery, ErrorOr<PaymentTransactionEntity>>
{
    public async Task<ErrorOr<PaymentTransactionEntity>> Handle(
        GetPaymentTransactionQuery request,
        CancellationToken cancellationToken)
    {
        return await paymentService.GetTransactionByCodeAsync(request.TransactionCode);
    }
}

public sealed record ExpirePaymentTransactionCommand([property: JsonPropertyName("transactionCode")] string TransactionCode) : IRequest<ErrorOr<PaymentTransactionEntity>>;

public class ExpirePaymentTransactionCommandValidator : AbstractValidator<ExpirePaymentTransactionCommand>
{
    public ExpirePaymentTransactionCommandValidator()
    {
        RuleFor(x => x.TransactionCode)
            .NotEmpty().WithMessage(ValidationMessages.PaymentTransactionIdRequired);
    }
}

public sealed class ExpirePaymentTransactionCommandHandler(IPaymentService paymentService)
    : IRequestHandler<ExpirePaymentTransactionCommand, ErrorOr<PaymentTransactionEntity>>
{
    public async Task<ErrorOr<PaymentTransactionEntity>> Handle(
        ExpirePaymentTransactionCommand request,
        CancellationToken cancellationToken)
    {
        return await paymentService.ExpireTransactionAsync(request.TransactionCode);
    }
}

public sealed record GetNormalizedPaymentStatusQuery([property: JsonPropertyName("transactionCode")] string TransactionCode)
    : IRequest<ErrorOr<PaymentStatusSnapshot>>;

public class GetNormalizedPaymentStatusQueryValidator : AbstractValidator<GetNormalizedPaymentStatusQuery>
{
    public GetNormalizedPaymentStatusQueryValidator()
    {
        RuleFor(x => x.TransactionCode)
            .NotEmpty().WithMessage(ValidationMessages.PaymentTransactionIdRequired);
    }
}

public sealed class GetNormalizedPaymentStatusQueryHandler(IPaymentReconciliationService paymentReconciliationService)
    : IRequestHandler<GetNormalizedPaymentStatusQuery, ErrorOr<PaymentStatusSnapshot>>
{
    public async Task<ErrorOr<PaymentStatusSnapshot>> Handle(
        GetNormalizedPaymentStatusQuery request,
        CancellationToken cancellationToken)
    {
        return await paymentReconciliationService.GetNormalizedStatusAsync(request.TransactionCode);
    }
}

public sealed record ReconcilePaymentReturnCommand([property: JsonPropertyName("transactionCode")] string TransactionCode)
    : IRequest<ErrorOr<PaymentStatusSnapshot>>;

public class ReconcilePaymentReturnCommandValidator : AbstractValidator<ReconcilePaymentReturnCommand>
{
    public ReconcilePaymentReturnCommandValidator()
    {
        RuleFor(x => x.TransactionCode)
            .NotEmpty().WithMessage(ValidationMessages.PaymentTransactionIdRequired);
    }
}

public sealed class ReconcilePaymentReturnCommandHandler(IPaymentReconciliationService paymentReconciliationService)
    : IRequestHandler<ReconcilePaymentReturnCommand, ErrorOr<PaymentStatusSnapshot>>
{
    public async Task<ErrorOr<PaymentStatusSnapshot>> Handle(
        ReconcilePaymentReturnCommand request,
        CancellationToken cancellationToken)
    {
        return await paymentReconciliationService.ReconcileReturnAsync(request.TransactionCode);
    }
}

public sealed record ReconcilePaymentCancelCommand([property: JsonPropertyName("transactionCode")] string TransactionCode)
    : IRequest<ErrorOr<PaymentStatusSnapshot>>;

public class ReconcilePaymentCancelCommandValidator : AbstractValidator<ReconcilePaymentCancelCommand>
{
    public ReconcilePaymentCancelCommandValidator()
    {
        RuleFor(x => x.TransactionCode)
            .NotEmpty().WithMessage(ValidationMessages.PaymentTransactionIdRequired);
    }
}

public sealed class ReconcilePaymentCancelCommandHandler(IPaymentReconciliationService paymentReconciliationService)
    : IRequestHandler<ReconcilePaymentCancelCommand, ErrorOr<PaymentStatusSnapshot>>
{
    public async Task<ErrorOr<PaymentStatusSnapshot>> Handle(
        ReconcilePaymentCancelCommand request,
        CancellationToken cancellationToken)
    {
        return await paymentReconciliationService.ReconcileCancelAsync(request.TransactionCode);
    }
}

/// <summary>
/// Proactively checks SePay for a matching payment for the given transaction code.
/// Called when the user clicks "Kiểm tra giao dịch" button on the payment page.
/// Uses FetchTransactionsInRangeAsync (last 10 minutes) for accurate matching.
/// </summary>
public sealed record CheckPaymentNowCommand([property: JsonPropertyName("transactionCode")] string TransactionCode)
    : IRequest<ErrorOr<PaymentStatusSnapshot>>;

public class CheckPaymentNowCommandValidator : AbstractValidator<CheckPaymentNowCommand>
{
    public CheckPaymentNowCommandValidator()
    {
        RuleFor(x => x.TransactionCode)
            .NotEmpty().WithMessage(ValidationMessages.PaymentTransactionIdRequired);
    }
}

public sealed class CheckPaymentNowCommandHandler(
    IPaymentService paymentService,
    ISePayApiClient sePayApiClient,
    IPaymentNotificationBroadcaster? notificationBroadcaster,
    ILogger<CheckPaymentNowCommandHandler> logger)
    : IRequestHandler<CheckPaymentNowCommand, ErrorOr<PaymentStatusSnapshot>>
{
    public async Task<ErrorOr<PaymentStatusSnapshot>> Handle(
        CheckPaymentNowCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Fetch transaction from DB
        var transactionResult = await paymentService.GetTransactionByCodeAsync(request.TransactionCode);
        if (transactionResult.IsError)
        {
            return transactionResult.Errors;
        }

        var transaction = transactionResult.Value;

        // 2. If already completed or cancelled, return immediately
        if (transaction.Status == TransactionStatus.Completed)
        {
            return BuildCheckSnapshot(transaction, "check-payment", verifiedWithProvider: true);
        }

        if (transaction.Status != TransactionStatus.Pending)
        {
            return Error.Conflict(
                ErrorConstants.Payment.TransactionAlreadyCompletedCode,
                ErrorConstants.Payment.TransactionAlreadyCompletedDescription);
        }

        // 3. If expired, mark as failed and return
        if (transaction.IsExpired())
        {
            var expireResult = await paymentService.ExpireTransactionAsync(request.TransactionCode);
            if (!expireResult.IsError)
            {
                var latest = await paymentService.GetTransactionByCodeAsync(request.TransactionCode);
                if (!latest.IsError)
                {
                    return BuildCheckSnapshot(latest.Value, "check-payment", verifiedWithProvider: false);
                }
            }
            return BuildCheckSnapshot(transaction, "check-payment", verifiedWithProvider: false);
        }

        // 4. Poll SePay for the last 10 minutes
        if (!sePayApiClient.IsConfigured)
        {
            logger.LogDebug("SePay API not configured, skipping provider check for {TransactionCode}", request.TransactionCode);
            return BuildCheckSnapshot(transaction, "check-payment", verifiedWithProvider: false);
        }

        var now = DateTimeOffset.UtcNow;
        var sepayTransactions = await sePayApiClient.FetchTransactionsInRangeAsync(
            now.AddMinutes(-30), now, cancellationToken);

        // 5. 3-tier match: exact refcode → partial substring → content search
        var matched = sepayTransactions.FirstOrDefault(t =>
            SepayMatchingService.MatchTransaction(t, transaction) != null);

        if (matched == null)
        {
            // No payment found — return current pending status
            return BuildCheckSnapshot(transaction, "check-payment", verifiedWithProvider: false);
        }

        // 6. Process the matched payment
        var transactionData = SepayParsingHelper.ToTransactionData(matched);
        var processResult = await paymentService.ProcessSepayCallbackAsync(transactionData);

        if (processResult.IsError)
        {
            logger.LogWarning(
                "CheckPayment: failed to process payment for {TransactionCode}: {Errors}",
                request.TransactionCode,
                string.Join(", ", processResult.Errors.Select(e => e.Description)));
            return BuildCheckSnapshot(transaction, "check-payment", verifiedWithProvider: false);
        }

        // 7. Broadcast SignalR
        var snapshot2 = new PaymentStatusSnapshot(
            processResult.Value.TransactionCode,
            PaymentStatusMapper.Paid,
            processResult.Value.Status.ToString(),
            "check-payment",
            VerifiedWithProvider: true,
            IsTerminal: true,
            DateTimeOffset.UtcNow,
            transactionData.TransactionId);

        if (notificationBroadcaster != null)
        {
            await notificationBroadcaster.BroadcastAsync(snapshot2, cancellationToken);
        }

        return snapshot2;
    }

    private static PaymentStatusSnapshot BuildCheckSnapshot(
        PaymentTransactionEntity transaction,
        string source,
        bool verifiedWithProvider)
    {
        return new PaymentStatusSnapshot(
            transaction.TransactionCode,
            PaymentStatusMapper.FromTransaction(transaction),
            transaction.Status.ToString(),
            source,
            verifiedWithProvider,
            PaymentStatusMapper.IsTerminal(PaymentStatusMapper.FromTransaction(transaction)),
            DateTimeOffset.UtcNow,
            transaction.ExternalTransactionId);
    }
}
