using Api.Controllers;
using Api.Endpoint;
using Application.Features.Admin.Commands.ReassignStaff;
using Application.Features.Admin.DTOs;
using Application.Features.Admin.Queries;
using Application.Features.Admin.Queries.GetAllUsers;
using Application.Features.Admin.Queries.GetAdminDashboardOverview;
using Application.Features.Admin.Queries.GetHotelProviders;
using Application.Features.Admin.Queries.GetTourManagerStaff;
using Application.Features.Admin.Queries.GetTransportProviders;
using Application.Features.Admin.Queries.GetUserDetail;
using Contracts.ModelResponse;
using global::Contracts;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Domain.Specs.Api.Admin;

public sealed class AdminControllerTests
{
    private const string BasePath = "/api/admin";

    #region GetAllUsers

    [Fact]
    public async Task GetAllUsers_ValidRequest_Returns200()
    {
        var userItems = new PaginatedList<UserListItemDto>(
            1,
            new List<UserListItemDto>
            {
                new(Guid.NewGuid(), "manager1", "Manager One", "manager@example.com", "+84 123 456 001", null, UserStatus.Active, VerifyStatus.Verified, new List<string> { "Manager" })
            },
            1, 20);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetAllUsersQuery, PaginatedList<UserListItemDto>>(
                userItems,
                $"{BasePath}/users");

        var actionResult = await controller.GetAllUsers(1, 20, null, null, null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/users",
            expectedData: userItems);
        var captured = Assert.IsType<GetAllUsersQuery>(probe.CapturedRequest);
        Assert.Equal(1, captured.PageNumber);
        Assert.Equal(20, captured.PageSize);
    }

    [Fact]
    public async Task GetAllUsers_WithRoleFilter_PassesRoleToQuery()
    {
        var emptyResult = new PaginatedList<UserListItemDto>(0, new List<UserListItemDto>(), 1, 20);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetAllUsersQuery, PaginatedList<UserListItemDto>>(
                emptyResult,
                $"{BasePath}/users");

        var actionResult = await controller.GetAllUsers(1, 20, "TourGuide", null, null);

        var captured = Assert.IsType<GetAllUsersQuery>(probe.CapturedRequest);
        Assert.Equal("TourGuide", captured.Role);
    }

    [Fact]
    public async Task GetAllUsers_WithStatusFilter_PassesStatusToQuery()
    {
        var emptyResult = new PaginatedList<UserListItemDto>(0, new List<UserListItemDto>(), 1, 20);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetAllUsersQuery, PaginatedList<UserListItemDto>>(
                emptyResult,
                $"{BasePath}/users");

        var actionResult = await controller.GetAllUsers(1, 20, null, UserStatus.Active, null);

        var captured = Assert.IsType<GetAllUsersQuery>(probe.CapturedRequest);
        Assert.Equal(UserStatus.Active, captured.Status);
    }

    [Fact]
    public async Task GetAllUsers_WithSearchText_PassesSearchToQuery()
    {
        var emptyResult = new PaginatedList<UserListItemDto>(0, new List<UserListItemDto>(), 1, 20);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetAllUsersQuery, PaginatedList<UserListItemDto>>(
                emptyResult,
                $"{BasePath}/users");

        var actionResult = await controller.GetAllUsers(1, 20, null, null, "Lan");

        var captured = Assert.IsType<GetAllUsersQuery>(probe.CapturedRequest);
        Assert.Equal("Lan", captured.SearchText);
    }

    [Fact]
    public async Task GetAllUsers_NoResults_Returns200WithEmptyArray()
    {
        var emptyResult = new PaginatedList<UserListItemDto>(0, new List<UserListItemDto>(), 1, 20);
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetAllUsersQuery, PaginatedList<UserListItemDto>>(
                emptyResult,
                $"{BasePath}/users");

        var actionResult = await controller.GetAllUsers(1, 20, null, null, null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/users",
            expectedData: emptyResult);
    }

    #endregion

    #region GetUserDetail

