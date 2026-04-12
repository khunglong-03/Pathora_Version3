using Api.Controllers.Admin;
using Api.Endpoint;
using Application.Features.Admin.DTOs;
using Application.Features.Admin.Queries;
using Application.Features.Admin.Queries.GetAdminDashboard;
using Application.Features.Admin.Queries.GetAdminOverview;
using Application.Features.Admin.Queries.GetTourManagement;
using Application.Features.Admin.Queries.GetAllManagerUsers;
using Application.Features.Admin.Queries.GetManagersBankAccount;
using Application.Features.Admin.Commands.UpdateBankAccount;
using Application.Features.Admin.Commands.VerifyBankAccount;
using Application.Features.Admin.Commands.CreateStaffUnderManager;
using Contracts.ModelResponse;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Domain.Specs.Api.Admin;

public sealed class AdminApiCompleteTests
{
    private const string BasePath = "/api/admin";

    #region GetOverview

    [Fact]
    public async Task GetOverview_ValidRequest_Returns200()
    {
        var overview = new AdminOverviewDto(
            totalUsers: 100,
            activeUsers: 80,
            totalBookings: 250,
            confirmedBookings: 200,
            totalRevenue: 50000m
        );

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetAdminOverviewQuery, AdminOverviewDto>(
                overview,
                AdminEndpoint.Overview);

        var actionResult = await controller.GetOverview();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: AdminEndpoint.Overview,
            expectedData: overview);
    }

    #endregion

    #region GetDashboard

    [Fact]
    public async Task GetDashboard_ValidRequest_Returns200()
    {
        var recentBookings = new List<BookingInfoDto>
        {
            new(
                bookingId: Guid.NewGuid(),
                bookingCode: "BK001",
                customerName: "Customer A",
                hotelName: "Hotel X",
                checkInDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)),
                checkOutDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(4)),
                totalAmount: 300.00m,
                status: "Confirmed"
            )
        };
        var stats = new AdminDashboardStatsDto(
            totalUsers: 150,
            activeUsers: 120,
            totalBookings: 300,
            confirmedBookings: 250
        );
        var dashboard = new AdminDashboardDto(recentBookings, stats);

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetAdminDashboardQuery, AdminDashboardDto>(
                dashboard,
                AdminEndpoint.Dashboard);

        var actionResult = await controller.GetDashboard();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: AdminEndpoint.Dashboard,
            expectedData: dashboard);
    }

    #endregion

    #region GetTourManagement

    [Fact]
    public async Task GetTourManagement_ValidRequest_Returns200()
    {
        var tours = new List<TourManagementDto>
        {
            new(
                tourId: Guid.NewGuid(),
                tourCode: "T001",
                tourName: "Beautiful Vietnam",
                startDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
                endDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
                status: Domain.Enums.TourStatus.Active,
                totalBookings: 20
            )
        };
        var response = new PaginatedList<TourManagementDto>(tours.Count, tours, 1, 10);

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetAdminTourManagementQuery, PaginatedList<TourManagementDto>>(
                response,
                AdminEndpoint.TourManagement);

        var actionResult = await controller.GetTourManagement(null, null, 1, 10);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: AdminEndpoint.TourManagement,
            expectedData: response);
    }

    [Fact]
    public async Task GetTourManagement_WithStatusFilter_PassesStatusToQuery()
    {
        var emptyResponse = new PaginatedList<TourManagementDto>(0, new List<TourManagementDto>(), 1, 10);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetAdminTourManagementQuery, PaginatedList<TourManagementDto>>(
                emptyResponse,
                AdminEndpoint.TourManagement);

        var actionResult = await controller.GetTourManagement(null, Domain.Enums.TourStatus.Active, 1, 10);

        var captured = Assert.IsType<GetAdminTourManagementQuery>(probe.CapturedRequest);
        Assert.Equal(Domain.Enums.TourStatus.Active, captured.Status);
    }

    [Fact]
    public async Task GetTourManagement_WithSearchText_PassesSearchToQuery()
    {
        var emptyResponse = new PaginatedList<TourManagementDto>(0, new List<TourManagementDto>(), 1, 10);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetAdminTourManagementQuery, PaginatedList<TourManagementDto>>(
                emptyResponse,
                AdminEndpoint.TourManagement);

        var actionResult = await controller.GetTourManagement("Vietnam", null, 1, 10);

        var captured = Assert.IsType<GetAdminTourManagementQuery>(probe.CapturedRequest);
        Assert.Equal("Vietnam", captured.SearchText);
    }

    #endregion

    #region GetAllManagers

    [Fact]
    public async Task GetAllManagers_ValidRequest_Returns200()
    {
        var managers = new List<UserListItemDto>
        {
            new(
                Guid.NewGuid(),
                "manager1",
                "Manager One",
                "manager1@example.com",
                "+84 123 456 001",
                null,
                UserStatus.Active,
                VerifyStatus.Verified,
                new List<string> { "Manager" })
        };
        var response = new PaginatedList<UserListItemDto>(managers.Count, managers, 1, 20);

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetAllManagerUsersQuery, PaginatedList<UserListItemDto>>(
                response,
                AdminEndpoint.GetAllManagers);

        var actionResult = await controller.GetAllManagers();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: AdminEndpoint.GetAllManagers,
            expectedData: response);
    }

    #endregion

    #region GetManagersBankAccount

    [Fact]
    public async Task GetManagersBankAccount_ValidRequest_Returns200()
    {
        var accounts = new List<ManagerBankAccountInfoDto>
        {
            new(
                userId: Guid.NewGuid(),
                username: "manager1",
                fullName: "Manager One",
                email: "manager1@example.com",
                accountNumber: "1234567890",
                bankName: "Vietcombank",
                verified: true
            )
        };
        var response = new PaginatedList<ManagerBankAccountInfoDto>(accounts.Count, accounts, 1, 50);

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetManagersBankAccountQuery, PaginatedList<ManagerBankAccountInfoDto>>(
                response,
                AdminEndpoint.ManagersBankAccounts);

        var actionResult = await controller.GetManagersBankAccount(null, null, 1, 50);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: AdminEndpoint.ManagersBankAccounts,
            expectedData: response);
    }

    [Fact]
    public async Task GetManagersBankAccount_WithRoleFilter_PassesRoleToQuery()
    {
        var emptyResponse = new PaginatedList<ManagerBankAccountInfoDto>(0, new List<ManagerBankAccountInfoDto>(), 1, 50);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetManagersBankAccountQuery, PaginatedList<ManagerBankAccountInfoDto>>(
                emptyResponse,
                AdminEndpoint.ManagersBankAccounts);

        var actionResult = await controller.GetManagersBankAccount("Manager", null, 1, 50);

        var captured = Assert.IsType<GetManagersBankAccountQuery>(probe.CapturedRequest);
        Assert.Equal("Manager", captured.Role);
    }

    [Fact]
    public async Task GetManagersBankAccount_WithSearchFilter_PassesSearchToQuery()
    {
        var emptyResponse = new PaginatedList<ManagerBankAccountInfoDto>(0, new List<ManagerBankAccountInfoDto>(), 1, 50);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetManagersBankAccountQuery, PaginatedList<ManagerBankAccountInfoDto>>(
                emptyResponse,
                AdminEndpoint.ManagersBankAccounts);

        var actionResult = await controller.GetManagersBankAccount(null, "manager1", 1, 50);

        var captured = Assert.IsType<GetManagersBankAccountQuery>(probe.CapturedRequest);
        Assert.Equal("manager1", captured.Search);
    }

    #endregion

    #region UpdateBankAccount

    [Fact]
    public async Task UpdateBankAccount_ValidRequest_Returns200()
    {
        var managerId = Guid.NewGuid();
        var request = new UpdateBankAccountRequest(
            accountNumber: "111122223333",
            bankName: "ACB",
            branch: "District 1",
            swiftCode: "ACBAVNVX"
        );

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, UpdateBankAccountCommand, ErrorOr.Success>(
                Result.Success,
                string.Format(AdminEndpoint.ManagerBankAccount, managerId));

        var actionResult = await controller.UpdateBankAccount(managerId, request);

        Assert.IsType<ObjectResult>(actionResult);
        var captured = Assert.IsType<UpdateBankAccountCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
        Assert.Equal(request.AccountNumber, captured.AccountNumber);
        Assert.Equal(request.BankName, captured.BankName);
        Assert.Equal(request.Branch, captured.Branch);
        Assert.Equal(request.SwiftCode, captured.SwiftCode);
    }

    [Fact]
    public async Task UpdateBankAccount_ManagerNotFound_Returns404()
    {
        var managerId = Guid.NewGuid();
        var request = new UpdateBankAccountRequest(
            accountNumber: "111122223333",
            bankName: "ACB",
            branch: "District 1",
            swiftCode: "ACBAVNVX"
        );

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, UpdateBankAccountCommand, ErrorOr.Success>(
                Error.NotFound("User.NotFound", "Manager not found."),
                string.Format(AdminEndpoint.ManagerBankAccount, managerId));

        var actionResult = await controller.UpdateBankAccount(managerId, request);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "Manager not found.",
            expectedInstance: string.Format(AdminEndpoint.ManagerBankAccount, managerId));
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
                string.Format(AdminEndpoint.VerifyBankAccount, managerId));

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
                string.Format(AdminEndpoint.VerifyBankAccount, managerId));

        var actionResult = await controller.VerifyBankAccount(managerId);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "Manager not found.",
            expectedInstance: string.Format(AdminEndpoint.VerifyBankAccount, managerId));
    }

    #endregion

    #region CreateStaffUnderManager

    [Fact]
    public async Task CreateStaffUnderManager_ValidRequest_Returns200()
    {
        var managerId = Guid.NewGuid();
        var request = new CreateStaffUnderManagerRequest(
            email: "staff@example.com",
            fullName: "Staff Member",
            password: "Password123!",
            role: "TourGuide"
        );

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, CreateStaffUnderManagerCommand, ErrorOr<Guid>>(
                Result.Success(Guid.NewGuid()),
                AdminEndpoint.TourManagerStaff);

        var actionResult = await controller.CreateStaffUnderManager(managerId, request);

        Assert.IsType<ObjectResult>(actionResult);
        var captured = Assert.IsType<CreateStaffUnderManagerCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
        Assert.Equal(request.Email, captured.Email);
        Assert.Equal(request.FullName, captured.FullName);
        Assert.Equal(request.Password, captured.Password);
        Assert.Equal(request.Role, captured.Role);
    }

    [Fact]
    public async Task CreateStaffUnderManager_InvalidEmail_Returns400()
    {
        var managerId = Guid.NewGuid();
        var request = new CreateStaffUnderManagerRequest(
            email: "invalid-email",
            fullName: "Staff",
            password: "Password123!",
            role: "TourGuide"
        );

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, CreateStaffUnderManagerCommand, ErrorOr<Guid>>(
                Error.Validation("Email.Invalid", "Invalid email format."),
                AdminEndpoint.TourManagerStaff);

        var actionResult = await controller.CreateStaffUnderManager(managerId, request);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status400BadRequest,
            expectedCode: "Email.Invalid",
            expectedMessage: "Invalid email format.",
            expectedInstance: AdminEndpoint.TourManagerStaff);
    }

    #endregion
}
