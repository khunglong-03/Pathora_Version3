using Api.Controllers;
using Application.Features.Admin.Commands.ReassignStaff;
using Application.Features.Admin.DTOs;
using Contracts.ModelResponse;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Domain.Specs.Api;

public sealed class AdminControllerReassignStaffTests
{
    [Fact]
    public async Task ReassignStaff_ValidRequest_Returns200()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var targetManagerId = Guid.NewGuid();
        var request = new ReassignStaffRequest(targetManagerId);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminController, ReassignStaffCommand, ErrorOr.Success>(
                Result.Success, $"/api/admin/tour-managers/{managerId}/staff/{staffId}/reassign");

        var actionResult = await controller.ReassignStaff(managerId, staffId, request);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/admin/tour-managers/{managerId}/staff/{staffId}/reassign",
            expectedData: Result.Success);
        var captured = Assert.IsType<ReassignStaffCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
        Assert.Equal(staffId, captured.StaffId);
        Assert.Equal(targetManagerId, captured.TargetManagerId);
    }

    [Fact]
    public async Task ReassignStaff_SameManager_Returns200NoOp()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var request = new ReassignStaffRequest(managerId);
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminController, ReassignStaffCommand, ErrorOr.Success>(
                Result.Success, $"/api/admin/tour-managers/{managerId}/staff/{staffId}/reassign");

        var actionResult = await controller.ReassignStaff(managerId, staffId, request);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/admin/tour-managers/{managerId}/staff/{staffId}/reassign",
            expectedData: Result.Success);
    }
}
