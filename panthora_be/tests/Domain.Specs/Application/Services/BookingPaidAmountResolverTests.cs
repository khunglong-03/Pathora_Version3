using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Services;

public sealed class BookingPaidAmountResolverTests
{
    private readonly IDepositPolicyRepository _depositPolicyRepository;
    private readonly ILogger<BookingPaidAmountResolver> _logger;
    private readonly BookingPaidAmountResolver _resolver;

    public BookingPaidAmountResolverTests()
    {
        _depositPolicyRepository = Substitute.For<IDepositPolicyRepository>();
        _logger = Substitute.For<ILogger<BookingPaidAmountResolver>>();
        _resolver = new BookingPaidAmountResolver(_depositPolicyRepository, _logger);
    }

    [Fact]
    public async Task ResolveAsync_WhenSumGreaterThanZero_ShouldReturnSumWithoutLoggingWarning()
    {
        // Arrange
        var booking = BookingEntity.Create(Guid.NewGuid(), "Customer", "123", 1, 10000m, PaymentMethod.BankTransfer, true, "TEST");
        var tx = PaymentTransactionEntity.Create(booking.Id, "TX1", TransactionType.Deposit, 3000m, PaymentMethod.BankTransfer, "Note", "TEST");
        tx.MarkAsPaid(3000m, DateTimeOffset.UtcNow);
        booking.PaymentTransactions = new List<PaymentTransactionEntity> { tx };

        // Act
        var result = await _resolver.ResolveAsync(booking, CancellationToken.None);

        // Assert
        result.Should().Be(3000m);
        // Verify no warning logs were generated
        _logger.DidNotReceiveWithAnyArgs().Log(default, default, default, default, default!);
    }

    [Fact]
    public async Task ResolveAsync_WhenSumIsZeroAndStatusIsPending_ShouldReturnZeroWithoutLoggingWarning()
    {
        // Arrange
        var booking = BookingEntity.Create(Guid.NewGuid(), "Customer", "123", 1, 10000m, PaymentMethod.BankTransfer, true, "TEST");
        booking.Status = BookingStatus.Pending;

        // Act
        var result = await _resolver.ResolveAsync(booking, CancellationToken.None);

        // Assert
        result.Should().Be(0m);
        _logger.DidNotReceiveWithAnyArgs().Log(default, default, default, default, default!);
    }

    [Fact]
    public async Task ResolveAsync_WhenSumIsZeroAndStatusIsConfirmed_ShouldReturnZeroWithoutLoggingWarning()
    {
        // Arrange
        var booking = BookingEntity.Create(Guid.NewGuid(), "Customer", "123", 1, 10000m, PaymentMethod.BankTransfer, true, "TEST");
        booking.Status = BookingStatus.Confirmed;

        // Act
        var result = await _resolver.ResolveAsync(booking, CancellationToken.None);

        // Assert
        result.Should().Be(0m);
        _logger.DidNotReceiveWithAnyArgs().Log(default, default, default, default, default!);
    }

