using Api.Controllers.Admin;
using Api.Controllers.Manager;
using Api.Endpoint;
using Application.Contracts.User;
using Application.Features.Admin.DTOs;
using Application.Features.Admin.Queries.GetAllUsers;
using Application.Features.Admin.Queries.GetUserDetail;
using Application.Features.Admin.Queries.GetTransportProviders;
using Application.Features.Admin.Queries.GetHotelProviders;
using Application.Features.Admin.Queries.GetTourManagerStaff;
using Application.Features.Admin.Queries.GetAdminDashboardOverview;
using Contracts;
using Contracts.ModelResponse;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Domain.Specs.Api;

public sealed class AdminControllerTests
{
    private const string BasePath = "/api/admin";

    #region GetAllUsers

    [Fact]
    public async Task GetAllUsers_Returns200WithPaginatedList()
    {
        var items = new List<UserListItemDto>
        {
            new(Guid.NewGuid(), "john", "John Doe", "john@example.com", "0123456789", null, UserStatus.Active, VerifyStatus.Verified, new List<string> { "Customer" })
        };
        var paginated = new PaginatedList<UserListItemDto>(1, items, 1, 10);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetAllUsersQuery, PaginatedList<UserListItemDto>>(
                paginated, $"{BasePath}/users");

        var actionResult = await controller.GetAllUsers(1, 10, null, null, null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/users",
            expectedData: paginated);
        Assert.IsType<GetAllUsersQuery>(probe.CapturedRequest);
    }

    #endregion

    #region GetUserDetail

    [Fact]
    public async Task GetUserDetail_WhenExists_Returns200()
    {
        var userId = Guid.NewGuid();
        var detail = new UserDetailDto(
            userId, "john", "John Doe", "john@example.com", "0123456789", null,
            UserStatus.Active, VerifyStatus.Verified, new List<string> { "Customer" }, new List<BookingSummaryDto>());
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetUserDetailQuery, UserDetailDto>(
                detail, $"{BasePath}/users/{userId}");

        var actionResult = await controller.GetUserDetail(userId);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/users/{userId}",
            expectedData: detail);
    }

    [Fact]
    public async Task GetUserDetail_WhenNotFound_Returns404()
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
    public async Task GetTransportProviders_Returns200WithList()
    {
        var providers = new List<TransportProviderListItemDto>
        {
            new(Guid.NewGuid(), "Transport Co", "trans@example.com", "0123456789", null, UserStatus.Active, 5, [], null, null, 0)
        };
        var response = new PaginatedList<TransportProviderListItemDto>(
            providers.Count, providers, 1, 10);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<ManagerController, GetTransportProvidersQuery, PaginatedList<TransportProviderListItemDto>>(
                response, $"{BasePath}/transport-providers");

        var actionResult = await controller.GetTransportProviders(1, 10);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/transport-providers",
            expectedData: response);
    }

    #endregion

    #region GetHotelProviders

    [Fact]
    public async Task GetHotelProviders_Returns200WithList()
    {
        var providers = new List<HotelProviderListItemDto>
        {
            new(Guid.NewGuid(), "Hotel Co", "SUP-001", "hotel@example.com", "0123456789", null, null, UserStatus.Active, 3, 3, 20, null, null, [])
        };
        var response = new PaginatedList<HotelProviderListItemDto>(
            providers.Count, providers, 1, 10);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<ManagerController, GetHotelProvidersQuery, PaginatedList<HotelProviderListItemDto>>(
                response, $"{BasePath}/hotel-providers");

        var actionResult = await controller.GetHotelProviders(1, 10);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/hotel-providers",
            expectedData: response);
    }

    #endregion

    #region GetTourManagerStaff

    [Fact]
    public async Task GetTourManagerStaff_WhenExists_Returns200()
    {
        var managerId = Guid.NewGuid();
        var dto = new TourManagerStaffDto(
            new UserSummaryDto(managerId, "Manager", "manager@example.com", null),
            new List<StaffMemberDto>());
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<ManagerController, GetTourManagerStaffQuery, TourManagerStaffDto>(
                dto, $"{BasePath}/tour-managers/{managerId}/staff");

        var actionResult = await controller.GetTourManagerStaff(managerId);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/tour-managers/{managerId}/staff",
            expectedData: dto);
    }

    [Fact]
    public async Task GetTourManagerStaff_WhenNotFound_Returns404()
    {
        var managerId = Guid.NewGuid();
        var (controller, _) = ApiControllerTestHelper
            .BuildController<ManagerController, GetTourManagerStaffQuery, TourManagerStaffDto>(
                Error.NotFound("User.NotFound", "User not found."),
                $"{BasePath}/tour-managers/{managerId}/staff");

        var actionResult = await controller.GetTourManagerStaff(managerId);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "User not found.",
            expectedInstance: $"{BasePath}/tour-managers/{managerId}/staff");
    }

    #endregion

    #region GetAdminDashboardOverview

    [Fact]
    public async Task GetAdminDashboardOverview_Returns200WithOverview()
    {
        var overview = new AdminDashboardOverviewDto(
            100, 5, 10, 8, 15, new List<ActivityItemDto>());
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, GetAdminDashboardOverviewQuery, AdminDashboardOverviewDto>(
                overview, $"{BasePath}/dashboard/overview");

        var actionResult = await controller.GetAdminDashboardOverview();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/dashboard/overview",
            expectedData: overview);
    }

    #endregion
}
