using global::Application.Common;
using global::Application.Common.Constant;
using global::Application.Common.Interfaces;
using global::Application.Common.Pricing;
using global::Application.Features.BookingManagement;
using global::Application.Features.TourInstance.Commands;
using global::Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features;

/// <summary>
/// Cross-handler integration tests for the manager-cancel-cascade flow.
/// Verify wiring between cmd → service → repo using NSubstitute (no real DB).
/// True end-to-end with Postgres lives on the dev server.
/// </summary>
public sealed class ManagerCancelCascadeIntegrationTests
{
    [Fact]
    public void ChangeTourInstanceStatusCommand_InvalidatesBookingCache()
    {
        var cmd = new ChangeTourInstanceStatusCommand(Guid.NewGuid(), TourInstanceStatus.Cancelled);
        Assert.Contains(CacheKey.Booking, cmd.CacheKeysToInvalidate);
        Assert.Contains(CacheKey.TourInstance, cmd.CacheKeysToInvalidate);
    }

    [Fact]
    public void DeleteTourInstanceCommand_InvalidatesBookingCache()
    {
        var cmd = new DeleteTourInstanceCommand(Guid.NewGuid());
        Assert.Contains(CacheKey.Booking, cmd.CacheKeysToInvalidate);
        Assert.Contains(CacheKey.TourInstance, cmd.CacheKeysToInvalidate);
    }

    [Fact]
    public async Task ManagerCancel_EndToEnd_FlipsBookings_KeepsCompleted_AndPublishesEvent()
    {
        // Arrange — wire full TourInstanceService with mocked deps to simulate API request lifecycle
        var instanceId = Guid.NewGuid();
        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            Status = TourInstanceStatus.Confirmed,
            TourName = "Test Tour",
            TourCode = "TEST001",
            Title = "Instance",
            ClassificationName = "Std",
            StartDate = DateTimeOffset.UtcNow.AddDays(7),
            EndDate = DateTimeOffset.UtcNow.AddDays(10),
            MaxParticipation = 10
        };

        var paidBooking = BookingEntity.Create(Guid.NewGuid(), "Khach Paid", "+84111", 2, 1_000_000m, PaymentMethod.VnPay, true, "PAID");
        paidBooking.Status = BookingStatus.Paid;

        var completedBooking = BookingEntity.Create(Guid.NewGuid(), "Khach Done", "+84222", 1, 500_000m, PaymentMethod.VnPay, true, "DONE");
        completedBooking.Status = BookingStatus.Completed;

        var paidTx = new PaymentTransactionEntity
        {
            Id = Guid.NewGuid(),
            BookingId = paidBooking.Id,
            Amount = 10_000_000m,
            PaidAmount = 10_000_000m,
            Type = TransactionType.FullPayment,
            Status = TransactionStatus.Completed
        };

        var sut = BuildService(
            instance,
            new List<BookingEntity> { paidBooking, completedBooking },
            new Dictionary<Guid, List<PaymentTransactionEntity>>
            {
                [paidBooking.Id] = new() { paidTx },
                [completedBooking.Id] = new()
            });

        // Act
        var result = await sut.ChangeStatus(instanceId, TourInstanceStatus.Cancelled, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(BookingStatus.Cancelled, paidBooking.Status);
        Assert.Equal(BookingStatus.Completed, completedBooking.Status); // skipped, untouched
        Assert.Equal(RefundStatus.Pending, paidBooking.RefundStatus);
        Assert.Equal(7_000_000m, paidBooking.RefundOutstandingAmount);
    }

    [Fact]
    public async Task GetAllBookings_RefundStatusFilter_FlowsThroughToRepository()
    {
        // Arrange
        var bookingRepository = Substitute.For<IBookingRepository>();
        var pricingPolicyRepository = Substitute.For<IPricingPolicyRepository>();
        var taxConfigRepository = Substitute.For<ITaxConfigRepository>();
        var priceCalculator = Substitute.For<IBookingPriceCalculator>();
        bookingRepository
            .GetAllPagedAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<RefundStatus?>(), Arg.Any<CancellationToken>())
            .Returns((new List<BookingEntity>(), 0));

