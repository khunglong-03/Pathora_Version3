using Application.Contracts.Manager;
using Application.Features.Manager.Commands.CreateManagerBankAccount;
using Application.Features.Manager.Commands.DeleteManagerBankAccount;
using Application.Features.Manager.Commands.UpdateManagerBankAccount;
using Application.Features.Manager.Queries.GetMyBankAccounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Manager;

[Authorize(Policy = "ManagerOnly")]
[Route("api/manager")]
public class ManagerBankAccountsController : BaseApiController
{
    [HttpGet("me/bank-accounts")]
    public async Task<IActionResult> GetMyBankAccounts()
    {
        var result = await Sender.Send(new GetMyBankAccountsQuery());
        return HandleResult(result);
    }

    [HttpPost("me/bank-accounts")]
    public async Task<IActionResult> CreateBankAccount([FromBody] CreateManagerBankAccountRequest request)
    {
        var result = await Sender.Send(new CreateManagerBankAccountCommand(request));
        return HandleResult(result);
    }

    [HttpPut("me/bank-accounts/{id:guid}")]
    public async Task<IActionResult> UpdateBankAccount(Guid id, [FromBody] UpdateManagerBankAccountRequest request)
    {
        var result = await Sender.Send(new UpdateManagerBankAccountCommand(id, request));
        return HandleResult(result);
    }

    [HttpDelete("me/bank-accounts/{id:guid}")]
    public async Task<IActionResult> DeleteBankAccount(Guid id)
    {
        var result = await Sender.Send(new DeleteManagerBankAccountCommand(id));
        return HandleResult(result);
    }
}
