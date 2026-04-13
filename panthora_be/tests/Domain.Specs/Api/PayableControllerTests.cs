using System.Collections.Generic;
using Api.Controllers;
using Application.Features.BookingManagement.Payable;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

public sealed class PayableControllerTests
{
    [Fact]
    public async Task RecordPayment_WhenCommandSucceeds_ShouldReturnCreatedAndSendCommand()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var receipt = new SupplierReceiptEntity
        {
            Id = Guid.CreateVersion7(),
            SupplierPayableId = supplierId,
            Amount = 150000m,
            PaidAt = DateTimeOffset.UtcNow,
            PaymentMethod = PaymentMethod.BankTransfer,
            TransactionRef = "BANK-TXN-001",
            Note = "Payment for July services",
            CreatedBy = "admin@example.com"
        };

        var request = new RecordSupplierPaymentRequest(
            Amount: 150000m,
            PaidAt: DateTimeOffset.UtcNow,
            PaymentMethod: PaymentMethod.BankTransfer,
            TransactionRef: "BANK-TXN-001",
            Note: "Payment for July services");

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PayableController, RecordSupplierPaymentCommand, Guid>(
                receipt.Id,
                $"api/payable/{supplierId}/payments");

        // Act
        var actionResult = await controller.RecordPayment(supplierId, request);

        // Assert
        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status201Created,
            expectedInstance: "api/payable",
            expectedData: receipt.Id);

        var captured = Assert.IsType<RecordSupplierPaymentCommand>(probe.CapturedRequest);
        Assert.Equal(supplierId, captured.SupplierPayableId);
        Assert.Equal(request.Amount, captured.Amount);
        Assert.Equal(request.PaidAt, captured.PaidAt);
        Assert.Equal(request.PaymentMethod, captured.PaymentMethod);
        Assert.Equal(request.TransactionRef, captured.TransactionRef);
        Assert.Equal(request.Note, captured.Note);
    }

    [Fact]
    public async Task RecordPayment_WhenSupplierNotFound_ShouldReturnError()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var request = new RecordSupplierPaymentRequest(
            Amount: 100000m,
            PaidAt: DateTimeOffset.UtcNow,
            PaymentMethod: PaymentMethod.Card,
            null,
            "Payment");

        var errors = new List<Error>
        {
            Error.NotFound("SUPPLIER_NOT_FOUND", "Supplier not found")
        };

        var (controller, _) = ApiControllerTestHelper
            .BuildController<PayableController, RecordSupplierPaymentCommand, Guid>(
                ErrorOr<Guid>.From(errors),
                $"api/payable/{supplierId}/payments");

        // Act
        var actionResult = await controller.RecordPayment(supplierId, request);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status404NotFound, objectResult.StatusCode);
    }

    [Fact]
    public async Task RecordPayment_WhenInvalidAmount_ShouldReturnError()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var request = new RecordSupplierPaymentRequest(
            Amount: 0,
            PaidAt: DateTimeOffset.UtcNow,
            PaymentMethod: PaymentMethod.Cash,
            null,
            "Invalid payment");

        var errors = new List<Error>
        {
            Error.Validation("INVALID_AMOUNT", "Amount must be greater than zero")
        };

        var (controller, _) = ApiControllerTestHelper
            .BuildController<PayableController, RecordSupplierPaymentCommand, Guid>(
                ErrorOr<Guid>.From(errors),
                $"api/payable/{supplierId}/payments");

        // Act
        var actionResult = await controller.RecordPayment(supplierId, request);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
    }

    [Fact]
    public async Task RecordPayment_WhenPaymentMethodInvalid_ShouldReturnError()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var request = new RecordSupplierPaymentRequest(
            Amount: 100000m,
            PaidAt: DateTimeOffset.UtcNow,
            PaymentMethod: 0, // Invalid enum value for test
            null,
            "Payment with invalid method");

        var errors = new List<Error>
        {
            Error.Validation("INVALID_PAYMENT_METHOD", "Invalid payment method")
        };

        var (controller, _) = ApiControllerTestHelper
            .BuildController<PayableController, RecordSupplierPaymentCommand, Guid>(
                ErrorOr<Guid>.From(errors),
                $"api/payable/{supplierId}/payments");

        // Act
        var actionResult = await controller.RecordPayment(supplierId, request);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
    }
}
