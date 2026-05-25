using Application.Common.Interfaces;
using Application.Common.Pricing;
using Application.Features.BookingManagement.Queries.GetBookingDetail;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement.Queries;

public sealed class GetBookingDetailQueryHandlerTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly IBookingCancellationRequestRepository _cancellationRequestRepository = Substitute.For<IBookingCancellationRequestRepository>();
    private readonly IPricingPolicyRepository _pricingPolicyRepository = Substitute.For<IPricingPolicyRepository>();
    private readonly ITaxConfigRepository _taxConfigRepository = Substitute.For<ITaxConfigRepository>();
    private readonly IBookingPriceCalculator _priceCalculator = Substitute.For<IBookingPriceCalculator>();
    private readonly ITourInstanceBookingTicketRepository _ticketRepository = Substitute.For<ITourInstanceBookingTicketRepository>();
    private readonly ITourInstanceBookingRoomAssignmentRepository _roomAssignmentRepository = Substitute.For<ITourInstanceBookingRoomAssignmentRepository>();
    private readonly ITourDayActivityStatusRepository _dayActivityStatusRepository = Substitute.For<ITourDayActivityStatusRepository>();
    private readonly ITicketImageRepository _ticketImageRepository = Substitute.For<ITicketImageRepository>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();
    private readonly GetBookingDetailQueryHandler _handler;

    public GetBookingDetailQueryHandlerTests()
    {
        _handler = new GetBookingDetailQueryHandler(
            _bookingRepository,
            _cancellationRequestRepository,
            _pricingPolicyRepository,
            _taxConfigRepository,
            _priceCalculator,
            _ticketRepository,
            _roomAssignmentRepository,
            _dayActivityStatusRepository,
            _ticketImageRepository,
            _currentUser);

        // Setup default mock for price calculator
        _priceCalculator.Calculate(Arg.Any<BookingEntity>(), Arg.Any<TourInstanceEntity>(), Arg.Any<IReadOnlyList<global::Domain.ValueObjects.PricingPolicyTier>>(), Arg.Any<TaxConfigEntity>(), Arg.Any<decimal>())
            .Returns(new BookingPriceBreakdown(
                AdultUnitPrice: 500_000m,
                ChildUnitPrice: 300_000m,
                InfantUnitPrice: 0m,
                AdultSubtotal: 1_000_000m,
                ChildSubtotal: 0m,
                InfantSubtotal: 0m,
                Subtotal: 1_000_000m,
                TaxRate: 0.1m,
                TaxAmount: 100_000m,
                VisaServiceFeeTotal: 0m,
                TotalAmount: 1_100_000m,
                PaidAmount: 1_100_000m,
                RemainingBalance: 0m
            ));
    }

    [Fact]
    public async Task Handle_BookingExistsAndPaid_ReturnsBookingWithTicketsRoomsAndStatuses()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        var booking = BookingEntity.Create(
            tourInstanceId, "Test Customer", "+84123456789", 2, 1000000m, PaymentMethod.VnPay, true, "TEST");
        booking.UserId = userId;
        booking.Id = bookingId;

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourName = "Test Tour",
            StartDate = DateTimeOffset.UtcNow.AddDays(10),
            EndDate = DateTimeOffset.UtcNow.AddDays(15),
            Status = TourInstanceStatus.Available
        };
        booking.TourInstance = tourInstance;

        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        _currentUser.Id.Returns(userId);
        _currentUser.IsInRole(Arg.Any<string>()).Returns(false);

        var tickets = new List<TourInstanceBookingTicketEntity>
        {
            TourInstanceBookingTicketEntity.Create(Guid.NewGuid(), bookingId, "VN123", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddHours(2), "12A", "PNR123", "Economy", "Note", "SYSTEM")
        };
        _ticketRepository.GetByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(tickets);

        var roomAssignments = new List<TourInstanceBookingRoomAssignmentEntity>
        {
            TourInstanceBookingRoomAssignmentEntity.Create(Guid.NewGuid(), bookingId, RoomType.Double, 1, "202", "Note", "SYSTEM")
        };
        _roomAssignmentRepository.GetByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(roomAssignments);

        var dayStatuses = new List<TourDayActivityStatusEntity>
        {
            TourDayActivityStatusEntity.Create(bookingId, Guid.NewGuid(), "SYSTEM")
        };
        _dayActivityStatusRepository.GetByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(dayStatuses);

        var ticketImages = new List<TicketImageEntity>
        {
            TicketImageEntity.Create(Guid.NewGuid(), new ImageEntity { PublicURL = "http://test.com/image.png" }, "SYSTEM", bookingId, "REF123", "Note")
        };
        _ticketImageRepository.GetByBookingIdAsync(bookingId, tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(ticketImages);

        _cancellationRequestRepository.GetByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingCancellationRequestEntity>());

        var query = new GetBookingDetailQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var dto = result.Value;
        Assert.Equal(bookingId, dto.Id);

        Assert.Single(dto.Tickets);
        Assert.Equal("VN123", dto.Tickets[0].FlightNumber);

        Assert.Single(dto.RoomAssignments);
        Assert.Equal("Double", dto.RoomAssignments[0].RoomType);
        Assert.Equal("202", dto.RoomAssignments[0].RoomNumbers);

        Assert.Single(dto.DayStatuses);
        Assert.Equal("NotStarted", dto.DayStatuses[0].ActivityStatus);

        Assert.Single(dto.TicketImages);
        Assert.Equal("http://test.com/image.png", dto.TicketImages[0].PublicUrl);
    }
}
