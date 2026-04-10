using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.User.Commands;
using Application.Features.User.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.User;

[Authorize(Policy = "AdminOnly")]
[Route(UserEndpoint.Base)]
public class UserController : BaseApiController
{
    [AllowAnonymous]
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

    [HttpGet(UserEndpoint.Id)]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var result = await Sender.Send(new GetUserDetailQuery(id));
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateUserCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete(UserEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteUserCommand(id));
        return HandleResult(result);
    }

    [HttpPut(UserEndpoint.ChangePassword)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }
}
