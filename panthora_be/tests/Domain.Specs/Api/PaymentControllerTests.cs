using System.Collections.Generic;
using Api.Controllers;
using Application.Contracts.Payment;
using Application.Services;
using Contracts.ModelResponse;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;

namespace Domain.Specs.Api;

public sealed class PaymentControllerTests
{
    [Fact]
    public async Task CreateQr_WhenCommandSucceeds_ShouldReturnCreatedAndSendCommand()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var qrUrl = "https://sepay.vn/qr/test123";
        var command = new GetQRCommand("Test payment", 100000);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, GetQRCommand, string>(
                qrUrl,
                "api/payment/getQR",
                rateLimitService);

        // Act
        var actionResult = await controller.CreateQr(command);

        // Assert
        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status201Created,
            expectedInstance: "api/payment",
            expectedData: qrUrl);

        var captured = Assert.IsType<GetQRCommand>(probe.CapturedRequest);
        Assert.Equal(command.note, captured.note);
        Assert.Equal(command.amount, captured.amount);
    }

    [Fact]
    public async Task CreateQr_WhenCommandFails_ShouldReturnError()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var errors = new List<Error>
        {
            Error.Validation("VALIDATION_ERROR", "Amount must be greater than zero")
        };
        var command = new GetQRCommand("", 0);

        var (controller, _) = ApiControllerTestHelper
            .BuildController<PaymentController, GetQRCommand, string>(
                ErrorOr<string>.From(errors),
                "api/payment/getQR",
                rateLimitService);

        // Act
        var actionResult = await controller.CreateQr(command);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, payload.StatusCode);
        Assert.Null(payload.Data);
        Assert.NotNull(payload.Errors);
        Assert.Single(payload.Errors);
    }

    [Fact]
    public async Task CreateTransaction_WhenCommandSucceeds_ShouldReturnCreatedAndSendCommand()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var bookingId = Guid.NewGuid();
        var transaction = PaymentTransactionEntity.Create(
            bookingId: bookingId,
            transactionCode: "PAY-TEST-001",
            type: TransactionType.Deposit,
            amount: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test deposit",
            createdBy: "customer@test.com",
            expiredAt: DateTimeOffset.UtcNow.AddHours(1));

        var command = new CreatePaymentTransactionCommand(
            bookingId,
            TransactionType.Deposit,
            100000m,
            PaymentMethod.BankTransfer,
            "Test deposit",
            "customer@test.com");

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, CreatePaymentTransactionCommand, PaymentTransactionEntity>(
                transaction,
                "api/payment/create-transaction",
                rateLimitService);

        // Act
        var actionResult = await controller.CreateTransaction(command);

        // Assert
        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status201Created,
            expectedInstance: "api/payment",
            expectedData: transaction);

        var captured = Assert.IsType<CreatePaymentTransactionCommand>(probe.CapturedRequest);
        Assert.Equal(command.BookingId, captured.BookingId);
        Assert.Equal(command.Type, captured.Type);
        Assert.Equal(command.Amount, captured.Amount);
        Assert.Equal(command.PaymentMethod, captured.PaymentMethod);
        Assert.Equal(command.PaymentNote, captured.PaymentNote);
        Assert.Equal(command.CreatedBy, captured.CreatedBy);
        Assert.Equal(command.ExpirationMinutes, captured.ExpirationMinutes);
    }

    [Fact]
    public async Task CreateTransaction_WhenBookingNotFound_ShouldReturnError()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var bookingId = Guid.NewGuid();
        var command = new CreatePaymentTransactionCommand(
            bookingId,
            TransactionType.Deposit,
            100000m,
            PaymentMethod.BankTransfer,
            "Test deposit",
            "customer@test.com");

        var errors = new List<Error>
        {
            Error.NotFound("BOOKING_NOT_FOUND", "Booking not found")
        };

        var (controller, _) = ApiControllerTestHelper
            .BuildController<PaymentController, CreatePaymentTransactionCommand, PaymentTransactionEntity>(
                ErrorOr<PaymentTransactionEntity>.From(errors),
                "api/payment/create-transaction",
                rateLimitService);

        // Act
        var actionResult = await controller.CreateTransaction(command);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status404NotFound, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, payload.StatusCode);
        Assert.NotNull(payload.Errors);
    }

    [Fact]
    public async Task GetTransaction_WhenTransactionExists_ShouldReturnOk()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var transactionCode = "PAY-TEST-001";
        var transaction = PaymentTransactionEntity.Create(
            bookingId: Guid.NewGuid(),
            transactionCode: transactionCode,
            type: TransactionType.Deposit,
            amount: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test",
            createdBy: "test@test.com",
            expiredAt: DateTimeOffset.UtcNow.AddHours(1));

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, GetPaymentTransactionQuery, PaymentTransactionEntity>(
                transaction,
                $"api/payment/transaction/{transactionCode}",
                rateLimitService);

        // Act
        var actionResult = await controller.GetTransaction(transactionCode);

        // Assert
        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "api/payment",
            expectedData: transaction);

        var captured = Assert.IsType<GetPaymentTransactionQuery>(probe.CapturedRequest);
        Assert.Equal(transactionCode, captured.TransactionCode);
    }

    [Fact]
    public async Task GetTransaction_WhenTransactionNotFound_ShouldReturnError()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var transactionCode = "PAY-NOTFOUND";
        var errors = new List<Error>
        {
            Error.NotFound("PAYMENT_NOT_FOUND", "Payment transaction not found")
        };

        var (controller, _) = ApiControllerTestHelper
            .BuildController<PaymentController, GetPaymentTransactionQuery, PaymentTransactionEntity>(
                ErrorOr<PaymentTransactionEntity>.From(errors),
                $"api/payment/transaction/{transactionCode}",
                rateLimitService);

        // Act
        var actionResult = await controller.GetTransaction(transactionCode);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status404NotFound, objectResult.StatusCode);
    }

    [Fact]
    public async Task CheckPayment_WhenTransactionExists_ShouldReturnSnapshot()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var transactionCode = "PAY-TEST-001";
        var snapshot = new PaymentStatusSnapshot(
            transactionCode,
            "paid",
            "Completed",
            "check-payment",
            true,
            true,
            DateTimeOffset.UtcNow,
            "ext-tx-123");

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, CheckPaymentNowCommand, PaymentStatusSnapshot>(
                snapshot,
                $"api/payment/transaction/{transactionCode}/check",
                rateLimitService);

        // Act
        var actionResult = await controller.CheckPayment(transactionCode);

        // Assert
        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "api/payment",
            expectedData: snapshot);

        var captured = Assert.IsType<CheckPaymentNowCommand>(probe.CapturedRequest);
        Assert.Equal(transactionCode, captured.TransactionCode);
    }

    [Fact]
    public async Task GetTransactionStatus_WhenTransactionExists_ShouldReturnSnapshot()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var transactionCode = "PAY-TEST-001";
        var snapshot = new PaymentStatusSnapshot(
            transactionCode,
            "pending",
            "Pending",
            "status-check",
            false,
            false,
            DateTimeOffset.UtcNow,
            null);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, GetNormalizedPaymentStatusQuery, PaymentStatusSnapshot>(
                snapshot,
                $"api/payment/transaction/{transactionCode}/status",
                rateLimitService);

        // Act
        var actionResult = await controller.GetTransactionStatus(transactionCode);

        // Assert
        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "api/payment",
            expectedData: snapshot);

        var captured = Assert.IsType<GetNormalizedPaymentStatusQuery>(probe.CapturedRequest);
        Assert.Equal(transactionCode, captured.TransactionCode);
    }

    [Fact]
    public async Task GetTransactionStatus_WhenRateLimited_ShouldReturn429()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var transactionCode = "PAY-TEST-001";
        var retryAfter = 30;
        rateLimitService.CheckRateLimit(transactionCode).Returns((false, retryAfter));

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, GetNormalizedPaymentStatusQuery, PaymentStatusSnapshot>(
                ErrorOr<PaymentStatusSnapshot>.From(new List<Error> { Error.Validation("RATE_LIMITED", "Too many requests") }),
                $"api/payment/transaction/{transactionCode}/status",
                rateLimitService);

        // Act
        var actionResult = await controller.GetTransactionStatus(transactionCode);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status429TooManyRequests, objectResult.StatusCode);

        // Verify Retry-After header
        Assert.True(controller.Response.Headers.ContainsKey("Retry-After"));
        Assert.Equal(retryAfter.ToString(), controller.Response.Headers["Retry-After"].FirstOrDefault());
    }

    [Fact]
    public async Task ReconcileReturn_WithTransactionCode_ShouldUseTransactionCode()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var transactionCode = "PAY-001";
        var snapshot = new PaymentStatusSnapshot(
            transactionCode,
            "paid",
            "Completed",
            "return",
            true,
            true,
            DateTimeOffset.UtcNow,
            "ext-tx-return");

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, ReconcilePaymentReturnCommand, PaymentStatusSnapshot>(
                snapshot,
                "api/payment/return",
                rateLimitService);

        // Act
        var actionResult = await controller.ReconcileReturn(transactionCode, null, null);

        // Assert
        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "api/payment",
            expectedData: snapshot);

        var captured = Assert.IsType<ReconcilePaymentReturnCommand>(probe.CapturedRequest);
        Assert.Equal(transactionCode, captured.TransactionCode);
    }

    [Fact]
    public async Task ReconcileReturn_WithNullTransactionCode_WithCode_UsesCode()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var code = "CODE-002";
        var snapshot = new PaymentStatusSnapshot(
            code,
            "paid",
            "Completed",
            "return",
            true,
            true,
            DateTimeOffset.UtcNow,
            "ext-tx-return");

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, ReconcilePaymentReturnCommand, PaymentStatusSnapshot>(
                snapshot,
                "api/payment/return",
                rateLimitService);

        // Act
        var actionResult = await controller.ReconcileReturn(null, code, null);

        // Assert
        var captured = Assert.IsType<ReconcilePaymentReturnCommand>(probe.CapturedRequest);
        Assert.Equal(code, captured.TransactionCode);
    }

    [Fact]
    public async Task ReconcileReturn_WithNullTransactionCodeAndCode_WithOrderCode_UsesOrderCode()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var orderCode = "ORDER-003";
        var snapshot = new PaymentStatusSnapshot(
            orderCode,
            "paid",
            "Completed",
            "return",
            true,
            true,
            DateTimeOffset.UtcNow,
            "ext-tx-return");

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, ReconcilePaymentReturnCommand, PaymentStatusSnapshot>(
                snapshot,
                "api/payment/return",
                rateLimitService);

        // Act
        var actionResult = await controller.ReconcileReturn(null, null, orderCode);

        // Assert
        var captured = Assert.IsType<ReconcilePaymentReturnCommand>(probe.CapturedRequest);
        Assert.Equal(orderCode, captured.TransactionCode);
    }

    [Fact]
    public async Task ReconcileReturn_WithAllNull_ReturnsBadRequest()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var (controller, _) = ApiControllerTestHelper
            .BuildController<PaymentController, ReconcilePaymentReturnCommand, PaymentStatusSnapshot>(
                ErrorOr<PaymentStatusSnapshot>.From(new List<Error> { Error.Validation("MISSING_CODE", "Missing transaction code") }),
                "api/payment/return",
                rateLimitService);

        // Act
        var actionResult = await controller.ReconcileReturn(null, null, null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, payload.StatusCode);
        Assert.Contains("Missing transaction code", payload.Message);
    }

    [Fact]
    public async Task ReconcileCancel_WithTransactionCode_ShouldUseTransactionCode()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var transactionCode = "PAY-001";
        var snapshot = new PaymentStatusSnapshot(
            transactionCode,
            "cancelled",
            "Cancelled",
            "cancel",
            true,
            true,
            DateTimeOffset.UtcNow,
            null);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, ReconcilePaymentCancelCommand, PaymentStatusSnapshot>(
                snapshot,
                "api/payment/cancel",
                rateLimitService);

        // Act
        var actionResult = await controller.ReconcileCancel(transactionCode, null, null);

        // Assert
        var captured = Assert.IsType<ReconcilePaymentCancelCommand>(probe.CapturedRequest);
        Assert.Equal(transactionCode, captured.TransactionCode);
    }

    [Fact]
    public async Task ReconcileCancel_WithNullTransactionCode_WithCode_UsesCode()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var code = "CODE-002";
        var snapshot = new PaymentStatusSnapshot(
            code,
            "cancelled",
            "Cancelled",
            "cancel",
            true,
            true,
            DateTimeOffset.UtcNow,
            null);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, ReconcilePaymentCancelCommand, PaymentStatusSnapshot>(
                snapshot,
                "api/payment/cancel",
                rateLimitService);

        // Act
        var actionResult = await controller.ReconcileCancel(null, code, null);

        // Assert
        var captured = Assert.IsType<ReconcilePaymentCancelCommand>(probe.CapturedRequest);
        Assert.Equal(code, captured.TransactionCode);
    }

    [Fact]
    public async Task ExpireTransaction_WhenTransactionExists_ShouldReturnUpdatedTransaction()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var transactionCode = "PAY-TEST-001";
        var transaction = PaymentTransactionEntity.Create(
            bookingId: Guid.NewGuid(),
            transactionCode: transactionCode,
            type: TransactionType.Deposit,
            amount: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test",
            createdBy: "test@test.com",
            expiredAt: DateTimeOffset.UtcNow.AddHours(-1)); // Already expired

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PaymentController, ExpirePaymentTransactionCommand, PaymentTransactionEntity>(
                transaction,
                $"api/payment/transaction/{transactionCode}/expire",
                rateLimitService);

        // Act
        var actionResult = await controller.ExpireTransaction(transactionCode);

        // Assert
        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "api/payment",
            expectedData: transaction);

        var captured = Assert.IsType<ExpirePaymentTransactionCommand>(probe.CapturedRequest);
        Assert.Equal(transactionCode, captured.TransactionCode);
    }

    [Fact]
    public async Task ExpireTransaction_WhenTransactionNotFound_ShouldReturnError()
    {
        // Arrange
        var rateLimitService = Substitute.For<IRateLimitService>();
        var transactionCode = "PAY-NOTFOUND";
        var errors = new List<Error>
        {
            Error.NotFound("PAYMENT_NOT_FOUND", "Payment transaction not found")
        };

        var (controller, _) = ApiControllerTestHelper
            .BuildController<PaymentController, ExpirePaymentTransactionCommand, PaymentTransactionEntity>(
                ErrorOr<PaymentTransactionEntity>.From(errors),
                $"api/payment/transaction/{transactionCode}/expire",
                rateLimitService);

        // Act
        var actionResult = await controller.ExpireTransaction(transactionCode);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status404NotFound, objectResult.StatusCode);
    }
}
