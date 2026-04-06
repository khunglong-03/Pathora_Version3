using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.Position.Commands;
using Application.Features.Position.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Roles = RoleConstants.Admin)]
[Authorize(Policy = "AdminOnly")]
[Route(PositionEndpoint.Base)]
public class PositionController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchText = null)
    {
        var result = await Sender.Send(new GetAllPositionsQuery(pageNumber, pageSize, searchText));
        return HandleResult(result);
    }

    [HttpGet(PositionEndpoint.ComboBox)]
    public async Task<IActionResult> GetComboBox()
    {
        var result = await Sender.Send(new GetPositionComboBoxQuery());
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePositionCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdatePositionCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete(PositionEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeletePositionCommand(id));
        return HandleResult(result);
    }
}
