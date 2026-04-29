using global::Api.Controllers.Public;
using global::Application.Contracts.Booking;
using global::Application.Dtos;
using global::Application.Features.Public.Commands;
using global::Application.Features.Public.Queries;
using Contracts.Interfaces;
using global::Domain.Enums;
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

    [Fact]
    public async Task RequestPrivateTour_WhenCommandSucceeds_ShouldReturnCreated()
    {
        var tourId = Guid.CreateVersion7();
        var classificationId = Guid.CreateVersion7();
        var bookingId = Guid.CreateVersion7();
        var instanceId = Guid.CreateVersion7();
        var start = DateTimeOffset.UtcNow.AddDays(3);
        var end = DateTimeOffset.UtcNow.AddDays(6);

        var checkout = new CheckoutPriceResponse(
            bookingId,
            instanceId,
            "T",
            "C",
            null,
            start,
            end,
            4,
            null,
            2,
            0,
            0,
            1000m,
            500m,
            0m,
            2000m,
            0m,
            0m,
            2000m,
            0m,
            0m,
            2000m,
            100m,
            2000m,
            0m);

        var path = $"/api/public/tours/{tourId}/request-private";
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PublicTourController, RequestPublicPrivateTourCommand, CheckoutPriceResponse>(
                checkout,
                path);

        var body = new RequestPublicPrivateTourRequestDto(
            classificationId,
            start,
            end,
            8,
            "Nguyen",
            "+84 912345678",
            null,
            2,
            0,
            0,
            PaymentMethod.BankTransfer,
            true);

        var actionResult = await controller.RequestPrivateTour(tourId, body);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status201Created,
            expectedInstance: path,
            expectedData: checkout,
            expectedMessage: "Tạo thành công");

        var expectedCommand = new RequestPublicPrivateTourCommand(
            tourId,
            classificationId,
            start,
            end,
            8,
            "Nguyen",
            "+84 912345678",
            null,
            2,
            0,
            0,
            PaymentMethod.BankTransfer,
            true);
        Assert.Equal(expectedCommand, probe.CapturedRequest);
    }

    private sealed class TestLanguageContext : ILanguageContext
    {
        public string CurrentLanguage { get; set; } = ILanguageContext.DefaultLanguage;
    }
}
