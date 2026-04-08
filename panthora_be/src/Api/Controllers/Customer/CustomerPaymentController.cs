namespace Api.Controllers.Customer;

using Api.Endpoint;
using Application.Common.Constant;
using Application.Contracts.Payment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "CustomerOnly")]
[Route(PaymentEndpoint.Base)]
public class CustomerPaymentController : BaseApiController
{
    [HttpPost(PaymentEndpoint.GetQR)]
    public async Task<IActionResult> CreateQr([FromBody] GetQRCommand command)
    {
        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [HttpPost(PaymentEndpoint.CreateTransaction)]
    public async Task<IActionResult> CreateTransaction([FromBody] CreatePaymentTransactionCommand command)
    {
        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [HttpGet(PaymentEndpoint.GetTransaction)]
    public async Task<IActionResult> GetTransaction([FromRoute] string code)
    {
        var result = await Sender.Send(new GetPaymentTransactionQuery(code));
        return HandleResult(result);
    }
}
