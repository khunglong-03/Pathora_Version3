using Api.Controllers;
using Contracts;
using Application.Contracts.Role;
using Application.Features.Role.Commands;
using Application.Features.Role.Queries;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class RoleControllerTests
{
    [Fact]
    public async Task GetAll_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var roles = new List<RoleVm>
        {
            new(
                1,
                "Admin",
                "System admin",
                1,
                RoleStatus.Active,
                [])
        };
        var response = new PaginatedListWithPermissions<RoleVm>(roles.Count, roles, new Dictionary<string, bool>());
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<RoleController, GetAllRolesQuery, PaginatedListWithPermissions<RoleVm>>(response, "/api/role");

        var actionResult = await controller.GetAll();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/role",
            expectedData: response);
        Assert.IsType<GetAllRolesQuery>(probe.CapturedRequest);
    }

    [Fact]
    public async Task GetDetail_WhenRoleMissing_ShouldReturnNotFoundResponse()
    {
        const int roleId = 0;
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<RoleController, GetRoleDetailQuery, RoleDetailVm>(
                Error.NotFound("Role.NotFound", "Không tìm thấy vai trò"),
                "/api/role/0");

        var actionResult = await controller.GetDetail(roleId);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "Role.NotFound",
            expectedMessage: "Không tìm thấy vai trò",
            expectedInstance: "/api/role/0");
        Assert.Equal(new GetRoleDetailQuery(roleId), probe.CapturedRequest);
    }

    [Fact]
    public async Task GetLookup_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var response = new List<LookupVm>
        {
            new("1", "Admin")
        };
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<RoleController, GetRoleLookupQuery, List<LookupVm>>(response, "/api/role/lookup");

        var actionResult = await controller.GetLookup();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/role/lookup",
            expectedData: response);
        Assert.IsType<GetRoleLookupQuery>(probe.CapturedRequest);
    }

    [Fact]
    public async Task Create_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var command = new CreateRoleCommand("Admin", "System admin", 1, [1, 2]);
        var response = 1;
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<RoleController, CreateRoleCommand, int>(response, "/api/role");

        var actionResult = await controller.Create(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/role",
            expectedData: response);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task Update_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var command = new UpdateRoleCommand(
            RoleId: 1,
            Name: "Admin",
            Description: "Updated description",
            Status: RoleStatus.Active,
            Type: 1,
            FunctionIds: [1, 2]);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<RoleController, UpdateRoleCommand, Success>(Result.Success, "/api/role");

        var actionResult = await controller.Update(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/role",
            expectedData: Result.Success);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task Delete_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        const int roleId = 1;
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<RoleController, DeleteRoleCommand, Success>(Result.Success, "/api/role/1");

        var actionResult = await controller.Delete(roleId);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/role/1",
            expectedData: Result.Success);
        Assert.Equal(new DeleteRoleCommand(roleId), probe.CapturedRequest);
    }
}
