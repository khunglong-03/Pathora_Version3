using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.DepositPolicy.Commands;
using Application.Features.DepositPolicy.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route(DepositPolicyEndpoint.Base)]
public class DepositPolicyController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllDepositPoliciesQuery());
        return HandleResult(result);
    }

    [HttpGet(DepositPolicyEndpoint.Id)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await Sender.Send(new GetDepositPolicyByIdQuery(id));
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDepositPolicyCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateDepositPolicyCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete(DepositPolicyEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteDepositPolicyCommand(id));
        return HandleResult(result);
    }
}
