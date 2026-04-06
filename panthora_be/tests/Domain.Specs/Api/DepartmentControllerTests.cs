using Api.Controllers;
using Contracts;
using Application.Contracts.Department;
using Application.Features.Department.Commands;
using Application.Features.Department.Queries;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class DepartmentControllerTests
{
    [Fact]
    public async Task GetAll_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var departments = new List<DepartmentVm>
        {
            new(Guid.CreateVersion7(), null, "IT", 1)
        };
        var response = new PaginatedListWithPermissions<DepartmentVm>(departments.Count, departments, new Dictionary<string, bool>());
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<DepartmentController, GetAllDepartmentsQuery, PaginatedListWithPermissions<DepartmentVm>>(response, "/api/department");

        var actionResult = await controller.GetAll();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/department",
            expectedData: response);
        Assert.IsType<GetAllDepartmentsQuery>(probe.CapturedRequest);
    }

    [Fact]
    public async Task GetComboBox_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var response = new List<DepartmentComboBoxVm>
        {
            new(Guid.CreateVersion7(), null, 1, "IT")
        };
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<DepartmentController, GetDepartmentComboBoxQuery, List<DepartmentComboBoxVm>>(response, "/api/department/combobox");

        var actionResult = await controller.GetComboBox();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/department/combobox",
            expectedData: response);
        Assert.IsType<GetDepartmentComboBoxQuery>(probe.CapturedRequest);
    }

    [Fact]
    public async Task Create_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var command = new CreateDepartmentCommand(null, "Nhân sự");
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<DepartmentController, CreateDepartmentCommand, Guid>(response, "/api/department");

        var actionResult = await controller.Create(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/department",
            expectedData: response);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task Update_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var command = new UpdateDepartmentCommand(Guid.CreateVersion7(), null, "Cập nhật");
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<DepartmentController, UpdateDepartmentCommand, Success>(Result.Success, "/api/department");

        var actionResult = await controller.Update(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/department",
            expectedData: Result.Success);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task Delete_WhenDepartmentMissing_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<DepartmentController, DeleteDepartmentCommand, Success>(
                Error.NotFound("Department.NotFound", "Không tìm thấy phòng ban"),
                $"/api/department/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "Department.NotFound",
            expectedMessage: "Không tìm thấy phòng ban",
            expectedInstance: $"/api/department/{id}");
        Assert.Equal(new DeleteDepartmentCommand(id), probe.CapturedRequest);
    }
}
