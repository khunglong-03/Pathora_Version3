namespace Api.Controllers.HotelProvider;

using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.HotelServiceProvider.Supplier;
using Application.Features.HotelServiceProvider.Supplier.DTOs;
using Application.Features.HotelServiceProvider.Supplier.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "HotelServiceProviderOnly")]
public class HotelServiceProviderSupplierController : BaseApiController
{
    [HttpPost(HotelServiceProviderSupplierEndpoint.Base)]
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierInfoRequestDto request)
    {
        var result = await Sender.Send(new CreateSupplierInfoCommand(request));
        return HandleResult(result);
    }

    [HttpGet(HotelServiceProviderSupplierEndpoint.Base)]
    public async Task<IActionResult> GetSuppliers()
    {
        var result = await Sender.Send(new GetHotelSupplierForProviderQuery());
        return HandleResult(result);
    }

    /// <summary>Update supplier info for one of the current owner's accommodation suppliers.</summary>
    [HttpPut($"{HotelServiceProviderSupplierEndpoint.Base}/{HotelServiceProviderSupplierEndpoint.Info}")]
    public async Task<IActionResult> UpdateSupplierInfo([FromBody] UpdateSupplierInfoRequestDto request)
    {
        var result = await Sender.Send(new UpdateSupplierInfoCommand(request));
        return HandleResult(result);
    }
}
