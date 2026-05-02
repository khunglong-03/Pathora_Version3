using global::Api.Controllers;
using global::Api.Endpoint;
using global::Application.Contracts.TourManagerAssignment;
using global::Application.Features.TourManagerAssignment.Commands.AssignTourManagerTeam;
using global::Application.Features.TourManagerAssignment.Commands.BulkAssignTourManagerTeam;
using global::Application.Features.TourManagerAssignment.Commands.RemoveTourManagerAssignment;
using global::Application.Features.TourManagerAssignment.Queries;
using Contracts.ModelResponse;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

public sealed class TourManagerAssignmentControllerTests
{
    private const string BasePath = "/api/tour-manager-assignment";

    #region GetAll

    [Fact]
    public async Task GetAllAssignments_SuperAdmin_Returns200()
    {
        var summaries = new List<TourManagerSummaryVm>
        {
            new(Guid.NewGuid(), "Manager A", "manager@example.com", 2, 3, 1)
        };
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, GetTourManagerAssignmentsQuery, List<TourManagerSummaryVm>>(
                summaries,
                BasePath);

        var actionResult = await controller.GetAll(null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: BasePath,
            expectedData: summaries);
        Assert.IsType<GetTourManagerAssignmentsQuery>(probe.CapturedRequest);
    }

