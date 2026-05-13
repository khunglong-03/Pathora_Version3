using ApiPublic.Controller.BaseController;
using Application.Features.CancellationPolicy.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiPublic.Controller;

[AllowAnonymous]
[Route("api/public/cancellation-policies")]
public class PublicCancellationPolicyController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllCancellationPoliciesQuery());
        return HandleResult(result);
    }
}
