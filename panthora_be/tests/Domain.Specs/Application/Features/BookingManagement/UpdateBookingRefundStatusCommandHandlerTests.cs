using Application.Common.Constant;
using Application.Features.BookingManagement;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement;

public sealed class UpdateBookingRefundStatusCommandHandlerTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly UpdateBookingRefundStatusCommandHandler _handler;

    public UpdateBookingRefundStatusCommandHandlerTests()
    {
        _handler = new UpdateBookingRefundStatusCommandHandler(_bookingRepository, _user, _unitOfWork);
    }

    [Fact]
    public async Task Handle_SkipStepTransition_PendingToRefunded_RejectsWithInvalidTransition()
    {
        // Arrange: booking is Cancelled with RefundStatus = Pending
        var bookingId = Guid.NewGuid();
        var booking = CreateCancelledBooking(bookingId, RefundStatus.Pending);
        _bookingRepository.GetByIdAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);
        _user.Id.Returns("MANAGER_ID");

        // Act: try to skip from Pending directly to Refunded
        var command = new UpdateBookingRefundStatusCommand(bookingId, RefundStatus.Refunded);
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert: should reject with invalid transition error
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be(ErrorConstants.Booking.InvalidRefundStatusTransitionCode);
        await _bookingRepository.DidNotReceive().UpdateAsync(Arg.Any<BookingEntity>(), Arg.Any<CancellationToken>());
        await _unitOfWork.DidNotReceive().SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_BookingNotCancelled_RejectsWithOnlyForCancelled()
    {
        // Arrange: booking is Confirmed (not Cancelled)
        var bookingId = Guid.NewGuid();
        var booking = CreateBooking(bookingId, BookingStatus.Confirmed);
        _bookingRepository.GetByIdAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);
        _user.Id.Returns("MANAGER_ID");

        // Act
        var command = new UpdateBookingRefundStatusCommand(bookingId, RefundStatus.Contacted);
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be(ErrorConstants.Booking.RefundStatusOnlyForCancelledCode);
    }

    [Fact]
    public async Task Handle_PendingToContacted_Succeeds()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = CreateCancelledBooking(bookingId, RefundStatus.Pending);
        _bookingRepository.GetByIdAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);
        _user.Id.Returns("MANAGER_ID");

        // Act
        var command = new UpdateBookingRefundStatusCommand(bookingId, RefundStatus.Contacted);
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(Result.Success);
        booking.RefundStatus.Should().Be(RefundStatus.Contacted);
        booking.RefundContactedAt.Should().NotBeNull();
        await _bookingRepository.Received().UpdateAsync(booking, Arg.Any<CancellationToken>());
        await _unitOfWork.Received().SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ContactedToRefunded_Succeeds()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = CreateCancelledBooking(bookingId, RefundStatus.Contacted);
        _bookingRepository.GetByIdAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);
        _user.Id.Returns("MANAGER_ID");

        // Act
        var command = new UpdateBookingRefundStatusCommand(bookingId, RefundStatus.Refunded);
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        booking.RefundStatus.Should().Be(RefundStatus.Refunded);
        booking.RefundCompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_SetsTimestampAndLastModifiedBy()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = CreateCancelledBooking(bookingId, RefundStatus.Pending);
        _bookingRepository.GetByIdAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);
        _user.Id.Returns("TEST_USER_123");

        // Act
        var command = new UpdateBookingRefundStatusCommand(bookingId, RefundStatus.Contacted);
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        booking.LastModifiedBy.Should().Be("TEST_USER_123");
        booking.RefundContactedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_BookingNotFound_ReturnsNotFound()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        _bookingRepository.GetByIdAsync(bookingId, Arg.Any<CancellationToken>()).Returns((BookingEntity?)null);
        _user.Id.Returns("MANAGER_ID");

        // Act
        var command = new UpdateBookingRefundStatusCommand(bookingId, RefundStatus.Contacted);
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be(ErrorConstants.Booking.NotFoundCode);
    }

    private static BookingEntity CreateBooking(Guid id, BookingStatus status)
    {
        var booking = BookingEntity.Create(
            Guid.NewGuid(), "Test Customer", "+84123456789", 2, 1000000m, PaymentMethod.VnPay, true, "TEST");
        typeof(BookingEntity).GetProperty(nameof(BookingEntity.Id))!.SetValue(booking, id);
        if (status != BookingStatus.Pending)
        {
            booking.Status = status;
        }
        return booking;
    }

    private static BookingEntity CreateCancelledBooking(Guid id, RefundStatus refundStatus)
    {
        var booking = BookingEntity.Create(
            Guid.NewGuid(), "Test Customer", "+84123456789", 2, 1000000m, PaymentMethod.VnPay, true, "TEST");
        typeof(BookingEntity).GetProperty(nameof(BookingEntity.Id))!.SetValue(booking, id);

        // Cancel first (transitions from Pending to Cancelled)
        booking.Cancel("Test cancel", "MANAGER");
        booking.InitializeRefundTracking(10_000_000m, "MANAGER");

        if (refundStatus == RefundStatus.Contacted)
        {
            booking.MarkRefundContacted("MANAGER");
        }

        return booking;
    }
}
