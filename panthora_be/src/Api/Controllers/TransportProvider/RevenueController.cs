namespace Api.Controllers.TransportProvider;

using Api.Endpoint.TransportProvider;
using Application.Features.TransportProvider.Revenue.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Authorize(Policy = "TransportProviderOnly")]
public class RevenueController : BaseApiController
{
    [HttpGet(RevenueEndpoint.Summary)]
    public async Task<IActionResult> GetRevenueSummary([FromQuery] int year, [FromQuery] int? quarter = null)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetRevenueSummaryQuery(userId, year, quarter));
        return HandleResult(result);
    }

    [HttpGet(RevenueEndpoint.History)]
    public async Task<IActionResult> GetTripHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? year = null,
        [FromQuery] int? quarter = null)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetTripHistoryQuery(userId, page, pageSize, year, quarter));
        return HandleResult(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}