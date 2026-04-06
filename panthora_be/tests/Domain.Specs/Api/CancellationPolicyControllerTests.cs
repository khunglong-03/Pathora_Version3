using Api.Controllers;
using Application.Features.CancellationPolicy.Commands;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class CancellationPolicyControllerTests
{
    [Fact]
    public async Task Delete_WhenPolicyExists_ShouldReturnOkAndPayload()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<CancellationPolicyController, DeleteCancellationPolicyCommand, Guid>(
                id, $"/api/cancellation-policies/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/cancellation-policies/{id}",
            expectedData: id);
        Assert.Equal(new DeleteCancellationPolicyCommand(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task Delete_WhenPolicyNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<CancellationPolicyController, DeleteCancellationPolicyCommand, Guid>(
                Error.NotFound("CancellationPolicy.NotFound", "Không tìm thấy chính sách hủy"),
                $"/api/cancellation-policies/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "CancellationPolicy.NotFound",
            expectedMessage: "Không tìm thấy chính sách hủy",
            expectedInstance: $"/api/cancellation-policies/{id}");
        Assert.Equal(new DeleteCancellationPolicyCommand(id), probe.CapturedRequest);
    }
}
