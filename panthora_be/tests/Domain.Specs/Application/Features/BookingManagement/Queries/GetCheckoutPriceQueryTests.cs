using Application.Features.BookingManagement.Queries;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using NSubstitute;
using Xunit;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Domain.Specs.Application.Features.BookingManagement.Queries;

public sealed class CheckoutPriceQueryTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly ITaxConfigRepository _taxConfigRepository = Substitute.For<ITaxConfigRepository>();
    private readonly IPricingPolicyRepository _pricingPolicyRepository = Substitute.For<IPricingPolicyRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly IDepositPolicyRepository _depositPolicyRepository = Substitute.For<IDepositPolicyRepository>();
    private readonly GetCheckoutPriceQueryHandler _handler;

    public CheckoutPriceQueryTests()
    {
        _handler = new GetCheckoutPriceQueryHandler(
            _bookingRepository,
            _taxConfigRepository,
            _pricingPolicyRepository,
            _tourRepository,
            _depositPolicyRepository);

        // Setup default config mock
        _taxConfigRepository.GetListAsync(Arg.Any<System.Linq.Expressions.Expression<Func<TaxConfigEntity, bool>>>())
            .Returns(new List<TaxConfigEntity>());
        
        _pricingPolicyRepository.GetActivePolicyByTourType(Arg.Any<TourType>())
            .Returns((PricingPolicy?)null);
        _pricingPolicyRepository.GetDefaultPolicy()
            .Returns((PricingPolicy?)null);

        _depositPolicyRepository.GetAllActiveAsync(Arg.Any<CancellationToken>())
            .Returns(new List<DepositPolicyEntity>());
    }

    [Fact]
    public async Task Handle_BookingWithoutVisaFee_ReturnsPriceWithoutVisaFee()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            BasePrice = 10000m,
            TourName = "Test Tour",
            TourCode = "T1",
            StartDate = DateTimeOffset.UtcNow,
            EndDate = DateTimeOffset.UtcNow.AddDays(5)
        };
        var booking = BookingEntity.Create(
            tourInstance.Id, "Customer", "123456", 1, 10000m, PaymentMethod.BankTransfer, false, "TEST");
        booking.TourInstance = tourInstance;

        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        _tourRepository.FindById(tourInstance.TourId, true, Arg.Any<CancellationToken>())
            .Returns(new TourEntity { TourScope = TourScope.Domestic });

        var query = new GetCheckoutPriceQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(10000m, result.Value.TotalPrice);
        Assert.Equal(0m, result.Value.VisaServiceFeeTotal);
        Assert.Equal(7000m, result.Value.RemainingBalance); // 10000 - 3000 deposit (30%)
    }

    [Fact]
    public async Task Handle_BookingWithVisaFee_ReturnsPriceIncludingVisaFee()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            BasePrice = 10000m,
            TourName = "Test Tour",
            TourCode = "T1",
            StartDate = DateTimeOffset.UtcNow,
            EndDate = DateTimeOffset.UtcNow.AddDays(5)
        };
        var booking = BookingEntity.Create(
            tourInstance.Id, "Customer", "123456", 1, 10000m, PaymentMethod.BankTransfer, false, "TEST");
        booking.TourInstance = tourInstance;
        booking.AddVisaServiceFee(2000m, "TEST");

        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        _tourRepository.FindById(tourInstance.TourId, true, Arg.Any<CancellationToken>())
            .Returns(new TourEntity { TourScope = TourScope.Domestic });

        var query = new GetCheckoutPriceQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(12000m, result.Value.TotalPrice); // 10000 subtotal + 2000 visa fee (no tax config mock so 0 tax)
        Assert.Equal(2000m, result.Value.VisaServiceFeeTotal);
        Assert.Equal(8400m, result.Value.RemainingBalance); // 12000 - 3600 deposit (30% of 12000)
    }

    [Fact]
    public async Task Handle_BookingWithDepositAndVisaFeeCompleted_SubtractsBothFromRemainingBalance()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            BasePrice = 10000m,
            TourName = "Test Tour",
            TourCode = "T1",
            StartDate = DateTimeOffset.UtcNow,
            EndDate = DateTimeOffset.UtcNow.AddDays(5)
        };
        var booking = BookingEntity.Create(
            tourInstance.Id, "Customer", "123456", 1, 10000m, PaymentMethod.BankTransfer, false, "TEST");
        booking.TourInstance = tourInstance;
        booking.AddVisaServiceFee(2000m, "TEST");

        // Add completed transactions
        booking.PaymentTransactions = new List<PaymentTransactionEntity>
        {
            new() { Type = TransactionType.Deposit, Status = TransactionStatus.Completed, Amount = 4500m },
            new() { Type = TransactionType.VisaServiceFee, Status = TransactionStatus.Completed, Amount = 2000m }
        };

        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        _tourRepository.FindById(tourInstance.TourId, true, Arg.Any<CancellationToken>())
            .Returns(new TourEntity { TourScope = TourScope.Domestic });

        var query = new GetCheckoutPriceQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(12000m, result.Value.TotalPrice);
        // remaining = 12000 - 4500 (deposit) - 2000 (visa fee) = 5500
        Assert.Equal(5500m, result.Value.RemainingBalance);
    }

    [Fact]
    public async Task Handle_BookingWithOnlyDepositCompleted_RemainingBalanceStillIncludesVisaFee()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            BasePrice = 10000m,
            TourName = "Test Tour",
            TourCode = "T1",
            StartDate = DateTimeOffset.UtcNow,
            EndDate = DateTimeOffset.UtcNow.AddDays(5)
        };
        var booking = BookingEntity.Create(
            tourInstance.Id, "Customer", "123456", 1, 10000m, PaymentMethod.BankTransfer, false, "TEST");
        booking.TourInstance = tourInstance;
        booking.AddVisaServiceFee(2000m, "TEST");

        // Add deposit only
        booking.PaymentTransactions = new List<PaymentTransactionEntity>
        {
            new() { Type = TransactionType.Deposit, Status = TransactionStatus.Completed, Amount = 4500m },
            new() { Type = TransactionType.VisaServiceFee, Status = TransactionStatus.Pending, Amount = 2000m }
        };

        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        _tourRepository.FindById(tourInstance.TourId, true, Arg.Any<CancellationToken>())
            .Returns(new TourEntity { TourScope = TourScope.Domestic });

        var query = new GetCheckoutPriceQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(12000m, result.Value.TotalPrice);
        // remaining = 12000 - 4500 = 7500 (2000 visa fee is still pending/unpaid)
        Assert.Equal(7500m, result.Value.RemainingBalance);
    }
}