    [Fact]
    public async Task GetUserDetail_ValidId_Returns200()
    {
        var userId = Guid.NewGuid();
        var detail = new UserDetailDto(
            userId,
            "guide1",
            "Guide One",
            "guide@example.com",
            "+84 999 888 777",
            null,
            UserStatus.Active,
            VerifyStatus.Verified,
            new List<string> { "TourGuide" },
            new List<BookingSummaryDto>());

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetUserDetailQuery, UserDetailDto>(
                detail,
                $"{BasePath}/users/{userId}");

        var actionResult = await controller.GetUserDetail(userId);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/users/{userId}",
            expectedData: detail);
        var captured = Assert.IsType<GetUserDetailQuery>(probe.CapturedRequest);
        Assert.Equal(userId, captured.Id);
    }

    [Fact]
    public async Task GetUserDetail_NotFound_Returns404()
    {
        var userId = Guid.NewGuid();
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetUserDetailQuery, UserDetailDto>(
                Error.NotFound("User.NotFound", "User not found."),
                $"{BasePath}/users/{userId}");

        var actionResult = await controller.GetUserDetail(userId);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "User not found.",
            expectedInstance: $"{BasePath}/users/{userId}");
    }

    #endregion

    #region GetTransportProviders

    [Fact]
    public async Task GetTransportProviders_ValidRequest_Returns200()
    {
        var providers = new List<TransportProviderListItemDto>
        {
            new(Guid.NewGuid(), "Transport One", "transport@example.com", "+84 111 222 333", null, UserStatus.Active, 42)
        };
        var response = new PaginatedList<TransportProviderListItemDto>(providers.Count, providers, 1, 10);
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetTransportProvidersQuery, PaginatedList<TransportProviderListItemDto>>(
                response,
                $"{BasePath}/transport-providers");

        var actionResult = await controller.GetTransportProviders(1, 10);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/transport-providers",
            expectedData: response);
    }

    [Fact]
    public async Task GetTransportProviders_EmptyList_Returns200WithEmptyArray()
    {
        var emptyResponse = new PaginatedList<TransportProviderListItemDto>(0, new List<TransportProviderListItemDto>(), 1, 10);
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetTransportProvidersQuery, PaginatedList<TransportProviderListItemDto>>(
                emptyResponse,
                $"{BasePath}/transport-providers");

        var actionResult = await controller.GetTransportProviders(1, 10);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/transport-providers",
            expectedData: emptyResponse);
    }

    #endregion

    #region GetHotelProviders

    [Fact]
    public async Task GetHotelProviders_ValidRequest_Returns200()
    {
        var providers = new List<HotelProviderListItemDto>
        {
            new(Guid.NewGuid(), "Hotel One", "hotel@example.com", "+84 444 555 666", null, UserStatus.Active, 120)
        };
        var response = new PaginatedList<HotelProviderListItemDto>(providers.Count, providers, 1, 10);
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetHotelProvidersQuery, PaginatedList<HotelProviderListItemDto>>(
                response,
                $"{BasePath}/hotel-providers");

        var actionResult = await controller.GetHotelProviders(1, 10);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/hotel-providers",
            expectedData: response);
    }

    [Fact]
    public async Task GetHotelProviders_EmptyList_Returns200WithEmptyArray()
    {
        var emptyResponse = new PaginatedList<HotelProviderListItemDto>(0, new List<HotelProviderListItemDto>(), 1, 10);
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetHotelProvidersQuery, PaginatedList<HotelProviderListItemDto>>(
                emptyResponse,
                $"{BasePath}/hotel-providers");

        var actionResult = await controller.GetHotelProviders(1, 10);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/hotel-providers",
            expectedData: emptyResponse);
    }

    #endregion

    #region GetTourManagerStaff

    [Fact]
    public async Task GetTourManagerStaff_ValidManagerId_Returns200()
    {
        var managerId = Guid.NewGuid();
        var staffDto = new TourManagerStaffDto(
            new UserSummaryDto(managerId, "Manager One", "manager@example.com", null),
            new List<StaffMemberDto>
            {
                new(Guid.NewGuid(), "Designer One", "designer@example.com", null, "TourDesigner", "Member", "Hoạt động"),
                new(Guid.NewGuid(), "Guide One", "guide@example.com", null, "TourGuide", "Lead", "Hoạt động")
            });

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetTourManagerStaffQuery, TourManagerStaffDto>(
                staffDto,
                $"{BasePath}/tour-managers/{managerId}/staff");

        var actionResult = await controller.GetTourManagerStaff(managerId);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/tour-managers/{managerId}/staff",
            expectedData: staffDto);
        var captured = Assert.IsType<GetTourManagerStaffQuery>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
    }

    [Fact]
    public async Task GetTourManagerStaff_ManagerNotFound_Returns404()
    {
        var managerId = Guid.NewGuid();
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetTourManagerStaffQuery, TourManagerStaffDto>(
                Error.NotFound("User.NotFound", "Tour manager not found."),
                $"{BasePath}/tour-managers/{managerId}/staff");

        var actionResult = await controller.GetTourManagerStaff(managerId);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "Tour manager not found.",
            expectedInstance: $"{BasePath}/tour-managers/{managerId}/staff");
    }

    [Fact]
    public async Task GetTourManagerStaff_EmptyStaff_Returns200WithEmptyList()
    {
        var managerId = Guid.NewGuid();
        var staffDto = new TourManagerStaffDto(
            new UserSummaryDto(managerId, "Manager Two", "manager2@example.com", null),
            new List<StaffMemberDto>());

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetTourManagerStaffQuery, TourManagerStaffDto>(
                staffDto,
                $"{BasePath}/tour-managers/{managerId}/staff");

        var actionResult = await controller.GetTourManagerStaff(managerId);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/tour-managers/{managerId}/staff",
            expectedData: staffDto);
    }

    #endregion

    #region ReassignStaff

    [Fact]
    public async Task ReassignStaff_ValidRequest_Returns200()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var targetManagerId = Guid.NewGuid();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, ReassignStaffCommand, ErrorOr.Success>(
                Result.Success,
                $"{BasePath}/tour-managers/{managerId}/staff/{staffId}/reassign");

        var actionResult = await controller.ReassignStaff(managerId, staffId, new ReassignStaffRequest(targetManagerId));

        Assert.IsType<ObjectResult>(actionResult);
        var captured = Assert.IsType<ReassignStaffCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
        Assert.Equal(staffId, captured.StaffId);
        Assert.Equal(targetManagerId, captured.TargetManagerId);
    }

    [Fact]
    public async Task ReassignStaff_StaffNotFound_Returns404()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, ReassignStaffCommand, ErrorOr.Success>(
                Error.NotFound("User.NotFound", "Staff not found."),
                $"{BasePath}/tour-managers/{managerId}/staff/{staffId}/reassign");

        var actionResult = await controller.ReassignStaff(managerId, staffId, new ReassignStaffRequest(Guid.NewGuid()));

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "Staff not found.",
            expectedInstance: $"{BasePath}/tour-managers/{managerId}/staff/{staffId}/reassign");
    }

    [Fact]
    public async Task ReassignStaff_TargetManagerNotFound_Returns404()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, ReassignStaffCommand, ErrorOr.Success>(
                Error.NotFound("TourManager.NotFound", "Target manager not found."),
                $"{BasePath}/tour-managers/{managerId}/staff/{staffId}/reassign");

        var actionResult = await controller.ReassignStaff(managerId, staffId, new ReassignStaffRequest(Guid.NewGuid()));

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "TourManager.NotFound",
            expectedMessage: "Target manager not found.",
            expectedInstance: $"{BasePath}/tour-managers/{managerId}/staff/{staffId}/reassign");
    }

    #endregion

    #region GetAdminDashboardOverview

    [Fact]
    public async Task GetAdminDashboardOverview_ValidRequest_Returns200()
    {
        var overview = new AdminDashboardOverviewDto(
            150,
            5,
            12,
            8,
            7,
            new List<ActivityItemDto>
            {
                new("UserRegistration", "New user registered", DateTimeOffset.UtcNow)
            });

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetAdminDashboardOverviewQuery, AdminDashboardOverviewDto>(
                overview,
                $"{BasePath}/dashboard/overview");

        var actionResult = await controller.GetAdminDashboardOverview();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/dashboard/overview",
            expectedData: overview);
    }

    [Fact]
    public async Task GetAdminDashboardOverview_NoData_Returns200WithZeros()
    {
        var overview = new AdminDashboardOverviewDto(
            0, 0, 0, 0, 0,
            new List<ActivityItemDto>());

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, GetAdminDashboardOverviewQuery, AdminDashboardOverviewDto>(
                overview,
                $"{BasePath}/dashboard/overview");

        var actionResult = await controller.GetAdminDashboardOverview();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/dashboard/overview",
            expectedData: overview);
    }

    #endregion
}
