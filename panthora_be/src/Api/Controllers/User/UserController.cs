using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.User.Commands;
using Application.Features.User.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.User;

[Route(UserEndpoint.Base)]
public class UserController : BaseApiController
{
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid departmentId = default,
        [FromQuery] string? textSearch = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? role = null)
    {
        var result = await Sender.Send(new GetAllUsersQuery(departmentId, textSearch, pageNumber, pageSize) { RoleName = role });
        return HandleResult(result);
    }

    [Authorize(Roles = "Admin,Manager,TourOperator")]
    [HttpGet("team-guides")]
    public async Task<IActionResult> GetTeamGuides()
    {
        var result = await Sender.Send(new Application.Features.User.Queries.GetTeamGuides.GetTeamGuidesQuery());
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet(UserEndpoint.Id)]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var result = await Sender.Send(new GetUserDetailQuery(id));
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateUserCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete(UserEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteUserCommand(id));
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut(UserEndpoint.ChangePassword)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut(UserEndpoint.Ban)]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateUserStatusCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }
}
