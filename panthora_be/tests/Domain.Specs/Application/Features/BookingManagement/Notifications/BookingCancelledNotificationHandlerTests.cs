using Application.Features.BookingManagement.Notifications;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Events;
using Domain.Mails;
using Domain.UnitOfWork;
using Microsoft.Extensions.Logging;
using NSubstitute;
using ErrorOr;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement.Notifications;

public sealed class BookingCancelledNotificationHandlerTests
{
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly ILogger<BookingCancelledNotificationHandler> _logger = Substitute.For<ILogger<BookingCancelledNotificationHandler>>();
    private readonly BookingCancelledNotificationHandler _handler;

    public BookingCancelledNotificationHandlerTests()
    {
        _handler = new BookingCancelledNotificationHandler(_mailRepository, _bookingRepository, _logger);
    }

    [Fact]
    public async Task Handle_FiresEmail_WhenEmailPresent()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = CreateCancelledBooking(bookingId, "customer@test.com", 5_000_000m);
        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);

        var notification = new BookingStatusChangedEvent(bookingId, BookingStatus.Confirmed, BookingStatus.Cancelled, "MANAGER");

        // Act
        await _handler.Handle(notification, CancellationToken.None);

        // Assert
        await _mailRepository.Received().Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SkipsSilent_WhenEmailNull()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = CreateCancelledBooking(bookingId, null, 0m);
        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);

        var notification = new BookingStatusChangedEvent(bookingId, BookingStatus.Confirmed, BookingStatus.Cancelled, "MANAGER");

        // Act
        await _handler.Handle(notification, CancellationToken.None);

        // Assert
        await _mailRepository.DidNotReceive().Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SkipsSilent_WhenEmailWhitespace()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = CreateCancelledBooking(bookingId, "   ", 0m);
        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);

        var notification = new BookingStatusChangedEvent(bookingId, BookingStatus.Confirmed, BookingStatus.Cancelled, "MANAGER");

        // Act
        await _handler.Handle(notification, CancellationToken.None);

        // Assert
        await _mailRepository.DidNotReceive().Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_MailFails_LogsWarningNoThrow()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = CreateCancelledBooking(bookingId, "customer@test.com", 5_000_000m);
        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);
        _mailRepository.Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromException<ErrorOr<Success>>(new Exception("Mail server down")));

        var notification = new BookingStatusChangedEvent(bookingId, BookingStatus.Confirmed, BookingStatus.Cancelled, "MANAGER");

        // Act & Assert: should not throw
        await _handler.Handle(notification, CancellationToken.None);

        // Verify warning was logged
        _logger.Received().Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Any<object>(),
            Arg.Any<Exception>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task Handle_NonCancelledStatus_NoOp()
    {
        // Arrange
        var notification = new BookingStatusChangedEvent(Guid.NewGuid(), BookingStatus.Pending, BookingStatus.Confirmed, "MANAGER");

        // Act
        await _handler.Handle(notification, CancellationToken.None);

        // Assert
        await _bookingRepository.DidNotReceive().GetByIdWithDetailsAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await _mailRepository.DidNotReceive().Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CustomerInitiatedCancel_NoOp()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var notification = new BookingStatusChangedEvent(bookingId, BookingStatus.Confirmed, BookingStatus.Cancelled, "CUSTOMER");

        // Act
        await _handler.Handle(notification, CancellationToken.None);

        // Assert
        await _bookingRepository.DidNotReceive().GetByIdWithDetailsAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SystemInitiatedCancel_NoOp()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var notification = new BookingStatusChangedEvent(bookingId, BookingStatus.Confirmed, BookingStatus.Cancelled, "SYSTEM");

        // Act
        await _handler.Handle(notification, CancellationToken.None);

        // Assert
        await _bookingRepository.DidNotReceive().GetByIdWithDetailsAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_OldStatusPendingCancellation_NoOp()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var notification = new BookingStatusChangedEvent(bookingId, BookingStatus.PendingCancellation, BookingStatus.Cancelled, "MANAGER");

        // Act
        await _handler.Handle(notification, CancellationToken.None);

        // Assert
        await _bookingRepository.DidNotReceive().GetByIdWithDetailsAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await _mailRepository.DidNotReceive().Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>());
    }

    private static BookingEntity CreateCancelledBooking(Guid id, string? email, decimal refundAmount)
    {
        var booking = BookingEntity.Create(
            Guid.NewGuid(), "Test Customer", "+84123456789", 2, 1000000m, PaymentMethod.VnPay, true, "TEST");
        typeof(BookingEntity).GetProperty(nameof(BookingEntity.Id))!.SetValue(booking, id);
        booking.CustomerEmail = email;
        booking.Cancel("Test cancel", "MANAGER");
        if (refundAmount > 0)
        {
            booking.InitializeRefundTracking(refundAmount, "MANAGER");
        }

        // Set up TourInstance
        booking.TourInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourName = "Test Tour Instance"
        };

        return booking;
    }
}
