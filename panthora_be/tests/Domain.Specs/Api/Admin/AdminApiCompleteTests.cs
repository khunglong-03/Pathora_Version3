using AdminDTOs = Application.Features.Admin.DTOs;
using AdminContracts = Application.Contracts.Admin;
using Api.Controllers.Admin;
using Api.Controllers.Manager;
using Api.Endpoint;
using Application.Features.Admin.Commands.CreateStaffUnderManager;
using Application.Features.Admin.Commands.UpdateBankAccount;
using Application.Features.Admin.Commands.VerifyBankAccount;
using Application.Features.Admin.Queries;
using Application.Features.Admin.Queries.GetAllManagerUsers;
using Application.Features.Admin.Queries.GetManagersBankAccount;
using Application.Features.Tour.Queries;
using Contracts;
using Domain.Common.Repositories;
using Domain.Reports;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Domain.Specs.Api.Admin;

public sealed class AdminApiCompleteTests
{

    #region GetOverview

    [Fact]
    public async Task GetOverview_ValidRequest_Returns200()
    {
        var stats = new AdminDashboardStatsReport(
            TotalRevenue: 50000m,
            TotalBookings: 250,
            ActiveTours: 10,
            TotalCustomers: 100,
            CancellationRate: 5.0m,
            VisaApprovalRate: 95.0m
        );
        var overview = new AdminOverviewReport(
            Stats: stats,
            Customers: [],
            Payments: [],
            Insurances: [],
            VisaApplications: []
        );

        var (controller, _) = ApiControllerTestHelper
            .BuildController<ManagerController, GetAdminOverviewQuery, AdminOverviewReport>(
                overview,
                "/" + ManagerEndpoint.Overview);

        var actionResult = await controller.GetOverview();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/" + ManagerEndpoint.Overview,
            expectedData: overview);
    }

    #endregion

    #region GetDashboard

    [Fact]
    public async Task GetDashboard_ValidRequest_Returns200()
    {
        var stats = new AdminDashboardStatsReport(
            TotalRevenue: 50000m,
            TotalBookings: 300,
            ActiveTours: 15,
            TotalCustomers: 150,
            CancellationRate: 3.0m,
            VisaApprovalRate: 90.0m
        );
        var dashboard = new AdminDashboardReport(
            Stats: stats,
            RevenueOverTime: [],
            RevenueByTourType: [],
            RevenueByRegion: [],
            BookingStatusDistribution: [],
            BookingTrend: [],
            TopTours: [],
            TopDestinations: [],
            CustomerGrowth: [],
            CustomerNationalities: [],
            VisaStatuses: [],
            UpcomingVisaDeadlines: [],
            VisaSummary: new AdminDashboardVisaSummaryReport(10, 8, 2, 80.0m),
            Alerts: []
        );

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetAdminDashboardQuery, AdminDashboardReport>(
                dashboard,
                "/" + AdminEndpoint.Dashboard);

        var actionResult = await controller.GetDashboard();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/" + AdminEndpoint.Dashboard,
            expectedData: dashboard);
    }

    #endregion

    #region GetTourManagement

    [Fact]
    public async Task GetTourManagement_ValidRequest_Returns200()
    {
        var tours = new List<TourVm>
        {
            new(
                Id: Guid.NewGuid(),
                TourCode: "T001",
                TourName: "Beautiful Vietnam",
                ShortDescription: "A great tour",
                Status: "Active",
                Thumbnail: null,
                CreatedOnUtc: DateTimeOffset.UtcNow
            )
        };
        var response = new PaginatedList<TourVm>(tours.Count, tours, 1, 10);

        var (controller, _) = ApiControllerTestHelper
            .BuildController<ManagerController, GetAdminTourManagementQuery, PaginatedList<TourVm>>(
                response,
                "/" + ManagerEndpoint.TourManagement);

        var actionResult = await controller.GetTourManagement(null, null, null, null, 1, 10);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/" + ManagerEndpoint.TourManagement,
            expectedData: response);
    }

    [Fact]
    public async Task GetTourManagement_WithStatusFilter_PassesStatusToQuery()
    {
        var emptyResponse = new PaginatedList<TourVm>(0, new List<TourVm>(), 1, 10);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<ManagerController, GetAdminTourManagementQuery, PaginatedList<TourVm>>(
                emptyResponse,
                "/" + ManagerEndpoint.TourManagement);

        var actionResult = await controller.GetTourManagement(null, Domain.Enums.TourStatus.Active, null, null, 1, 10);

        var captured = Assert.IsType<GetAdminTourManagementQuery>(probe.CapturedRequest);
        Assert.Equal(Domain.Enums.TourStatus.Active, captured.Status);
    }

    [Fact]
    public async Task GetTourManagement_WithSearchText_PassesSearchToQuery()
    {
        var emptyResponse = new PaginatedList<TourVm>(0, new List<TourVm>(), 1, 10);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<ManagerController, GetAdminTourManagementQuery, PaginatedList<TourVm>>(
                emptyResponse,
                "/" + ManagerEndpoint.TourManagement);

        var actionResult = await controller.GetTourManagement("Vietnam", null, null, null, 1, 10);

        var captured = Assert.IsType<GetAdminTourManagementQuery>(probe.CapturedRequest);
        Assert.Equal("Vietnam", captured.SearchText);
    }

    #endregion

    #region GetAllManagers

    [Fact]
    public async Task GetAllManagers_ValidRequest_Returns200()
    {
        var managers = new List<ManagerUserSummaryDto>
        {
            new(
                ManagerId: Guid.NewGuid(),
                ManagerName: "Manager One",
                ManagerEmail: "manager1@example.com",
                DesignerCount: 2,
                GuideCount: 3,
                TourCount: 5
            )
        };

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetAllManagerUsersQuery, List<ManagerUserSummaryDto>>(
                managers,
                "/" + AdminEndpoint.GetAllManagers);

        var actionResult = await controller.GetAllManagers();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/" + AdminEndpoint.GetAllManagers,
            expectedData: managers);
    }

    #endregion

    #region GetManagersBankAccount

    [Fact]
    public async Task GetManagersBankAccount_ValidRequest_Returns200()
    {
        var accounts = new List<AdminDTOs.UserBankAccountDto>
        {
            new(
                UserId: Guid.NewGuid(),
                Username: "manager1",
                FullName: "Manager One",
                Email: "manager1@example.com",
                BankAccountNumber: "1234567890",
                BankCode: "VCB",
                BankAccountName: "Manager One",
                BankAccountVerified: true,
                BankAccountVerifiedAt: DateTimeOffset.UtcNow
            )
        };
        var response = new PaginatedResult<AdminDTOs.UserBankAccountDto>(accounts, accounts.Count, 1, 50);

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetManagersBankAccountQuery, PaginatedResult<AdminDTOs.UserBankAccountDto>>(
                response,
                "/" + AdminEndpoint.ManagersBankAccounts);

        var actionResult = await controller.GetManagersBankAccount(null, null, 1, 50);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/" + AdminEndpoint.ManagersBankAccounts,
            expectedData: response);
    }

    [Fact]
    public async Task GetManagersBankAccount_WithRoleFilter_PassesRoleToQuery()
    {
        var emptyResponse = new PaginatedResult<AdminDTOs.UserBankAccountDto>([], 0, 1, 50);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetManagersBankAccountQuery, PaginatedResult<AdminDTOs.UserBankAccountDto>>(
                emptyResponse,
                "/" + AdminEndpoint.ManagersBankAccounts);

        await controller.GetManagersBankAccount("Manager", null, 1, 50);

        var captured = Assert.IsType<GetManagersBankAccountQuery>(probe.CapturedRequest);
        Assert.Equal("Manager", captured.Role);
    }

    [Fact]
    public async Task GetManagersBankAccount_WithSearchFilter_PassesSearchToQuery()
    {
        var emptyResponse = new PaginatedResult<AdminDTOs.UserBankAccountDto>([], 0, 1, 50);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetManagersBankAccountQuery, PaginatedResult<AdminDTOs.UserBankAccountDto>>(
                emptyResponse,
                "/" + AdminEndpoint.ManagersBankAccounts);

        await controller.GetManagersBankAccount(null, "manager1", 1, 50);

        var captured = Assert.IsType<GetManagersBankAccountQuery>(probe.CapturedRequest);
        Assert.Equal("manager1", captured.SearchQuery);
    }

    #endregion

    #region UpdateBankAccount

    [Fact]
    public async Task UpdateBankAccount_ValidRequest_Returns200()
    {
        var managerId = Guid.NewGuid();
        var request = new AdminContracts.UpdateBankAccountRequest(
            BankAccountNumber: "111122223333",
            BankCode: "ACB",
            BankAccountName: "Manager Name"
        );

        var resultDto = new AdminDTOs.UserBankAccountDto(
            managerId, "manager1", "Manager Name", "mgr@example.com",
            "111122223333", "ACB", "Manager Name", false, null);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, UpdateBankAccountCommand, AdminDTOs.UserBankAccountDto>(
                resultDto,
                string.Format("/managers/{0}/bank-account", managerId));

        var actionResult = await controller.UpdateBankAccount(managerId, request);

        Assert.IsType<ObjectResult>(actionResult);
        var captured = Assert.IsType<UpdateBankAccountCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
        Assert.Equal(request.BankAccountNumber, captured.Request.BankAccountNumber);
        Assert.Equal(request.BankCode, captured.Request.BankCode);
    }

    [Fact]
    public async Task UpdateBankAccount_ManagerNotFound_Returns404()
    {
        var managerId = Guid.NewGuid();
        var request = new AdminContracts.UpdateBankAccountRequest(
            BankAccountNumber: "111122223333",
            BankCode: "ACB",
            BankAccountName: "Manager Name"
        );

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, UpdateBankAccountCommand, AdminDTOs.UserBankAccountDto>(
                Error.NotFound("User.NotFound", "Manager not found."),
                string.Format("/managers/{0}/bank-account", managerId));

        var actionResult = await controller.UpdateBankAccount(managerId, request);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "Manager not found.",
            expectedInstance: string.Format("/managers/{0}/bank-account", managerId));
    }

    #endregion

    #region VerifyBankAccount

    [Fact]
    public async Task VerifyBankAccount_ValidRequest_Returns200()
    {
        var managerId = Guid.NewGuid();

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, VerifyBankAccountCommand, ErrorOr.Success>(
                Result.Success,
                string.Format("/managers/{0}/bank-account/verify", managerId));

        var actionResult = await controller.VerifyBankAccount(managerId);

        Assert.IsType<ObjectResult>(actionResult);
        var captured = Assert.IsType<VerifyBankAccountCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
    }

    [Fact]
    public async Task VerifyBankAccount_ManagerNotFound_Returns404()
    {
        var managerId = Guid.NewGuid();

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, VerifyBankAccountCommand, ErrorOr.Success>(
                Error.NotFound("User.NotFound", "Manager not found."),
                string.Format("/managers/{0}/bank-account/verify", managerId));

        var actionResult = await controller.VerifyBankAccount(managerId);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "Manager not found.",
            expectedInstance: string.Format("/managers/{0}/bank-account/verify", managerId));
    }

    #endregion

    #region CreateStaffUnderManager

    [Fact]
    public async Task CreateStaffUnderManager_ValidRequest_Returns200()
    {
        var managerId = Guid.NewGuid();
        var request = new AdminContracts.CreateStaffUnderManagerRequest(
            Email: "staff@example.com",
            FullName: "Staff Member",
            StaffType: 1
        );

        var resultDto = new AdminDTOs.StaffMemberDto(
            Guid.NewGuid(), "Staff Member", "staff@example.com", null, "TourGuide", "Guide", "Active", []);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<ManagerController, CreateStaffUnderManagerCommand, AdminDTOs.StaffMemberDto>(
                resultDto,
                "/tour-managers/" + managerId + "/staff/create");

        var actionResult = await controller.CreateStaffUnderManager(managerId, request);

        Assert.IsType<ObjectResult>(actionResult);
        var captured = Assert.IsType<CreateStaffUnderManagerCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
        Assert.Equal(request.Email, captured.Request.Email);
        Assert.Equal(request.FullName, captured.Request.FullName);
    }

    [Fact]
    public async Task CreateStaffUnderManager_InvalidEmail_Returns400()
    {
        var managerId = Guid.NewGuid();
        var request = new AdminContracts.CreateStaffUnderManagerRequest(
            Email: "invalid-email",
            FullName: "Staff",
            StaffType: 1
        );

        var (controller, _) = ApiControllerTestHelper
            .BuildController<ManagerController, CreateStaffUnderManagerCommand, AdminDTOs.StaffMemberDto>(
                Error.Validation("Email.Invalid", "Invalid email format."),
                "/tour-managers/" + managerId + "/staff/create");

        var actionResult = await controller.CreateStaffUnderManager(managerId, request);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status400BadRequest,
            expectedCode: "Email.Invalid",
            expectedMessage: "Invalid email format.",
            expectedInstance: "/tour-managers/" + managerId + "/staff/create");
    }

    #endregion
}