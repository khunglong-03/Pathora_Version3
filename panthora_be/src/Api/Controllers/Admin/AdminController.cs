using Api.Endpoint;
using Application.Common.Constant;
using Application.Contracts.Admin;
using Application.Features.Admin.Commands.UpdateBankAccount;
using Application.Features.Admin.Commands.VerifyBankAccount;
using Application.Features.Admin.Commands.CreateStaffUnderManager;
using Application.Features.Admin.Commands.UpdateStaffUnderManager;
using Application.Features.Admin.Commands.ReassignStaff;
using Application.Features.Admin.Queries;
using Application.Features.Admin.Queries.GetAllManagerUsers;
using Application.Features.Admin.Queries.GetAllUsers;
using Application.Features.Admin.Queries.GetAdminDashboardOverview;
using Application.Features.Admin.Queries.GetHotelProviders;
using Application.Features.Admin.Queries.GetHotelProviderById;
using Application.Features.Admin.Queries.GetManagersBankAccount;
using Application.Features.Admin.Queries.GetTourManagerStaff;
using Application.Features.Admin.Queries.GetTransportProviders;
using Application.Features.Admin.Queries.GetTransportProviderById;
using Application.Features.Admin.Queries.GetUserDetail;
using Application.Features.TransportProvider.Drivers.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Admin;

[Authorize(Policy = "AdminOnly")]
[Route(AdminEndpoint.Base)]
public class AdminController : BaseApiController
{


    [HttpGet(AdminEndpoint.Dashboard)]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await Sender.Send(new GetAdminDashboardQuery());
        return HandleResult(result);
    }



    // Group 1: User Management
    [HttpGet(AdminEndpoint.Users)]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? role = null,
        [FromQuery] Domain.Enums.UserStatus? status = null,
        [FromQuery] string? searchText = null)
    {
        var result = await Sender.Send(new GetAllUsersQuery(pageNumber, pageSize, searchText, status, role));
        return HandleResult(result);
    }
    [HttpGet(AdminEndpoint.UserById)]
    public async Task<IActionResult> GetUserDetail(Guid id)
    {
        var result = await Sender.Send(new GetUserDetailQuery(id));
        return HandleResult(result);
    }





    // Group 5: Admin Dashboard
    [HttpGet(AdminEndpoint.AdminDashboardOverview)]
    public async Task<IActionResult> GetAdminDashboardOverview()
    {
        var result = await Sender.Send(new GetAdminDashboardOverviewQuery());
        return HandleResult(result);
    }

    // Group 6: Managers
    [HttpGet(AdminEndpoint.GetAllManagers)]
    public async Task<IActionResult> GetAllManagers()
    {
        var result = await Sender.Send(new GetAllManagerUsersQuery());
        return HandleResult(result);
    }

    // Group 7: Manager Bank Accounts
    [HttpGet(AdminEndpoint.ManagersBankAccounts)]
    public async Task<IActionResult> GetManagersBankAccount(
        [FromQuery] string? role,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50)
    {
        var result = await Sender.Send(new GetManagersBankAccountQuery(role, search, page, limit));
        return HandleResult(result);
    }

    [HttpPut(AdminEndpoint.ManagerBankAccount)]
    public async Task<IActionResult> UpdateBankAccount(
        Guid managerId,
        [FromBody] UpdateBankAccountRequest request)
    {
        var result = await Sender.Send(new UpdateBankAccountCommand(managerId, request));
        return HandleResult(result);
    }

    [HttpPost(AdminEndpoint.VerifyBankAccount)]
    public async Task<IActionResult> VerifyBankAccount(Guid managerId)
    {
        var result = await Sender.Send(new VerifyBankAccountCommand(managerId));
        return HandleResult(result);
    }

    // Group 8: Tour Manager Staff
    [HttpGet(AdminEndpoint.GetTourManagerStaff)]
    public async Task<IActionResult> GetTourManagerStaff(Guid managerId)
    {
        var result = await Sender.Send(new GetTourManagerStaffQuery(managerId));
        return HandleResult(result);
    }

    [HttpPost(AdminEndpoint.CreateStaffUnderManager)]
    public async Task<IActionResult> CreateStaffUnderManager(Guid managerId, [FromBody] CreateStaffUnderManagerRequest request)
    {
        var result = await Sender.Send(new CreateStaffUnderManagerCommand(managerId, request));
        return HandleResult(result);
    }

    [HttpPut(AdminEndpoint.UpdateStaffUnderManager)]
    public async Task<IActionResult> UpdateStaffUnderManager(Guid managerId, Guid staffId, [FromBody] UpdateStaffUnderManagerRequest request)
    {
        var result = await Sender.Send(new UpdateStaffUnderManagerCommand(managerId, staffId, request));
        return HandleResult(result);
    }

    [HttpPost(AdminEndpoint.ReassignStaff)]
    public async Task<IActionResult> ReassignStaff(Guid managerId, Guid staffId, [FromBody] ReassignStaffRequest request)
    {
        var result = await Sender.Send(new ReassignStaffCommand(managerId, staffId, request.TargetManagerId));
        return HandleResult(result);
    }

    // Group 9: Transport Provider Vehicles (Admin Management)
    [HttpPost("transport-providers/{providerId}/vehicles")]
    public async Task<IActionResult> CreateVehicleForProvider(Guid providerId, [FromBody] Application.Features.TransportProvider.Vehicles.DTOs.CreateVehicleRequestDto request)
    {
        var result = await Sender.Send(new Application.Features.TransportProvider.Vehicles.Commands.CreateVehicleCommand(providerId, request));
        return HandleResult(result);
    }

    [HttpPut("transport-providers/{providerId}/vehicles/{vehicleId:guid}")]
    public async Task<IActionResult> UpdateVehicleForProvider(Guid providerId, Guid vehicleId, [FromBody] Application.Features.TransportProvider.Vehicles.DTOs.UpdateVehicleRequestDto request)
    {
        var result = await Sender.Send(new Application.Features.TransportProvider.Vehicles.Commands.UpdateVehicleCommand(providerId, vehicleId, request));
        return HandleResult(result);
    }

    [HttpDelete("transport-providers/{providerId}/vehicles/{vehicleId:guid}")]
    public async Task<IActionResult> DeleteVehicleForProvider(Guid providerId, Guid vehicleId)
    {
        var result = await Sender.Send(new Application.Features.TransportProvider.Vehicles.Commands.DeleteVehicleCommand(providerId, vehicleId));
        return HandleResult(result);
    }

    [HttpGet(AdminEndpoint.DriverActivities)]
    public async Task<IActionResult> GetDriverActivities(
        Guid providerId,
        Guid driverId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await Sender.Send(new GetDriverActivitiesQuery(providerId, driverId, pageNumber, pageSize));
        return HandleResult(result);
    }
}
