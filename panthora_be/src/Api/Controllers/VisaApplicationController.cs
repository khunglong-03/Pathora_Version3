using Api.Endpoint;
using Application.Features.VisaApplication.Commands;
using Application.Features.VisaApplication.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "AdminAndTourOperator")]
[Route(VisaApplicationEndpoint.Base)]
public sealed class VisaApplicationController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllVisaApplicationsQuery());
        return HandleResult(result);
    }

    [HttpGet(VisaApplicationEndpoint.Id)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await Sender.Send(new GetVisaApplicationByIdQuery(id));
        return HandleResult(result);
    }

    [HttpGet(VisaApplicationEndpoint.ByBookingParticipant)]
    public async Task<IActionResult> GetByParticipant(Guid bookingParticipantId)
    {
        var result = await Sender.Send(new GetVisaApplicationsByParticipantQuery(bookingParticipantId));
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVisaApplicationCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "ManagerOnly")]
    [HttpPut("status")]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateVisaApplicationStatusCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "ManagerOnly")]
    [HttpPost("quote-fee")]
    public async Task<IActionResult> QuoteFee([FromBody] QuoteVisaSupportFeeCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "ManagerOnly")]
    [HttpPost("{id:guid}/register-details")]
    public async Task<IActionResult> RegisterDetails(Guid id, [FromBody] RegisterVisaDetailsRequest body)
    {
        if (body is null) return BadRequest("Request payload is required.");

        var command = new RegisterVisaDetailsCommand(
            VisaApplicationId: id,
            VisaNumber: body.VisaNumber,
            IssuedAt: body.IssuedAt,
            ExpiresAt: body.ExpiresAt,
            Category: body.Category,
            Format: body.Format,
            EntryType: body.EntryType,
            MaxStayDays: body.MaxStayDays,
            IssuingAuthority: body.IssuingAuthority,
            VisaFileUrl: body.VisaFileUrl);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }
}

public sealed record RegisterVisaDetailsRequest(
    string VisaNumber,
    DateTimeOffset IssuedAt,
    DateTimeOffset ExpiresAt,
    Domain.Enums.VisaCategory Category,
    Domain.Enums.VisaFormat Format,
    Domain.Enums.VisaEntryType? EntryType = null,
    int? MaxStayDays = null,
    string? IssuingAuthority = null,
    string? VisaFileUrl = null);
