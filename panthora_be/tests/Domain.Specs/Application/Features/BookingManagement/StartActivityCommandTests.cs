using Application.Features.BookingManagement.ActivityStatus;
using Application.Services;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentAssertions;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement;

public sealed class StartActivityCommandTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly ITourDayActivityStatusRepository _tourDayActivityStatusRepository = Substitute.For<ITourDayActivityStatusRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly IOwnershipValidator _ownershipValidator = Substitute.For<IOwnershipValidator>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly StartActivityCommandHandler _handler;

    public StartActivityCommandTests()
    {
        _handler = new StartActivityCommandHandler(
            _bookingRepository,
            _tourDayActivityStatusRepository,
            _tourInstanceRepository,
            _ownershipValidator,
            _user,
            _unitOfWork);

        _unitOfWork.ExecuteTransactionAsync(Arg.Any<IsolationLevel>(), Arg.Any<Func<Task>>())
            .Returns(async callInfo =>
            {
                var func = callInfo.Arg<Func<Task>>();
                await func();
            });

        _ownershipValidator.CanAccessAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(true);
    }

    [Fact]
    public async Task Handle_StatusDoesNotExist_LazyCreatesStatusAndStartsSuccessfully()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourDayId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        var booking = BookingEntity.Create(tourInstanceId, "Jane Doe", "+84987654321", 2, 2000000m, PaymentMethod.Momo, true, "TEST");
        booking.Id = bookingId;
        booking.UserId = Guid.NewGuid();

        _bookingRepository.GetByIdAsync(bookingId).Returns(booking);

        _tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(bookingId, tourDayId)
            .Returns((TourDayActivityStatusEntity?)null);

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            Status = TourInstanceStatus.InProgress
        };
        _tourInstanceRepository.FindById(tourInstanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        var activityId = Guid.NewGuid();
        var command = new StartActivityCommand(bookingId, tourDayId, DateTimeOffset.UtcNow, activityId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        await _tourDayActivityStatusRepository.Received(1).AddAsync(Arg.Is<TourDayActivityStatusEntity>(s =>
            s.BookingId == bookingId &&
            s.TourDayId == tourDayId &&
            s.ActivityStatus == ActivityStatus.InProgress &&
            s.Note != null && s.Note.Contains(activityId.ToString())));
        _tourDayActivityStatusRepository.DidNotReceive().Update(Arg.Any<TourDayActivityStatusEntity>());
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_TourIsConfirmed_TransitionsTourToInProgress()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourDayId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var booking = BookingEntity.Create(tourInstanceId, "Jane Doe", "+84987654321", 2, 2000000m, PaymentMethod.Momo, true, "TEST");
        booking.Id = bookingId;
        booking.UserId = userId;

        _bookingRepository.GetByIdAsync(bookingId).Returns(booking);

        var existingStatus = TourDayActivityStatusEntity.Create(bookingId, tourDayId, "SYSTEM");
        _tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(bookingId, tourDayId)
            .Returns(existingStatus);

        var tourInstance = TourInstanceEntity.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Test Tour",
            "Test Operator",
            "TEST-CODE",
            "Standard",
            TourType.Public,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow.AddDays(5),
            20,
            1500m,
            "system"
        );
        tourInstance.Status = TourInstanceStatus.Confirmed;
        _tourInstanceRepository.FindById(tourInstanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        var command = new StartActivityCommand(bookingId, tourDayId, DateTimeOffset.UtcNow);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        tourInstance.Status.Should().Be(TourInstanceStatus.InProgress);
        await _tourInstanceRepository.Received(1).Update(tourInstance, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_TourIsAlreadyInProgress_DoesNotThrowOrReTransition()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourDayId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        var booking = BookingEntity.Create(tourInstanceId, "Jane Doe", "+84987654321", 2, 2000000m, PaymentMethod.Momo, true, "TEST");
        booking.Id = bookingId;
        booking.UserId = Guid.NewGuid();

        _bookingRepository.GetByIdAsync(bookingId).Returns(booking);

        var existingStatus = TourDayActivityStatusEntity.Create(bookingId, tourDayId, "SYSTEM");
        _tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(bookingId, tourDayId)
            .Returns(existingStatus);

        var tourInstance = TourInstanceEntity.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Test Tour",
            "Test Operator",
            "TEST-CODE",
            "Standard",
            TourType.Public,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow.AddDays(5),
            20,
            1500m,
            "system"
        );
        tourInstance.Status = TourInstanceStatus.InProgress;
        _tourInstanceRepository.FindById(tourInstanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        var command = new StartActivityCommand(bookingId, tourDayId, DateTimeOffset.UtcNow);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        tourInstance.Status.Should().Be(TourInstanceStatus.InProgress);
        await _tourInstanceRepository.DidNotReceive().Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>());
    }
}
