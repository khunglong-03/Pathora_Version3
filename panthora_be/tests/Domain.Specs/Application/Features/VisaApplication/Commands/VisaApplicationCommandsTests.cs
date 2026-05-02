using Application.Common.Interfaces;
using Application.Features.VisaApplication.Commands;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.VisaApplication.Commands;

public class VisaApplicationCommandsTests
{
    private readonly IVisaApplicationRepository _visaRepoMock = Substitute.For<IVisaApplicationRepository>();
    private readonly IBookingRepository _bookingRepoMock = Substitute.For<IBookingRepository>();
    private readonly IPaymentTransactionRepository _transactionRepoMock = Substitute.For<IPaymentTransactionRepository>();
    private readonly ICurrentUser _currentUserMock = Substitute.For<ICurrentUser>();
    private readonly IPostPaymentVisaGateService _visaGateMock = Substitute.For<IPostPaymentVisaGateService>();
    private readonly global::Domain.UnitOfWork.IUnitOfWork _uowMock = Substitute.For<global::Domain.UnitOfWork.IUnitOfWork>();

    [Fact]
    public async Task CreateVisaApplication_ShouldReturnId()
    {
        var handler = new CreateVisaApplicationCommandHandler(_visaRepoMock, _uowMock);
        var command = new CreateVisaApplicationCommand(Guid.NewGuid(), Guid.NewGuid(), "Vietnam");

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Should().NotBeEmpty();
        await _visaRepoMock.Received(1).AddAsync(Arg.Any<VisaApplicationEntity>(), Arg.Any<CancellationToken>());
        await _uowMock.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateVisaStatus_WhenRejectingAfterGateClosed_ShouldReturnConflict()
    {
        var handler = new UpdateVisaApplicationStatusCommandHandler(_visaRepoMock, _currentUserMock, _visaGateMock, _uowMock);
        
        var userId = Guid.NewGuid();
        _currentUserMock.Id.Returns(userId);
        _currentUserMock.IsInRole(global::Application.Common.Constant.RoleConstants.Admin).Returns(true);

        var tour = new TourEntity { Id = Guid.NewGuid(), TourName = "Tour", IsVisa = true };
        var tourInstance = TourInstanceEntity.Create(tour.Id, Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "TEST");
        tourInstance.ChangeStatus(TourInstanceStatus.Confirmed, "TEST"); // Post Visa Gate

        var booking = BookingEntity.Create(tourInstance.Id, "Customer", "123", 1, 1000m, PaymentMethod.VnPay, true, "TEST", userId);
        booking.TourInstance = tourInstance;

        var participant = BookingParticipantEntity.Create(booking.Id, "Adult", "Name", "TEST", DateTimeOffset.UtcNow.AddYears(-30));
        participant.Booking = booking;

        var visaApp = VisaApplicationEntity.Create(participant.Id, Guid.NewGuid(), "Vietnam", "TEST", null, null);
        visaApp.BookingParticipant = participant;

        _visaRepoMock.GetByIdWithGraphAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(visaApp);

        var command = new UpdateVisaApplicationStatusCommand(visaApp.Id, VisaStatus.Rejected, "Lý do");

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Visa.CannotReject");
    }

    [Fact]
    public async Task QuoteFee_WhenNotSystemAssisted_ShouldReturnValidation()
    {
        var handler = new QuoteVisaSupportFeeCommandHandler(_visaRepoMock, _bookingRepoMock, _transactionRepoMock, _currentUserMock, _uowMock);
        
        var userId = Guid.NewGuid();
        _currentUserMock.Id.Returns(userId);
        _currentUserMock.IsInRole(global::Application.Common.Constant.RoleConstants.Admin).Returns(true);

        var tour = new TourEntity { Id = Guid.NewGuid(), TourName = "Tour", IsVisa = true };
        var tourInstance = TourInstanceEntity.Create(tour.Id, Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "TEST");
        var booking = BookingEntity.Create(tourInstance.Id, "Customer", "123", 1, 1000m, PaymentMethod.VnPay, true, "TEST", userId);
        booking.TourInstance = tourInstance;

        var participant = BookingParticipantEntity.Create(booking.Id, "Adult", "Name", "TEST", DateTimeOffset.UtcNow.AddYears(-30));
        participant.Booking = booking;

        var visaApp = VisaApplicationEntity.Create(participant.Id, Guid.NewGuid(), "Vietnam", "TEST", null, null);
        visaApp.BookingParticipant = participant;
        // Not system assisted!

        _visaRepoMock.GetByIdWithGraphAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(visaApp);

        var command = new QuoteVisaSupportFeeCommand(visaApp.Id, 100m);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Visa.NotSystemAssisted");
    }

    [Fact]
    public async Task QuoteFee_WhenAlreadyQuoted_ShouldReturnExistingTransactionId()
    {
        var handler = new QuoteVisaSupportFeeCommandHandler(_visaRepoMock, _bookingRepoMock, _transactionRepoMock, _currentUserMock, _uowMock);
        
        var userId = Guid.NewGuid();
        _currentUserMock.Id.Returns(userId);
        _currentUserMock.IsInRole(global::Application.Common.Constant.RoleConstants.Admin).Returns(true);

        var tour = new TourEntity { Id = Guid.NewGuid(), TourName = "Tour", IsVisa = true };
        var tourInstance = TourInstanceEntity.Create(tour.Id, Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "TEST");
        var booking = BookingEntity.Create(tourInstance.Id, "Customer", "123", 1, 1000m, PaymentMethod.VnPay, true, "TEST", userId);
        booking.TourInstance = tourInstance;

        var participant = BookingParticipantEntity.Create(booking.Id, "Adult", "Name", "TEST", DateTimeOffset.UtcNow.AddYears(-30));
        participant.Booking = booking;

        var transactionId = Guid.NewGuid();
        var visaApp = VisaApplicationEntity.Create(participant.Id, Guid.NewGuid(), "Vietnam", "TEST", null, null);
        visaApp.BookingParticipant = participant;
        visaApp.IsSystemAssisted = true;
        visaApp.ServiceFeeTransactionId = transactionId;

        _visaRepoMock.GetByIdWithGraphAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(visaApp);

        var command = new QuoteVisaSupportFeeCommand(visaApp.Id, 100m);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Should().Be(transactionId);
        
        // Ensure no new transaction is created
        await _transactionRepoMock.DidNotReceiveWithAnyArgs().AddAsync(default!);
    }
}