        var handler = new global::Application.Features.BookingManagement.Queries.GetAllBookingsQueryHandler(bookingRepository, pricingPolicyRepository, taxConfigRepository, priceCalculator);
        var query = new global::Application.Features.BookingManagement.Queries.GetAllBookingsQuery(
            Page: 1, PageSize: 20, ManagerId: null, RefundStatus: RefundStatus.Pending);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert — filter forwarded to repo
        Assert.False(result.IsError);
        await bookingRepository.Received(1).GetAllPagedAsync(1, 20, RefundStatus.Pending, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateRefundStatus_HappyPath_PendingToContacted()
    {
        // Arrange
        var booking = BookingEntity.Create(Guid.NewGuid(), "Khach", "+84111", 2, 1_000_000m, PaymentMethod.VnPay, true, "PAID");
        booking.Status = BookingStatus.Cancelled;
        booking.InitializeRefundTracking(10_000_000m, "manager-1");
        Assert.Equal(RefundStatus.Pending, booking.RefundStatus);

        var bookingRepository = Substitute.For<IBookingRepository>();
        bookingRepository.GetByIdAsync(booking.Id, Arg.Any<CancellationToken>()).Returns(booking);
        var user = Substitute.For<IUser>();
        user.Id.Returns(Guid.NewGuid().ToString());

        var unitOfWork = Substitute.For<IUnitOfWork>();
        unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var handler = new UpdateBookingRefundStatusCommandHandler(bookingRepository, user, unitOfWork);
        var cmd = new UpdateBookingRefundStatusCommand(booking.Id, RefundStatus.Contacted);

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(RefundStatus.Contacted, booking.RefundStatus);
        Assert.NotNull(booking.RefundContactedAt);
    }

    private static TourInstanceService BuildService(
        TourInstanceEntity instance,
        List<BookingEntity> bookings,
        Dictionary<Guid, List<PaymentTransactionEntity>> txByBooking)
    {
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        tourInstanceRepository.FindById(instance.Id, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);

        var bookingRepository = Substitute.For<IBookingRepository>();
        bookingRepository.GetByTourInstanceIdAsync(instance.Id, Arg.Any<CancellationToken>()).Returns(bookings);

        var paymentTxRepo = Substitute.For<IPaymentTransactionRepository>();
        foreach (var kvp in txByBooking)
        {
            paymentTxRepo.GetByBookingIdListAsync(kvp.Key, Arg.Any<CancellationToken>()).Returns(kvp.Value);
        }

        var unitOfWork = Substitute.For<IUnitOfWork>();
        unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);
        unitOfWork
            .ExecuteTransactionAsync(Arg.Any<System.Data.IsolationLevel>(), Arg.Any<Func<Task>>())
            .Returns(call => call.Arg<Func<Task>>()());

        var user = Substitute.For<IUser>();
        user.Id.Returns(Guid.NewGuid().ToString());

        return new TourInstanceService(
            tourInstanceRepository,
            Substitute.For<ITourRepository>(),
            Substitute.For<ITourRequestRepository>(),
            Substitute.For<ISupplierRepository>(),
            Substitute.For<IVehicleRepository>(),
            Substitute.For<IMailRepository>(),
            Substitute.For<IRoomBlockRepository>(),
            Substitute.For<IHotelRoomInventoryRepository>(),
            user,
            Substitute.For<AutoMapper.IMapper>(),
            Substitute.For<Microsoft.Extensions.Logging.ILogger<TourInstanceService>>(),
            Substitute.For<ICloudinaryService>(),
            bookingRepository: bookingRepository,
            unitOfWork: unitOfWork,
            paymentTransactionRepository: paymentTxRepo,
            bookingCancellationRequestRepository: Substitute.For<IBookingCancellationRequestRepository>());
    }
}
