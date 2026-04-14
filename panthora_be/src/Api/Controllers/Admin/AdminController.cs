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
}
