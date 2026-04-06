using System.Security.Cryptography;
using Application.Common.Constant;
using Application.Options;
using Domain.Common.Repositories;
using Microsoft.Extensions.Options;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OutboxMessage = Domain.Entities.OutboxMessage;

namespace Application.Services;

public interface IPaymentService
{
    Task<ErrorOr<string>> GetQR(string note, long amount);
    Task<ErrorOr<PaymentTransactionEntity>> CreatePaymentTransactionAsync(
        Guid bookingId,
        TransactionType type,
        decimal amount,
        PaymentMethod paymentMethod,
        string paymentNote,
        string createdBy,
        int? expirationMinutes = null);
    Task<ErrorOr<PaymentTransactionEntity>> GetTransactionByCodeAsync(string transactionCode);
    Task<ErrorOr<PaymentTransactionEntity>> ProcessSepayCallbackAsync(SepayTransactionData transactionData);
    Task<ErrorOr<PaymentTransactionEntity>> ExpireTransactionAsync(string transactionCode);
    /// <summary>
    /// Expires a pending transaction and cancels the associated booking atomically.
    /// Used by the expiration sweep (Phase 2).
    /// </summary>
    Task<ErrorOr<PaymentTransactionEntity>> ExpireTransactionAndCancelBookingAsync(string transactionCode);
}

public class PaymentService : IPaymentService
{
    private const string OutboxTypePaymentCheck = OutboxMessageTypeConstants.PaymentCheck;
    private readonly string _sepayAccountNumber;
    private readonly string _sepayBankCode;
    private readonly string _sepayQrBaseUrl;
    private readonly string _frontendBaseUrl;
    private readonly string _vietQrApiUrl;
    private readonly string _vietQrBankBin;
    private readonly string _vietQrAccountNo;
    private readonly string _vietQrAccountName;
    private readonly string _vietQrTemplateId;
    private readonly IPaymentTransactionRepository _transactionRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IOutboxRepository _outboxRepository;
    private readonly ITourInstanceRepository _tourInstanceRepository;
    private readonly ILogger<PaymentService> _logger;
    private readonly Domain.UnitOfWork.IUnitOfWork _unitOfWork;

    public PaymentService(
        IPaymentTransactionRepository transactionRepository,
        IBookingRepository bookingRepository,
        IOutboxRepository outboxRepository,
        ITourInstanceRepository tourInstanceRepository,
        ILogger<PaymentService> logger,
        IConfiguration configuration,
        Domain.UnitOfWork.IUnitOfWork unitOfWork)
    {
        _transactionRepository = transactionRepository;
        _bookingRepository = bookingRepository;
        _outboxRepository = outboxRepository;
        _tourInstanceRepository = tourInstanceRepository;
        _logger = logger;
        _unitOfWork = unitOfWork;
        _sepayAccountNumber = NormalizeConfigValue(configuration["Payment:Account"]);
        _sepayBankCode = NormalizeConfigValue(configuration["Payment:Bank"]);
        _sepayQrBaseUrl = NormalizeConfigValue(configuration["Payment:QrBaseUrl"]);
        _frontendBaseUrl = NormalizeConfigValue(configuration["AppConfig:FrontendBaseUrl"]);
        _vietQrApiUrl = NormalizeConfigValue(configuration["VietQR:ApiUrl"]);
        _vietQrBankBin = NormalizeConfigValue(configuration["VietQR:BankBin"]);
        _vietQrAccountNo = NormalizeConfigValue(configuration["VietQR:AccountNo"]);
        _vietQrAccountName = NormalizeConfigValue(configuration["VietQR:AccountName"]);
        _vietQrTemplateId = NormalizeConfigValue(configuration["VietQR:TemplateId"]);
    }

