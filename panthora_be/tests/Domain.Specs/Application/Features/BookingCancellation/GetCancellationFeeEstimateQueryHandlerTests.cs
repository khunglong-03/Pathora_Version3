using global::Application.Common.Interfaces;
using global::Application.Features.BookingCancellation.Queries;
using global::Application.Services;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::NSubstitute;
using global::Xunit;
using global::ErrorOr;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Domain.Specs.Application.Features.BookingCancellation.Queries;

public sealed class GetCancellationFeeEstimateQueryHandlerTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly ICancellationPolicyRepository _cancellationPolicyRepository = Substitute.For<ICancellationPolicyRepository>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();
    private readonly IBookingPaidAmountResolver _paidAmountResolver = Substitute.For<IBookingPaidAmountResolver>();
    private readonly ILogger<GetCancellationFeeEstimateQueryHandler> _logger = Substitute.For<ILogger<GetCancellationFeeEstimateQueryHandler>>();

    private GetCancellationFeeEstimateQueryHandler CreateHandler() => new(
        _bookingRepository,
        _cancellationPolicyRepository,
        _currentUser,
        _paidAmountResolver,
        _logger);

    [Fact]
    public async Task Handle_WhenBookingIsPaidAndNoTransactions_ResolvesPaidAmountViaFallback()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        _currentUser.Id.Returns(userId);
        _currentUser.IsInRole(Arg.Any<string>()).Returns(false);

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourName = "Ha Long Bay",
            StartDate = DateTimeOffset.UtcNow.AddDays(5),
            MaxParticipation = 10,
            CurrentParticipation = 3
        };

        var booking = BookingEntity.Create(
            tourInstanceId: tourInstanceId,
            customerName: "Nguyen A",
            customerPhone: "+84912345678",
            numberAdult: 2,
            totalPrice: 7520m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: true,
            performedBy: userId.ToString(),
            userId: userId);

        booking.Id = bookingId;
        booking.Status = BookingStatus.Paid;
        booking.TourInstance = tourInstance;

        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        _paidAmountResolver.ResolveAsync(booking, Arg.Any<CancellationToken>())
            .Returns(7520m); // Fallback applied

        _cancellationPolicyRepository.FindActiveByTourScopeAsync(Arg.Any<TourScope>(), cancellationToken: Arg.Any<CancellationToken>())
            .Returns((CancellationPolicyEntity?)null); // 0% fee

        var query = new GetCancellationFeeEstimateQuery(bookingId);

        // Act
        var result = await CreateHandler().Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(7520m, result.Value.PaidAmount);
        Assert.Equal(7520m, result.Value.RefundAmount);
        Assert.Equal(0, result.Value.FeePercent);
    }
}
