using Application.Features.Withdrawal.Commands.ApproveWithdrawal;
using Application.Features.Withdrawal.Commands.ConfirmWithdrawalTransfer;
using Application.Features.Withdrawal.Commands.RejectWithdrawal;
using Application.Features.Withdrawal.Queries.GetAdminWithdrawals;
using Application.Features.Withdrawal.Queries.GetWithdrawalQR;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Admin;

[Authorize(Policy = "AdminOnly")]
[Route("api/admin/withdrawals")]
public class AdminWithdrawalController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAdminWithdrawals([FromQuery] WithdrawalStatus? status, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await Sender.Send(new GetAdminWithdrawalsQuery(status, search, page, pageSize));
        return HandleResult(result);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> ApproveWithdrawal(Guid id)
    {
        var result = await Sender.Send(new ApproveWithdrawalCommand(id));
        return HandleResult(result);
    }

    [HttpPut("{id}/confirm-transfer")]
    public async Task<IActionResult> ConfirmWithdrawalTransfer(Guid id)
    {
        var result = await Sender.Send(new ConfirmWithdrawalTransferCommand(id));
        return HandleResult(result);
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> RejectWithdrawal(Guid id, [FromBody] RejectWithdrawalRequest request)
    {
        var result = await Sender.Send(new RejectWithdrawalCommand(id, request.Reason));
        return HandleResult(result);
    }

    [HttpGet("{id}/qr")]
    public async Task<IActionResult> GetWithdrawalQR(Guid id)
    {
        var result = await Sender.Send(new GetWithdrawalQRQuery(id));
        return HandleResult(result);
    }
}

public class RejectWithdrawalRequest
{
    public string Reason { get; set; } = null!;
}