    public Task<ErrorOr<string>> GetQR(string note, long amount)
    {
        if (string.IsNullOrWhiteSpace(_vietQrApiUrl)
            || string.IsNullOrWhiteSpace(_vietQrBankBin)
            || string.IsNullOrWhiteSpace(_vietQrAccountNo)
            || string.IsNullOrWhiteSpace(_vietQrTemplateId))
        {
            return Task.FromResult<ErrorOr<string>>(
                Error.Failure(
                    ErrorConstants.Payment.PaymentProcessingFailedCode,
                    "VietQR configuration is missing. Set VietQR:ApiUrl, VietQR:BankBin, VietQR:AccountNo, and VietQR:TemplateId."));
        }

        // Use the note parameter (refCode) directly as addInfo.
        // Note: note IS the refCode passed from CreatePaymentTransactionAsync, not free text.
        var encodedAccountName = Uri.EscapeDataString(_vietQrAccountName);
        var encodedAddInfo = Uri.EscapeDataString(note);

        // VietQR URL format:
        // https://api.vietqr.io/image/{bankBin}-{accountNo}-{templateId}.jpg
        //     ?accountName={name}&amount={amount}&addInfo={refCode}
        var imageId = $"{_vietQrBankBin}-{_vietQrAccountNo}-{_vietQrTemplateId}";
        var url = $"{_vietQrApiUrl.TrimEnd('/')}/{imageId}.jpg?accountName={encodedAccountName}&amount={amount}&addInfo={encodedAddInfo}";

        return Task.FromResult<ErrorOr<string>>(url);
    }

    public async Task<ErrorOr<PaymentTransactionEntity>> CreatePaymentTransactionAsync(
        Guid bookingId,
        TransactionType type,
        decimal amount,
        PaymentMethod paymentMethod,
        string paymentNote,
        string createdBy,
        int? expirationMinutes = null)
    {
        var transactionCode = $"PAY-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        var expiredAt = DateTimeOffset.UtcNow.AddMinutes(expirationMinutes ?? 30);

        // Generate 12-char reference code: yyMMddHH (8 chars) + 4 Base36 random.
        // 4 Base36 chars = 36^4 ≈ 1.67 million combos per hour-minute combo.
        var randomChars = GenerateBase36Random(4);
        var refCode = $"{DateTimeOffset.UtcNow:yyMMddHH}{randomChars}";

        var paymentNoteWithRef = $"{transactionCode}|{refCode}|{paymentNote}";

        var transaction = PaymentTransactionEntity.Create(
            bookingId: bookingId,
            transactionCode: transactionCode,
            type: type,
            amount: amount,
            paymentMethod: paymentMethod,
            paymentNote: paymentNoteWithRef,
            createdBy: createdBy,
            expiredAt: expiredAt,
            referenceCode: refCode);

        // VietQR path: generate QR URL using the new 12-char refCode
        var qrResult = await GetQR(refCode, (long)amount);
        if (qrResult.IsError)
        {
            return qrResult.Errors;
        }
        transaction.CheckoutUrl = qrResult.Value;
        _logger.LogInformation("Created payment transaction {TransactionCode} with VietQR URL", transactionCode);

        await _transactionRepository.AddAsync(transaction);

        // Create outbox message for background payment check
        var outboxPayload = System.Text.Json.JsonSerializer.Serialize(new
        {
            TransactionId = transaction.Id,
            TransactionCode = transactionCode,
            ReferenceCode = refCode,
            BookingId = bookingId,
            Amount = amount,
            CreatedAt = DateTimeOffset.UtcNow
        });
        var outboxMessage = OutboxMessage.Create(OutboxTypePaymentCheck, outboxPayload);
        await _outboxRepository.AddAsync(outboxMessage);

        return transaction;
    }

    public async Task<ErrorOr<PaymentTransactionEntity>> GetTransactionByCodeAsync(string transactionCode)
    {
        var transaction = await _transactionRepository.GetByTransactionCodeAsync(transactionCode);
        if (transaction == null)
        {
            return Error.NotFound(ErrorConstants.Payment.TransactionNotFoundCode, ErrorConstants.Payment.TransactionNotFoundDescription);
        }
        return transaction;
    }

