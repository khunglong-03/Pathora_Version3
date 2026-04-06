using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

/// <summary>
/// InsuranceController does not exist in the codebase.
/// This test file serves as a placeholder until the controller is implemented.
/// All tests are marked as skip until the controller is available.
/// </summary>
public sealed class InsuranceControllerTests
{
    // InsuranceController is not yet implemented in the codebase.
    // The controller file does not exist at src/Api/Controllers/InsuranceController.cs
    // and there is no corresponding Application/Features/Insurance/ folder.
    //
    // Once InsuranceController is implemented, the following tests should be added:
    //
    // - GetAllInsurancesQuery -> GET /api/insurance
    // - Any additional CRUD endpoints (GetById, Create, Update, Delete)
    //
    // Example test pattern (for reference only):
    //
    // [Fact]
    // public async Task GetAll_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    // {
    //     var response = new List<InsuranceResponse> { ... }.AsReadOnly();
    //     var (controller, probe) = ApiControllerTestHelper
    //         .BuildController<InsuranceController, GetAllInsurancesQuery, IReadOnlyList<InsuranceResponse>>(
    //             response, "/api/insurance");
    //
    //     var actionResult = await controller.GetAll();
    //
    //     ApiControllerTestHelper.AssertSuccessResponse(
    //         actionResult,
    //         expectedStatusCode: StatusCodes.Status200OK,
    //         expectedInstance: "/api/insurance",
    //         expectedData: response);
    //     Assert.Equal(new GetAllInsurancesQuery(), probe.CapturedRequest);
    // }
}
