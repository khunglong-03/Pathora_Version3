using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.Role.Commands;
using Application.Features.Role.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route(RoleEndpoint.Base)]
public class RoleController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllRolesQuery());
        return HandleResult(result);
    }

    [HttpGet(RoleEndpoint.RoleId)]
    public async Task<IActionResult> GetDetail(int roleId)
    {
        var result = await Sender.Send(new GetRoleDetailQuery(roleId));
        return HandleResult(result);
    }

    [HttpGet(RoleEndpoint.Lookup)]
    public async Task<IActionResult> GetLookup()
    {
        var result = await Sender.Send(new GetRoleLookupQuery());
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

    [HttpDelete(RoleEndpoint.RoleId)]
    public async Task<IActionResult> Delete(int roleId)
    {
        var result = await Sender.Send(new DeleteRoleCommand(roleId));
        return HandleResult(result);
    }
}
