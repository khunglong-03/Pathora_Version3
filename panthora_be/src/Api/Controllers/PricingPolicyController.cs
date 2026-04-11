using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.PricingPolicy.Commands;
using Application.Features.PricingPolicy.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route(PricingPolicyEndpoint.Base)]
public class PricingPolicyController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllPricingPoliciesQuery());
        return HandleResult(result);
    }

    [HttpGet(PricingPolicyEndpoint.Id)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await Sender.Send(new GetPricingPolicyByIdQuery(id));
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePricingPolicyCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdatePricingPolicyCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete(PricingPolicyEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeletePricingPolicyCommand(id));
        return HandleResult(result);
    }

    [HttpPut(PricingPolicyEndpoint.SetDefault)]
    public async Task<IActionResult> SetAsDefault(Guid id)
    {
        var result = await Sender.Send(new SetDefaultPricingPolicyCommand(id));
        return HandleResult(result);
    }
}
