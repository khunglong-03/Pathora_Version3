using Api.Controllers;
using Application.Contracts.Booking;
using Application.Features.BookingManagement.Activity;
using Application.Features.BookingManagement.Participant;
using Application.Features.BookingManagement.Payable;
using Application.Features.BookingManagement.Supplier;
using Contracts.ModelResponse;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

public sealed class BookingManagementApiControllerTests
{
    [Fact]
    public async Task GetSuppliers_WhenQuerySucceeds_ShouldReturnOkAndCaptureFilter()
    {
        var supplier = new SupplierDto(
            Guid.CreateVersion7(),
            "SUP-001",
            SupplierType.Transport,
            "Supplier A",
            null,
            null,
            null,
            null,
            null,
            true);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<SupplierController, GetSuppliersQuery, List<SupplierDto>>(
                new List<SupplierDto> { supplier },
                "/api/suppliers");

        var actionResult = await controller.GetSuppliers(SupplierType.Transport);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/suppliers",
            expectedData: new List<SupplierDto> { supplier });

        Assert.Equal(new GetSuppliersQuery(SupplierType.Transport), probe.CapturedRequest);
    }

    [Fact]
    public async Task CreateSupplier_WhenCommandSucceeds_ShouldReturnCreatedAndSendMappedCommand()
    {
        var createdId = Guid.CreateVersion7();
        var request = new CreateSupplierDto(
            "SUP-NEW",
            SupplierType.Accommodation,
            "Hotel Supplier",
            "TAX01",
            "0900000000",
            "hotel@example.com",
            "Ha Noi",
            "priority");

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<SupplierController, CreateSupplierCommand, Guid>(
                createdId,
                "/api/suppliers");

        var actionResult = await controller.CreateSupplier(request);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status201Created, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<ApiCreatedResponse<Guid>>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status201Created, payload.StatusCode);
        Assert.Equal(createdId, payload.Data?.Value);

        var captured = Assert.IsType<CreateSupplierCommand>(probe.CapturedRequest);
        Assert.Equal(request.SupplierCode, captured.SupplierCode);
        Assert.Equal(request.SupplierType, captured.SupplierType);
        Assert.Equal(request.Name, captured.Name);
    }

    [Fact]
    public async Task GetParticipants_WhenQuerySucceeds_ShouldReturnOkAndCaptureBookingId()
    {
        var bookingId = Guid.CreateVersion7();
        var participant = new ParticipantDto(
            Guid.CreateVersion7(),
            bookingId,
            "Adult",
            "Participant",
            null,
            null,
            null,
            ReservationStatus.Pending,
            null,
            new List<VisaApplicationDto>());

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<BookingManagementController, GetBookingParticipantsQuery, List<ParticipantDto>>(
                new List<ParticipantDto> { participant },
                $"/api/bookings/{bookingId}/participants");

        var actionResult = await controller.GetParticipants(bookingId);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/bookings/{bookingId}/participants",
            expectedData: new List<ParticipantDto> { participant });

        Assert.Equal(new GetBookingParticipantsQuery(bookingId), probe.CapturedRequest);
    }

    [Fact]
    public async Task CreatePayable_WhenCommandSucceeds_ShouldReturnCreatedAndMapBookingIdFromRoute()
    {
        var bookingId = Guid.CreateVersion7();
        var supplierId = Guid.CreateVersion7();
        var payableId = Guid.CreateVersion7();
        var request = new CreateSupplierPayableRequest(supplierId, 500, DateTimeOffset.UtcNow.AddDays(7), "note");

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<BookingManagementController, CreateSupplierPayableCommand, Guid>(
                payableId,
                $"/api/bookings/{bookingId}/payables");

        var actionResult = await controller.CreatePayable(bookingId, request);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status201Created, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<ApiCreatedResponse<Guid>>>(objectResult.Value);
        Assert.Equal(payableId, payload.Data?.Value);

        var captured = Assert.IsType<CreateSupplierPayableCommand>(probe.CapturedRequest);
        Assert.Equal(bookingId, captured.BookingId);
        Assert.Equal(supplierId, captured.SupplierId);
        Assert.Equal(500, captured.ExpectedAmount);
    }

    [Fact]
    public async Task UpsertPassport_WhenPassportIdMissing_ShouldSendCreateCommand()
    {
        var participantId = Guid.CreateVersion7();
        var passportId = Guid.CreateVersion7();
        var request = new UpsertPassportRequest(
            PassportId: null,
            PassportNumber: "P123456",
            Nationality: "VN",
            IssuedAt: DateTimeOffset.UtcNow.AddYears(-1),
            ExpiresAt: DateTimeOffset.UtcNow.AddYears(5),
            FileUrl: null);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<ParticipantController, CreatePassportCommand, Guid>(
                passportId,
                $"/api/participants/{participantId}/passport");

        var actionResult = await controller.UpsertPassport(participantId, request);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status201Created, objectResult.StatusCode);

        var captured = Assert.IsType<CreatePassportCommand>(probe.CapturedRequest);
        Assert.Equal(participantId, captured.BookingParticipantId);
        Assert.Equal(request.PassportNumber, captured.PassportNumber);
    }

    [Fact]
    public async Task RecordPayment_WhenCommandSucceeds_ShouldReturnCreatedAndCapturePayableId()
    {
        var payableId = Guid.CreateVersion7();
        var receiptId = Guid.CreateVersion7();
        var request = new RecordSupplierPaymentRequest(
            300,
            DateTimeOffset.UtcNow,
            PaymentMethod.BankTransfer,
            "TX-001",
            "first payment");

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PayableController, RecordSupplierPaymentCommand, Guid>(
                receiptId,
                $"/api/payables/{payableId}/payments");

        var actionResult = await controller.RecordPayment(payableId, request);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status201Created, objectResult.StatusCode);

        var captured = Assert.IsType<RecordSupplierPaymentCommand>(probe.CapturedRequest);
        Assert.Equal(payableId, captured.SupplierPayableId);
        Assert.Equal(request.Amount, captured.Amount);
        Assert.Equal(request.PaymentMethod, captured.PaymentMethod);
    }
}
