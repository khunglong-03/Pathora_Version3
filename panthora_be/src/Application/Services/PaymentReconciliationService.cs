using Microsoft.Extensions.Logging;

using ErrorOr;

using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;

namespace Application.Services;

public sealed record PaymentStatusSnapshot(
    string TransactionCode,
    string NormalizedStatus,
    string RawStatus,
    string Source,
    bool VerifiedWithProvider,
    bool IsTerminal,
    DateTimeOffset CheckedAt,
    string? ProviderTransactionId);

public interface IPaymentReconciliationService
{
    Task<ErrorOr<PaymentStatusSnapshot>> GetNormalizedStatusAsync(string transactionCode);
    Task<ErrorOr<PaymentStatusSnapshot>> ReconcileReturnAsync(string transactionCode);
    Task<ErrorOr<PaymentStatusSnapshot>> ReconcileCancelAsync(string transactionCode);
    Task<ErrorOr<PaymentStatusSnapshot>> ReconcileProviderCallbackAsync(
        SepayTransactionData transactionData,
        string source = "webhook");
    /// <summary>
    /// Phase 3.2.5: Checks if a transaction with the given SePay ID already exists with a non-Pending status.
    /// Returns the existing transaction if found (duplicate), null otherwise.
    /// </summary>
    Task<PaymentTransactionEntity?> CheckDuplicateBySepayIdAsync(string sepayTransactionId);
}

/// <summary>
/// Phase 4.2: Interface for payment notification broadcasting.
/// Implemented in Api layer to avoid Application -> Infrastructure dependency.
/// </summary>
public interface IPaymentNotificationBroadcaster
{
    Task BroadcastAsync(PaymentStatusSnapshot snapshot, CancellationToken ct = default);
}

