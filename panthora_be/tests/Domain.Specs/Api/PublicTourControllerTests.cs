using Api.Controllers.Public;
using Application.Dtos;
using Application.Features.Public.Queries;
using Contracts.Interfaces;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class PublicTourControllerTests
{
    [Fact]
    public async Task GetTourDetail_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var id = Guid.CreateVersion7();
        var tourDto = new TourDto
        {
            Id = id,
            TourCode = "TOUR-001",
            TourName = "Paris Tour",
            ShortDescription = "Short desc",
            LongDescription = "Long desc",
            Status = TourStatus.Active,
            TourScope = TourScope.Domestic,
            CustomerSegment = CustomerSegment.Group,
            SEOTitle = null,
            SEODescription = null,
            IsDeleted = false,
            Thumbnail = new ImageDto(null, null, null, null),
            Images = [],
            Classifications = [],
            CreatedBy = "tester",
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedBy = "tester",
            LastModifiedOnUtc = DateTimeOffset.UtcNow,
            PricingPolicyId = null,
            DepositPolicyId = null,
            CancellationPolicyId = null,
            VisaPolicyId = null,
            Translations = null,
            Services = null
        };

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PublicTourController, GetPublicTourDetailQuery, TourDto>(
                tourDto, $"/api/public/tours/{id}");
        var languageContext = new TestLanguageContext { CurrentLanguage = "vi" };

        var actionResult = await controller.GetTourDetail(id, languageContext);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/public/tours/{id}",
            expectedData: tourDto);
        Assert.Equal(new GetPublicTourDetailQuery(id, "vi"), probe.CapturedRequest);
    }

    [Fact]
    public async Task GetTourDetail_WhenTourNotFound_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PublicTourController, GetPublicTourDetailQuery, TourDto>(
                Error.NotFound("Tour.NotFound", "Tour không tìm thấy"),
                $"/api/public/tours/{id}");
        var languageContext = new TestLanguageContext { CurrentLanguage = "en" };

        var actionResult = await controller.GetTourDetail(id, languageContext);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "Tour.NotFound",
            expectedMessage: "Tour không tìm thấy",
            expectedInstance: $"/api/public/tours/{id}");
        Assert.Equal(new GetPublicTourDetailQuery(id, "en"), probe.CapturedRequest);
    }

    private sealed class TestLanguageContext : ILanguageContext
    {
        public string CurrentLanguage { get; set; } = ILanguageContext.DefaultLanguage;
    }
}
