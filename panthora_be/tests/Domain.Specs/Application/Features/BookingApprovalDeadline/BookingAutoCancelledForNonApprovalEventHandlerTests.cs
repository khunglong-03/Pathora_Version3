using System.Text;
using System.Text.Json;
using Application.Common.Behaviors;
using Application.Features.BookingApprovalDeadline;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Events;
using Domain.Mails;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;
using ZiggyCreatures.Caching.Fusion;

namespace Domain.Specs.Application.Features.BookingApprovalDeadline;

public class BookingAutoCancelledForNonApprovalEventHandlerTests
{
    private readonly IRoomBlockRepository _roomBlockRepository = Substitute.For<IRoomBlockRepository>();
    private readonly IVehicleBlockRepository _vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly IFusionCache _cache = Substitute.For<IFusionCache>();
    private readonly IDistributedCache _distributedCache = Substitute.For<IDistributedCache>();
    private readonly CacheKeyTracker _cacheKeyTracker;
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly IConfiguration _configuration = Substitute.For<IConfiguration>();
    private readonly ILogger<BookingAutoCancelledForNonApprovalEventHandler> _logger = Substitute.For<ILogger<BookingAutoCancelledForNonApprovalEventHandler>>();
    private readonly BookingAutoCancelledForNonApprovalEventHandler _sut;

    public BookingAutoCancelledForNonApprovalEventHandlerTests()
    {
        _cacheKeyTracker = new CacheKeyTracker(_distributedCache);
        _sut = new BookingAutoCancelledForNonApprovalEventHandler(
            _roomBlockRepository,
            _vehicleBlockRepository,
            _mailRepository,
            _cache,
            _cacheKeyTracker,
            _bookingRepository,
            _configuration,
            _logger);
    }

    [Fact]
    public async Task Handle_ShouldReleaseBlocksQueueMailAndInvalidateCaches()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var notification = new BookingAutoCancelledForNonApprovalEvent(
            bookingId,
            BookingStatus.Paid,
            "Booking.AutoCancel.ApprovalDeadlineMissed",
            "system");

        var booking = BookingEntity.Create(
            Guid.NewGuid(), "Test Customer", "+84123456789", 2, 1000000m, PaymentMethod.VnPay, true, "TEST");
        booking.CustomerEmail = "customer@test.com";

        var tourInstance = new TourInstanceEntity
        {
            Id = booking.TourInstanceId,
            TourName = "Test Tour",
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(5),
            Status = TourInstanceStatus.Available
        };
        booking.TourInstance = tourInstance;

        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        // Setup CacheKeyTracker to return some cached booking keys
        var cachedKeys = new HashSet<string> { "Booking:detail:123" };
        var json = JsonSerializer.Serialize(cachedKeys);
        _distributedCache.GetAsync("tracker:Booking", Arg.Any<CancellationToken>())
            .Returns(Encoding.UTF8.GetBytes(json));

        _configuration["Pathora:HotlinePhone"].Returns("1900-1234");

        // Act
        await _sut.Handle(notification, CancellationToken.None);

        // Assert
        // 1. Blocks are deleted
        await _roomBlockRepository.Received(1).DeleteByBookingAsync(bookingId, Arg.Any<CancellationToken>());
        await _vehicleBlockRepository.Received(1).DeleteByBookingAsync(bookingId, Arg.Any<CancellationToken>());

        // 2. Email is queued
        await _mailRepository.Received(1).Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>());

        // 3. Cache keys are invalidated and removed from tracker
        await _cache.Received(1).RemoveAsync("Booking:detail:123", token: Arg.Any<CancellationToken>());
        await _distributedCache.Received(1).RemoveAsync("tracker:Booking", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenBlockDeletionThrows_ShouldStillQueueMailAndInvalidateCaches()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var notification = new BookingAutoCancelledForNonApprovalEvent(
            bookingId,
            BookingStatus.Paid,
            "Booking.AutoCancel.ApprovalDeadlineMissed",
            "system");

        var booking = BookingEntity.Create(
            Guid.NewGuid(), "Test Customer", "+84123456789", 2, 1000000m, PaymentMethod.VnPay, true, "TEST");
        booking.CustomerEmail = "customer@test.com";

        var tourInstance = new TourInstanceEntity
        {
            Id = booking.TourInstanceId,
            TourName = "Test Tour",
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(5),
            Status = TourInstanceStatus.Available
        };
        booking.TourInstance = tourInstance;

        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        // Simulate failure during block deletion
        _roomBlockRepository.When(x => x.DeleteByBookingAsync(bookingId, Arg.Any<CancellationToken>()))
            .Do(_ => throw new InvalidOperationException("DB Failure"));

        var cachedKeys = new HashSet<string> { "Booking:detail:123" };
        var json = JsonSerializer.Serialize(cachedKeys);
        _distributedCache.GetAsync("tracker:Booking", Arg.Any<CancellationToken>())
            .Returns(Encoding.UTF8.GetBytes(json));

        // Act
        await _sut.Handle(notification, CancellationToken.None);

        // Assert
        // Deletion failure was logged and did not prevent subsequent steps:
        await _vehicleBlockRepository.Received(1).DeleteByBookingAsync(bookingId, Arg.Any<CancellationToken>());
        await _mailRepository.Received(1).Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>());
        await _cache.Received(1).RemoveAsync("Booking:detail:123", token: Arg.Any<CancellationToken>());
    }
}
