using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.TaxConfig.Commands;
using Application.Features.TaxConfig.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route(TaxConfigEndpoint.Base)]
public class TaxConfigController : BaseApiController
{
    /// <summary>GET /api/tax-configs/active-rate — public, no auth required.</summary>
    [HttpGet("active-rate")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveRate()
    {
        var result = await Sender.Send(new GetActiveTaxRateQuery());
        return HandleResult(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllTaxConfigsQuery());
        return HandleResult(result);
    }

    [HttpGet(TaxConfigEndpoint.Id)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await Sender.Send(new GetTaxConfigByIdQuery(id));
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaxConfigCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateTaxConfigCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete(TaxConfigEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteTaxConfigCommand(id));
        return HandleResult(result);
    }
}
