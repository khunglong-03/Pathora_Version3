using global::Application.Features.Admin.Queries;
using global::Domain.Common.Repositories;
using global::Domain.Reports;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Queries;

public sealed class GetAdminOverviewQueryHandlerTests
{
    private readonly IAdminOverviewRepository _adminOverviewRepository;
    private readonly GetAdminOverviewQueryHandler _handler;

    public GetAdminOverviewQueryHandlerTests()
    {
        _adminOverviewRepository = Substitute.For<IAdminOverviewRepository>();
        _handler = new GetAdminOverviewQueryHandler(_adminOverviewRepository);
    }

    [Fact]
    public async Task Handle_WithoutManagerId_CallsGetOverviewWithNull()
    {
        var expectedReport = new AdminOverviewReport(
            Stats: new AdminDashboardStatsReport(0, 0, 0, 0, 0, 0),
            Customers: [],
            Payments: [],
            Insurances: [],
            VisaApplications: []
        );

        _adminOverviewRepository.GetOverview(null, Arg.Any<CancellationToken>())
            .Returns(expectedReport);

        var query = new GetAdminOverviewQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(expectedReport, result.Value);
        await _adminOverviewRepository.Received(1).GetOverview(null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithManagerId_CallsGetOverviewWithManagerId()
    {
        var managerId = Guid.NewGuid();
        var expectedReport = new AdminOverviewReport(
            Stats: new AdminDashboardStatsReport(0, 0, 0, 0, 0, 0),
            Customers: [],
            Payments: [],
            Insurances: [],
            VisaApplications: []
        );

        _adminOverviewRepository.GetOverview(managerId, Arg.Any<CancellationToken>())
            .Returns(expectedReport);

        var query = new GetAdminOverviewQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(expectedReport, result.Value);
        await _adminOverviewRepository.Received(1).GetOverview(managerId, Arg.Any<CancellationToken>());
    }
}