    public async Task<ErrorOr<PaymentTransactionEntity>> ProcessSepayCallbackAsync(SepayTransactionData transactionData)
    {
        var transactionCode = ExtractTransactionCode(transactionData.TransactionContent);

        PaymentTransactionEntity? transaction = null;

        if (!string.IsNullOrEmpty(transactionCode))
        {
            transaction = await _transactionRepository.GetByTransactionCodeAsync(transactionCode);
        }

        // Fallback: if transaction_code extraction failed (e.g. VietQR refCode-only content),
        // try to find by matching ReferenceCode from transaction_content
        if (transaction == null)
        {
            var content = transactionData.TransactionContent ?? string.Empty;
            if (!string.IsNullOrEmpty(content))
            {
                // Try each token in the content as a potential refCode
                var tokens = content.Split(new[] { ' ', '|', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var token in tokens)
                {
                    var found = await _transactionRepository.FindPendingByReferenceCodeAsync(token.Trim());
                    if (found != null)
                    {
                        _logger.LogInformation(
                            "Found transaction by ReferenceCode fallback: {RefCode} -> {TransactionCode}",
                            token, found.TransactionCode);
                        // Set ReferenceCode on the found entity so MarkAsPaid can use it
                        found.ReferenceCode = token.Trim();
                        transaction = found;
                        break;
                    }
                }
            }
        }

        if (transaction == null)
        {
            _logger.LogWarning("Transaction not found for content: {Content}", transactionData.TransactionContent);
            return Error.NotFound(ErrorConstants.Payment.TransactionNotFoundCode, ErrorConstants.Payment.TransactionNotFoundDescription);
        }

        // Idempotency: Check if already processed
        if (transaction.Status == TransactionStatus.Completed)
        {
            _logger.LogInformation("Transaction {TransactionCode} already processed, returning existing record", transaction.TransactionCode);
            return transaction;
        }

        if (transaction.Status != TransactionStatus.Pending)
        {
            _logger.LogWarning("Transaction {TransactionCode} has unexpected status: {Status}", transaction.TransactionCode, transaction.Status);
            return Error.Conflict(ErrorConstants.Payment.TransactionAlreadyCompletedCode, ErrorConstants.Payment.TransactionAlreadyCompletedDescription);
        }

        // NOTE: We DO NOT check IsExpired() here. If the customer has already transferred money
        // (matched by content + amount from SePay), we must mark the payment as paid
        // regardless of expiration. The expiration sweep handles auto-cancellation separately.

        // Mark transaction as paid
        transaction.MarkAsPaid(
            paidAmount: transactionData.Amount,
            paidAt: transactionData.TransactionDate,
            externalTransactionId: transactionData.TransactionId,
            referenceCode: transactionData.ReferenceCode ?? transaction.ReferenceCode);

        transaction.SenderAccountNumber = transactionData.AccountNumber;
        transaction.BeneficiaryBank = transactionData.BankBrandName;

        await _transactionRepository.UpdateAsync(transaction);

        // Update booking status based on transaction type
        await UpdateBookingStatusAsync(transaction);

        // Persist all changes (transaction + booking) in one transaction
        try
        {
            await _unitOfWork.SaveChangeAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save payment transaction {TransactionCode} to database",
                transaction.TransactionCode);
            throw;
        }

        _logger.LogInformation(
            "Payment processed successfully: TransactionCode={TransactionCode}, Amount={Amount}, BookingId={BookingId}",
            transaction.TransactionCode, transaction.PaidAmount, transaction.BookingId);

        return transaction;
    }

