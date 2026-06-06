using Application.Common.Pricing;
using Application.Contracts.Booking;
using Application.Features.BookingManagement.Handlers;
using Application.Features.BookingManagement.Queries;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement.Queries;

public sealed class GetBookingsByTourInstanceQueryTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IPricingPolicyRepository _pricingPolicyRepository = Substitute.For<IPricingPolicyRepository>();
    private readonly ITaxConfigRepository _taxConfigRepository = Substitute.For<ITaxConfigRepository>();
    private readonly IBookingPriceCalculator _priceCalculator = Substitute.For<IBookingPriceCalculator>();
    private readonly GetBookingsByTourInstanceQueryHandler _handler;

    public GetBookingsByTourInstanceQueryTests()
    {
        _handler = new GetBookingsByTourInstanceQueryHandler(
            _bookingRepository,
            _tourInstanceRepository,
            _tourRepository,
            _user,
            _pricingPolicyRepository,
            _taxConfigRepository,
            _priceCalculator);

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
    public async Task Handle_TourGuideAssigned_ReturnsOnlyConfirmedPaidDepositedBookings()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var guideUserId = Guid.NewGuid();

        _user.Id.Returns(guideUserId.ToString());
        _user.Roles.Returns(new List<string> { "TourGuide" });

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourId = Guid.NewGuid(),
            TourName = "Test Tour",
            StartDate = DateTimeOffset.UtcNow.AddDays(5),
            EndDate = DateTimeOffset.UtcNow.AddDays(10),
            Status = TourInstanceStatus.Confirmed
        };

        _tourInstanceRepository.FindById(tourInstanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        _tourInstanceRepository.HasGuideAssignmentAsync(tourInstanceId, guideUserId, Arg.Any<CancellationToken>())
            .Returns(true);

        var booking1 = BookingEntity.Create(tourInstanceId, "Jane Doe", "+84987654321", 2, 2000000m, PaymentMethod.Momo, true, "TEST");
        booking1.Id = Guid.NewGuid();
        booking1.Status = BookingStatus.Confirmed;
        booking1.TourInstance = tourInstance;

        var booking2 = BookingEntity.Create(tourInstanceId, "John Smith", "+84987654322", 1, 1000000m, PaymentMethod.BankTransfer, true, "TEST");
        booking2.Id = Guid.NewGuid();
        booking2.Status = BookingStatus.Paid;
        booking2.TourInstance = tourInstance;

        var booking3 = BookingEntity.Create(tourInstanceId, "Alice Brown", "+84987654323", 1, 1000000m, PaymentMethod.VnPay, true, "TEST");
        booking3.Id = Guid.NewGuid();
        booking3.Status = BookingStatus.Deposited;
        booking3.TourInstance = tourInstance;

        var booking4 = BookingEntity.Create(tourInstanceId, "Bob Green", "+84987654324", 1, 1000000m, PaymentMethod.Momo, true, "TEST");
        booking4.Id = Guid.NewGuid();
        booking4.Status = BookingStatus.Cancelled;
        booking4.TourInstance = tourInstance;

        _bookingRepository.GetByTourInstanceIdAsync(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking1, booking2, booking3, booking4 });

        _taxConfigRepository.GetListAsync(Arg.Any<System.Linq.Expressions.Expression<Func<TaxConfigEntity, bool>>>(), cancellationToken: Arg.Any<CancellationToken>())
            .Returns(new List<TaxConfigEntity>());

        var query = new GetBookingsByTourInstanceQuery(tourInstanceId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(3, result.Value.Count);
        Assert.Contains(result.Value, b => b.Id == booking1.Id && b.Status == "Confirmed");
        Assert.Contains(result.Value, b => b.Id == booking2.Id && b.Status == "Paid");
        Assert.Contains(result.Value, b => b.Id == booking3.Id && b.Status == "Deposited");
        Assert.DoesNotContain(result.Value, b => b.Id == booking4.Id);
    }

    [Fact]
    public async Task Handle_TourGuideNotAssigned_ReturnsNotFound()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var guideUserId = Guid.NewGuid();

        _user.Id.Returns(guideUserId.ToString());
        _user.Roles.Returns(new List<string> { "TourGuide" });

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourId = Guid.NewGuid(),
            TourName = "Test Tour",
            StartDate = DateTimeOffset.UtcNow.AddDays(5),
            EndDate = DateTimeOffset.UtcNow.AddDays(10),
            Status = TourInstanceStatus.Confirmed
        };

        _tourInstanceRepository.FindById(tourInstanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        _tourInstanceRepository.HasGuideAssignmentAsync(tourInstanceId, guideUserId, Arg.Any<CancellationToken>())
            .Returns(false);

        var query = new GetBookingsByTourInstanceQuery(tourInstanceId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
    }
}
