using Application.Contracts.Manager;
using Application.Features.Manager.Commands.UpdateMyBankAccount;
using Application.Features.Manager.Queries.GetMyBankAccount;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Manager;

[Authorize(Policy = "ManagerOnly")]
[Route("api/manager")]
public class ManagerBankAccountController : BaseApiController
{
    [HttpGet("me/bank-account")]
    public async Task<IActionResult> GetMyBankAccount()
    {
        var result = await Sender.Send(new GetMyBankAccountQuery());
        return HandleResult(result);
    }

    [HttpPut("me/bank-account")]
    public async Task<IActionResult> UpdateMyBankAccount([FromBody] UpdateMyBankAccountRequest request)
    {
        var result = await Sender.Send(new UpdateMyBankAccountCommand(request));
        return HandleResult(result);
    }
}
