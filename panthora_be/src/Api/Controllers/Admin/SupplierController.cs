using Api.Endpoint;
using Application.Common.Constant;
using Application.Contracts.Booking;
using Application.Features.BookingManagement.Supplier;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Admin;

[Authorize(Policy = "AdminOnly")]
[Route(SupplierEndpoint.Base)]
public class SupplierController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetSuppliers([FromQuery] SupplierType? supplierType)
    {
        var result = await Sender.Send(new GetSuppliersQuery(supplierType));
        return HandleResult(result);
    }

    [HttpGet(SupplierEndpoint.Id)]
    public async Task<IActionResult> GetSupplierById(Guid id)
    {
        var result = await Sender.Send(new GetSupplierByIdQuery(id));
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto request)
    {
        var command = new CreateSupplierCommand(
            request.SupplierCode,
            request.SupplierType,
            request.Name,
            request.Phone,
            request.Email,
            request.Address,
            request.Note);

        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [HttpPost(SupplierEndpoint.WithOwner)]
    public async Task<IActionResult> CreateSupplierWithOwner([FromBody] CreateSupplierWithOwnerDto request)
    {
        var command = new CreateSupplierWithOwnerCommand(
            request.OwnerEmail,
            request.OwnerFullName,
            request.SupplierCode,
            request.SupplierType,
            request.SupplierName,
            request.Phone,
            request.Email,
            request.Address,
            request.Note);

        var result = await Sender.Send(command);
        return HandleSupplierWithOwnerCreated(result);
    }

    [HttpPut(SupplierEndpoint.Id)]
    public async Task<IActionResult> UpdateSupplier(Guid id, [FromBody] UpdateSupplierDto request)
    {
        var command = new UpdateSupplierCommand(
            id,
            request.SupplierCode,
            request.SupplierType,
            request.Name,
            request.Phone,
            request.Email,
            request.Address,
            request.Note,
            request.IsActive);

        var result = await Sender.Send(command);
        return HandleUpdated(result);
    }

    [HttpDelete(SupplierEndpoint.Id)]
    public async Task<IActionResult> DeleteSupplier(Guid id)
    {
        var result = await Sender.Send(new DeleteSupplierCommand(id));
        return HandleDeleted(result);
    }
}
