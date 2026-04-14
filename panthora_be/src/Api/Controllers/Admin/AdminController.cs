using Api.Endpoint;
using Application.Common.Constant;
using Application.Contracts.Admin;
using Application.Features.Admin.Commands.UpdateBankAccount;
using Application.Features.Admin.Commands.VerifyBankAccount;
using Application.Features.Admin.Commands.CreateStaffUnderManager;
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
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Admin;

[Authorize(Policy = "ManagerOnly")]
[Route(AdminEndpoint.Base)]
public class AdminController : BaseApiController
{
    [HttpGet(AdminEndpoint.Overview)]
    public async Task<IActionResult> GetOverview()
    {
        var result = await Sender.Send(new GetAdminOverviewQuery());
        return HandleResult(result);
    }

    [HttpGet(AdminEndpoint.Dashboard)]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await Sender.Send(new GetAdminDashboardQuery());
        return HandleResult(result);
    }

    [HttpGet(AdminEndpoint.TourManagement)]
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

    // Group 2: Transport Provider
    [HttpGet(AdminEndpoint.TransportProviders)]
    public async Task<IActionResult> GetTransportProviders(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] Domain.Enums.Continent? continent = null)
    {
        var result = await Sender.Send(new GetTransportProvidersQuery(pageNumber, pageSize, search, status, continent));
        return HandleResult(result);
    }

    [HttpGet(AdminEndpoint.TransportProviderById)]
    public async Task<IActionResult> GetTransportProviderById(Guid id)
    {
        var result = await Sender.Send(new GetTransportProviderByIdQuery(id));
        return HandleResult(result);
    }

    // Group 3: Hotel Provider
    [HttpGet(AdminEndpoint.HotelProviders)]
    public async Task<IActionResult> GetHotelProviders(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] Domain.Enums.Continent? continent = null)
    {
        var result = await Sender.Send(new GetHotelProvidersQuery(pageNumber, pageSize, search, status, continent));
        return HandleResult(result);
    }

    [HttpGet(AdminEndpoint.HotelProviderById)]
    public async Task<IActionResult> GetHotelProviderById(Guid id)
    {
        var result = await Sender.Send(new GetHotelProviderByIdQuery(id));
        return HandleResult(result);
    }

    // Group 4: TourManager Staff (staff under current manager only)
    [HttpGet(AdminEndpoint.TourManagerStaff)]
    public async Task<IActionResult> GetTourManagerStaff(Guid managerId)
    {
        var result = await Sender.Send(new GetTourManagerStaffQuery(managerId));
        return HandleResult(result);
    }

    [HttpPut(AdminEndpoint.ReassignStaff)]
    public async Task<IActionResult> ReassignStaff(Guid managerId, Guid staffId, [FromBody] ReassignStaffRequest request)
    {
        var result = await Sender.Send(new ReassignStaffCommand(managerId, staffId, request.TargetManagerId));
        return HandleResult(result);
    }

    [HttpPost(AdminEndpoint.CreateStaffUnderManager)]
    public async Task<IActionResult> CreateStaffUnderManager(Guid managerId, [FromBody] CreateStaffUnderManagerRequest request)
    {
        var result = await Sender.Send(new CreateStaffUnderManagerCommand(managerId, request));
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
}
