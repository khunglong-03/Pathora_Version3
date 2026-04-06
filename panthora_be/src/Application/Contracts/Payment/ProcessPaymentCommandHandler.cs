using Application.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Contracts.Payment;

public sealed class ProcessPaymentCommandHandler(
    IPaymentService paymentService,
    ILogger<ProcessPaymentCommandHandler> logger)
    : IRequestHandler<ProcessPaymentCommand, Unit>
{
    private readonly IPaymentService _paymentService = paymentService;
    private readonly ILogger<ProcessPaymentCommandHandler> _logger = logger;

    public async Task<Unit> Handle(ProcessPaymentCommand request, CancellationToken cancellationToken)
    {
        if (request.Response?.Transactions == null || request.Response.Transactions.Count == 0)
        {
            _logger.LogDebug("No transactions to process");
            return Unit.Value;
        }

        _logger.LogInformation("Processing {Count} transactions from SePay", request.Response.Transactions.Count);

        foreach (var transaction in request.Response.Transactions)
        {
            try
            {
                var transactionData = new SepayTransactionData
                {
                    TransactionId = transaction.id ?? string.Empty,
                    BankBrandName = transaction.bank_brand_name,
                    AccountNumber = transaction.account_number,
                    TransactionDate = ParseDateTime(transaction.transaction_date),
                    Amount = ParseDecimal(transaction.amount_in),
                    TransactionContent = transaction.transaction_content,
                    ReferenceNumber = transaction.reference_number
                };

                var result = await _paymentService.ProcessSepayCallbackAsync(transactionData);

                if (result.IsError)
                {
                    _logger.LogWarning(
                        "Failed to process transaction {TransactionId}: {Errors}",
                        transaction.id,
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
                else
                {
                    _logger.LogInformation(
                        "Successfully processed transaction {TransactionId}, Amount: {Amount}",
                        transaction.id,
                        transactionData.Amount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing transaction {TransactionId}", transaction.id);
            }
        }

        return Unit.Value;
    }

    private static DateTimeOffset ParseDateTime(string? dateStr)
    {
        if (string.IsNullOrEmpty(dateStr))
            return DateTimeOffset.UtcNow;

        if (DateTimeOffset.TryParse(dateStr, out var parsed))
            return parsed;

        // Try parsing common formats
        if (DateTimeOffset.TryParseExact(dateStr, new[] { "yyyy-MM-dd HH:mm:ss", "yyyy/MM/dd HH:mm:ss" },
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None,
            out parsed))
            return parsed;

        return DateTimeOffset.UtcNow;
    }

    private static decimal ParseDecimal(string? amountStr)
    {
        if (string.IsNullOrEmpty(amountStr))
            return 0;

        // Remove commas and whitespace
        var cleaned = amountStr.Replace(",", "").Trim();

        if (decimal.TryParse(cleaned, out var result))
            return result;

        return 0;
    }
}
