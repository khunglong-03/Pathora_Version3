using ApiPublic.Controller.BaseController;
using Application.Features.PricingPolicy.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiPublic.Controller;

[AllowAnonymous]
[Route("api/public/pricing-policies")]
public class PublicPricingPolicyController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllPricingPoliciesQuery());
        return HandleResult(result);
    }
}
