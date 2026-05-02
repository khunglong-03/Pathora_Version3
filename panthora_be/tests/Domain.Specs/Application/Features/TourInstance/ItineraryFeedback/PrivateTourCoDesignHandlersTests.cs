using global::Application.Features.TourInstance.ItineraryFeedback;
using global::Application.Services;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using global::Xunit;
using ErrorOr;
using NSubstitute;

namespace Domain.Specs.Application.Features.TourInstance.ItineraryFeedback;

public sealed class PrivateTourCoDesignHandlersTests
{
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly ITourItineraryFeedbackRepository _feedbackRepository = Substitute.For<ITourItineraryFeedbackRepository>();
    private readonly IOwnershipValidator _ownershipValidator = Substitute.For<IOwnershipValidator>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly global::Contracts.Interfaces.IUser _user = Substitute.For<global::Contracts.Interfaces.IUser>();

    [Fact]
    public async Task CreateFeedback_Customer_Succeeds_WhenOwnsBooking()
    {
        var userId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var instance = PrivateInstanceWithOneDay(dayId);
        var booking = BookingEntity.Create(
            instance.Id,
            "A",
            "0909",
            2,
            5000m,
            PaymentMethod.BankTransfer,
            true,
            "sys",
            userId: userId);
        booking.Id = Guid.NewGuid();

        _ownershipValidator.GetCurrentUserId().Returns(userId.ToString());
        _tourInstanceRepository.FindById(instance.Id, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(instance);
        _bookingRepository.GetByIdAsync(booking.Id, Arg.Any<CancellationToken>()).Returns(booking);
        _feedbackRepository.AddAsync(Arg.Any<TourItineraryFeedbackEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(1));

        var handler = new CreateTourItineraryFeedbackCommandHandler(
            _tourInstanceRepository,
            _bookingRepository,
            _feedbackRepository,
            _ownershipValidator,
            _unitOfWork,
            _user,
            Substitute.For<Microsoft.Extensions.Logging.ILogger<CreateTourItineraryFeedbackCommandHandler>>(),
            null);

        var result = await handler.Handle(
            new CreateTourItineraryFeedbackCommand(instance.Id, dayId, booking.Id, "Hello", true),
            CancellationToken.None);

        Assert.False(result.IsError);
        await _feedbackRepository.Received(1).AddAsync(Arg.Any<TourItineraryFeedbackEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SetFinalSellPrice_Fails_WhenInstanceNotDraft()
    {
        var userId = Guid.NewGuid();
        var instance = PrivateInstanceWithOneDay(Guid.NewGuid());
        instance.Status = TourInstanceStatus.Available;

        _ownershipValidator.GetCurrentUserId().Returns(userId.ToString());
        _ownershipValidator.IsAdminAsync(Arg.Any<CancellationToken>()).Returns(false);
        _tourInstanceRepository.FindById(instance.Id, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(instance);
        instance.Managers.Add(new TourInstanceManagerEntity
        {
            UserId = userId,
            Role = TourInstanceManagerRole.Manager
        });

        var handler = new SetPrivateTourFinalSellPriceCommandHandler(
            _feedbackRepository,
            _tourInstanceRepository,
            _ownershipValidator,
            _unitOfWork,
            _user,
            Substitute.For<Microsoft.Extensions.Logging.ILogger<SetPrivateTourFinalSellPriceCommandHandler>>(),
            null);

        var result = await handler.Handle(
            new SetPrivateTourFinalSellPriceCommand(instance.Id, 12000m),
            CancellationToken.None);

        Assert.True(result.IsError);
    }

    [Fact]
    public async Task ApplySettlement_DeltaPositive_CreatesTopUpAndPendingAdjustment()
    {
        var managerId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var instance = PrivateInstanceWithOneDay(dayId);
        instance.FinalSellPrice = 12000m;
        instance.Managers.Add(new TourInstanceManagerEntity { UserId = managerId, Role = TourInstanceManagerRole.Manager });

        var booking = BookingEntity.Create(
            instance.Id,
            "A",
            "0909",
            2,
            10000m,
            PaymentMethod.BankTransfer,
            true,
            "sys",
            userId: customerId);
        booking.Id = Guid.NewGuid();
        booking.Status = BookingStatus.Deposited; // changed to Deposited
        booking.TourInstance = instance;

        var paymentTx = Substitute.For<IPaymentTransactionRepository>();
        paymentTx.GetByBookingIdListAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(
            [
                CompletedTransaction(booking.Id, 3000m) // paid 3000m
            ]);

        var paymentService = Substitute.For<IPaymentService>();
        var paidTx = PaymentTransactionEntity.Create(
            booking.Id,
            "PAY-UP-1",
            TransactionType.FullPayment,
            9000m, // Delta: 12000 - 3000 = 9000
            PaymentMethod.BankTransfer,
            "top-up",
            managerId.ToString());
        paymentService.CreatePaymentTransactionAsync(
                Arg.Any<Guid>(),
                TransactionType.FullPayment,
                9000m, // Expect 9000
                Arg.Any<PaymentMethod>(),
                Arg.Any<string>(),
                Arg.Any<string>(),
                Arg.Any<int?>())
            .Returns(paidTx);

        _ownershipValidator.GetCurrentUserId().Returns(managerId.ToString());
        _ownershipValidator.IsAdminAsync(Arg.Any<CancellationToken>()).Returns(false);
        _bookingRepository.GetByIdWithDetailsAsync(booking.Id, Arg.Any<CancellationToken>()).Returns(booking);
        _bookingRepository.UpdateAsync(Arg.Any<BookingEntity>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        _tourInstanceRepository.FindById(instance.Id, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(1));

        var handler = new ApplyPrivateTourSettlementCommandHandler(
            _bookingRepository,
            _tourInstanceRepository,
            paymentService,
            paymentTx,
            Substitute.For<ITransactionHistoryRepository>(),
            Substitute.For<IUserRepository>(),
            _ownershipValidator,
            _unitOfWork,
            Substitute.For<ITourInstanceService>(),
            _user);

        var result = await handler.Handle(
            new ApplyPrivateTourSettlementCommand(instance.Id, booking.Id),
            CancellationToken.None);

        if (result.IsError) Assert.Fail(result.FirstError.Description);
        Assert.False(result.IsError);
        Assert.Equal(9000m, result.Value.Delta); // Delta expected to be 9000
        Assert.NotNull(result.Value.TopUpTransactionId);
        Assert.Equal(BookingStatus.PendingAdjustment, booking.Status);
        Assert.Equal(TourInstanceStatus.PendingAdjustment, instance.Status);
    }

    [Fact]
    public async Task ApplySettlement_DeltaNegative_CreditsWalletAndHistory()
    {
        var managerId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var instance = PrivateInstanceWithOneDay(dayId);
        instance.FinalSellPrice = 8000m;
        instance.Managers.Add(new TourInstanceManagerEntity { UserId = managerId, Role = TourInstanceManagerRole.Manager });

        var booking = BookingEntity.Create(
            instance.Id,
            "A",
            "0909",
            2,
            10000m,
            PaymentMethod.BankTransfer,
            true,
            "sys",
            userId: customerId);
        booking.Id = Guid.NewGuid();
        booking.Status = BookingStatus.Paid;
        booking.TourInstance = instance;

        var paymentTx = Substitute.For<IPaymentTransactionRepository>();
        paymentTx.GetByBookingIdListAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns([CompletedTransaction(booking.Id, 10000m)]);

        var customer = UserEntity.Create("c", "C", "c@e.com", "x", "s");
        customer.Id = customerId;
        var userRepo = Substitute.For<IUserRepository>();
        userRepo.FindById(customerId, Arg.Any<CancellationToken>()).Returns(customer);

        var historyRepo = Substitute.For<ITransactionHistoryRepository>();

        _ownershipValidator.GetCurrentUserId().Returns(managerId.ToString());
        _ownershipValidator.IsAdminAsync(Arg.Any<CancellationToken>()).Returns(false);
        _bookingRepository.GetByIdWithDetailsAsync(booking.Id, Arg.Any<CancellationToken>()).Returns(booking);
        _tourInstanceRepository.FindById(instance.Id, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(1));

        var handler = new ApplyPrivateTourSettlementCommandHandler(
            _bookingRepository,
            _tourInstanceRepository,
            Substitute.For<IPaymentService>(),
            paymentTx,
            historyRepo,
            userRepo,
            _ownershipValidator,
            _unitOfWork,
            Substitute.For<ITourInstanceService>(),
            _user);

        var result = await handler.Handle(
            new ApplyPrivateTourSettlementCommand(instance.Id, booking.Id),
            CancellationToken.None);

        if (result.IsError) Assert.Fail(result.FirstError.Description);
        Assert.False(result.IsError);
        Assert.Equal(-2000m, result.Value.Delta);
        Assert.Equal(2000m, result.Value.CreditAmount);
        Assert.Equal(2000m, customer.Balance);
        await historyRepo.Received(1).AddAsync(Arg.Any<TransactionHistoryEntity>(), Arg.Any<CancellationToken>());
    }

    private static TourInstanceEntity PrivateInstanceWithOneDay(Guid dayId)
    {
        var instance = TourInstanceEntity.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "t",
            "tn",
            "TC",
            "cl",
            TourType.Private,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow.AddDays(2),
            10,
            10000m,
            "sys");
        instance.Status = TourInstanceStatus.Draft;
        instance.InstanceDays =
        [
            new TourInstanceDayEntity { Id = dayId, TourInstanceId = instance.Id }
        ];
        return instance;
    }

    private static PaymentTransactionEntity CompletedTransaction(Guid bookingId, decimal paid)
    {
        var t = PaymentTransactionEntity.Create(
            bookingId,
            $"PAY-{Guid.NewGuid():N}".Substring(0, 18),
            TransactionType.FullPayment,
            paid,
            PaymentMethod.BankTransfer,
            "x",
            "s");
        t.MarkAsPaid(paid, DateTimeOffset.UtcNow, externalTransactionId: $"ext-{Guid.NewGuid():N}");
        return t;
    }
}
