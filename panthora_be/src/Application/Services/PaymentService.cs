using System.Security.Cryptography;
using Application.Common.Constant;
using Application.Options;
using Domain.Common.Repositories;
using Microsoft.Extensions.Options;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OutboxMessage = Domain.Entities.OutboxMessage;
using System.Linq;

namespace Application.Services;

public interface IPaymentService
{
    Task<ErrorOr<string>> GetQR(string note, long amount, string? bankBin = null, string? accountNo = null, string? accountName = null);
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
    private readonly IManagerBankAccountRepository _managerBankAccountRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<PaymentService> _logger;
    private readonly Domain.UnitOfWork.IUnitOfWork _unitOfWork;
    private readonly IServiceProvider _serviceProvider;

    public PaymentService(
        IPaymentTransactionRepository transactionRepository,
        IBookingRepository bookingRepository,
        IOutboxRepository outboxRepository,
        ITourInstanceRepository tourInstanceRepository,
        IManagerBankAccountRepository managerBankAccountRepository,
        IUserRepository userRepository,
        ILogger<PaymentService> logger,
        IConfiguration configuration,
        Domain.UnitOfWork.IUnitOfWork unitOfWork,
        IServiceProvider serviceProvider)
    {
        _transactionRepository = transactionRepository;
        _bookingRepository = bookingRepository;
        _outboxRepository = outboxRepository;
        _tourInstanceRepository = tourInstanceRepository;
        _managerBankAccountRepository = managerBankAccountRepository;
        _userRepository = userRepository;
        _logger = logger;
        _unitOfWork = unitOfWork;
        _serviceProvider = serviceProvider;
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

    public Task<ErrorOr<string>> GetQR(string note, long amount, string? bankBin = null, string? accountNo = null, string? accountName = null)
    {
        var effectiveBankBin = bankBin ?? _vietQrBankBin;
        var effectiveAccountNo = accountNo ?? _vietQrAccountNo;
        var effectiveAccountName = accountName ?? _vietQrAccountName;

        if (string.IsNullOrWhiteSpace(_vietQrApiUrl)
            || string.IsNullOrWhiteSpace(effectiveBankBin)
            || string.IsNullOrWhiteSpace(effectiveAccountNo)
            || string.IsNullOrWhiteSpace(_vietQrTemplateId))
        {
            return Task.FromResult<ErrorOr<string>>(
                Error.Failure(
                    ErrorConstants.Payment.PaymentProcessingFailedCode,
                    "VietQR configuration is missing. Set VietQR:ApiUrl, VietQR:BankBin, VietQR:AccountNo, and VietQR:TemplateId."));
        }

        // Use the note parameter (refCode) directly as addInfo.
        // Note: note IS the refCode passed from CreatePaymentTransactionAsync, not free text.
        var encodedAccountName = Uri.EscapeDataString(effectiveAccountName);
        var encodedAddInfo = Uri.EscapeDataString(note);

        // VietQR URL format:
        // https://api.vietqr.io/image/{bankBin}-{accountNo}-{templateId}.jpg
        //     ?accountName={name}&amount={amount}&addInfo={refCode}
        var imageId = $"{effectiveBankBin}-{effectiveAccountNo}-{_vietQrTemplateId}";
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
        // Fetch the booking to get tour instance
        var booking = await _bookingRepository.GetByIdAsync(bookingId);
        if (booking == null)
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        var transactionCode = $"PAY-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        var expiredAt = DateTimeOffset.UtcNow.AddMinutes(expirationMinutes ?? 30);

        // Generate 12-char reference code: yyMMddHH (8 chars) + 4 Base36 random.
        // 4 Base36 chars = 36^4 ≈ 1.67 million combos per hour-minute combo.
        var randomChars = GenerateBase36Random(4);
        var refCode = $"{DateTimeOffset.UtcNow:yyMMddHH}{randomChars}";

        var paymentNoteWithRef = $"{transactionCode}|{refCode}|{paymentNote}";

        // Determine manager's bank account from ManagerBankAccountEntity
        string? managerAccountNumber = null;
        string? managerBankCode = null;
        string? managerAccountName = null;
        string? beneficiaryBank = null;

        var managerId = await GetPrimaryManagerIdForTourInstanceAsync(booking.TourInstanceId);
        if (managerId.HasValue)
        {
            // Try default account first, then first verified, then any account
            var bankAccount = await _managerBankAccountRepository.GetDefaultByUserIdAsync(managerId.Value);
            if (bankAccount is null)
            {
                var allAccounts = await _managerBankAccountRepository.GetByUserIdAsync(managerId.Value);
                bankAccount = allAccounts.FirstOrDefault(a => a.IsVerified) ?? allAccounts.FirstOrDefault();
            }

            if (bankAccount is not null && !string.IsNullOrWhiteSpace(bankAccount.BankAccountNumber) && !string.IsNullOrWhiteSpace(bankAccount.BankCode))
            {
                managerAccountNumber = bankAccount.BankAccountNumber;
                managerBankCode = bankAccount.BankCode;
                managerAccountName = bankAccount.BankAccountName;
                beneficiaryBank = bankAccount.BankShortName ?? bankAccount.BankCode;
                _logger.LogInformation("Using manager {ManagerId} bank account {AccountId} for payment transaction", managerId.Value, bankAccount.Id);
            }
            else
            {
                _logger.LogWarning("Manager {ManagerId} for tour instance {TourInstanceId} has no valid bank account; using default config", managerId.Value, booking.TourInstanceId);
            }
        }
        else
        {
            _logger.LogWarning("No manager found for tour instance {TourInstanceId}; using default config", booking.TourInstanceId);
        }

        // Fallback to VietQR config if not set
        if (string.IsNullOrWhiteSpace(managerAccountNumber) || string.IsNullOrWhiteSpace(managerBankCode))
        {
            managerAccountNumber = _vietQrAccountNo;
            managerBankCode = _vietQrBankBin;
            managerAccountName = _vietQrAccountName;
            beneficiaryBank = _sepayBankCode;
        }

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

        // Store the manager account used
        transaction.ManagerAccountNumber = managerAccountNumber;
        transaction.ManagerBankCode = managerBankCode;
        transaction.ManagerAccountName = managerAccountName;
        transaction.BeneficiaryBank = beneficiaryBank ?? managerBankCode;

        // Generate QR using dynamic account parameters
        var qrResult = await GetQR(refCode, (long)amount, bankBin: managerBankCode, accountNo: managerAccountNumber, accountName: managerAccountName);
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
        // Idempotency: same SePay TransactionId must not be processed twice (retry / duplicate webhook).
        if (!string.IsNullOrWhiteSpace(transactionData.TransactionId))
        {
            var existingByExternal = await _transactionRepository.GetBySepayTransactionIdAsync(
                transactionData.TransactionId.Trim());
            if (existingByExternal is { Status: TransactionStatus.Completed })
            {
                _logger.LogInformation(
                    "SePay callback duplicate for external id {ExternalId}; transaction {Code} already completed.",
                    transactionData.TransactionId,
                    existingByExternal.TransactionCode);
                return existingByExternal;
            }
        }

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
        transaction.BeneficiaryBank ??= transactionData.BankBrandName;

        await _transactionRepository.UpdateAsync(transaction);

        // Update booking status based on transaction type (and check capacity)
        bool isBookingSuccess = await UpdateBookingStatusAsync(transaction);

        var bookingForCredit = transaction.Booking
            ?? await _bookingRepository.GetByIdWithDetailsAsync(transaction.BookingId);

        if (isBookingSuccess)
        {
            // Credit manager balance
            if (bookingForCredit != null)
            {
                var managerId = await GetPrimaryManagerIdForTourInstanceAsync(bookingForCredit.TourInstanceId);
                if (managerId.HasValue)
                {
                    var manager = await _userRepository.GetByIdAsync(managerId.Value);
                    if (manager != null)
                    {
                        var creditAmount = transaction.PaidAmount ?? transaction.Amount;
                        manager.CreditBalance(creditAmount);
                        _userRepository.Update(manager);
                        _logger.LogInformation(
                            "Credited {Amount} to manager {ManagerId} balance for transaction {TransactionCode}",
                            creditAmount, managerId.Value, transaction.TransactionCode);
                    }
                    else
                    {
                        _logger.LogWarning("Manager {ManagerId} not found for balance credit", managerId.Value);
                    }
                }
                else
                {
                    _logger.LogWarning(
                        "No manager found for TourInstance of booking {BookingId}. Balance not credited.",
                        transaction.BookingId);
                }
            }
        }
        else
        {
            // Capacity is full. Refund to Customer Wallet.
            if (bookingForCredit != null && bookingForCredit.UserId.HasValue)
            {
                var customer = await _userRepository.GetByIdAsync(bookingForCredit.UserId.Value);
                if (customer != null)
                {
                    var refundAmount = transaction.PaidAmount ?? transaction.Amount;
                    customer.CreditBalance(refundAmount);
                    _logger.LogInformation(
                        "Refunded {Amount} to customer {CustomerId} wallet because tour was full for transaction {TransactionCode}",
                        refundAmount, customer.Id, transaction.TransactionCode);
                    _userRepository.Update(customer);
                }
            }
            else
            {
                _logger.LogWarning("Booking {BookingId} failed due to capacity but no customer account found to refund. Amount: {Amount}", transaction.BookingId, transaction.PaidAmount ?? transaction.Amount);
            }
        }

        if (isBookingSuccess
            && bookingForCredit != null
            && bookingForCredit.UserId == null
            && !string.IsNullOrWhiteSpace(bookingForCredit.CustomerEmail))
        {
            var matchedUser = await _userRepository.GetByEmailAsync(
                bookingForCredit.CustomerEmail,
                CancellationToken.None);
            if (matchedUser != null)
            {
                bookingForCredit.UserId = matchedUser.Id;
                await _bookingRepository.UpdateAsync(bookingForCredit);
                _logger.LogInformation(
                    "Linked booking {BookingId} to user {UserId} via email match",
                    bookingForCredit.Id,
                    matchedUser.Id);
            }
            else
            {
                _logger.LogWarning(
                    "No active user match for booking {BookingId} customer email {Email}",
                    bookingForCredit.Id,
                    bookingForCredit.CustomerEmail);
            }
        }

        // Persist all changes (transaction + booking + manager balance) in one transaction
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

    private async Task<bool> UpdateBookingStatusAsync(PaymentTransactionEntity transaction)
    {
        var booking = transaction.Booking
            ?? await _bookingRepository.GetByIdWithDetailsAsync(transaction.BookingId);
        if (booking == null)
        {
            _logger.LogWarning("Booking {BookingId} not found for transaction {TransactionCode}",
                transaction.BookingId, transaction.TransactionCode);
            return false;
        }

        var tourInstance = await _tourInstanceRepository.FindById(booking.TourInstanceId);
        if (tourInstance == null)
        {
            _logger.LogWarning("TourInstance {TourInstanceId} not found for booking {BookingId}", booking.TourInstanceId, booking.Id);
            return false;
        }

        // Only check and reserve capacity if the booking is currently Pending
        if (booking.Status == BookingStatus.Pending)
        {
            var totalParticipants = booking.NumberAdult + booking.NumberChild + booking.NumberInfant;

            if (tourInstance.CurrentParticipation + totalParticipants > tourInstance.MaxParticipation)
            {
                _logger.LogWarning("Tour {TourInstanceId} is full for booking {BookingId}. Capacity: {Current}/{Max}",
                    tourInstance.Id, booking.Id, tourInstance.CurrentParticipation, tourInstance.MaxParticipation);
                booking.Cancel("Hết chỗ. Số tiền thanh toán đã được cộng vào số dư tài khoản.", "SYSTEM");
                await _bookingRepository.UpdateAsync(booking);
                return false;
            }

            // Reserve capacity!
            tourInstance.AddParticipant(totalParticipants);
            await _tourInstanceRepository.Update(tourInstance);
        }

        // Update booking status based on transaction type
        switch (transaction.Type)
        {
            case TransactionType.Deposit:
                if (booking.Status == BookingStatus.Pending || booking.Status == BookingStatus.Confirmed)
                {
                    if (transaction.Amount >= booking.TotalPrice || booking.IsFullPay)
                    {
                        booking.MarkPaid("SYSTEM");
                        _logger.LogInformation("Booking {BookingId} marked as Paid via 100% deposit transaction {TransactionCode}",
                            booking.Id, transaction.TransactionCode);
                    }
                    else
                    {
                        booking.MarkDeposited("SYSTEM");
                        _logger.LogInformation("Booking {BookingId} marked as Deposited via transaction {TransactionCode}",
                            booking.Id, transaction.TransactionCode);
                    }

                    // Khi thanh toán deposit cho Private tour Draft → xác nhận instance và gán nhà cung cấp
                    if (tourInstance.InstanceType == TourType.Private
                        && tourInstance.Status == TourInstanceStatus.Draft
                        && booking.BookingType == BookingType.PrivateCustomTourRequest)
                    {
                        if (tourInstance.WantsCustomization)
                        {
                            _logger.LogInformation(
                                "Private tour instance {InstanceId} requires customization. Keeping in Draft and notifying operator (transaction {TransactionCode}).",
                                tourInstance.Id,
                                transaction.TransactionCode);
                            // TODO: Notify managers that a private custom tour requires their attention.
                            // The notification logic has been deferred to a specialized event/handler.
                        }
                        else
                        {
                            tourInstance.ChangeStatus(TourInstanceStatus.Confirmed, "SYSTEM");
                            await _tourInstanceRepository.Update(tourInstance);
                            _logger.LogInformation(
                                "Private tour instance {InstanceId} confirmed after deposit payment (transaction {TransactionCode}).",
                                tourInstance.Id,
                                transaction.TransactionCode);

                            using var scope = _serviceProvider.CreateScope();
                            var tourService = scope.ServiceProvider.GetRequiredService<ITourInstanceService>();
                            await tourService.TriggerProviderAssignmentsAsync(tourInstance.Id, CancellationToken.None);
                        }
                    }
                }
                break;

            case TransactionType.FullPayment:
                if (booking.Status == BookingStatus.PendingAdjustment
                    || (booking.Status != BookingStatus.Paid && booking.Status != BookingStatus.Completed))
                {
                    booking.MarkPaid("SYSTEM");
                    _logger.LogInformation("Booking {BookingId} marked as Paid via transaction {TransactionCode}",
                        booking.Id, transaction.TransactionCode);

                    // Khi full pay cho Private tour (Draft hoặc PendingAdjustment) → xác nhận instance
                    if (tourInstance.InstanceType == TourType.Private
                        && (tourInstance.Status == TourInstanceStatus.Draft
                            || tourInstance.Status == TourInstanceStatus.PendingAdjustment)
                        && booking.BookingType == BookingType.PrivateCustomTourRequest)
                    {
                        if (tourInstance.Status == TourInstanceStatus.Draft && tourInstance.WantsCustomization)
                        {
                            _logger.LogInformation(
                                "Private tour instance {InstanceId} requires customization. Keeping in Draft and notifying operator (transaction {TransactionCode}).",
                                tourInstance.Id,
                                transaction.TransactionCode);
                            // TODO: Notify managers that a private custom tour requires their attention.
                            // The notification logic has been deferred to a specialized event/handler.
                        }
                        else
                        {
                            tourInstance.ChangeStatus(TourInstanceStatus.Confirmed, "SYSTEM");
                            await _tourInstanceRepository.Update(tourInstance);
                            _logger.LogInformation(
                                "Private tour instance {InstanceId} confirmed after full payment (transaction {TransactionCode}).",
                                tourInstance.Id,
                                transaction.TransactionCode);

                            using var scope = _serviceProvider.CreateScope();
                            var tourService = scope.ServiceProvider.GetRequiredService<ITourInstanceService>();
                            await tourService.TriggerProviderAssignmentsAsync(tourInstance.Id, CancellationToken.None);
                        }
                    }
                }
                break;

            default:
                _logger.LogDebug("No booking status update for transaction type: {Type}", transaction.Type);
                break;
        }

        await _bookingRepository.UpdateAsync(booking);
        return true;
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
            var originalStatus = booking.Status;

            booking.Cancel(
                "Payment expired after 30 minutes without payment",
                "SYSTEM");
            await _bookingRepository.UpdateAsync(booking);

            // Restore capacity on the tour instance ONLY IF capacity was previously reserved
            // (i.e. booking was not Pending)
            if (originalStatus != BookingStatus.Pending)
            {
                var tourInstance = await _tourInstanceRepository.FindById(booking.TourInstanceId);
                if (tourInstance != null)
                {
                    var participants = booking.TotalParticipants();
                    if (tourInstance.CurrentParticipation >= participants)
                    {
                        tourInstance.RemoveParticipant(participants);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "CurrentParticipation ({Current}) < participants to remove ({Count}) for TourInstance {TourInstanceId}. Clamping to 0.",
                            tourInstance.CurrentParticipation, participants, tourInstance.Id);
                        if (tourInstance.CurrentParticipation > 0)
                        {
                            tourInstance.RemoveParticipant(tourInstance.CurrentParticipation);
                        }
                    }
                    await _tourInstanceRepository.Update(tourInstance);
                }
            }
        }

        await _unitOfWork.SaveChangeAsync();

        return transaction;
    }

    private async Task<Guid?> GetPrimaryManagerIdForTourInstanceAsync(Guid tourInstanceId)
    {
        var tourInstance = await _tourInstanceRepository.FindById(tourInstanceId);
        if (tourInstance == null) return null;

        var managerAssignment = tourInstance.Managers
            .FirstOrDefault(m => m.Role == TourInstanceManagerRole.Manager)
            ?? tourInstance.Managers.FirstOrDefault();

        return managerAssignment?.UserId;
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
