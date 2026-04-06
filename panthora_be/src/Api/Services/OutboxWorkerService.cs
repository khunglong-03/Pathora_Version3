using System.Text.Json;
using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Api.Services;

public class OutboxWorkerService(
    IServiceProvider serviceProvider,
    ILogger<OutboxWorkerService> logger,
    IOptions<OutboxWorkerOptions> options,
    ISePayApiClient sePayApiClient)
    : BackgroundService
{
    private readonly OutboxWorkerOptions _options = options.Value;
    private Timer? _expirationTimer;
    private Timer? _sweepPollTimer;

    private static readonly TimeSpan[] RetryDelays =
    [
        TimeSpan.FromMinutes(1),
        TimeSpan.FromMinutes(5),
        TimeSpan.FromMinutes(30),
        TimeSpan.FromHours(2),
        TimeSpan.FromHours(6),
        TimeSpan.FromHours(12),
        TimeSpan.FromHours(24),
        TimeSpan.FromDays(2),
        TimeSpan.FromDays(3),
        TimeSpan.FromDays(7)
    ];

    private static readonly TimeSpan ExpirationCheckInterval = TimeSpan.FromMinutes(5);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private const string PaymentCheckType = OutboxMessageTypeConstants.PaymentCheck;
    private const string TourMediaCleanupType = OutboxMessageTypeConstants.TourMediaCleanup;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Outbox Worker starting with interval {IntervalMs}ms", _options.PollingIntervalMs);

        // Start the expiration sweep timer (auto-expire stale pending transactions)
        _expirationTimer = new Timer(
            _ => _ = ExpireStaleTransactionsAsync(stoppingToken),
            null,
            TimeSpan.FromSeconds(30),      // First run after 30s (warmup)
            ExpirationCheckInterval);       // Then every 5 minutes

        // Start the SePay sweep poll timer (poll for incoming payments every 5 minutes)
        _sweepPollTimer = new Timer(
            _ => _ = SweepPendingPaymentsAsync(stoppingToken),
            null,
            TimeSpan.FromSeconds(60),      // First run after 60s (wait for warmup)
            TimeSpan.FromMinutes(5));      // Then every 5 minutes

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingMessagesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error processing outbox messages");
                }

                try
                {
                    await Task.Delay(_options.PollingIntervalMs, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
        finally
        {
            _expirationTimer?.Dispose();
            _sweepPollTimer?.Dispose();
        }

        logger.LogInformation("Outbox Worker stopped");
    }

    /// <summary>
    /// Sweeps pending payment transactions by polling SePay API for recent transfers.
    /// Matches pending transactions by content + amount, marks as paid, and broadcasts via SignalR.
    /// Runs every 5 minutes via a Timer.
    /// </summary>
    private async Task SweepPendingPaymentsAsync(CancellationToken stoppingToken)
    {
        try
        {
            var now = DateTimeOffset.UtcNow;
            var from = now.AddMinutes(-30);

            var sepayTransactions = await sePayApiClient.FetchTransactionsInRangeAsync(from, now, stoppingToken);

            if (sepayTransactions.Count == 0)
            {
                logger.LogDebug("SePay sweep: no transactions found in the last 10 minutes");
                return;
            }

            using var scope = serviceProvider.CreateScope();
            var transactionRepo = scope.ServiceProvider.GetRequiredService<IPaymentTransactionRepository>();
            var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();
            var notificationService = scope.ServiceProvider.GetRequiredService<IPaymentNotificationService>();

            var pendingTransactions = await transactionRepo.GetPendingTransactionsAsync();

            if (pendingTransactions.Count == 0)
            {
                logger.LogDebug("SePay sweep: no pending transactions to check");
                return;
            }

            logger.LogInformation("SePay sweep: checking {PendingCount} pending transactions against {SepayCount} SePay transactions",
                pendingTransactions.Count, sepayTransactions.Count);

            foreach (var pending in pendingTransactions)
            {
                if (stoppingToken.IsCancellationRequested)
                    break;

                if (pending.ExpiredAt != null && pending.ExpiredAt < now)
                    continue; // Skip already-expired transactions

                var matched = sepayTransactions.FirstOrDefault(t =>
                    Application.Services.SepayMatchingService.MatchTransaction(t, pending) != null);

                if (matched == null)
                    continue;

                try
                {
                    var transactionData = SepayParsingHelper.ToTransactionData(matched);
                    var result = await paymentService.ProcessSepayCallbackAsync(transactionData);

                    if (result.IsError)
                    {
                        logger.LogWarning(
                            "SePay sweep failed to process payment for {TransactionCode}: {Errors}",
                            pending.TransactionCode,
                            string.Join(", ", result.Errors.Select(e => e.Description)));
                    }
                    else
                    {
                        logger.LogInformation(
                            "SePay sweep: payment confirmed for {TransactionCode}, broadcasting SignalR",
                            pending.TransactionCode);

                        var snapshot = new PaymentStatusSnapshot(
                            pending.TransactionCode,
                            PaymentStatusMapper.Paid,
                            TransactionStatus.Completed.ToString(),
                            "sepay-sweep",
                            true,
                            true,
                            DateTimeOffset.UtcNow,
                            transactionData.TransactionId);

                        await notificationService.BroadcastPaymentUpdateAsync(snapshot, stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex,
                        "SePay sweep encountered an error for transaction {TransactionCode}",
                        pending.TransactionCode);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SePay sweep encountered an unexpected error");
        }
    }

    /// <summary>
    /// Proactively expires stale pending transactions and cancels their associated bookings.
    /// Runs every 5 minutes via a Timer.
    /// </summary>
    private async Task ExpireStaleTransactionsAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var transactionRepo = scope.ServiceProvider.GetRequiredService<IPaymentTransactionRepository>();
            var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();

            var expiredTransactions = await transactionRepo.GetExpiredTransactionsAsync();

            if (expiredTransactions.Count == 0)
                return;

            logger.LogInformation("Expiration sweep found {Count} stale pending transactions", expiredTransactions.Count);

            foreach (var transaction in expiredTransactions)
            {
                if (stoppingToken.IsCancellationRequested)
                    break;

                try
                {
                    var result = await paymentService.ExpireTransactionAndCancelBookingAsync(transaction.TransactionCode);
                    if (result.IsError)
                    {
                        logger.LogWarning(
                            "Expiration sweep failed for transaction {TransactionCode}: {Errors}",
                            transaction.TransactionCode,
                            string.Join(", ", result.Errors.Select(e => e.Description)));
                    }
                    else
                    {
                        logger.LogInformation(
                            "Expiration sweep expired transaction {TransactionCode} and cancelled associated booking",
                            transaction.TransactionCode);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex,
                        "Expiration sweep encountered an error for transaction {TransactionCode}",
                        transaction.TransactionCode);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Expiration sweep encountered an unexpected error");
        }
    }

    private async Task ProcessPendingMessagesAsync(CancellationToken cancellationToken)
    {
        using var scope = serviceProvider.CreateScope();
        var outboxRepository = scope.ServiceProvider.GetRequiredService<IOutboxRepository>();
        var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();
        var fileManager = scope.ServiceProvider.GetRequiredService<IFileManager>();

        var messages = await outboxRepository.GetPendingMessagesAsync(_options.BatchSize, cancellationToken);

        foreach (var message in messages)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            try
            {
                await ProcessMessageAsync(message, paymentService, fileManager, outboxRepository, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing outbox message {MessageId}", message.Id);
                var delay = GetRetryDelay(message.RetryCount);
                message.MarkAsFailed(ex.Message, delay);
                await outboxRepository.UpdateAsync(message, cancellationToken);
            }
        }
    }

    private async Task ProcessMessageAsync(
        OutboxMessage message,
        IPaymentService paymentService,
        IFileManager fileManager,
        IOutboxRepository outboxRepository,
        CancellationToken cancellationToken)
    {
        switch (message.Type)
        {
            case PaymentCheckType:
                await ProcessPaymentCheckMessageAsync(message, paymentService, outboxRepository, cancellationToken);
                break;
            case TourMediaCleanupType:
                await ProcessTourMediaCleanupMessageAsync(message, fileManager, outboxRepository, cancellationToken);
                break;
            default:
                logger.LogWarning("Unknown outbox message type: {Type}", message.Type);
                message.MarkAsDeadLetter("Unknown message type");
                await outboxRepository.UpdateAsync(message, cancellationToken);
                break;
        }
    }

    private async Task ProcessTourMediaCleanupMessageAsync(
        OutboxMessage message,
        IFileManager fileManager,
        IOutboxRepository outboxRepository,
        CancellationToken cancellationToken)
    {
        var payload = JsonSerializer.Deserialize<TourMediaCleanupPayload>(message.Payload, JsonOptions);
        if (payload == null || payload.ObjectNames.Count == 0)
        {
            message.MarkAsProcessed();
            await outboxRepository.UpdateAsync(message, cancellationToken);
            return;
        }

        message.MarkAsProcessing();
        await outboxRepository.UpdateAsync(message, cancellationToken);

        logger.LogInformation(
            "Deleting {Count} media objects for purged tour {TourId}",
            payload.ObjectNames.Count, payload.TourId);

        try
        {
            await fileManager.DeleteUploadedFilesAsync(payload.ObjectNames, cancellationToken);
            message.MarkAsProcessed();
            logger.LogInformation(
                "Successfully deleted {Count} media objects for tour {TourId}",
                payload.ObjectNames.Count, payload.TourId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete media objects for tour {TourId}", payload.TourId);
            var delay = GetRetryDelay(message.RetryCount);
            message.MarkAsFailed(ex.Message, delay);
        }

        await outboxRepository.UpdateAsync(message, cancellationToken);
    }

    private async Task ProcessPaymentCheckMessageAsync(
        OutboxMessage message,
        IPaymentService paymentService,
        IOutboxRepository outboxRepository,
        CancellationToken cancellationToken)
    {
        var payload = JsonSerializer.Deserialize<PaymentCheckPayload>(message.Payload, JsonOptions);
        if (payload == null)
        {
            message.MarkAsDeadLetter("Invalid payload");
            await outboxRepository.UpdateAsync(message, cancellationToken);
            return;
        }

        message.MarkAsProcessing();
        await outboxRepository.UpdateAsync(message, cancellationToken);

        logger.LogInformation("Checking payment status for transaction {TransactionCode}, Amount: {Amount}",
            payload.TransactionCode, payload.Amount);

        try
        {
            var matchedTransaction = await CheckPaymentFromSePayAsync(payload, cancellationToken);

            if (matchedTransaction != null)
            {
                var transactionData = SepayParsingHelper.ToTransactionData(matchedTransaction);

                var result = await paymentService.ProcessSepayCallbackAsync(transactionData);

                if (result.IsError)
                {
                    logger.LogWarning("Failed to process payment for {TransactionCode}: {Errors}",
                        payload.TransactionCode, string.Join(", ", result.Errors.Select(e => e.Description)));
                    message.MarkAsFailed(string.Join(", ", result.Errors.Select(e => e.Description)), TimeSpan.FromMinutes(5));
                }
                else
                {
                    logger.LogInformation("Successfully processed payment for {TransactionCode}, Amount: {Amount}",
                        payload.TransactionCode, transactionData.Amount);
                    message.MarkAsProcessed();
                }
            }
            else
            {
                logger.LogDebug("No payment found for transaction {TransactionCode}, amount {Amount}",
                    payload.TransactionCode, payload.Amount);

                var transaction = await paymentService.GetTransactionByCodeAsync(payload.TransactionCode);
                if (transaction.IsError)
                {
                    message.MarkAsProcessed();
                }
                else if (transaction.Value.IsExpired())
                {
                    await paymentService.ExpireTransactionAsync(payload.TransactionCode);
                    logger.LogInformation("Transaction {TransactionCode} has expired", payload.TransactionCode);
                    message.MarkAsProcessed();
                }
                else
                {
                    message.MarkAsFailed("Payment not received yet", TimeSpan.FromMinutes(5));
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error checking payment for {TransactionCode}", payload.TransactionCode);
            message.MarkAsFailed(ex.Message, TimeSpan.FromMinutes(5));
        }

        await outboxRepository.UpdateAsync(message, cancellationToken);
    }

    private async Task<SePayTransaction?> CheckPaymentFromSePayAsync(PaymentCheckPayload payload, CancellationToken cancellationToken)
    {
        if (!sePayApiClient.IsConfigured)
        {
            logger.LogWarning("SePay API is not configured, skipping payment check for {TransactionCode}", payload.TransactionCode);
            return null;
        }

        try
        {
            var matched = await sePayApiClient.FindTransactionByRefCodeAsync(
                payload.ReferenceCode ?? "",
                payload.TransactionCode,
                (long)payload.Amount,
                cancellationToken);

            if (matched != null)
            {
                logger.LogInformation("Found matching SePay transaction: {TransactionId}, Amount: {Amount}",
                    matched.id, payload.Amount);
            }

            return matched;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling SePay API for transaction {TransactionCode}", payload.TransactionCode);
            throw;
        }
    }

    private static TimeSpan GetRetryDelay(int retryCount)
    {
        if (retryCount >= RetryDelays.Length)
            return RetryDelays[^1];
        return RetryDelays[retryCount];
    }

    private record PaymentCheckPayload(Guid TransactionId, string TransactionCode, string? ReferenceCode, Guid BookingId, decimal Amount, DateTimeOffset CreatedAt);
    private record TourMediaCleanupPayload(Guid TourId, List<string> ObjectNames);
}

public class OutboxWorkerOptions
{
    public int PollingIntervalMs { get; set; } = 30000;
    public int BatchSize { get; set; } = 10;
    public int MaxRetries { get; set; } = 10;
}
