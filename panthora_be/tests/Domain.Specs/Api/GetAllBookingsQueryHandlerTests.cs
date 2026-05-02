using global::Application.Contracts.Booking;
using global::Application.Features.BookingManagement.Queries;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using ErrorOr;
using NSubstitute;

namespace Domain.Specs.Api;

public sealed class GetAllBookingsQueryHandlerTests
{
    private readonly IBookingRepository _bookingRepository;
    private readonly GetAllBookingsQueryHandler _handler;

    public GetAllBookingsQueryHandlerTests()
    {
        _bookingRepository = Substitute.For<IBookingRepository>();
        _handler = new GetAllBookingsQueryHandler(_bookingRepository);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsBookings_ShouldReturnMappedResult()
    {
        var bookingId = Guid.CreateVersion7();
        var tourInstanceId = Guid.CreateVersion7();
        var booking = new BookingEntity
        {
            Id = bookingId,
            TourInstanceId = tourInstanceId,
            CustomerName = "Nguyen Van A",
            TotalPrice = 5000m,
            Status = BookingStatus.Confirmed,
            BookingDate = DateTimeOffset.UtcNow,
            TourInstance = new TourInstanceEntity
            {
                Id = tourInstanceId,
                TourName = "Ha Long Bay Tour",
                StartDate = DateTimeOffset.UtcNow.AddDays(7)
            }
        };
        _bookingRepository.GetAllPagedAsync(1, 20)
            .Returns((new List<BookingEntity> { booking }, 1));

        var result = await _handler.Handle(new GetAllBookingsQuery(), CancellationToken.None);

        var listResult = Assert.IsType<ErrorOr<AdminBookingListResult>>(result);
        Assert.False(listResult.IsError);
        Assert.NotNull(listResult.Value);

        var item = Assert.Single(listResult.Value.Items);
        Assert.Equal(bookingId, item.Id);
        Assert.Equal("Nguyen Van A", item.CustomerName);
        Assert.Equal("Ha Long Bay Tour", item.TourName);
        Assert.Equal(5000m, item.TotalPrice);
        Assert.Equal("Confirmed", item.Status);
        Assert.Equal(1, listResult.Value.TotalCount);
    }

    [Fact]
    public async Task Handle_WhenManagerIdIsProvided_ShouldReturnManagerScopedBookings()
    {
        var managerId = Guid.CreateVersion7();
        _bookingRepository.GetPagedForManagerAsync(managerId, 2, 10)
            .Returns((new List<BookingEntity>(), 0));

        var result = await _handler.Handle(
            new GetAllBookingsQuery(Page: 2, PageSize: 10, ManagerId: managerId),
            CancellationToken.None);

        var listResult = Assert.IsType<ErrorOr<AdminBookingListResult>>(result);
        Assert.False(listResult.IsError);
        Assert.Empty(listResult.Value.Items);

        await _bookingRepository.Received(1).GetPagedForManagerAsync(managerId, 2, 10);
        await _bookingRepository.DidNotReceive().GetAllPagedAsync(Arg.Any<int>(), Arg.Any<int>());
    }

    [Fact]
    public async Task Handle_WhenPageSizeExceeds100_ShouldCapTo100()
    {
        _bookingRepository.GetAllPagedAsync(1, 100)
            .Returns((new List<BookingEntity>(), 0));

        await _handler.Handle(new GetAllBookingsQuery(Page: 1, PageSize: 500), CancellationToken.None);

        await _bookingRepository.Received(1).GetAllPagedAsync(1, 100);
    }

    [Fact]
    public async Task Handle_WhenPageIsLessThan1_ShouldDefaultToPage1()
    {
        _bookingRepository.GetAllPagedAsync(1, 20)
            .Returns((new List<BookingEntity>(), 0));

        await _handler.Handle(new GetAllBookingsQuery(Page: 0, PageSize: 20), CancellationToken.None);

        await _bookingRepository.Received(1).GetAllPagedAsync(1, 20);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsEmpty_ShouldReturnEmptyItemsWithZeroCount()
    {
        _bookingRepository.GetAllPagedAsync(1, 20)
            .Returns((new List<BookingEntity>(), 0));

        var result = await _handler.Handle(new GetAllBookingsQuery(), CancellationToken.None);

        var listResult = Assert.IsType<ErrorOr<AdminBookingListResult>>(result);
        Assert.Empty(listResult.Value.Items);
        Assert.Equal(0, listResult.Value.TotalCount);
    }
}
