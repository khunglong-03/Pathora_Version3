using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.TaxConfig.Commands;
using Application.Features.TaxConfig.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;


[Route(TaxConfigEndpoint.Base)]
public class TaxConfigController : BaseApiController
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllTaxConfigsQuery());
        return HandleResult(result);
    }
    [AllowAnonymous]
    [HttpGet(TaxConfigEndpoint.Id)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await Sender.Send(new GetTaxConfigByIdQuery(id));
        return HandleResult(result);
    }
    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaxConfigCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }
    [Authorize(Policy = "AdminOnly")]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateTaxConfigCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }
    [Authorize(Policy = "AdminOnly")]
    [HttpDelete(TaxConfigEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteTaxConfigCommand(id));
        return HandleResult(result);
    }
}
