using global::Application.Common.Interfaces;
using global::Application.Features.BookingCancellation.Commands;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using global::NSubstitute;
using global::Xunit;
using global::ErrorOr;
using Microsoft.Extensions.Logging;

namespace Domain.Specs.Application.Features.BookingCancellation.Commands;

public sealed class RequestBookingCancellationCommandHandlerTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly IBookingCancellationRequestRepository _cancellationRequestRepository = Substitute.For<IBookingCancellationRequestRepository>();
    private readonly ICancellationPolicyRepository _cancellationPolicyRepository = Substitute.For<ICancellationPolicyRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly IBookingTourGuideRepository _bookingTourGuideRepository = Substitute.For<IBookingTourGuideRepository>();
    private readonly ISupplierPayableRepository _supplierPayableRepository = Substitute.For<ISupplierPayableRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();
    private readonly ILogger<RequestBookingCancellationCommandHandler> _logger = Substitute.For<ILogger<RequestBookingCancellationCommandHandler>>();

    private RequestBookingCancellationCommandHandler CreateHandler() => new(
        _bookingRepository,
        _cancellationRequestRepository,
        _cancellationPolicyRepository,
        _tourInstanceRepository,
        _bookingTourGuideRepository,
        _supplierPayableRepository,
        _unitOfWork,
        _currentUser,
        _logger);

    [Fact]
    public async Task Handle_WhenPaidAmountIsZeroAndBookingIsConfirmed_PerformsDirectCancelAndCleanups()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        _currentUser.Id.Returns(userId);

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
            totalPrice: 2000000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: true,
            performedBy: userId.ToString(),
            userId: userId);

        booking.Id = bookingId;
        booking.Status = BookingStatus.Confirmed;
        booking.TourInstance = tourInstance;

        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        _bookingTourGuideRepository.GetByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingTourGuideEntity>());

        _supplierPayableRepository.GetByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<SupplierPayableEntity>());

        _unitOfWork.ExecuteTransactionAsync(Arg.Any<System.Data.IsolationLevel>(), Arg.Any<Func<Task>>())
            .Returns(call => call.Arg<Func<Task>>()());

        var cmd = new RequestBookingCancellationCommand(bookingId, "Khong di duoc nua");

        // Act
        var result = await CreateHandler().Handle(cmd, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal("DirectCancel", result.Value.Type);
        Assert.Equal(0, result.Value.RefundAmount);
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.Equal(1, tourInstance.CurrentParticipation); // 3 - 2 participants = 1

        await _tourInstanceRepository.Received(1).Update(tourInstance, Arg.Any<CancellationToken>());
        await _bookingRepository.Received(1).UpdateWithoutSaveAsync(booking);
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }
}
