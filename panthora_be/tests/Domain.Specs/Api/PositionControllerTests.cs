using Api.Controllers;
using Contracts;
using Application.Contracts.Position;
using Application.Features.Position.Commands;
using Application.Features.Position.Queries;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class PositionControllerTests
{
    [Fact]
    public async Task GetAll_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var positions = new List<PositionVm>
        {
            new(Guid.CreateVersion7(), "Trưởng phòng", 1, null, 1)
        };
        var response = new PaginatedListWithPermissions<PositionVm>(positions.Count, positions, new Dictionary<string, bool>());
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PositionController, GetAllPositionsQuery, PaginatedListWithPermissions<PositionVm>>(response, "/api/position");

        var actionResult = await controller.GetAll(pageNumber: 2, pageSize: 5, searchText: "trưởng");

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/position",
            expectedData: response);
        Assert.Equal(new GetAllPositionsQuery(2, 5, "trưởng"), probe.CapturedRequest);
    }

    [Fact]
    public async Task GetComboBox_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var response = new List<LookupVm>
        {
            new("1", "Trưởng phòng")
        };
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PositionController, GetPositionComboBoxQuery, List<LookupVm>>(response, "/api/position/combobox");

        var actionResult = await controller.GetComboBox();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/position/combobox",
            expectedData: response);
        Assert.IsType<GetPositionComboBoxQuery>(probe.CapturedRequest);
    }

    [Fact]
    public async Task Create_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var command = new CreatePositionCommand("Nhân viên", 2, "Ghi chú", 1);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PositionController, CreatePositionCommand, Success>(Result.Success, "/api/position");

        var actionResult = await controller.Create(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/position",
            expectedData: Result.Success);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task Update_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var command = new UpdatePositionCommand(Guid.CreateVersion7(), "Nhân viên", 2, "Ghi chú mới", 1);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PositionController, UpdatePositionCommand, Success>(Result.Success, "/api/position");

        var actionResult = await controller.Update(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/position",
            expectedData: Result.Success);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task Delete_WhenPositionMissing_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PositionController, DeletePositionCommand, Success>(
                Error.NotFound("Position.NotFound", "Không tìm thấy chức vụ"),
                $"/api/position/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "Position.NotFound",
            expectedMessage: "Không tìm thấy chức vụ",
            expectedInstance: $"/api/position/{id}");
        Assert.Equal(new DeletePositionCommand(id), probe.CapturedRequest);
    }
}