    [Fact]
    public async Task GetAllAssignments_WithManagerFilter_PassesFilterToQuery()
    {
        var managerId = Guid.NewGuid();
        var summaries = new List<TourManagerSummaryVm>
        {
            new(managerId, "Manager A", "manager@example.com", 1, 1, 0)
        };
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, GetTourManagerAssignmentsQuery, List<TourManagerSummaryVm>>(
                summaries,
                BasePath);

        var actionResult = await controller.GetAll(managerId);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: BasePath,
            expectedData: summaries);
        var captured = Assert.IsType<GetTourManagerAssignmentsQuery>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
    }

    [Fact]
    public async Task GetAllAssignments_NoAssignments_Returns200WithEmptyList()
    {
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, GetTourManagerAssignmentsQuery, List<TourManagerSummaryVm>>(
                new List<TourManagerSummaryVm>(),
                BasePath);

        var actionResult = await controller.GetAll(null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: BasePath,
            expectedData: new List<TourManagerSummaryVm>());
    }

    #endregion

    #region GetById

    [Fact]
    public async Task GetAssignmentById_WhenExists_Returns200()
    {
        var managerId = Guid.NewGuid();
        var detail = new TourManagerAssignmentDetailVm(
            managerId,
            "Manager A",
            "manager@example.com",
            new List<AssignmentItemVm>
            {
                new(Guid.NewGuid(), Guid.NewGuid(), "Designer", "designer@example.com", null, null, 1, 1, DateTimeOffset.UtcNow)
            });
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, GetTourManagerAssignmentByIdQuery, TourManagerAssignmentDetailVm>(
                detail,
                $"{BasePath}/{managerId}");

        var actionResult = await controller.GetById(managerId);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"{BasePath}/{managerId}",
            expectedData: detail);
        Assert.Equal(new GetTourManagerAssignmentByIdQuery(managerId), probe.CapturedRequest);
    }

    [Fact]
    public async Task GetAssignmentById_WhenNotFound_Returns404()
    {
        var managerId = Guid.NewGuid();
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, GetTourManagerAssignmentByIdQuery, TourManagerAssignmentDetailVm>(
                Error.NotFound("TourManagerAssignment.NotFound", "Tour manager assignment not found."),
                $"{BasePath}/{managerId}");

        var actionResult = await controller.GetById(managerId);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "TourManagerAssignment.NotFound",
            expectedMessage: "Tour manager assignment not found.",
            expectedInstance: $"{BasePath}/{managerId}");
    }

    #endregion

    #region Assign

    [Fact]
    public async Task Assign_WithValidData_Returns201()
    {
        var managerId = Guid.NewGuid().ToString();
        var designerId = Guid.NewGuid();
        var request = new AssignTourManagerTeamRequest(managerId, new List<AssignmentItem>
        {
            new(designerId, null, 1, 1)
        });
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, AssignTourManagerTeamCommand, Success>(
                Result.Success,
                BasePath);

        var actionResult = await controller.Assign(request);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status201Created, objectResult.StatusCode);
        var captured = Assert.IsType<AssignTourManagerTeamCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.TourManagerUserId);
        Assert.Single(captured.Assignments);
    }

    [Fact]
    public async Task Assign_WhenDuplicate_ReturnsConflict()
    {
        var managerId = Guid.NewGuid().ToString();
        var request = new AssignTourManagerTeamRequest(managerId, new List<AssignmentItem>
        {
            new(Guid.NewGuid(), null, 1, 1)
        });
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, AssignTourManagerTeamCommand, Success>(
                Error.Conflict("TourManagerAssignment.DuplicateUser", "User is already assigned to this manager's team."),
                BasePath);

        var actionResult = await controller.Assign(request);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status409Conflict,
            expectedCode: "TourManagerAssignment.DuplicateUser",
            expectedMessage: "User is already assigned to this manager's team.",
            expectedInstance: BasePath);
    }

    [Fact]
    public async Task Assign_WhenUserNotFound_Returns404()
    {
        var managerId = Guid.NewGuid().ToString();
        var request = new AssignTourManagerTeamRequest(managerId, new List<AssignmentItem>
        {
            new(Guid.NewGuid(), null, 1, 1)
        });
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, AssignTourManagerTeamCommand, Success>(
                Error.NotFound("User.NotFound", "User not found."),
                BasePath);

        var actionResult = await controller.Assign(request);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "User.NotFound",
            expectedMessage: "User not found.",
            expectedInstance: BasePath);
    }

    [Fact]
    public async Task Assign_WhenSelfAssignment_Returns400()
    {
        var managerId = Guid.NewGuid().ToString();
        var request = new AssignTourManagerTeamRequest(managerId, new List<AssignmentItem>
        {
            new(Guid.Parse(managerId), null, 1, 1)
        });
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, AssignTourManagerTeamCommand, Success>(
                Error.Validation("TourManagerAssignment.SelfAssignment", "Cannot assign the manager to their own team."),
                BasePath);

        var actionResult = await controller.Assign(request);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status400BadRequest,
            expectedCode: "TourManagerAssignment.SelfAssignment",
            expectedMessage: "Cannot assign the manager to their own team.",
            expectedInstance: BasePath);
    }

    [Fact]
    public async Task Assign_WhenManagerRoleUserAssigned_Returns400()
    {
        var managerId = Guid.NewGuid().ToString();
        var request = new AssignTourManagerTeamRequest(managerId, new List<AssignmentItem>
        {
            new(Guid.NewGuid(), null, 1, 1)
        });
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, AssignTourManagerTeamCommand, Success>(
                Error.Validation("TourManagerAssignment.ManagerCannotBeAssigned", "A user with the Manager role cannot be assigned."),
                BasePath);

        var actionResult = await controller.Assign(request);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status400BadRequest,
            expectedCode: "TourManagerAssignment.ManagerCannotBeAssigned",
            expectedMessage: "A user with the Manager role cannot be assigned.",
            expectedInstance: BasePath);
    }

    #endregion

    #region BulkAssign

    [Fact]
    public async Task BulkAssign_ReplacesAllAssignments_Returns200()
    {
        var managerId = Guid.NewGuid().ToString();
        var request = new BulkAssignRequest(managerId, new List<AssignmentItem>
        {
            new(Guid.NewGuid(), null, 1, 1),
            new(Guid.NewGuid(), null, 2, 2)
        });
        var bulkPath = $"{BasePath}/bulk";
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, BulkAssignTourManagerTeamCommand, Success>(
                Result.Success,
                bulkPath);

        var actionResult = await controller.BulkAssign(request);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: bulkPath,
            expectedData: Result.Success);
        var captured = Assert.IsType<BulkAssignTourManagerTeamCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
        Assert.Equal(2, captured.Assignments.Count);
    }

    [Fact]
    public async Task BulkAssign_WithEmptyList_ClearsAll_Returns200()
    {
        var managerId = Guid.NewGuid().ToString();
        var request = new BulkAssignRequest(managerId, new List<AssignmentItem>());
        var bulkPath = $"{BasePath}/bulk";
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, BulkAssignTourManagerTeamCommand, Success>(
                Result.Success,
                bulkPath);

        var actionResult = await controller.BulkAssign(request);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: bulkPath,
            expectedData: Result.Success);
    }

    #endregion

    #region Remove

    [Fact]
    public async Task Remove_ExistingUserAssignment_Returns204()
    {
        var managerId = Guid.NewGuid();
        var assignedUserId = Guid.NewGuid();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, RemoveTourManagerAssignmentCommand, Success>(
                Result.Success,
                $"{BasePath}/{managerId}");

        var actionResult = await controller.Remove(managerId, assignedUserId, null, 1);

        Assert.IsType<NoContentResult>(actionResult);
        var captured = Assert.IsType<RemoveTourManagerAssignmentCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
        Assert.Equal(assignedUserId, captured.AssignedUserId);
        Assert.Equal(1, captured.AssignedEntityType);
    }

    [Fact]
    public async Task Remove_TourAssignment_Returns204()
    {
        var managerId = Guid.NewGuid();
        var assignedTourId = Guid.NewGuid();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourManagerAssignmentController, RemoveTourManagerAssignmentCommand, Success>(
                Result.Success,
                $"{BasePath}/{managerId}");

        var actionResult = await controller.Remove(managerId, null, assignedTourId, 3);

        Assert.IsType<NoContentResult>(actionResult);
        var captured = Assert.IsType<RemoveTourManagerAssignmentCommand>(probe.CapturedRequest);
        Assert.Equal(managerId, captured.ManagerId);
        Assert.Equal(assignedTourId, captured.AssignedTourId);
        Assert.Equal(3, captured.AssignedEntityType);
    }

    #endregion
}
