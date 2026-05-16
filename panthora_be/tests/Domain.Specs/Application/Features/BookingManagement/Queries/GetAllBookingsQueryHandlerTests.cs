using Application.Features.BookingManagement.Queries;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement.Queries;

public sealed class GetAllBookingsQueryHandlerTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly GetAllBookingsQueryHandler _handler;

    public GetAllBookingsQueryHandlerTests()
    {
        _handler = new GetAllBookingsQueryHandler(_bookingRepository);
    }

    [Fact]
    public async Task Handle_WithRefundStatusFilter_PassesFilterToRepository()
    {
        // Arrange
        var bookings = new List<BookingEntity>
        {
            CreateCancelledBooking(RefundStatus.Pending, 10_000_000m)
        };
        _bookingRepository.GetAllPagedAsync(1, 20, RefundStatus.Pending, Arg.Any<CancellationToken>())
            .Returns((bookings, 1));

        var query = new GetAllBookingsQuery(Page: 1, PageSize: 20, RefundStatus: RefundStatus.Pending);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        Assert.Equal("Pending", result.Value.Items[0].RefundStatus);
        await _bookingRepository.Received().GetAllPagedAsync(1, 20, RefundStatus.Pending, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithRefundStatusPending_ReturnsOnlyPendingBookings()
    {
        // Arrange
        var pendingBooking = CreateCancelledBooking(RefundStatus.Pending, 5_000_000m);
        var refundedBooking = CreateCancelledBooking(RefundStatus.Refunded, 3_000_000m);

        // When filtering by Pending, repo returns only pending
        _bookingRepository.GetAllPagedAsync(1, 20, RefundStatus.Pending, Arg.Any<CancellationToken>())
            .Returns((new List<BookingEntity> { pendingBooking }, 1));

        var query = new GetAllBookingsQuery(Page: 1, PageSize: 20, RefundStatus: RefundStatus.Pending);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        Assert.Equal("Pending", result.Value.Items[0].RefundStatus);
        Assert.Equal(3_500_000m, result.Value.Items[0].RefundOutstandingAmount); // 5M * 0.7
    }

    [Fact]
    public async Task Handle_WithoutRefundStatusFilter_ReturnsAllBookings()
    {
        // Arrange
        var bookings = new List<BookingEntity>
        {
            CreateCancelledBooking(RefundStatus.Pending, 1_000_000m),
            CreateCancelledBooking(RefundStatus.Contacted, 2_000_000m),
            CreateCancelledBooking(RefundStatus.Refunded, 3_000_000m)
        };
        _bookingRepository.GetAllPagedAsync(1, 20, null, Arg.Any<CancellationToken>())
            .Returns((bookings, 3));

        var query = new GetAllBookingsQuery(Page: 1, PageSize: 20);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(3, result.Value.Items.Count);
        await _bookingRepository.Received().GetAllPagedAsync(1, 20, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithManagerId_UsesManagerScopedQuery()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        var bookings = new List<BookingEntity>
        {
            CreateCancelledBooking(RefundStatus.Pending, 1_000_000m)
        };
        _bookingRepository.GetPagedForManagerAsync(managerId, 1, 20, RefundStatus.Pending, Arg.Any<CancellationToken>())
            .Returns((bookings, 1));

        var query = new GetAllBookingsQuery(Page: 1, PageSize: 20, ManagerId: managerId, RefundStatus: RefundStatus.Pending);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        await _bookingRepository.Received().GetPagedForManagerAsync(managerId, 1, 20, RefundStatus.Pending, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_NoResults_ReturnsEmptyList()
    {
        // Arrange
        _bookingRepository.GetAllPagedAsync(1, 20, RefundStatus.Pending, Arg.Any<CancellationToken>())
            .Returns((new List<BookingEntity>(), 0));

        var query = new GetAllBookingsQuery(Page: 1, PageSize: 20, RefundStatus: RefundStatus.Pending);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Empty(result.Value.Items);
        Assert.Equal(0, result.Value.TotalCount);
    }

    [Fact]
    public async Task Handle_IncludesCustomerContactInfo()
    {
        // Arrange
        var booking = CreateCancelledBooking(RefundStatus.Pending, 1_000_000m);
        _bookingRepository.GetAllPagedAsync(1, 20, null, Arg.Any<CancellationToken>())
            .Returns((new List<BookingEntity> { booking }, 1));

        var query = new GetAllBookingsQuery(Page: 1, PageSize: 20);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal("+84123456789", result.Value.Items[0].CustomerPhone);
        Assert.Equal("test@example.com", result.Value.Items[0].CustomerEmail);
    }

    private static BookingEntity CreateCancelledBooking(RefundStatus refundStatus, decimal paidAmount)
    {
        var booking = BookingEntity.Create(
            Guid.NewGuid(), "Test Customer", "+84123456789", 2, 1000000m, PaymentMethod.VnPay, true, "TEST");
        booking.CustomerEmail = "test@example.com";

        // Set up TourInstance navigation property (handler accesses b.TourInstance.TourName)
        var tourInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourName = "Test Tour Instance"
        };
        booking.TourInstance = tourInstance;

        booking.Cancel("Test cancel", "MANAGER");
        booking.InitializeRefundTracking(paidAmount, "MANAGER");

        if (refundStatus == RefundStatus.Contacted)
        {
            booking.MarkRefundContacted("MANAGER");
        }
        else if (refundStatus == RefundStatus.Refunded)
        {
            booking.MarkRefundContacted("MANAGER");
            booking.MarkRefundCompleted("MANAGER");
        }

        return booking;
    }
}
