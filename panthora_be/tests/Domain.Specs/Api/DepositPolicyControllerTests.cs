using Api.Controllers;
using Application.Features.DepositPolicy.Commands;
using Contracts.ModelResponse;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class DepositPolicyControllerTests
{
    [Fact]
    public async Task Delete_WhenPolicyExists_ShouldReturnOkAndPayload()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<DepositPolicyController, DeleteDepositPolicyCommand, Success>(
                Result.Success, $"/api/deposit-policies/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/deposit-policies/{id}",
            expectedData: Result.Success);
        Assert.Equal(new DeleteDepositPolicyCommand(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task Delete_WhenPolicyNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<DepositPolicyController, DeleteDepositPolicyCommand, Success>(
                Error.NotFound("DepositPolicy.NotFound", "Không tìm thấy chính sách đặt cọc"),
                $"/api/deposit-policies/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "DepositPolicy.NotFound",
            expectedMessage: "Không tìm thấy chính sách đặt cọc",
            expectedInstance: $"/api/deposit-policies/{id}");
        Assert.Equal(new DeleteDepositPolicyCommand(id), probe.CapturedRequest);
    }
}
