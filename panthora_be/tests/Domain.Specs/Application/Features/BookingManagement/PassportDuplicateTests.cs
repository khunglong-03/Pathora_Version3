using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Features.VisaApplication.Commands;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement;

public class PassportDuplicateTests
{
    private readonly IBookingRepository _bookingRepoMock = Substitute.For<IBookingRepository>();
    private readonly IPassportRepository _passportRepoMock = Substitute.For<IPassportRepository>();
    private readonly ICurrentUser _currentUserMock = Substitute.For<ICurrentUser>();
    private readonly IUnitOfWork _uowMock = Substitute.For<IUnitOfWork>();
    private readonly ILanguageContext _languageContextMock = Substitute.For<ILanguageContext>();

    public PassportDuplicateTests()
    {
        _languageContextMock.CurrentLanguage.Returns("vi");
        _currentUserMock.Id.Returns(Guid.NewGuid());
        _uowMock.ExecuteTransactionAsync(Arg.Any<IsolationLevel>(), Arg.Any<Func<Task>>())
            .Returns(async x => await ((Func<Task>)x[1])());
    }

    [Fact]
    public async Task UpdateCustomerPassport_WhenPassportNumberDuplicatedAcrossDifferentParticipants_ReturnsConflict()
    {
        // Arrange
        var handler = new UpdateCustomerPassportCommandHandler(
            _bookingRepoMock,
            _passportRepoMock,
            _currentUserMock,
            _uowMock,
            _languageContextMock);

        var bookingId = Guid.NewGuid();
        var participantIdB = Guid.NewGuid();
        var participantIdA = Guid.NewGuid();

        var tourInstance = TourInstanceEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "system");
        var booking = BookingEntity.Create(tourInstance.Id, "Customer Name", "0123456789", 1, 1000m, PaymentMethod.VnPay, true, "system", _currentUserMock.Id);
        booking.TourInstance = tourInstance;

        var participantA = BookingParticipantEntity.Create(booking.Id, "Adult", "Passenger A", "system");
        participantA.Id = participantIdA;
        var participantB = BookingParticipantEntity.Create(booking.Id, "Adult", "Passenger B", "system");
        participantB.Id = participantIdB;

        booking.BookingParticipants.Add(participantA);
        booking.BookingParticipants.Add(participantB);

        var existingPassportA = PassportEntity.Create(participantIdA, "DUPTEST1", "system");