public sealed class PaymentReconciliationService(
    IPaymentTransactionRepository transactionRepository,
    IPaymentService paymentService,
    IUnitOfWork unitOfWork,
    ISePayApiClient sePayApiClient,
    IPaymentNotificationBroadcaster? notificationBroadcaster,
    ILogger<PaymentReconciliationService> logger) : IPaymentReconciliationService
{
    private readonly IPaymentTransactionRepository _transactionRepository = transactionRepository;
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly ISePayApiClient _sePayApiClient = sePayApiClient;
    private readonly IPaymentNotificationBroadcaster? _notificationBroadcaster = notificationBroadcaster;
    private readonly ILogger<PaymentReconciliationService> _logger = logger;

    public Task<ErrorOr<PaymentStatusSnapshot>> GetNormalizedStatusAsync(string transactionCode)
    {
        return ReconcileByTransactionCodeAsync(transactionCode, source: "status-check", verifyWithProviderIfPending: true);
    }

    public Task<ErrorOr<PaymentStatusSnapshot>> ReconcileReturnAsync(string transactionCode)
    {
        return ReconcileByTransactionCodeAsync(transactionCode, source: "return", verifyWithProviderIfPending: true);
    }

    public async Task<ErrorOr<PaymentStatusSnapshot>> ReconcileCancelAsync(string transactionCode)
    {
        var reconciliation = await ReconcileByTransactionCodeAsync(
            transactionCode,
            source: "cancel",
            verifyWithProviderIfPending: true);

        if (reconciliation.IsError)
        {
            return reconciliation.Errors;
        }

        if (!string.Equals(reconciliation.Value.NormalizedStatus, PaymentStatusMapper.Pending, StringComparison.Ordinal))
        {
            return reconciliation;
        }

        var transaction = await _transactionRepository.GetByTransactionCodeAsync(transactionCode);
        if (transaction == null)
        {
            return Error.NotFound(
                ErrorConstants.Payment.TransactionNotFoundCode,
                ErrorConstants.Payment.TransactionNotFoundDescription);
        }

        var previousStatus = transaction.Status.ToString();
        if (transaction.Status == TransactionStatus.Pending || transaction.Status == TransactionStatus.Processing)
        {
            transaction.MarkAsCancelled("SYSTEM");
            await _transactionRepository.UpdateAsync(transaction);
            await _unitOfWork.SaveChangeAsync();
        }

        var snapshot = BuildSnapshot(transaction, source: "cancel", reconciliation.Value.VerifiedWithProvider);
        LogTransition(
            source: "cancel",
            transactionCode: transaction.TransactionCode,
            previousStatus: previousStatus,
            currentStatus: transaction.Status.ToString(),
            normalizedStatus: snapshot.NormalizedStatus,
            verifiedWithProvider: snapshot.VerifiedWithProvider);

        return snapshot;
    }

    public async Task<ErrorOr<PaymentStatusSnapshot>> ReconcileProviderCallbackAsync(
        SepayTransactionData transactionData,
        string source = "webhook")
    {
        var duplicate = await CheckDuplicateBySepayIdAsync(transactionData.TransactionId);
        if (duplicate != null)
        {
            var duplicateSnapshot = BuildSnapshot(duplicate, source, verifiedWithProvider: true, transactionData.TransactionId);
            LogTransition(
                source,
                duplicate.TransactionCode,
                duplicate.Status.ToString(),
                duplicate.Status.ToString(),
                duplicateSnapshot.NormalizedStatus,
                verifiedWithProvider: true);

            return duplicateSnapshot;
        }

        var transactionCode = ExtractTransactionCode(transactionData.TransactionContent);
        var previousStatus = "unknown";

        if (!string.IsNullOrWhiteSpace(transactionCode))
        {
            var existing = await _transactionRepository.GetByTransactionCodeAsync(transactionCode);
            if (existing != null)
            {
                previousStatus = existing.Status.ToString();
            }
        }

        var result = await _paymentService.ProcessSepayCallbackAsync(transactionData);
        if (result.IsError)
        {
            if (!string.IsNullOrWhiteSpace(transactionCode))
            {
                var existing = await _transactionRepository.GetByTransactionCodeAsync(transactionCode);
                if (existing != null)
                {
                    var existingSnapshot = BuildSnapshot(existing, source, verifiedWithProvider: false);
                    LogTransition(
                        source,
                        existing.TransactionCode,
                        previousStatus,
                        existing.Status.ToString(),
                        existingSnapshot.NormalizedStatus,
                        verifiedWithProvider: false);
                    return existingSnapshot;
                }
            }

            return result.Errors;
        }

        var snapshot = BuildSnapshot(result.Value, source, verifiedWithProvider: true, transactionData.TransactionId);

        LogTransition(
            source,
            result.Value.TransactionCode,
            previousStatus,
            result.Value.Status.ToString(),
            snapshot.NormalizedStatus,
            verifiedWithProvider: true);

        return snapshot;
    }

    private async Task<ErrorOr<PaymentStatusSnapshot>> ReconcileByTransactionCodeAsync(
        string transactionCode,
        string source,
        bool verifyWithProviderIfPending)
    {
        var transaction = await _transactionRepository.GetByTransactionCodeAsync(transactionCode);
        if (transaction == null)
        {
            return Error.NotFound(
                ErrorConstants.Payment.TransactionNotFoundCode,
                ErrorConstants.Payment.TransactionNotFoundDescription);
        }

        var previousStatus = transaction.Status.ToString();
        var verifiedWithProvider = false;

        if (verifyWithProviderIfPending
            && (transaction.Status == TransactionStatus.Pending || transaction.Status == TransactionStatus.Processing))
        {
            var verificationResult = await VerifyPendingTransactionWithProviderAsync(transaction);
            transaction = verificationResult.Transaction;
            verifiedWithProvider = verificationResult.Verified;
        }

        if ((transaction.Status == TransactionStatus.Pending || transaction.Status == TransactionStatus.Processing)
            && transaction.IsExpired())
        {
            transaction.MarkAsFailed("EXPIRED", ErrorConstants.Payment.TransactionExpiredDescription);
            await _transactionRepository.UpdateAsync(transaction);
            await _unitOfWork.SaveChangeAsync();
        }

        var snapshot = BuildSnapshot(transaction, source, verifiedWithProvider);
        LogTransition(
            source,
            transaction.TransactionCode,
            previousStatus,
            transaction.Status.ToString(),
            snapshot.NormalizedStatus,
            verifiedWithProvider: snapshot.VerifiedWithProvider);

        return snapshot;
    }

    private async Task<(PaymentTransactionEntity Transaction, bool Verified)> VerifyPendingTransactionWithProviderAsync(
        PaymentTransactionEntity transaction)
    {
        if (!_sePayApiClient.IsConfigured)
        {
            _logger.LogDebug(
                "Skipping provider verification for {TransactionCode} because SePay API is not configured.",
                transaction.TransactionCode);
            return (transaction, false);
        }

        var matchedProviderTransaction = await FetchMatchingProviderTransactionAsync(transaction);
        if (matchedProviderTransaction == null)
        {
            return (transaction, false);
        }

        var callbackData = SepayParsingHelper.ToTransactionData(matchedProviderTransaction);

        var processResult = await _paymentService.ProcessSepayCallbackAsync(callbackData);
        if (processResult.IsError)
        {
            _logger.LogWarning(
                "Provider verification found a transaction but reconciliation failed for {TransactionCode}: {Errors}",
                transaction.TransactionCode,
                string.Join(", ", processResult.Errors.Select(error => error.Description)));

            var latest = await _transactionRepository.GetByTransactionCodeAsync(transaction.TransactionCode);
            return (latest ?? transaction, false);
        }

        // Phase 4.2.2: Broadcast SignalR payment update
        var snapshot = BuildSnapshot(processResult.Value, source: "provider-verification", verifiedWithProvider: true, processResult.Value.ExternalTransactionId);
        if (_notificationBroadcaster != null)
        {
            await _notificationBroadcaster.BroadcastAsync(snapshot);
        }

        return (processResult.Value, true);
    }

    internal async Task<SePayTransaction?> FetchMatchingProviderTransactionAsync(PaymentTransactionEntity transaction)
    {
        if (!_sePayApiClient.IsConfigured)
        {
            _logger.LogDebug(
                "Skipping provider fetch for {TransactionCode} because SePay API is not configured.",
                transaction.TransactionCode);
            return null;
        }

        try
        {
            var matched = await _sePayApiClient.FindTransactionByRefCodeAsync(
                transaction.ReferenceCode ?? "",
                transaction.TransactionCode,
                (long)transaction.Amount);

            if (matched != null)
            {
                _logger.LogInformation(
                    "Found matching SePay transaction for {TransactionCode}: {TransactionId}",
                    transaction.TransactionCode, matched.id);
            }

            return matched;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to verify transaction {TransactionCode} with SePay API.",
                transaction.TransactionCode);
            return null;
        }
    }

    private static PaymentStatusSnapshot BuildSnapshot(
        PaymentTransactionEntity transaction,
        string source,
        bool verifiedWithProvider,
        string? providerTransactionId = null)
    {
        var normalizedStatus = PaymentStatusMapper.FromTransaction(transaction);
        return new PaymentStatusSnapshot(
            transaction.TransactionCode,
            normalizedStatus,
            transaction.Status.ToString(),
            source,
            verifiedWithProvider,
            PaymentStatusMapper.IsTerminal(normalizedStatus),
            DateTimeOffset.UtcNow,
            providerTransactionId ?? transaction.ExternalTransactionId);
    }

    private void LogTransition(
        string source,
        string transactionCode,
        string previousStatus,
        string currentStatus,
        string normalizedStatus,
        bool verifiedWithProvider)
    {
        _logger.LogInformation(
            "Payment reconciliation transition Source={Source} TransactionCode={TransactionCode} PreviousStatus={PreviousStatus} CurrentStatus={CurrentStatus} NormalizedStatus={NormalizedStatus} VerifiedWithProvider={VerifiedWithProvider}",
            source,
            transactionCode,
            previousStatus,
            currentStatus,
            normalizedStatus,
            verifiedWithProvider);
    }

    private static string? ExtractTransactionCode(string? paymentContent)
    {
        if (string.IsNullOrWhiteSpace(paymentContent))
        {
            return null;
        }

        return paymentContent.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
    }

    /// <inheritdoc />
    public async Task<PaymentTransactionEntity?> CheckDuplicateBySepayIdAsync(string sepayTransactionId)
    {
        if (string.IsNullOrWhiteSpace(sepayTransactionId))
        {
            return null;
        }

        var existing = await _transactionRepository.GetBySepayTransactionIdAsync(sepayTransactionId);
        if (existing != null && existing.Status != TransactionStatus.Pending)
        {
            _logger.LogDebug(
                "Found existing transaction {TransactionCode} with SePay ID {SepayId} and status {Status}",
                existing.TransactionCode, sepayTransactionId, existing.Status);
            return existing;
        }

        return null;
    }
}
