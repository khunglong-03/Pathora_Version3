using global::Api.Controllers.Public;
using global::Application.Dtos;
using global::Application.Features.Public.Queries;
using Contracts;
using Contracts.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class PublicTourInstanceControllerTests
{
    [Fact]
    public async Task GetAvailable_WhenQuerySucceeds_ShouldReturnOkAndForwardLanguage()
    {
        var vm = new TourInstanceVm(
            Id: Guid.CreateVersion7(),
            TourId: Guid.CreateVersion7(),
            TourInstanceCode: "TI-001",
            Title: "Tour title",
            TourName: "Tour name",
            TourCode: "TOUR-001",
            ClassificationName: "VIP",
            Location: "Ha Long",
            Thumbnail: null,
            Images: [],
            StartDate: DateTimeOffset.UtcNow,
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            DurationDays: 4,
            CurrentParticipation: 2,
            MaxParticipation: 20,
            BasePrice: 1000m,
            Status: "Available",
            WantsCustomization: false,
            CustomizationNotes: null,
            InstanceType: "Public");

        var response = new PaginatedList<TourInstanceVm>(1, [vm], 1, 10);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PublicTourInstanceController, GetPublicTourInstancesQuery, PaginatedList<TourInstanceVm>>(
                response,
                "/api/public/tour-instances/available");
        var languageContext = new TestLanguageContext { CurrentLanguage = "en" };

        var actionResult = await controller.GetAvailable("ha", null, 2, 5, null, languageContext);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/public/tour-instances/available",
            expectedData: response);
        Assert.Equal(new GetPublicTourInstancesQuery("ha", null, 2, 5, "en", null), probe.CapturedRequest);
    }

    [Fact]
    public async Task GetDetail_WhenQuerySucceeds_ShouldReturnOkAndForwardLanguage()
    {
        var id = Guid.CreateVersion7();
        var dto = new TourInstanceDto(
            Id: id,
            TourId: Guid.CreateVersion7(),
            TourInstanceCode: "TI-001",
            Title: "Tour title",
            TourName: "Tour name",
            TourCode: "TOUR-001",
            ClassificationId: Guid.CreateVersion7(),
            ClassificationName: "VIP",
            Location: "Ha Long",
            Thumbnail: null,
            Images: [],
            StartDate: DateTimeOffset.UtcNow,
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            DurationDays: 4,
            CurrentParticipation: 2,
            MaxParticipation: 20,
            BasePrice: 1000m,
            Status: "Available",
            InstanceType: "Public",
            CancellationReason: null,
            Rating: 0,
            TotalBookings: 0,
            Revenue: 0,
            ConfirmationDeadline: null,
            Managers: [],
            IncludedServices: [],
            PricingPolicy: null,
            CancellationPolicy: null,
            DepositPolicy: null,
            FinalSellPrice: null,
            WantsCustomization: false,
            CustomizationNotes: null,
            Days: null);

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PublicTourInstanceController, GetPublicTourInstanceDetailQuery, TourInstanceDto>(
                dto,
                $"/api/public/tour-instances/{id}");
        var languageContext = new TestLanguageContext { CurrentLanguage = "vi" };

        var actionResult = await controller.GetDetail(id, languageContext);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/public/tour-instances/{id}",
            expectedData: dto);
        Assert.Equal(new GetPublicTourInstanceDetailQuery(id, "vi"), probe.CapturedRequest);
    }

    private sealed class TestLanguageContext : ILanguageContext
    {
        public string CurrentLanguage { get; set; } = ILanguageContext.DefaultLanguage;
    }
}