    private async Task UpdateBookingStatusAsync(PaymentTransactionEntity transaction)
    {
        try
        {
            var booking = await _bookingRepository.GetByIdAsync(transaction.BookingId);
            if (booking == null)
            {
                _logger.LogWarning("Booking {BookingId} not found for transaction {TransactionCode}",
                    transaction.BookingId, transaction.TransactionCode);
                return;
            }

            // Update booking status based on transaction type
            switch (transaction.Type)
            {
                case TransactionType.Deposit:
                    if (booking.Status == BookingStatus.Pending || booking.Status == BookingStatus.Confirmed)
                    {
                        booking.MarkDeposited("SYSTEM");
                        _logger.LogInformation("Booking {BookingId} marked as Deposited via transaction {TransactionCode}",
                            booking.Id, transaction.TransactionCode);
                    }
                    break;

                case TransactionType.FullPayment:
                    if (booking.Status != BookingStatus.Paid && booking.Status != BookingStatus.Completed)
                    {
                        booking.MarkPaid("SYSTEM");
                        _logger.LogInformation("Booking {BookingId} marked as Paid via transaction {TransactionCode}",
                            booking.Id, transaction.TransactionCode);
                    }
                    break;

                default:
                    _logger.LogDebug("No booking status update for transaction type: {Type}", transaction.Type);
                    break;
            }

            // Persist booking status change to database
            await _bookingRepository.UpdateAsync(booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update booking status for transaction {TransactionCode}", transaction.TransactionCode);
            // Don't fail the payment processing if booking update fails
        }
    }

    public async Task<ErrorOr<PaymentTransactionEntity>> ExpireTransactionAsync(string transactionCode)
    {
        var transaction = await _transactionRepository.GetByTransactionCodeAsync(transactionCode);
        if (transaction == null)
        {
            return Error.NotFound(ErrorConstants.Payment.TransactionNotFoundCode, ErrorConstants.Payment.TransactionNotFoundDescription);
        }

        if (transaction.Status != TransactionStatus.Pending)
        {
            return Error.Conflict(ErrorConstants.Payment.TransactionAlreadyCompletedCode, ErrorConstants.Payment.TransactionAlreadyCompletedDescription);
        }

        transaction.MarkAsFailed("EXPIRED", ErrorConstants.Payment.TransactionExpiredDescription);
        await _transactionRepository.UpdateAsync(transaction);
        await _unitOfWork.SaveChangeAsync();

        return transaction;
    }

    /// <inheritdoc />
    public async Task<ErrorOr<PaymentTransactionEntity>> ExpireTransactionAndCancelBookingAsync(string transactionCode)
    {
        var transaction = await _transactionRepository.GetByTransactionCodeAsync(transactionCode);
        if (transaction == null)
        {
            return Error.NotFound(ErrorConstants.Payment.TransactionNotFoundCode, ErrorConstants.Payment.TransactionNotFoundDescription);
        }

        if (transaction.Status != TransactionStatus.Pending)
        {
            return Error.Conflict(ErrorConstants.Payment.TransactionAlreadyCompletedCode, ErrorConstants.Payment.TransactionAlreadyCompletedDescription);
        }

        // Expire the transaction
        transaction.MarkAsFailed("EXPIRED", ErrorConstants.Payment.TransactionExpiredDescription);
        await _transactionRepository.UpdateAsync(transaction);

        // Cancel the associated booking atomically (same SaveChangeAsync)
        var booking = await _bookingRepository.GetByPaymentTransactionCodeAsync(transactionCode);
        if (booking != null && booking.Status != BookingStatus.Cancelled)
        {
            booking.Cancel(
                "Payment expired after 30 minutes without payment",
                "SYSTEM");
            await _bookingRepository.UpdateAsync(booking);

            // Restore capacity on the tour instance
            var tourInstance = await _tourInstanceRepository.FindById(booking.TourInstanceId);
            if (tourInstance != null)
            {
                var participants = booking.TotalParticipants();
                tourInstance.RemoveParticipant(participants);
                await _tourInstanceRepository.Update(tourInstance);
            }
        }

        await _unitOfWork.SaveChangeAsync();

        return transaction;
    }

    private static string ExtractTransactionCode(string? paymentContent)
    {
        if (string.IsNullOrWhiteSpace(paymentContent))
        {
            return string.Empty;
        }

        // New format: "PAY-20240101120000-ABCD1234|{12-char-refCode}|Note"
        // Old format: "PAY20240101120000AB|DEP...|Note"
        // Try to extract the transaction code (first token, before |)
        var firstPart = paymentContent.Split('|')[0].Trim();
        if (!string.IsNullOrEmpty(firstPart) && firstPart.StartsWith("PAY-"))
        {
            return firstPart;
        }

        // Fallback: first space-separated token
        return paymentContent.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? string.Empty;
    }

    private static string GenerateBase36Random(int length)
    {
        const string chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var bytes = RandomNumberGenerator.GetBytes(length);
        var result = new char[length];
        for (int i = 0; i < length; i++)
        {
            result[i] = chars[bytes[i] % chars.Length];
        }
        return new string(result);
    }

    private static string NormalizeConfigValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        if (trimmed.StartsWith("${", StringComparison.Ordinal) && trimmed.EndsWith("}", StringComparison.Ordinal))
        {
            return string.Empty;
        }

        return trimmed;
    }
}
