using Api.Controllers;
using Application.Contracts.PricingPolicy;
using Application.Features.PricingPolicy.Commands;
using Application.Features.PricingPolicy.Queries;
using Domain.Enums;
using Domain.ValueObjects;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Contracts;

namespace Domain.Specs.Api;

public sealed class PricingPolicyControllerTests
{
    [Fact]
    public async Task GetAll_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var policies = new List<PricingPolicyResponse>
        {
            new(
                Guid.CreateVersion7(),
                "PP-001",
                "Gia Niem Y",
                TourType.Public,
                "Công khai",
                PricingPolicyStatus.Active,
                "Hoạt động",
                false,
                [],
                [],
                DateTimeOffset.UtcNow,
                null)
        };
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PricingPolicyController, GetAllPricingPoliciesQuery, List<PricingPolicyResponse>>(
                policies, "/api/pricing-policies");

        var actionResult = await controller.GetAll();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/pricing-policies",
            expectedData: policies);
        Assert.Equal(new GetAllPricingPoliciesQuery(), probe.CapturedRequest);
    }

    [Fact]
    public async Task GetById_WhenPolicyExists_ShouldReturnOkAndPayload()
    {
        var id = Guid.CreateVersion7();
        var response = new PricingPolicyResponse(
            id,
            "PP-001",
            "Gia Niem Y",
            TourType.Public,
            "Công khai",
            PricingPolicyStatus.Active,
            "Hoạt động",
            false,
            [],
            [],
            DateTimeOffset.UtcNow,
            null);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PricingPolicyController, GetPricingPolicyByIdQuery, PricingPolicyResponse>(
                response, $"/api/pricing-policies/{id}");

        var actionResult = await controller.GetById(id);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/pricing-policies/{id}",
            expectedData: response);
        Assert.Equal(new GetPricingPolicyByIdQuery(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task GetById_WhenPolicyNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PricingPolicyController, GetPricingPolicyByIdQuery, PricingPolicyResponse>(
                Error.NotFound("PricingPolicy.NotFound", "Không tìm thấy chính sách giá"),
                $"/api/pricing-policies/{id}");

        var actionResult = await controller.GetById(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "PricingPolicy.NotFound",
            expectedMessage: "Không tìm thấy chính sách giá",
            expectedInstance: $"/api/pricing-policies/{id}");
        Assert.Equal(new GetPricingPolicyByIdQuery(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task Create_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PricingPolicyController, CreatePricingPolicyCommand, Guid>(
                response, "/api/pricing-policies");

        var command = new CreatePricingPolicyCommand(
            "Gia Niem Y",
            TourType.Public,
            [new PricingPolicyTier { Label = "Group", AgeFrom = 10, AgeTo = 5, PricePercentage = 100 }],
            false);

        var actionResult = await controller.Create(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/pricing-policies",
            expectedData: response);
        Assert.NotNull(probe.CapturedRequest);
        Assert.Equal("Gia Niem Y", probe.CapturedRequest.Name);
    }

    [Fact]
    public async Task Update_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var policyId = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PricingPolicyController, UpdatePricingPolicyCommand, Success>(
                Result.Success, "/api/pricing-policies");

        var command = new UpdatePricingPolicyCommand(
            policyId,
            "Gia Niem Y Cap Nhat",
            TourType.Public,
            [new PricingPolicyTier { Label = "Group", AgeFrom = 10, AgeTo = 5, PricePercentage = 100 }],
            PricingPolicyStatus.Active,
            null);

        var actionResult = await controller.Update(command);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/pricing-policies",
            expectedData: Result.Success);
        Assert.NotNull(probe.CapturedRequest);
        Assert.Equal(policyId, probe.CapturedRequest.Id);
    }

    [Fact]
    public async Task Delete_WhenPolicyExists_ShouldReturnOkAndPayload()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PricingPolicyController, DeletePricingPolicyCommand, Success>(
                Result.Success, $"/api/pricing-policies/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/pricing-policies/{id}",
            expectedData: Result.Success);
        Assert.Equal(new DeletePricingPolicyCommand(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task Delete_WhenPolicyNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PricingPolicyController, DeletePricingPolicyCommand, Success>(
                Error.NotFound("PricingPolicy.NotFound", "Không tìm thấy chính sách giá"),
                $"/api/pricing-policies/{id}");

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "PricingPolicy.NotFound",
            expectedMessage: "Không tìm thấy chính sách giá",
            expectedInstance: $"/api/pricing-policies/{id}");
        Assert.Equal(new DeletePricingPolicyCommand(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task SetAsDefault_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PricingPolicyController, SetDefaultPricingPolicyCommand, Success>(
                Result.Success, "/api/pricing-policies/set-default");

        var actionResult = await controller.SetAsDefault(id);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/pricing-policies/set-default",
            expectedData: Result.Success);
        Assert.Equal(new SetDefaultPricingPolicyCommand(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task SetAsDefault_WhenPolicyNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PricingPolicyController, SetDefaultPricingPolicyCommand, Success>(
                Error.NotFound("PricingPolicy.NotFound", "Không tìm thấy chính sách giá"),
                "/api/pricing-policies/set-default");

        var actionResult = await controller.SetAsDefault(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "PricingPolicy.NotFound",
            expectedMessage: "Không tìm thấy chính sách giá",
            expectedInstance: "/api/pricing-policies/set-default");
        Assert.Equal(new SetDefaultPricingPolicyCommand(id), probe.CapturedRequest);
    }
}
