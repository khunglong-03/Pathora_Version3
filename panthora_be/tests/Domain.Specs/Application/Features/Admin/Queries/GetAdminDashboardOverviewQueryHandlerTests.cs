using global::Application.Features.Admin.DTOs;
using global::Application.Features.Admin.Queries.GetAdminDashboardOverview;
using global::Domain.Common.Repositories;
using global::Contracts.ModelResponse;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Queries;

public sealed class GetAdminDashboardOverviewQueryHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly ITourManagerAssignmentRepository _assignmentRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly GetAdminDashboardOverviewQueryHandler _handler;

    public GetAdminDashboardOverviewQueryHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _assignmentRepository = Substitute.For<ITourManagerAssignmentRepository>();
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _handler = new GetAdminDashboardOverviewQueryHandler(
            _userRepository, _assignmentRepository, _supplierRepository);
    }

    [Fact]
    public async Task Handle_ReturnsAggregateKpisAcrossAllSections()
    {
        _userRepository.CountAll(null, (int?)null).Returns(150);
        _userRepository.CountActiveManagersAsync(Arg.Any<CancellationToken>()).Returns(5);
        _supplierRepository.CountActiveTransportProvidersAsync(Arg.Any<CancellationToken>()).Returns(12);
        _supplierRepository.CountActiveHotelProvidersAsync(Arg.Any<CancellationToken>()).Returns(8);
        _assignmentRepository.CountPendingTourRequestsAsync(Arg.Any<CancellationToken>()).Returns(7);
        _assignmentRepository.GetRecentActivityAsync(10, Arg.Any<CancellationToken>())
            .Returns(new List<ActivityItemDto>
            {
                new("UserRegistration", "New user registered", DateTimeOffset.UtcNow.AddMinutes(-30))
            });

        var query = new GetAdminDashboardOverviewQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(150, result.Value.TotalUsers);
        Assert.Equal(5, result.Value.ActiveManagers);
        Assert.Equal(12, result.Value.ActiveTransportProviders);
        Assert.Equal(8, result.Value.ActiveHotelProviders);
        Assert.Equal(7, result.Value.PendingTourRequests);
        Assert.Single(result.Value.RecentActivity);
    }

    [Fact]
    public async Task Handle_NoData_ReturnsZeroValues()
    {
        _userRepository.CountAll(null, (int?)null).Returns(0);
        _userRepository.CountActiveManagersAsync(Arg.Any<CancellationToken>()).Returns(0);
        _supplierRepository.CountActiveTransportProvidersAsync(Arg.Any<CancellationToken>()).Returns(0);
        _supplierRepository.CountActiveHotelProvidersAsync(Arg.Any<CancellationToken>()).Returns(0);
        _assignmentRepository.CountPendingTourRequestsAsync(Arg.Any<CancellationToken>()).Returns(0);
        _assignmentRepository.GetRecentActivityAsync(10, Arg.Any<CancellationToken>())
            .Returns(new List<ActivityItemDto>());

        var query = new GetAdminDashboardOverviewQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(0, result.Value.TotalUsers);
        Assert.Equal(0, result.Value.ActiveManagers);
        Assert.Equal(0, result.Value.ActiveTransportProviders);
        Assert.Equal(0, result.Value.ActiveHotelProviders);
        Assert.Equal(0, result.Value.PendingTourRequests);
        Assert.Empty(result.Value.RecentActivity);
    }

    [Fact]
    public async Task Handle_ReturnsRecentActivityItems()
    {
        var activity1 = new ActivityItemDto(
            "UserRegistration", "New user registered", DateTimeOffset.UtcNow.AddHours(-1));
        var activity2 = new ActivityItemDto(
            "BookingConfirmed", "Booking confirmed", DateTimeOffset.UtcNow.AddMinutes(-45));

        _userRepository.CountAll(null, (int?)null).Returns(10);
        _userRepository.CountActiveManagersAsync(Arg.Any<CancellationToken>()).Returns(0);
        _supplierRepository.CountActiveTransportProvidersAsync(Arg.Any<CancellationToken>()).Returns(0);
        _supplierRepository.CountActiveHotelProvidersAsync(Arg.Any<CancellationToken>()).Returns(0);
        _assignmentRepository.CountPendingTourRequestsAsync(Arg.Any<CancellationToken>()).Returns(0);
        _assignmentRepository.GetRecentActivityAsync(10, Arg.Any<CancellationToken>())
            .Returns(new List<ActivityItemDto> { activity1, activity2 });

        var query = new GetAdminDashboardOverviewQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.RecentActivity.Count);
        Assert.Equal("New user registered", result.Value.RecentActivity[0].Description);
        Assert.Equal("UserRegistration", result.Value.RecentActivity[0].Type);
    }
}
