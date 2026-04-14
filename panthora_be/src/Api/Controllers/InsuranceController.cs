using Api.Endpoint;
using Application.Features.Insurance.Commands;
using Application.Features.Insurance.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "AdminAndTourDesigner")]
[Route(InsuranceEndpoint.Base)]
public sealed class InsuranceController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllInsurancesQuery());
        return HandleResult(result);
    }

    [HttpGet(InsuranceEndpoint.Id)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await Sender.Send(new GetInsuranceByIdQuery(id));
        return HandleResult(result);
    }

    [HttpGet(InsuranceEndpoint.ByClassification)]
    public async Task<IActionResult> GetByClassification(Guid classificationId)
    {
        var result = await Sender.Send(new GetInsurancesByClassificationQuery(classificationId));
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInsuranceCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateInsuranceCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete(InsuranceEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteInsuranceCommand(id));
        return HandleResult(result);
    }
}
