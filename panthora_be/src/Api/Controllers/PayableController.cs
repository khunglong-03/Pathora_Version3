using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.BookingManagement.Payable;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Roles = RoleConstants.Admin)]
[Route(PayableEndpoint.Base)]
public class PayableController : BaseApiController
{
    [HttpPost(PayableEndpoint.Payments)]
    public async Task<IActionResult> RecordPayment(Guid id, [FromBody] RecordSupplierPaymentRequest request)
    {
        var command = new RecordSupplierPaymentCommand(
            id,
            request.Amount,
            request.PaidAt,
            request.PaymentMethod,
            request.TransactionRef,
            request.Note);

        var result = await Sender.Send(command);
        return HandleCreated(result);
    }
}

public sealed record RecordSupplierPaymentRequest(
    decimal Amount,
    DateTimeOffset PaidAt,
    PaymentMethod PaymentMethod,
    string? TransactionRef,
    string? Note);
