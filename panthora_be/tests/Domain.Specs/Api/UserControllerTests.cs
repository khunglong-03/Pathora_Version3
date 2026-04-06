using Api.Controllers;
using Contracts;
using Contracts.ModelResponse;
using Application.Contracts.User;
using Application.Features.User.Commands;
using Application.Features.User.Queries;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

public sealed class UserControllerTests
{
    [Fact]
    public async Task GetAll_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var users = new List<UserVm>
        {
            new(
                Guid.CreateVersion7(),
                null,
                "admin",
                "Administrator",
                "admin@example.com",
                "IT",
                ["Admin"],
                new Dictionary<string, bool> { ["canUpdate"] = true })
        };
        var response = new PaginatedListWithPermissions<UserVm>(users.Count, users, new Dictionary<string, bool>());
        var departmentId = Guid.CreateVersion7();
        const string textSearch = "admin";
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<UserController, GetAllUsersQuery, PaginatedListWithPermissions<UserVm>>(response, "/api/user");

        var actionResult = await controller.GetAll(departmentId, textSearch, pageNumber: 2, pageSize: 20);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/user",
            expectedData: response);
        Assert.Equal(new GetAllUsersQuery(departmentId, textSearch, 2, 20), probe.CapturedRequest);
    }

    [Fact]
    public async Task GetDetail_WhenUserMissing_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<UserController, GetUserDetailQuery, UserDetailVm>(
                Error.NotFound("User.NotFound", "Không tìm thấy người dùng"),
                $"/api/user/{id}");

        var actionResult = await controller.GetDetail(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "Không tìm thấy người dùng",
            expectedInstance: $"/api/user/{id}");
        Assert.Equal(new GetUserDetailQuery(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task Create_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var command = new CreateUserCommand(
            Departments:
            [
                new UserDepartmentInfo(Guid.CreateVersion7(), Guid.CreateVersion7())
            ],
            RoleIds:
            [
                1
            ],
            Email: "new.user@example.com",
            FullName: "New User",
            Avatar: "avatar.png");
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<UserController, CreateUserCommand, Guid>(response, "/api/user");

        var actionResult = await controller.Create(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/user",
            expectedData: response);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task Update_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var command = new UpdateUserCommand(
            Id: Guid.CreateVersion7(),
            Departments:
            [
                new UserDepartmentInfo(Guid.CreateVersion7(), Guid.CreateVersion7())
            ],
            RoleIds:
            [
                1
            ],
            FullName: "Updated User",
            Avatar: "updated-avatar.png");
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<UserController, UpdateUserCommand, Success>(Result.Success, "/api/user");

        var actionResult = await controller.Update(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/user",
            expectedData: Result.Success);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task Delete_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<UserController, DeleteUserCommand, Success>(Result.Success, $"/api/user/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/user/{id}",
            expectedData: Result.Success);
        Assert.Equal(new DeleteUserCommand(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task ChangePassword_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var command = new ChangePasswordCommand(Guid.CreateVersion7());
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<UserController, ChangePasswordCommand, Success>(Result.Success, "/api/user/change-password");

        var actionResult = await controller.ChangePassword(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/user/change-password",
            expectedData: Result.Success);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task ChangePassword_WhenUserNotFound_ShouldReturnNotFoundResponse()
    {
        var userId = Guid.CreateVersion7();
        var command = new ChangePasswordCommand(userId);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<UserController, ChangePasswordCommand, Success>(
                Error.NotFound("User.NotFound", "Không tìm thấy người dùng"),
                "/api/user/change-password");

        var actionResult = await controller.ChangePassword(command);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "Không tìm thấy người dùng",
            expectedInstance: "/api/user/change-password");
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task ChangePassword_WhenUnexpectedError_ShouldReturnInternalServerErrorResponse()
    {
        var command = new ChangePasswordCommand(Guid.CreateVersion7());
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<UserController, ChangePasswordCommand, Success>(
                Error.Failure("Server.Error", "Lỗi máy chủ không xác định"),
                "/api/user/change-password");

        var actionResult = await controller.ChangePassword(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status500InternalServerError, payload.StatusCode);
        Assert.Equal("/api/user/change-password", payload.Instance);
        Assert.NotNull(payload.Errors);
        Assert.Single(payload.Errors);
        Assert.Equal("Server.Error", payload.Errors[0].Details);
        Assert.Equal("Lỗi máy chủ không xác định", payload.Errors[0].ErrorMessage);
        Assert.Equal(command, probe.CapturedRequest);
    }
}
