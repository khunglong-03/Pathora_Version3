using Api.Controllers;
using Application.Features.TaxConfig.Commands;
using Contracts.ModelResponse;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class TaxConfigControllerTests
{
    [Fact]
    public async Task Delete_WhenConfigExists_ShouldReturnOkAndPayload()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TaxConfigController, DeleteTaxConfigCommand, Success>(
                Result.Success, $"/api/tax-configs/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/tax-configs/{id}",
            expectedData: Result.Success);
        Assert.Equal(new DeleteTaxConfigCommand(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task Delete_WhenConfigNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TaxConfigController, DeleteTaxConfigCommand, Success>(
                Error.NotFound("TaxConfig.NotFound", "Không tìm thấy cấu hình thuế"),
                $"/api/tax-configs/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "TaxConfig.NotFound",
            expectedMessage: "Không tìm thấy cấu hình thuế",
            expectedInstance: $"/api/tax-configs/{id}");
        Assert.Equal(new DeleteTaxConfigCommand(id), probe.CapturedRequest);
    }
}
