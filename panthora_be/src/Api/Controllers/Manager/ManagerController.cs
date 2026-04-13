using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.Manager.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Manager;

[Authorize(Roles = RoleConstants.Manager)]
[Route(ManagerEndpoint.Base)]
public sealed class ManagerController : BaseApiController
{
    [HttpGet(ManagerEndpoint.Dashboard)]
    public async Task<IActionResult> GetDashboard()
    {
        var managerId = Guid.Parse(CurrentUserId);
        var result = await Sender.Send(new GetManagerDashboardQuery(managerId));
        return HandleResult(result);
    }
}