    [Fact]
    public async Task ResolveAsync_WhenSumIsZeroAndStatusIsPaid_ShouldReturnTotalPriceAndLogWarning()
    {
        // Arrange
        var booking = BookingEntity.Create(Guid.NewGuid(), "Customer", "123", 1, 7520m, PaymentMethod.BankTransfer, true, "TEST");
        booking.Status = BookingStatus.Paid;

        // Act
        var result = await _resolver.ResolveAsync(booking, CancellationToken.None);

        // Assert
        result.Should().Be(7520m);
        // Verify warning log was called
        _logger.Received(1).Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Is<object>(v => v.ToString()!.Contains("Falling back to 7520")),
            null,
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task ResolveAsync_WhenSumIsZeroAndStatusIsDepositedWithActivePolicy_ShouldReturnPercentageAndLogWarning()
    {
        // Arrange
        var tour = new TourEntity { Id = Guid.NewGuid(), TourName = "Test Tour", TourScope = TourScope.Domestic };
        var tourInstance = TourInstanceEntity.Create(tour.Id, Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "TEST");
        tourInstance.Tour = tour;

        var booking = BookingEntity.Create(tourInstance.Id, "Customer", "123", 1, 10000m, PaymentMethod.BankTransfer, false, "TEST");
        booking.TourInstance = tourInstance;
        booking.Status = BookingStatus.Deposited;

        var activePolicy = new DepositPolicyEntity
        {
            Id = Guid.NewGuid(),
            TourScope = TourScope.Domestic,
            DepositType = DepositType.Percentage,
            DepositValue = 30m,
            IsActive = true
        };

        _depositPolicyRepository.GetAllActiveAsync(Arg.Any<CancellationToken>())
            .Returns(new List<DepositPolicyEntity> { activePolicy });

        // Act
        var result = await _resolver.ResolveAsync(booking, CancellationToken.None);

        // Assert
        result.Should().Be(3000m);
        _logger.Received(1).Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Is<object>(v => v.ToString()!.Contains("Falling back to 3000")),
            null,
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task ResolveAsync_WhenSumIsZeroAndStatusIsDepositedWithoutActivePolicy_ShouldReturnFiftyPercentAndLogWarnings()
    {
        // Arrange
        var tour = new TourEntity { Id = Guid.NewGuid(), TourName = "Test Tour", TourScope = TourScope.Domestic };
        var tourInstance = TourInstanceEntity.Create(tour.Id, Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "TEST");
        tourInstance.Tour = tour;

        var booking = BookingEntity.Create(tourInstance.Id, "Customer", "123", 1, 10000m, PaymentMethod.BankTransfer, false, "TEST");
        booking.TourInstance = tourInstance;
        booking.Status = BookingStatus.Deposited;

        _depositPolicyRepository.GetAllActiveAsync(Arg.Any<CancellationToken>())
            .Returns(new List<DepositPolicyEntity>()); // No policies

        // Act
        var result = await _resolver.ResolveAsync(booking, CancellationToken.None);

        // Assert
        result.Should().Be(5000m);
        // Verify both warnings were logged
        _logger.Received(2).Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Any<object>(),
            null,
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task ResolveAsync_WhenSumIsZeroAndStatusIsCancelled_ShouldReturnZeroAndLogInconsistencyWarning()
    {
        // Arrange
        var booking = BookingEntity.Create(Guid.NewGuid(), "Customer", "123", 1, 10000m, PaymentMethod.BankTransfer, true, "TEST");
        booking.Status = BookingStatus.Cancelled;

        // Act
        var result = await _resolver.ResolveAsync(booking, CancellationToken.None);

        // Assert
        result.Should().Be(0m);
        _logger.Received(1).Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Is<object>(v => v.ToString()!.Contains("No fallback applied for this status")),
            null,
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task ResolveAsync_WithMixedPaymentsAndDepositsSum_ShouldReturnCorrectTotal()
    {
        // Arrange
        var booking = BookingEntity.Create(Guid.NewGuid(), "Customer", "123", 1, 10000m, PaymentMethod.BankTransfer, false, "TEST");

        var tx = PaymentTransactionEntity.Create(booking.Id, "TX1", TransactionType.Deposit, 1500m, PaymentMethod.BankTransfer, "Note", "TEST");
        tx.MarkAsPaid(1500m, DateTimeOffset.UtcNow);

        var deposit = CustomerDepositEntity.Create(booking.Id, 1, 2000m, DateTimeOffset.UtcNow.AddDays(7), "TEST");
        deposit.MarkPaid("TEST");
        var payment = CustomerPaymentEntity.Create(booking.Id, 500m, PaymentMethod.BankTransfer, DateTimeOffset.UtcNow, "TEST");

        booking.PaymentTransactions = new List<PaymentTransactionEntity> { tx };
        booking.Deposits = new List<CustomerDepositEntity> { deposit };
        booking.Payments = new List<CustomerPaymentEntity> { payment };

        // Act
        var result = await _resolver.ResolveAsync(booking, CancellationToken.None);

        // Assert
        result.Should().Be(4000m); // 1500 + 2000 + 500 = 4000
    }
}
