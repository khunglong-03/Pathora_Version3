namespace Domain.Specs.Application.Features.TransportProvider.Drivers.Queries;

using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using NSubstitute;
using global::Application.Features.TransportProvider.Drivers.Queries;
using Xunit;

public sealed class GetDriverActivitiesQueryHandlerTests
{
    private readonly ITourDayActivityRouteTransportRepository _repository;
    private readonly IDriverRepository _driverRepository;
    private readonly GetDriverActivitiesQueryHandler _handler;

    public GetDriverActivitiesQueryHandlerTests()
    {
        _repository = Substitute.For<ITourDayActivityRouteTransportRepository>();
        _driverRepository = Substitute.For<IDriverRepository>();
        _handler = new GetDriverActivitiesQueryHandler(_repository, _driverRepository);
    }

    [Fact]
    public async Task Handle_DriverNotFound_ReturnsNotFoundError()
    {
        // Arrange
        var providerId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var query = new GetDriverActivitiesQuery(providerId, driverId);

        _driverRepository.FindByIdAndUserIdAsync(driverId, providerId, Arg.Any<CancellationToken>())
            .Returns((DriverEntity?)null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal("Driver.NotFound", result.Errors[0].Code);
    }

    [Fact]
    public async Task Handle_ValidDriver_ReturnsActivities()
    {
        // Arrange
        var providerId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var query = new GetDriverActivitiesQuery(providerId, driverId);

        var driver = new DriverEntity { Id = driverId, UserId = providerId };
        _driverRepository.FindByIdAndUserIdAsync(driverId, providerId, Arg.Any<CancellationToken>())
            .Returns(driver);

        var activityId = Guid.NewGuid();
        var activities = new List<TourDayActivityRouteTransportEntity>
        {
            new TourDayActivityRouteTransportEntity
            {
                Id = activityId,
                DriverId = driverId,
                BookingActivityReservation = new BookingActivityReservationEntity { Title = "Test Booking" },
                TourDayActivity = new TourDayActivityEntity { Title = "Test Activity" },
                Status = 1,
                UpdatedOnUtc = DateTimeOffset.UtcNow
            }
        };

        _repository.CountByDriverIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns(1);
        _repository.FindByDriverIdPaginatedAsync(driverId, 1, 50, Arg.Any<CancellationToken>())
            .Returns(activities);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        var item = result.Value.Items[0];
        Assert.Equal("Test Booking", item.BookingTitle);
        Assert.Equal("Test Activity", item.ActivityTitle);
        Assert.Equal(1, item.Status);
    }

    [Fact]
    public async Task Handle_Pagination_AppliesParameters()
    {
        // Arrange
        var providerId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var query = new GetDriverActivitiesQuery(providerId, driverId, 2, 10);

        var driver = new DriverEntity { Id = driverId, UserId = providerId };
        _driverRepository.FindByIdAndUserIdAsync(driverId, providerId, Arg.Any<CancellationToken>())
            .Returns(driver);

        _repository.CountByDriverIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns(25);
        _repository.FindByDriverIdPaginatedAsync(driverId, 2, 10, Arg.Any<CancellationToken>())
            .Returns(new List<TourDayActivityRouteTransportEntity>());

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.PageNumber);
        Assert.Equal(10, result.Value.PageSize);
        Assert.Equal(25, result.Value.Total);
        await _repository.Received(1).FindByDriverIdPaginatedAsync(driverId, 2, 10, Arg.Any<CancellationToken>());
    }
}
