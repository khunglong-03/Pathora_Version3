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

    [Authorize(Policy = "AdminAndManager")]
    [HttpPut("status")]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateVisaApplicationStatusCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminAndManager")]
    [HttpPost("quote-fee")]
    public async Task<IActionResult> QuoteFee([FromBody] QuoteVisaSupportFeeCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }
}
