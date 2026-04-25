using global::Api.Controllers;
using global::Application.Dtos;
using global::Application.Features.TourRequest.Commands;
using global::Application.Features.TourRequest.Queries;
using Contracts;
using global::Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class TourRequestControllerTests
{
    [Fact]
    public async Task GetAll_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var vm = new TourRequestVm(
            Guid.CreateVersion7(),
            "Ha Long",
            new DateTimeOffset(2026, 4, 10, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 4, 12, 0, 0, 0, TimeSpan.Zero),
            3,
            250,
            ["Adventure"],
            "Pending",
            DateTimeOffset.UtcNow,
            null,
            null);
        var response = new PaginatedList<TourRequestVm>(1, [vm], 1, 10);

        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourRequestController, GetAllTourRequestsQuery, PaginatedList<TourRequestVm>>(
                response,
                "/api/tour-requests");

        var actionResult = await controller.GetAll(null, null, null, null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/tour-requests",
            expectedData: response);
    }

    [Fact]
    public async Task GetAll_WhenForbidden_ShouldReturnForbiddenResponse()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourRequestController, GetAllTourRequestsQuery, PaginatedList<TourRequestVm>>(
                Error.Forbidden("TourRequest.AdminOnly", "Chỉ quản trị viên mới có quyền thực hiện thao tác này"),
                "/api/tour-requests");

        var actionResult = await controller.GetAll(null, null, null, null);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status403Forbidden,
            expectedCode: "TourRequest.AdminOnly",
            expectedMessage: "Chỉ quản trị viên mới có quyền thực hiện thao tác này",
            expectedInstance: "/api/tour-requests");
    }

    [Fact]
    public async Task GetDetail_WhenNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourRequestController, GetTourRequestDetailQuery, TourRequestDetailDto>(
                Error.NotFound("TourRequest.NotFound", "Yêu cầu tour không tồn tại"),
                $"/api/tour-requests/{id}");

        var actionResult = await controller.GetDetail(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "TourRequest.NotFound",
            expectedMessage: "Yêu cầu tour không tồn tại",
            expectedInstance: $"/api/tour-requests/{id}");
    }

    [Fact]
    public async Task Review_WhenValidationFails_ShouldReturnBadRequestResponse()
    {
        var id = Guid.CreateVersion7();
        var request = new ReviewTourRequestRequest(TourRequestStatus.Approved, "ok");
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourRequestController, ReviewTourRequestCommand, Success>(
                Error.Validation("TourRequest.InvalidStatusTransition", "Không thể chuyển trạng thái yêu cầu tour"),
                $"/api/tour-requests/{id}/review");

        var actionResult = await controller.Review(id, request);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status400BadRequest,
            expectedCode: "TourRequest.InvalidStatusTransition",
            expectedMessage: "Không thể chuyển trạng thái yêu cầu tour",
            expectedInstance: $"/api/tour-requests/{id}/review");
    }
}
