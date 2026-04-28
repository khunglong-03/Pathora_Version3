using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.CancellationPolicy.Commands;
using Application.Features.CancellationPolicy.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "AdminAndTourOperator")]
[Route(CancellationPolicyEndpoint.Base)]
public class CancellationPolicyController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllCancellationPoliciesQuery());
        return HandleResult(result);
    }

    [HttpGet(CancellationPolicyEndpoint.Id)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await Sender.Send(new GetCancellationPolicyByIdQuery(id));
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCancellationPolicyCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateCancellationPolicyCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete(CancellationPolicyEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteCancellationPolicyCommand(id));
        return HandleResult(result);
    }
}
