using global::Api.Controllers.Public;
using global::Application.Contracts.Public;
using global::Application.Features.Public.Queries;
using Contracts;
using Contracts.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class PublicHomeControllerTests
{
    [Fact]
    public async Task SearchTours_WhenQuerySucceeds_ShouldForwardLanguageToQuery()
    {
        var vm = new SearchTourVm(
            Guid.CreateVersion7(),
            "Ha Long Tour",
            "https://img",
            "Short desc",
            "Ha Long",
            3,
            1000m,
            "Standard",
            null);

        var response = new PaginatedList<SearchTourVm>(1, [vm], 1, 10);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<PublicHomeController, SearchToursQuery, PaginatedList<SearchTourVm>>(
                response,
                "/api/public/tours/search");
        var languageContext = new TestLanguageContext { CurrentLanguage = "en" };

        var actionResult = await controller.SearchTours(
            q: "ha long",
            destination: null,
            classification: null,
            date: null,
            people: null,
            minPrice: null,
            maxPrice: null,
            minDays: null,
            maxDays: null,
            page: 1,
            pageSize: 10,
            languageContext);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/public/tours/search",
            expectedData: response);

        Assert.Equal(
            new SearchToursQuery("ha long", null, null, null, null, null, null, null, null, 1, 10, "en"),
            probe.CapturedRequest);
    }

    private sealed class TestLanguageContext : ILanguageContext
    {
        public string CurrentLanguage { get; set; } = ILanguageContext.DefaultLanguage;
    }
}
