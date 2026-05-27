using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Features.BookingManagement.Participant;
using Application.Features.VisaApplication.Commands;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentAssertions;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using System.Data;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement;

public class ParticipantAndVisaCommandsTests
{
    private readonly IBookingRepository _bookingRepoMock = Substitute.For<IBookingRepository>();
    private readonly IBookingParticipantRepository _participantRepoMock = Substitute.For<IBookingParticipantRepository>();
    private readonly IBookingActivityReservationRepository _activityRepoMock = Substitute.For<IBookingActivityReservationRepository>();
    private readonly IBookingTransportDetailRepository _transportRepoMock = Substitute.For<IBookingTransportDetailRepository>();
    private readonly IBookingAccommodationDetailRepository _accommodationRepoMock = Substitute.For<IBookingAccommodationDetailRepository>();
    private readonly IPassportRepository _passportRepoMock = Substitute.For<IPassportRepository>();
    private readonly IVisaApplicationRepository _visaRepoMock = Substitute.For<IVisaApplicationRepository>();
    private readonly ICurrentUser _currentUserMock = Substitute.For<ICurrentUser>();
    private readonly global::Contracts.Interfaces.IUser _userMock = Substitute.For<global::Contracts.Interfaces.IUser>();
    private readonly IUnitOfWork _uowMock = Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task CreateParticipant_ConcurrentDbUpdate_ReturnsConflict()
    {
        // Arrange
        var handler = new CreateParticipantCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _activityRepoMock,
            _transportRepoMock,
            _accommodationRepoMock,
            _uowMock,
            _userMock);

        var bookingId = Guid.NewGuid();
        var command = new CreateParticipantCommand(bookingId, "Adult", "John Doe", null, null, null);

        // Simulate DbUpdateConcurrencyException during transaction execution
        _uowMock.ExecuteTransactionAsync(Arg.Any<IsolationLevel>(), Arg.Any<Func<Task>>())
            .Throws(new DbUpdateConcurrencyException("Concurrency conflict"));

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be(ErrorConstants.BookingParticipant.ConcurrencyConflictCode);
    }

    [Fact]
    public async Task UpdateParticipant_ConcurrentDbUpdate_ReturnsConflict()
    {
        // Arrange
        var handler = new UpdateParticipantCommandHandler(
            _participantRepoMock,
            _activityRepoMock,
            _transportRepoMock,
            _accommodationRepoMock,
            _uowMock,
            _userMock);

        var participantId = Guid.NewGuid();
        var command = new UpdateParticipantCommand(participantId, "Adult", "John Doe Updated", null, null, null, ReservationStatus.Pending);

        // Simulate DbUpdateConcurrencyException during transaction execution
        _uowMock.ExecuteTransactionAsync(Arg.Any<IsolationLevel>(), Arg.Any<Func<Task>>())
            .Throws(new DbUpdateConcurrencyException("Concurrency conflict"));

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be(ErrorConstants.BookingParticipant.ConcurrencyConflictCode);
    }

    [Fact]
    public void UpdateCustomerPassportValidator_RejectsPlaceholderPending()
    {
        // Arrange
        var validator = new UpdateCustomerPassportCommandValidator();
        var command = new UpdateCustomerPassportCommand(Guid.NewGuid(), Guid.NewGuid(), "PENDING", "VNM", null, null, null);

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(command.PassportNumber));
    }

    [Fact]
    public void UpdateCustomerPassportValidator_AllowsNullPassportNumber_WhenFileUrlSet()
    {
        // Arrange
        var validator = new UpdateCustomerPassportCommandValidator();
        var command = new UpdateCustomerPassportCommand(Guid.NewGuid(), Guid.NewGuid(), null, "VNM", null, null, "http://example.com/scan.jpg");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void SubmitCustomerVisaValidator_RejectsInvalidDestinationCountry()
    {
        // Arrange
        var validator = new SubmitCustomerVisaApplicationCommandValidator();
        var command = new SubmitCustomerVisaApplicationCommand(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "invalid_country_code");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(command.DestinationCountry));
    }

    [Fact]
    public async Task RequestVisaSupport_CreatesApplicationWithNullDestinationCountry()
    {
        // Arrange
        var handler = new RequestVisaSupportCommandHandler(
            _bookingRepoMock,
            _passportRepoMock,
            _visaRepoMock,
            _currentUserMock,
            _uowMock);

        var userId = Guid.NewGuid();
        _currentUserMock.Id.Returns(userId);

        var tourInstance = TourInstanceEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "system");
        var booking = BookingEntity.Create(tourInstance.Id, "Customer Name", "0123456789", 1, 1000m, PaymentMethod.VnPay, true, "system", userId);
        booking.TourInstance = tourInstance;

        var participant = BookingParticipantEntity.Create(booking.Id, "Adult", "John Doe", "system");
        booking.BookingParticipants.Add(participant);

        var passport = PassportEntity.Create(participant.Id, "12345678", "system");

        _bookingRepoMock.GetByIdWithDetailsAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(booking);
        _passportRepoMock.GetByBookingParticipantIdAsync(participant.Id, Arg.Any<CancellationToken>())
            .Returns(passport);
        _visaRepoMock.GetByBookingParticipantIdAsync(participant.Id, Arg.Any<CancellationToken>())
            .Returns(new List<VisaApplicationEntity>());

        var command = new RequestVisaSupportCommand(booking.Id, participant.Id);

        VisaApplicationEntity savedApplication = null!;
        await _visaRepoMock.AddAsync(Arg.Do<VisaApplicationEntity>(app => savedApplication = app), Arg.Any<CancellationToken>());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        savedApplication.Should().NotBeNull();
        savedApplication.DestinationCountry.Should().BeNull();
        savedApplication.IsSystemAssisted.Should().BeTrue();
    }
}