        _bookingRepoMock.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);
        _passportRepoMock.GetByBookingParticipantIdAsync(participantIdB, Arg.Any<CancellationToken>()).Returns((PassportEntity?)null);
        _passportRepoMock.GetByPassportNumberAsync("DUPTEST1", Arg.Any<CancellationToken>()).Returns(existingPassportA);

        var command = new UpdateCustomerPassportCommand(
            bookingId,
            participantIdB,
            "DUPTEST1",
            "VN",
            DateTimeOffset.UtcNow.AddYears(-1),
            DateTimeOffset.UtcNow.AddYears(5),
            "https://file/url");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be(ErrorConstants.Passport.DuplicateNumberCode);
    }

    [Fact]
    public async Task UpdateCustomerPassport_WhenSelfUpdateSamePassportNumber_ReturnsSuccess()
    {
        // Arrange
        var handler = new UpdateCustomerPassportCommandHandler(
            _bookingRepoMock,
            _passportRepoMock,
            _currentUserMock,
            _uowMock,
            _languageContextMock);

        var bookingId = Guid.NewGuid();
        var participantId = Guid.NewGuid();

        var tourInstance = TourInstanceEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "system");
        var booking = BookingEntity.Create(tourInstance.Id, "Customer Name", "0123456789", 1, 1000m, PaymentMethod.VnPay, true, "system", _currentUserMock.Id);
        booking.TourInstance = tourInstance;

        var participant = BookingParticipantEntity.Create(booking.Id, "Adult", "Passenger A", "system");
        participant.Id = participantId;
        booking.BookingParticipants.Add(participant);

        var existingPassport = PassportEntity.Create(participantId, "DUPTEST1", "system");

        _bookingRepoMock.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);
        _passportRepoMock.GetByBookingParticipantIdAsync(participantId, Arg.Any<CancellationToken>()).Returns(existingPassport);
        _passportRepoMock.GetByPassportNumberAsync("DUPTEST1", Arg.Any<CancellationToken>()).Returns(existingPassport);

        var command = new UpdateCustomerPassportCommand(
            bookingId,
            participantId,
            "DUPTEST1",
            "VN",
            DateTimeOffset.UtcNow.AddYears(-1),
            DateTimeOffset.UtcNow.AddYears(5),
            "https://file/url");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(existingPassport.Id);
    }

    [Fact]
    public async Task UpdateCustomerPassport_WhenPassportNumberEmpty_NormalizesToNullAndSaves()
    {
        // Arrange
        var handler = new UpdateCustomerPassportCommandHandler(
            _bookingRepoMock,
            _passportRepoMock,
            _currentUserMock,
            _uowMock,
            _languageContextMock);

        var bookingId = Guid.NewGuid();
        var participantId = Guid.NewGuid();

        var tourInstance = TourInstanceEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "system");
        var booking = BookingEntity.Create(tourInstance.Id, "Customer Name", "0123456789", 1, 1000m, PaymentMethod.VnPay, true, "system", _currentUserMock.Id);
        booking.TourInstance = tourInstance;

        var participant = BookingParticipantEntity.Create(booking.Id, "Adult", "Passenger A", "system");
        participant.Id = participantId;
        booking.BookingParticipants.Add(participant);

        _bookingRepoMock.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);
        _passportRepoMock.GetByBookingParticipantIdAsync(participantId, Arg.Any<CancellationToken>()).Returns((PassportEntity?)null);

        PassportEntity? savedPassport = null;
        await _passportRepoMock.AddAsync(Arg.Do<PassportEntity>(p => savedPassport = p), Arg.Any<CancellationToken>());

        var command = new UpdateCustomerPassportCommand(
            bookingId,
            participantId,
            "", // Empty Passport Number
            "VN",
            DateTimeOffset.UtcNow.AddYears(-1),
            DateTimeOffset.UtcNow.AddYears(5),
            "https://file/url");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        savedPassport.Should().NotBeNull();
        savedPassport!.PassportNumber.Should().BeNull();
    }

    [Fact]
    public async Task UpdateCustomerPassport_WhenPassportNumberLowercaseAndSpaced_NormalizesAndChecksConflict()
    {
        // Arrange
        var handler = new UpdateCustomerPassportCommandHandler(
            _bookingRepoMock,
            _passportRepoMock,
            _currentUserMock,
            _uowMock,
            _languageContextMock);

        var bookingId = Guid.NewGuid();
        var participantIdB = Guid.NewGuid();
        var participantIdA = Guid.NewGuid();

        var tourInstance = TourInstanceEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "system");
        var booking = BookingEntity.Create(tourInstance.Id, "Customer Name", "0123456789", 1, 1000m, PaymentMethod.VnPay, true, "system", _currentUserMock.Id);
        booking.TourInstance = tourInstance;

        var participantA = BookingParticipantEntity.Create(booking.Id, "Adult", "Passenger A", "system");
        participantA.Id = participantIdA;
        var participantB = BookingParticipantEntity.Create(booking.Id, "Adult", "Passenger B", "system");
        participantB.Id = participantIdB;

        booking.BookingParticipants.Add(participantA);
        booking.BookingParticipants.Add(participantB);

        var existingPassportA = PassportEntity.Create(participantIdA, "DUPTEST1", "system");

        _bookingRepoMock.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);
        _passportRepoMock.GetByBookingParticipantIdAsync(participantIdB, Arg.Any<CancellationToken>()).Returns((PassportEntity?)null);
        _passportRepoMock.GetByPassportNumberAsync("DUPTEST1", Arg.Any<CancellationToken>()).Returns(existingPassportA);

        var command = new UpdateCustomerPassportCommand(
            bookingId,
            participantIdB,
            " duptest1 ", // lowercase and with spaces
            "VN",
            DateTimeOffset.UtcNow.AddYears(-1),
            DateTimeOffset.UtcNow.AddYears(5),
            "https://file/url");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be(ErrorConstants.Passport.DuplicateNumberCode);
    }
}
