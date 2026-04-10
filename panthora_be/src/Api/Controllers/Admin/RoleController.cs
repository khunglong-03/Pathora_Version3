using Api.Endpoint;
using Application.Features.Role.Commands;
using Application.Features.Role.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Admin;

[Authorize(Policy = "AdminOnly")]
[Route(RoleEndpoint.Base)]
public class RoleController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchText = null)
    {
        var result = await Sender.Send(new GetAllRolesQuery(pageNumber, pageSize, searchText));
        return HandleResult(result);
    }

    [HttpGet("lookup")]
    public async Task<IActionResult> GetLookup()
    {
        var result = await Sender.Send(new GetRoleLookupQuery());
        return HandleResult(result);
    }

    [HttpGet(RoleEndpoint.Id)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await Sender.Send(new GetRoleDetailQuery(id));
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoleCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateRoleCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete(RoleEndpoint.Id)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await Sender.Send(new DeleteRoleCommand(id));
        return HandleResult(result);
    }
}
