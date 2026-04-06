using Api.Controllers.Public;
using Application.Dtos;
using Application.Features.TourRequest.Commands;
using Application.Features.TourRequest.Queries;
using Contracts;
using Contracts.ModelResponse;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

public sealed class PublicTourRequestControllerTests
{
    [Fact]
    public async Task Create_WhenCommandSucceeds_ShouldReturnCreatedResponse()
    {
        var requestId = Guid.CreateVersion7();
        var command = new CreateTourRequestCommand(
            Destination: "Ha Long",
            StartDate: new DateTimeOffset(2026, 4, 10, 0, 0, 0, TimeSpan.Zero),
            EndDate: new DateTimeOffset(2026, 4, 12, 0, 0, 0, TimeSpan.Zero),
            NumberOfParticipants: 3,
            BudgetPerPersonUsd: 250,
            TravelInterests: ["Adventure"]);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PublicTourRequestController, CreateTourRequestCommand, Guid>(
                requestId,
                "/api/public/tour-requests");

        var actionResult = await controller.Create(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status201Created, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<ApiCreatedResponse<Guid>>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status201Created, payload.StatusCode);
        Assert.Equal("/api/public/tour-requests", payload.Instance);
        Assert.Equal(requestId, payload.Data?.Value);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task GetMy_WhenUnauthorized_ShouldReturnUnauthorizedResponse()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<PublicTourRequestController, GetMyTourRequestsQuery, PaginatedList<TourRequestVm>>(
                Error.Unauthorized("User.Unauthorized", "Người dùng chưa đăng nhập"),
                "/api/public/tour-requests/my");

        var actionResult = await controller.GetMy();

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status401Unauthorized,
            expectedCode: "User.Unauthorized",
            expectedMessage: "Người dùng chưa đăng nhập",
            expectedInstance: "/api/public/tour-requests/my");
    }

    [Fact]
    public async Task GetDetail_WhenNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PublicTourRequestController, GetTourRequestDetailQuery, TourRequestDetailDto>(
                Error.NotFound("TourRequest.NotFound", "Yêu cầu tour không tồn tại"),
                $"/api/public/tour-requests/{id}");

        var actionResult = await controller.GetDetail(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "TourRequest.NotFound",
            expectedMessage: "Yêu cầu tour không tồn tại",
            expectedInstance: $"/api/public/tour-requests/{id}");
        Assert.Equal(new GetTourRequestDetailQuery(id, string.Empty), probe.CapturedRequest);
    }
}
