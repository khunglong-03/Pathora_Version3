using global::Application.Common.Interfaces;
using Contracts.Interfaces;
using global::Application.Features.TourInstance.Commands;
using global::Application.Services;
using AutoMapper;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Services;

public class TourInstanceServiceCascadeCancelTests
{
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly ITourRequestRepository _tourRequestRepository = Substitute.For<ITourRequestRepository>();
    private readonly ISupplierRepository _supplierRepository = Substitute.For<ISupplierRepository>();
    private readonly IVehicleRepository _vehicleRepository = Substitute.For<IVehicleRepository>();
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly IRoomBlockRepository _roomBlockRepository = Substitute.For<IRoomBlockRepository>();
    private readonly IHotelRoomInventoryRepository _hotelRoomInventoryRepository = Substitute.For<IHotelRoomInventoryRepository>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IMapper _mapper = Substitute.For<IMapper>();
    private readonly ILogger<TourInstanceService> _logger = Substitute.For<ILogger<TourInstanceService>>();
    private readonly ICloudinaryService _cloudinaryService = Substitute.For<ICloudinaryService>();
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly IPaymentTransactionRepository _paymentTransactionRepository = Substitute.For<IPaymentTransactionRepository>();
    private readonly IBookingCancellationRequestRepository _bookingCancellationRequestRepository = Substitute.For<IBookingCancellationRequestRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    private readonly TourInstanceService _sut;

    public TourInstanceServiceCascadeCancelTests()
    {
        _user.Id.Returns(Guid.NewGuid().ToString());
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);
        // Configure ExecuteTransactionAsync to actually invoke the callback
        _unitOfWork.ExecuteTransactionAsync(
            Arg.Any<System.Data.IsolationLevel>(),
            Arg.Any<Func<Task>>())
            .Returns(call =>
            {
                var action = call.Arg<Func<Task>>();
                return action();
            });

