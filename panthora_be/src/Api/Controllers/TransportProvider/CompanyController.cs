using Api.Endpoint.TransportProvider;

namespace Api.Controllers.TransportProvider;

using Application.Features.TransportProvider.Company.Commands;
using Application.Features.TransportProvider.Company.DTOs;
using Application.Features.TransportProvider.Company.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "TransportProviderOnly")]
public class CompanyController : BaseApiController
{
    [HttpGet(CompanyEndpoint.Base)]
    public async Task<IActionResult> GetCompany()
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetTransportCompanyQuery(userId));
        return HandleResult(result);
    }

    [HttpPut(CompanyEndpoint.Base)]
    public async Task<IActionResult> UpdateCompany([FromBody] UpdateTransportCompanyCommandDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new UpdateTransportCompanyCommand(userId, request));
        return HandleResult(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}