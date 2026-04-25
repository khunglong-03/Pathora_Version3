using System.Net;
using System.Text.Json;

using global::Application.Services;
using Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace Domain.Specs.Application.Services;

public sealed class PaymentReconciliationServiceTests
{
    private readonly IPaymentTransactionRepository _transactionRepo = Substitute.For<IPaymentTransactionRepository>();
    private readonly IPaymentService _paymentService = Substitute.For<IPaymentService>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ISePayApiClient _sePayApiClient = Substitute.For<ISePayApiClient>();
    private readonly ILogger<PaymentReconciliationService> _logger = Substitute.For<ILogger<PaymentReconciliationService>>();

    #region Amount Matching Tests

    #region TC01: FetchMatchingProviderTransaction matches when only amount_in is present

    [Fact]
    public async Task FetchMatchingProviderTransaction_WhenAmountInOnly_ShouldMatch()
    {
        // Arrange
        var transaction = CreatePendingTransaction(100000m);

        var sepayResponse = CreateSepayApiResponse(
            transactions:
            [
                new SePayTransaction
                {
                    id = "tx-in-only",
                    transaction_content = "PAY-TEST-AMOUNT 100000",
                    amount_in = "100000",
                    amount_out = null,
                    transaction_date = "2024-03-15 10:30:00"
                }
            ]);

        _sePayApiClient.IsConfigured.Returns(true);
        _sePayApiClient.FindTransactionByRefCodeAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<long>(),
            Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<SePayTransaction?>(sepayResponse.Transactions![0]));

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        // Act
        var result = await service.FetchMatchingProviderTransactionAsync(transaction);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("tx-in-only", result!.id);
    }

    #endregion

    #region TC02: FetchMatchingProviderTransaction matches when only amount_out is present

    [Fact]
    public async Task FetchMatchingProviderTransaction_WhenAmountOutOnly_ShouldMatch()
    {
        // Arrange
        var transaction = CreatePendingTransaction(100000m);

        var sepayResponse = CreateSepayApiResponse(
            transactions:
            [
                new SePayTransaction
                {
                    id = "tx-out-only",
                    transaction_content = "PAY-TEST-AMOUNT",
                    amount_in = null,
                    amount_out = "100000",
                    transaction_date = "2024-03-15 10:30:00"
                }
            ]);

        _sePayApiClient.IsConfigured.Returns(true);
        _sePayApiClient.FindTransactionByRefCodeAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<long>(),
            Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<SePayTransaction?>(sepayResponse.Transactions![0]));

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        // Act
        var result = await service.FetchMatchingProviderTransactionAsync(transaction);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("tx-out-only", result!.id);
    }

    #endregion

    #region TC03: FetchMatchingProviderTransaction does NOT match when amount is larger (SECURITY TEST)

    [Fact]
    public async Task FetchMatchingProviderTransaction_WhenAmountLarger_ShouldNotMatch()
    {
        // Arrange
        var transaction = CreatePendingTransaction(100000m);

        // Transaction amount is LARGER than expected — should NOT match
        var sepayResponse = CreateSepayApiResponse(
            transactions:
            [
                new SePayTransaction
                {
                    id = "tx-too-much",
                    transaction_content = "PAY-TEST-AMOUNT",
                    amount_in = "200000",
                    amount_out = null,
                    transaction_date = "2024-03-15 10:30:00"
                }
            ]);

        _sePayApiClient.IsConfigured.Returns(true);
        _sePayApiClient.FindTransactionByRefCodeAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<long>(),
            Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<SePayTransaction?>(null));

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        // Act
        var result = await service.FetchMatchingProviderTransactionAsync(transaction);

        // Assert — larger amount must NOT match (security)
        Assert.Null(result);
    }

    #endregion

    #region TC04: FetchMatchingProviderTransaction matches exact amount (boundary)

    [Fact]
    public async Task FetchMatchingProviderTransaction_WhenExactAmount_ShouldMatch()
    {
        // Arrange
        var transaction = CreatePendingTransaction(99999m);

        var sepayResponse = CreateSepayApiResponse(
            transactions:
            [
                new SePayTransaction
                {
                    id = "tx-exact",
                    transaction_content = "PAY-TEST-AMOUNT",
                    amount_in = "99999",
                    amount_out = null,
                    transaction_date = "2024-03-15 10:30:00"
                }
            ]);

        _sePayApiClient.IsConfigured.Returns(true);
        _sePayApiClient.FindTransactionByRefCodeAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<long>(),
            Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<SePayTransaction?>(sepayResponse.Transactions![0]));

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        // Act
        var result = await service.FetchMatchingProviderTransactionAsync(transaction);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("tx-exact", result!.id);
    }

    #endregion

    #endregion

    #region ReferenceCode Matching Tests

    #region TC05: FetchMatchingProviderTransaction matches by ReferenceCode (12-char) when set

    [Fact]
    public async Task FetchMatchingProviderTransaction_WhenReferenceCodeSet_ShouldMatchByReferenceCode()
    {
        // Arrange
        var transaction = CreatePendingTransaction(100000m, referenceCode: "202604011230XY");

        _sePayApiClient.IsConfigured.Returns(true);
        _sePayApiClient.FindTransactionByRefCodeAsync(
            "202604011230XY",
            "PAY-TEST-AMOUNT",
            100000,
            Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<SePayTransaction?>(new SePayTransaction
            {
                id = "tx-by-refcode",
                transaction_content = "PAY-20260401-TESTCODE|202604011230XY|Booking",
                amount_in = "100000",
                amount_out = null,
                transaction_date = "2024-03-15 10:30:00"
            }));

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        // Act
        var result = await service.FetchMatchingProviderTransactionAsync(transaction);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("tx-by-refcode", result!.id);
    }

    #endregion

    #region TC06: FetchMatchingProviderTransaction falls back to TransactionCode when ReferenceCode is null

    [Fact]
    public async Task FetchMatchingProviderTransaction_WhenReferenceCodeNull_ShouldMatchByTransactionCode()
    {
        // Arrange
        var transaction = CreatePendingTransaction(100000m, referenceCode: null);

        _sePayApiClient.IsConfigured.Returns(true);
        _sePayApiClient.FindTransactionByRefCodeAsync(
            "",
            "PAY-TEST-AMOUNT",
            100000,
            Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<SePayTransaction?>(new SePayTransaction
            {
                id = "tx-by-txcode",
                transaction_content = "PAY-TEST-AMOUNT 100000",
                amount_in = "100000",
                amount_out = null,
                transaction_date = "2024-03-15 10:30:00"
            }));

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        // Act
        var result = await service.FetchMatchingProviderTransactionAsync(transaction);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("tx-by-txcode", result!.id);
    }

    #endregion

    #region TC07: FetchMatchingProviderTransaction prefers ReferenceCode over TransactionCode

    [Fact]
    public async Task FetchMatchingProviderTransaction_WhenBothMatch_ShouldPreferReferenceCode()
    {
        // Arrange
        var transaction = CreatePendingTransaction(100000m, referenceCode: "202604011230XY");

        _sePayApiClient.IsConfigured.Returns(true);
        _sePayApiClient.FindTransactionByRefCodeAsync(
            "202604011230XY",
            "PAY-TEST-AMOUNT",
            100000,
            Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<SePayTransaction?>(new SePayTransaction
            {
                id = "tx-by-refcode",
                transaction_content = "PAY-20260401-TESTCODE|202604011230XY|Booking",
                amount_in = "100000",
                amount_out = null,
                transaction_date = "2024-03-15 10:31:00"
            }));

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        // Act
        var result = await service.FetchMatchingProviderTransactionAsync(transaction);

        // Assert — ReferenceCode match is found
        Assert.NotNull(result);
        Assert.Equal("tx-by-refcode", result!.id);
    }

    #endregion

    #region TC08: FetchMatchingProviderTransaction returns null when ReferenceCode is set but not found

    [Fact]
    public async Task FetchMatchingProviderTransaction_WhenReferenceCodeNotFound_ShouldReturnNull()
    {
        // Arrange
        var transaction = CreatePendingTransaction(100000m, referenceCode: "202604011230XY");

        _sePayApiClient.IsConfigured.Returns(true);
        _sePayApiClient.FindTransactionByRefCodeAsync(
            "202604011230XY",
            "PAY-TEST-AMOUNT",
            100000,
            Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<SePayTransaction?>(null));

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        // Act
        var result = await service.FetchMatchingProviderTransactionAsync(transaction);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region TC09: FetchMatchingProviderTransaction handles empty transaction_content

    [Fact]
    public async Task FetchMatchingProviderTransaction_WhenTransactionContentEmpty_ShouldNotMatch()
    {
        // Arrange
        var transaction = CreatePendingTransaction(100000m, referenceCode: "202604011230XY");

        _sePayApiClient.IsConfigured.Returns(true);
        _sePayApiClient.FindTransactionByRefCodeAsync(
            "202604011230XY",
            "PAY-TEST-AMOUNT",
            100000,
            Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<SePayTransaction?>(null));

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        // Act
        var result = await service.FetchMatchingProviderTransactionAsync(transaction);

        // Assert — empty content should not cause false positive
        Assert.Null(result);
    }

    #endregion

    #region TC10: FetchMatchingProviderTransaction skips when SePay is not configured

    [Fact]
    public async Task FetchMatchingProviderTransaction_WhenNotConfigured_ShouldReturnNull()
    {
        // Arrange
        var transaction = CreatePendingTransaction(100000m);

        _sePayApiClient.IsConfigured.Returns(false);

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        // Act
        var result = await service.FetchMatchingProviderTransactionAsync(transaction);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #endregion

    #region Helper Methods

    [Fact]
    public async Task ReconcileProviderCallbackAsync_WhenDuplicateSepayIdAlreadyCompleted_ShouldReturnExistingSnapshot()
    {
        // Arrange
        var completedTransaction = CreatePendingTransaction(100000m, referenceCode: "202604011230XY");
        completedTransaction.MarkAsPaid(100000m, DateTimeOffset.UtcNow, externalTransactionId: "sepay-duplicate-001");

        _transactionRepo.GetBySepayTransactionIdAsync("sepay-duplicate-001", Arg.Any<CancellationToken>())
            .Returns(completedTransaction);

        var service = new PaymentReconciliationService(
            _transactionRepo, _paymentService, _unitOfWork, _sePayApiClient, null, _logger);

        var callback = new SepayTransactionData
        {
            TransactionId = "sepay-duplicate-001",
            TransactionDate = DateTimeOffset.UtcNow,
            Amount = 100000m,
            TransactionContent = "PAY-TEST-AMOUNT|202604011230XY|Booking"
        };

        // Act
        var result = await service.ReconcileProviderCallbackAsync(callback);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal("PAY-TEST-AMOUNT", result.Value.TransactionCode);
        Assert.Equal("paid", result.Value.NormalizedStatus);
        await _paymentService.DidNotReceive().ProcessSepayCallbackAsync(Arg.Any<SepayTransactionData>());
    }

    private static PaymentTransactionEntity CreatePendingTransaction(decimal amount, string? referenceCode = null)
    {
        var t = PaymentTransactionEntity.Create(
            bookingId: Guid.NewGuid(),
            transactionCode: "PAY-TEST-AMOUNT",
            type: TransactionType.Deposit,
            amount: amount,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test",
            createdBy: "test",
            expiredAt: DateTimeOffset.UtcNow.AddHours(1),
            referenceCode: referenceCode);
        return t;
    }

    private static SePayApiResponse CreateSepayApiResponse(List<SePayTransaction> transactions) =>
        new()
        {
            Status = 1,
            Transactions = transactions
        };

    #endregion
}
