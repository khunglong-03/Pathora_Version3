using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.VisaPolicy.Commands;
using Application.Features.VisaPolicy.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "AdminAndTourDesigner")]
[Route(VisaPolicyEndpoint.Base)]
public class VisaPolicyController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllVisaPoliciesQuery());
        return HandleResult(result);
    }

    [HttpGet(VisaPolicyEndpoint.Id)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await Sender.Send(new GetVisaPolicyByIdQuery(id));
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVisaPolicyCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateVisaPolicyCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete(VisaPolicyEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteVisaPolicyCommand(id));
        return HandleResult(result);
    }
}