        _sut = new TourInstanceService(
            _tourInstanceRepository,
            _tourRepository,
            _tourRequestRepository,
            _supplierRepository,
            _vehicleRepository,
            _mailRepository,
            _roomBlockRepository,
            _hotelRoomInventoryRepository,
            _user,
            _mapper,
            _logger,
            _cloudinaryService,
            bookingRepository: _bookingRepository,
            unitOfWork: _unitOfWork,
            paymentTransactionRepository: _paymentTransactionRepository,
            bookingCancellationRequestRepository: _bookingCancellationRequestRepository);
    }

    [Fact]
    public async Task ChangeStatus_InstanceInProgress_ReturnsCannotCancelAfterStart_NoCascade()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.InProgress);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstance.CannotCancelAfterStart");
        await _bookingRepository.DidNotReceive().GetByTourInstanceIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ChangeStatus_InstanceCompleted_ReturnsCannotCancelAfterStart()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Completed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstance.CannotCancelAfterStart");
    }

    [Fact]
    public async Task CascadeCancel_SkipsCompletedBookings_Idempotent()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var completedBooking = CreateBooking(BookingStatus.Completed);
        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { completedBooking });

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(BookingStatus.Completed, completedBooking.Status);
    }

    [Fact]
    public async Task CascadeCancel_SkipsAlreadyCancelledBookings_NoDoubleEvent()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var cancelledBooking = CreateBooking(BookingStatus.Cancelled);
        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { cancelledBooking });

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        await _bookingRepository.DidNotReceive().UpdateAsync(cancelledBooking, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CascadeCancel_FlipsAllActiveBookings()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var pendingBooking = CreateBooking(BookingStatus.Pending);
        var confirmedBooking = CreateBooking(BookingStatus.Confirmed);
        var depositedBooking = CreateBooking(BookingStatus.Deposited);
        var paidBooking = CreateBooking(BookingStatus.Paid);

        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { pendingBooking, confirmedBooking, depositedBooking, paidBooking });
        _paymentTransactionRepository.GetByBookingIdListAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new List<PaymentTransactionEntity>());

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(BookingStatus.Cancelled, pendingBooking.Status);
        Assert.Equal(BookingStatus.Cancelled, confirmedBooking.Status);
        Assert.Equal(BookingStatus.Cancelled, depositedBooking.Status);
        Assert.Equal(BookingStatus.Cancelled, paidBooking.Status);
    }

    [Fact]
    public async Task CascadeCancel_BookingPendingZeroPaid_SetsRefundNotApplicable()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var booking = CreateBooking(BookingStatus.Pending);
        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });
        _paymentTransactionRepository.GetByBookingIdListAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(new List<PaymentTransactionEntity>());

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.Equal(RefundStatus.NotApplicable, booking.RefundStatus);
        Assert.Null(booking.RefundOutstandingAmount);
    }

    [Fact]
    public async Task CascadeCancel_BookingPaid_SetsRefundPending_70Percent()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var booking = CreateBooking(BookingStatus.Paid);
        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        var paymentTx = new PaymentTransactionEntity
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Amount = 10_000_000m,
            PaidAmount = 10_000_000m,
            Type = TransactionType.FullPayment,
            Status = TransactionStatus.Completed
        };
        _paymentTransactionRepository.GetByBookingIdListAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(new List<PaymentTransactionEntity> { paymentTx });

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.Equal(RefundStatus.Pending, booking.RefundStatus);
        Assert.Equal(7_000_000m, booking.RefundOutstandingAmount);
    }

    [Fact]
    public async Task CascadeCancel_PendingCancellationRequest_AutoRejected()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var booking = CreateBooking(BookingStatus.Confirmed);
        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });
        _paymentTransactionRepository.GetByBookingIdListAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(new List<PaymentTransactionEntity>());

        var pendingRequest = CreatePendingCancellationRequest(booking.Id);
        _bookingCancellationRequestRepository.GetPendingByBookingId(booking.Id, Arg.Any<CancellationToken>())
            .Returns(pendingRequest);

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(BookingCancellationRequestStatus.Rejected, pendingRequest.Status);
    }

    private static TourInstanceEntity CreateTourInstance(Guid id, TourInstanceStatus status)
    {
        return new TourInstanceEntity
        {
            Id = id,
            Status = status,
            TourName = "Test Tour",
            TourCode = "TEST001",
            Title = "Test Instance",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow.AddDays(7),
            EndDate = DateTimeOffset.UtcNow.AddDays(10),
            MaxParticipation = 10
        };
    }

    private static BookingEntity CreateBooking(BookingStatus status)
    {
        var booking = BookingEntity.Create(
            Guid.NewGuid(), "Test Customer", "+84123456789", 2, 1000000m, PaymentMethod.VnPay, true, "TEST");
        booking.Status = status;
        return booking;
    }

    private static BookingCancellationRequestEntity CreatePendingCancellationRequest(Guid bookingId)
    {
        return new BookingCancellationRequestEntity
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            Status = BookingCancellationRequestStatus.PendingManagerReview,
            RequestedByUserId = Guid.NewGuid(),
            CustomerReason = "Test reason",
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    [Fact]
    public async Task CascadeCancel_RefundsAlreadyApplied_NetPaidUsed()
    {
        // Arrange: paid 10M, refunded 4M → net 6M → 70% of net = 4.2M outstanding
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var booking = CreateBooking(BookingStatus.Paid);
        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        var paidTx = new PaymentTransactionEntity
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Amount = 10_000_000m,
            PaidAmount = 10_000_000m,
            Type = TransactionType.FullPayment,
            Status = TransactionStatus.Completed
        };
        var refundTx = new PaymentTransactionEntity
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Amount = 4_000_000m,
            PaidAmount = 4_000_000m,
            Type = TransactionType.Refund,
            Status = TransactionStatus.Completed
        };
        _paymentTransactionRepository.GetByBookingIdListAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(new List<PaymentTransactionEntity> { paidTx, refundTx });

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.Equal(RefundStatus.Pending, booking.RefundStatus);
        // 70% of 6_000_000 net = 4_200_000
        Assert.Equal(4_200_000m, booking.RefundOutstandingAmount);
    }

    [Fact]
    public async Task CascadeCancel_FiresBookingStatusChangedEvent_OncePerBooking()
    {
        // Arrange — two active bookings: each should fire its own domain event exactly once
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var b1 = CreateBooking(BookingStatus.Confirmed);
        var b2 = CreateBooking(BookingStatus.Paid);
        b1.ClearDomainEvents();
        b2.ClearDomainEvents();

        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { b1, b2 });
        _paymentTransactionRepository.GetByBookingIdListAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new List<PaymentTransactionEntity>());

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(b1.DomainEvents.OfType<global::Domain.Events.BookingStatusChangedEvent>());
        Assert.Single(b2.DomainEvents.OfType<global::Domain.Events.BookingStatusChangedEvent>());
    }

    [Fact]
    public async Task CascadeCancel_Transaction_RollsBackOnFailure()
    {
        // Arrange — repository UpdateAsync throws → ExecuteTransactionAsync must surface exception
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var booking = CreateBooking(BookingStatus.Confirmed);
        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });
        _paymentTransactionRepository.GetByBookingIdListAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(new List<PaymentTransactionEntity>());
        _bookingRepository.When(r => r.UpdateAsync(Arg.Any<BookingEntity>(), Arg.Any<CancellationToken>()))
            .Do(_ => throw new InvalidOperationException("DB failure"));

        // Act — service catches InvalidOperationException and surfaces via Error.Validation
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert — error surfaced, SaveChangeAsync never reached (would be in real DB rollback)
        Assert.True(result.IsError);
        await _unitOfWork.DidNotReceive().SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_InstanceWithActiveBookings_CascadeCancels()
    {
        // Arrange — Delete path must reuse cascade helper for active bookings
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId).Returns(instance);

        var booking = CreateBooking(BookingStatus.Confirmed);
        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });
        _paymentTransactionRepository.GetByBookingIdListAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(new List<PaymentTransactionEntity>());

        // Act
        var result = await _sut.Delete(instanceId, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        await _tourInstanceRepository.Received().SoftDelete(instanceId);
        await _roomBlockRepository.Received().DeleteByTourInstanceAsync(instanceId);
    }

    [Fact]
    public async Task Delete_InstanceWithCompletedBookings_RejectsWithCannotCancelAfterStart()
    {
        // Arrange — completed booking in instance → must reject delete
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Available);
        _tourInstanceRepository.FindById(instanceId).Returns(instance);

        var completedBooking = CreateBooking(BookingStatus.Completed);
        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { completedBooking });

        // Act
        var result = await _sut.Delete(instanceId, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstance.CannotCancelAfterStart");
        await _tourInstanceRepository.DidNotReceive().SoftDelete(Arg.Any<Guid>());
    }

    [Fact]
    public async Task CascadeCancel_NoBalanceMovement()
    {
        // Arrange — Manager cancel must not interact with wallet/balance repositories
        var instanceId = Guid.NewGuid();
        var instance = CreateTourInstance(instanceId, TourInstanceStatus.Confirmed);
        _tourInstanceRepository.FindById(instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var booking = CreateBooking(BookingStatus.Paid);
        _bookingRepository.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });
        var paidTx = new PaymentTransactionEntity
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Amount = 5_000_000m,
            PaidAmount = 5_000_000m,
            Type = TransactionType.FullPayment,
            Status = TransactionStatus.Completed
        };
        _paymentTransactionRepository.GetByBookingIdListAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(new List<PaymentTransactionEntity> { paidTx });

        // Act
        var result = await _sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert — cascade runs but does NOT create Refund tx automatically
        Assert.False(result.IsError);
        await _paymentTransactionRepository.DidNotReceive().AddAsync(Arg.Any<PaymentTransactionEntity>(), Arg.Any<CancellationToken>());
    }
}
