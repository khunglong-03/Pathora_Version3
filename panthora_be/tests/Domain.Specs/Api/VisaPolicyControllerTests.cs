using Api.Controllers;
using Application.Contracts.VisaPolicy;
using Application.Features.VisaPolicy.Commands;
using Application.Features.VisaPolicy.Queries;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Contracts;

namespace Domain.Specs.Api;

public sealed class VisaPolicyControllerTests
{
    [Fact]
    public async Task GetById_WhenPolicyExists_ShouldReturnOkAndPayload()
    {
        var id = Guid.CreateVersion7();
        var response = new VisaPolicyResponse(
            id,
            "Southeast Asia",
            7,
            2,
            true,
            true,
            false,
            [],
            DateTimeOffset.UtcNow,
            null);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<VisaPolicyController, GetVisaPolicyByIdQuery, VisaPolicyResponse?>(
                response, $"/api/visa-policy/{id}");

        var actionResult = await controller.GetById(id);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/visa-policy/{id}",
            expectedData: response);
        Assert.Equal(new GetVisaPolicyByIdQuery(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task GetById_WhenPolicyNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<VisaPolicyController, GetVisaPolicyByIdQuery, VisaPolicyResponse?>(
                Error.NotFound("VisaPolicy.NotFound", "Không tìm thấy chính sách visa"),
                $"/api/visa-policy/{id}");

        var actionResult = await controller.GetById(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "VisaPolicy.NotFound",
            expectedMessage: "Không tìm thấy chính sách visa",
            expectedInstance: $"/api/visa-policy/{id}");
        Assert.Equal(new GetVisaPolicyByIdQuery(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task Create_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<VisaPolicyController, CreateVisaPolicyCommand, Guid>(
                response, "/api/visa-policy");

        var command = new CreateVisaPolicyCommand(
            "Southeast Asia",
            7,
            2,
            true,
            null);

        var actionResult = await controller.Create(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/visa-policy",
            expectedData: response);
        Assert.NotNull(probe.CapturedRequest);
        Assert.Equal("Southeast Asia", probe.CapturedRequest.Region);
    }

    [Fact]
    public async Task Update_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var policyId = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<VisaPolicyController, UpdateVisaPolicyCommand, Success>(
                Result.Success, "/api/visa-policy");

        var command = new UpdateVisaPolicyCommand(
            policyId,
            "Southeast Asia",
            10,
            3,
            true,
            true,
            null);

        var actionResult = await controller.Update(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/visa-policy",
            expectedData: Result.Success);
        Assert.NotNull(probe.CapturedRequest);
        Assert.Equal(policyId, probe.CapturedRequest.Id);
    }

    [Fact]
    public async Task Delete_WhenPolicyExists_ShouldReturnOkAndPayload()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<VisaPolicyController, DeleteVisaPolicyCommand, Success>(
                Result.Success, $"/api/visa-policy/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/visa-policy/{id}",
            expectedData: Result.Success);
        Assert.Equal(new DeleteVisaPolicyCommand(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task Delete_WhenPolicyNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<VisaPolicyController, DeleteVisaPolicyCommand, Success>(
                Error.NotFound("VisaPolicy.NotFound", "Không tìm thấy chính sách visa"),
                $"/api/visa-policy/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "VisaPolicy.NotFound",
            expectedMessage: "Không tìm thấy chính sách visa",
            expectedInstance: $"/api/visa-policy/{id}");
        Assert.Equal(new DeleteVisaPolicyCommand(id), probe.CapturedRequest);
    }
}
