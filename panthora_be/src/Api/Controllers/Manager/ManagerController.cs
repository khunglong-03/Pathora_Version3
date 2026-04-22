using Api.Endpoint;
using Application.Common.Constant;
using Application.Contracts.Admin;
using Application.Features.Manager.Queries;
using Application.Features.Admin.Commands.CreateStaffUnderManager;
using Application.Features.Admin.Commands.ReassignStaff;
using Application.Features.Admin.Queries;
using Application.Features.Admin.Queries.GetHotelProviders;
using Application.Features.Admin.Queries.GetHotelProviderById;
using Application.Features.Admin.Queries.GetTourManagerStaff;
using Application.Features.Admin.Queries.GetTransportProviders;
using Application.Features.Admin.Queries.GetTransportProviderById;
using Application.Features.Admin.Commands.ManageTransportVehicles;
using Application.Features.TransportProvider.Vehicles.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Manager;

[Authorize(Policy = "ManagerOnly")]
[Route(ManagerEndpoint.Base)]
public sealed class ManagerController : BaseApiController
{
    [HttpGet(ManagerEndpoint.Overview)]
    public async Task<IActionResult> GetOverview()
    {
        var result = await Sender.Send(new GetAdminOverviewQuery());
        return HandleResult(result);
    }

    [HttpGet(ManagerEndpoint.Dashboard)]
    public async Task<IActionResult> GetDashboard()
    {
        var managerId = Guid.Parse(CurrentUserId);
        var result = await Sender.Send(new GetManagerDashboardQuery(managerId));
        return HandleResult(result);
    }

    [HttpGet(ManagerEndpoint.TourManagement)]
    public async Task<IActionResult> GetTourManagement(
        [FromQuery] string? searchText,
        [FromQuery] Domain.Enums.TourStatus? status,
        [FromQuery] Domain.Enums.TourScope? tourScope,
        [FromQuery] Domain.Enums.Continent? continent,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var isManager = User.IsInRole("Manager") && !User.IsInRole("Admin");
        var managerId = isManager && Guid.TryParse(CurrentUserId, out var parsedId) ? (Guid?)parsedId : null;

        var result = await Sender.Send(new GetAdminTourManagementQuery(searchText, status, tourScope, continent, pageNumber, pageSize, managerId));
        return HandleResult(result);
    }

    [HttpGet(ManagerEndpoint.TourManagementStats)]
    public async Task<IActionResult> GetTourManagementStats(
        [FromQuery] string? searchText,
        [FromQuery] Domain.Enums.TourScope? tourScope,
        [FromQuery] Domain.Enums.Continent? continent)
    {
        var isManager = User.IsInRole("Manager") && !User.IsInRole("Admin");
        var managerId = isManager && Guid.TryParse(CurrentUserId, out var parsedId) ? (Guid?)parsedId : null;

        var result = await Sender.Send(new GetTourManagementStatsQuery(searchText, tourScope, continent, managerId));
        return HandleResult(result);
    }

    // Transport Provider
    [HttpGet(ManagerEndpoint.TransportProviders)]
    public async Task<IActionResult> GetTransportProviders(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] Domain.Enums.Continent? continent = null,
        [FromQuery] List<Domain.Enums.Continent>? continents = null)
    {
        var result = await Sender.Send(new GetTransportProvidersQuery(pageNumber, pageSize, search, status, continent, continents));
        return HandleResult(result);
    }

    [HttpGet(ManagerEndpoint.TransportProviderStats)]
    public async Task<IActionResult> GetTransportProviderStats([FromQuery] string? search = null)
    {
        var result = await Sender.Send(new GetTransportProviderStatsQuery(search));
        return HandleResult(result);
    }

    [HttpGet(ManagerEndpoint.TransportProviderById)]
    public async Task<IActionResult> GetTransportProviderById(Guid id)
    {
        var result = await Sender.Send(new GetTransportProviderByIdQuery(id));
        return HandleResult(result);
    }

    [HttpPost(ManagerEndpoint.AdminTransportVehicles)]
    public async Task<IActionResult> CreateAdminTransportVehicle(Guid id, [FromBody] CreateVehicleRequestDto request)
    {
        var adminId = Guid.Parse(CurrentUserId);
        var result = await Sender.Send(new AdminCreateVehicleCommand(adminId, id, request));
        return HandleResult(result);
    }

    [HttpPut(ManagerEndpoint.AdminTransportVehicleByPlate)]
    public async Task<IActionResult> UpdateAdminTransportVehicle(Guid id, string plate, [FromBody] UpdateVehicleRequestDto request)
    {
        var adminId = Guid.Parse(CurrentUserId);
        var result = await Sender.Send(new AdminUpdateVehicleCommand(adminId, id, plate, request));
        return HandleResult(result);
    }

    [HttpDelete(ManagerEndpoint.AdminTransportVehicleByPlate)]
    public async Task<IActionResult> DeleteAdminTransportVehicle(Guid id, string plate)
    {
        var adminId = Guid.Parse(CurrentUserId);
        var result = await Sender.Send(new AdminDeleteVehicleCommand(adminId, id, plate));
        return HandleResult(result);
    }

    // Hotel Provider
    [HttpGet(ManagerEndpoint.HotelProviders)]
    public async Task<IActionResult> GetHotelProviders(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] Domain.Enums.Continent? continent = null,
        [FromQuery] List<Domain.Enums.Continent>? continents = null)
    {
        var result = await Sender.Send(new GetHotelProvidersQuery(pageNumber, pageSize, search, status, continent, continents));
        return HandleResult(result);
    }

    [HttpGet(ManagerEndpoint.HotelProviderById)]
    public async Task<IActionResult> GetHotelProviderById(Guid id)
    {
        var result = await Sender.Send(new GetHotelProviderByIdQuery(id));
        return HandleResult(result);
    }

    // TourManager Staff
    [HttpGet(ManagerEndpoint.TourManagerStaff)]
    public async Task<IActionResult> GetTourManagerStaff(Guid managerId)
    {
        var result = await Sender.Send(new GetTourManagerStaffQuery(managerId));
        return HandleResult(result);
    }

    [HttpPut(ManagerEndpoint.ReassignStaff)]
    public async Task<IActionResult> ReassignStaff(Guid managerId, Guid staffId, [FromBody] ReassignStaffRequest request)
    {
        var result = await Sender.Send(new ReassignStaffCommand(managerId, staffId, request.TargetManagerId));
        return HandleResult(result);
    }

    [HttpPost(ManagerEndpoint.CreateStaffUnderManager)]
    public async Task<IActionResult> CreateStaffUnderManager(Guid managerId, [FromBody] CreateStaffUnderManagerRequest request)
    {
        var result = await Sender.Send(new CreateStaffUnderManagerCommand(managerId, request));
        return HandleResult(result);
    }
}
