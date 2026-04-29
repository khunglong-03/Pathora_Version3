using global::Application.Contracts.Payment;
using global::Application.Services;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::NSubstitute;
using global::Xunit;

namespace Domain.Specs.Application.Features.Public.Commands;

public sealed class CreatePrivateTourInitialPaymentCommandHandlerTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly IDepositPolicyRepository _depositPolicyRepository = Substitute.For<IDepositPolicyRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly IPaymentService _paymentService = Substitute.For<IPaymentService>();

    private CreatePrivateTourInitialPaymentCommandHandler CreateHandler()
        => new(_bookingRepository, _depositPolicyRepository, _tourInstanceRepository, _paymentService);

    [Fact]
    public async Task HappyPath_UsesFullPaymentAndBookingTotalPrice()
    {
        var bookingId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();

        var instance = TourInstanceEntity.Create(
            tourId,
            classificationId,
            "Private",
            "Tour",
            "TC",
            "Std",
            TourType.Private,
            DateTimeOffset.UtcNow.AddDays(2),
            DateTimeOffset.UtcNow.AddDays(4),
            6,
            500m,
            performedBy: "op",
            thumbnail: new ImageEntity { FileId = "f", FileName = "n", PublicURL = "u" });
        instance.Id = instanceId;

        var booking = BookingEntity.Create(
            instance.Id,
            "A",
            "+84 900000000",
            2,
            1234.56m,
            PaymentMethod.BankTransfer,
            isFullPay: true,
            performedBy: "u",
            bookingType: BookingType.PrivateCustomTourRequest);
        booking.Id = bookingId;
        booking.TourInstance = instance;

        _bookingRepository.GetByIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        var expectedTx = PaymentTransactionEntity.Create(
            bookingId,
            "PAY-test",
            TransactionType.FullPayment,
            booking.TotalPrice,
            booking.PaymentMethod,
            "note",
            "u");
        _paymentService.CreatePaymentTransactionAsync(
                bookingId,
                TransactionType.FullPayment,
                booking.TotalPrice,
                booking.PaymentMethod,
                Arg.Any<string>(),
                Arg.Any<string>(),
                Arg.Any<int?>())
            .Returns(expectedTx);

        var handler = CreateHandler();
        var result = await handler.Handle(new CreatePrivateTourInitialPaymentCommand(bookingId), CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(booking.TotalPrice, result.Value.Amount);
        Assert.Equal(TransactionType.FullPayment, result.Value.Type);
        await _paymentService.Received(1).CreatePaymentTransactionAsync(
            bookingId,
            TransactionType.FullPayment,
            1234.56m,
            PaymentMethod.BankTransfer,
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<int?>());
    }

    [Fact]
    public async Task WhenBookingNotPrivateCustom_ReturnsValidationError()
    {
        var bookingId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();

        var instance = TourInstanceEntity.Create(
            tourId,
            classificationId,
            "x",
            "T",
            "C",
            "N",
            TourType.Private,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow.AddDays(1),
            2,
            100m,
            "u",
            thumbnail: new ImageEntity { FileId = "f", FileName = "n", PublicURL = "u" });
        instance.Id = instanceId;

        var booking = BookingEntity.Create(
            instance.Id,
            "A",
            "1",
            1,
            100m,
            PaymentMethod.BankTransfer,
            true,
            "u",
            bookingType: BookingType.InstanceJoin);
        booking.Id = bookingId;
        booking.TourInstance = instance;

        _bookingRepository.GetByIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        var result = await CreateHandler().Handle(new CreatePrivateTourInitialPaymentCommand(bookingId), CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("PrivateTour.NotCustomRequest", result.FirstError.Code);
        await _paymentService.DidNotReceive()
            .CreatePaymentTransactionAsync(
                Arg.Any<Guid>(),
                Arg.Any<TransactionType>(),
                Arg.Any<decimal>(),
                Arg.Any<PaymentMethod>(),
                Arg.Any<string>(),
                Arg.Any<string>(),
                Arg.Any<int?>());
    }
}
