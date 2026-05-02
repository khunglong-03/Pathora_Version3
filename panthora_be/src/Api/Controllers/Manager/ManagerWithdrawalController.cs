using Application.Features.Withdrawal.Commands.CancelWithdrawalRequest;
using Application.Features.Withdrawal.Commands.CreateWithdrawalRequest;
using Application.Features.Withdrawal.Queries.GetManagerWithdrawals;
using Application.Features.Withdrawal.Queries.GetWithdrawalDetail;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Manager;

[Authorize(Policy = "ManagerOnly")]
[Route("api/manager/withdrawals")]
public class ManagerWithdrawalController : BaseApiController
{
    [HttpPost]
    public async Task<IActionResult> CreateWithdrawalRequest([FromBody] CreateWithdrawalRequestCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetManagerWithdrawals([FromQuery] WithdrawalStatus? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await Sender.Send(new GetManagerWithdrawalsQuery(status, page, pageSize));
        return HandleResult(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetWithdrawalDetail(Guid id)
    {
        var result = await Sender.Send(new GetWithdrawalDetailQuery(id));
        return HandleResult(result);
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelWithdrawalRequest(Guid id)
    {
        var result = await Sender.Send(new CancelWithdrawalRequestCommand(id));
        return HandleResult(result);
    }
}
