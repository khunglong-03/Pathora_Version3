using ApiPublic.Controller.BaseController;
using Application.Features.DepositPolicy.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiPublic.Controller;

[AllowAnonymous]
[Route("api/public/deposit-policies")]
public class PublicDepositPolicyController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllDepositPoliciesQuery());
        return HandleResult(result);
    }
}
