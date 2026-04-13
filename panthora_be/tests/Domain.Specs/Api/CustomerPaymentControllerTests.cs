using System.Collections.Generic;
using Api.Controllers.Customer;
using Application.Contracts.Payment;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

public sealed class CustomerPaymentControllerTests
{
    [Fact]
    public async Task CreateQr_WhenCommandSucceeds_ShouldReturnCreatedAndSendCommand()
    {
        // Arrange
        var qrUrl = "https://sepay.vn/qr/customer123";
        var command = new GetQRCommand("Customer payment", 500000);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<CustomerPaymentController, GetQRCommand, string>(
                qrUrl,
                "api/payment/getQR");

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
        var errors = new List<Error>
        {
            Error.Validation("VALIDATION_ERROR", "Note is required")
        };
        var command = new GetQRCommand("", 100000);

        var (controller, _) = ApiControllerTestHelper
            .BuildController<CustomerPaymentController, GetQRCommand, string>(
                ErrorOr<string>.From(errors),
                "api/payment/getQR");

        // Act
        var actionResult = await controller.CreateQr(command);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
    }

    [Fact]
    public async Task CreateTransaction_WhenCommandSucceeds_ShouldReturnCreatedAndSendCommand()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var transaction = PaymentTransactionEntity.Create(
            bookingId: bookingId,
            transactionCode: "CUST-PAY-001",
            type: TransactionType.FullPayment,
            amount: 500000m,
            paymentMethod: PaymentMethod.VnPay,
            paymentNote: "Full payment for booking",
            createdBy: "customer@example.com",
            expiredAt: DateTimeOffset.UtcNow.AddHours(1));

        var command = new CreatePaymentTransactionCommand(
            bookingId,
            TransactionType.FullPayment,
            500000m,
            PaymentMethod.VnPay,
            "Full payment for booking",
            "customer@example.com");

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<CustomerPaymentController, CreatePaymentTransactionCommand, PaymentTransactionEntity>(
                transaction,
                "api/payment/create-transaction");

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
    }

    [Fact]
    public async Task CreateTransaction_WhenBookingAlreadyCompleted_ShouldReturnError()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var command = new CreatePaymentTransactionCommand(
            bookingId,
            TransactionType.Deposit,
            100000m,
            PaymentMethod.BankTransfer,
            "Deposit",
            "customer@example.com");

        var errors = new List<Error>
        {
            Error.Conflict("BOOKING_ALREADY_COMPLETED", "Booking is already completed")
        };

        var (controller, _) = ApiControllerTestHelper
            .BuildController<CustomerPaymentController, CreatePaymentTransactionCommand, PaymentTransactionEntity>(
                ErrorOr<PaymentTransactionEntity>.From(errors),
                "api/payment/create-transaction");

        // Act
        var actionResult = await controller.CreateTransaction(command);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status409Conflict, objectResult.StatusCode);
    }

    [Fact]
    public async Task GetTransaction_WhenTransactionExists_ShouldReturnOk()
    {
        // Arrange
        var transactionCode = "CUST-PAY-001";
        var transaction = PaymentTransactionEntity.Create(
            bookingId: Guid.NewGuid(),
            transactionCode: transactionCode,
            type: TransactionType.Deposit,
            amount: 200000m,
            paymentMethod: PaymentMethod.Momo,
            paymentNote: "Momo payment",
            createdBy: "customer@example.com",
            expiredAt: DateTimeOffset.UtcNow.AddHours(1));

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<CustomerPaymentController, GetPaymentTransactionQuery, PaymentTransactionEntity>(
                transaction,
                $"api/payment/transaction/{transactionCode}");

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
    public async Task GetTransaction_WhenTransactionExpired_ShouldReturnError()
    {
        // Arrange
        var transactionCode = "CUST-PAY-EXPIRED";
        var errors = new List<Error>
        {
            Error.NotFound("PAYMENT_EXPIRED", "Payment transaction has expired")
        };

        var (controller, _) = ApiControllerTestHelper
            .BuildController<CustomerPaymentController, GetPaymentTransactionQuery, PaymentTransactionEntity>(
                ErrorOr<PaymentTransactionEntity>.From(errors),
                $"api/payment/transaction/{transactionCode}");

        // Act
        var actionResult = await controller.GetTransaction(transactionCode);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status404NotFound, objectResult.StatusCode);
    }
}
