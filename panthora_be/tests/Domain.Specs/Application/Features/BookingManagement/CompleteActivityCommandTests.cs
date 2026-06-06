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
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement;

public sealed class CompleteActivityCommandTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly ITourDayActivityStatusRepository _tourDayActivityStatusRepository = Substitute.For<ITourDayActivityStatusRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly IOwnershipValidator _ownershipValidator = Substitute.For<IOwnershipValidator>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly CompleteActivityCommandHandler _handler;

    public CompleteActivityCommandTests()
    {
        _handler = new CompleteActivityCommandHandler(
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
    public async Task Handle_StatusDoesNotExist_LazyCreatesAndFastForwardsToCompleted()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourDayId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        var booking = BookingEntity.Create(tourInstanceId, "Jane Doe", "+84987654321", 2, 2000000m, PaymentMethod.Momo, true, "TEST");
        booking.Id = bookingId;
        booking.UserId = Guid.NewGuid();

        _bookingRepository.GetByIdAsync(bookingId).Returns(booking);

        _tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(bookingId, tourDayId)
            .Returns((TourDayActivityStatusEntity?)null);

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            Status = TourInstanceStatus.InProgress,
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new()
                {
                    TourDayId = tourDayId,
                    Activities = new List<TourInstanceDayActivityEntity>
                    {
                        new() { Id = activityId }
                    }
                }
            }
        };
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        _bookingRepository.GetByTourInstanceIdAsync(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        var command = new CompleteActivityCommand(bookingId, tourDayId, DateTimeOffset.UtcNow, activityId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        await _tourDayActivityStatusRepository.Received(1).AddAsync(Arg.Is<TourDayActivityStatusEntity>(s =>
            s.BookingId == bookingId &&
            s.TourDayId == tourDayId &&
            s.ActivityStatus == ActivityStatus.Completed &&
            s.Note != null && s.Note.Contains(activityId.ToString())));
        _tourDayActivityStatusRepository.DidNotReceive().Update(Arg.Any<TourDayActivityStatusEntity>());
    }

    [Fact]
    public async Task Handle_AllActivitiesCompleted_AutoTransitionsTourToCompleted()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourDayId1 = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        var booking = BookingEntity.Create(tourInstanceId, "Jane Doe", "+84987654321", 2, 2000000m, PaymentMethod.Momo, true, "TEST");
        booking.Id = bookingId;
        booking.Status = BookingStatus.Paid;

        _bookingRepository.GetByIdAsync(bookingId).Returns(booking);

        var status = TourDayActivityStatusEntity.Create(bookingId, tourDayId1, "SYSTEM");
        status.Start("SYSTEM");
        _tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(bookingId, tourDayId1)
            .Returns(status);

        var tourInstance = TourInstanceEntity.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Test Tour", "Test Operator", "TEST-CODE", "Standard",
            TourType.Public, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 20, 1500m, "system"
        );
        tourInstance.Status = TourInstanceStatus.InProgress;
        tourInstance.InstanceDays = new List<TourInstanceDayEntity>
        {
            TourInstanceDayEntity.Create(tourInstanceId, tourDayId1, 1, DateOnly.FromDateTime(DateTime.Today), "Day 1", "system")
        };

        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        _bookingRepository.GetByTourInstanceIdAsync(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        var finalStatus = new TourDayActivityStatusEntity { BookingId = bookingId, TourDayId = tourDayId1, ActivityStatus = ActivityStatus.Completed };
        _tourDayActivityStatusRepository.GetByBookingIdsAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new List<TourDayActivityStatusEntity> { finalStatus });

        var command = new CompleteActivityCommand(bookingId, tourDayId1, DateTimeOffset.UtcNow);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        tourInstance.Status.Should().Be(TourInstanceStatus.Completed);
        await _tourInstanceRepository.Received(1).Update(tourInstance, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SomeActivitiesRemaining_DoesNotTransitionTour()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourDayId1 = Guid.NewGuid();
        var tourDayId2 = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        var booking = BookingEntity.Create(tourInstanceId, "Jane Doe", "+84987654321", 2, 2000000m, PaymentMethod.Momo, true, "TEST");
        booking.Id = bookingId;
        booking.Status = BookingStatus.Paid;

        _bookingRepository.GetByIdAsync(bookingId).Returns(booking);

        var status1 = TourDayActivityStatusEntity.Create(bookingId, tourDayId1, "SYSTEM");
        status1.Start("SYSTEM");
        _tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(bookingId, tourDayId1)
            .Returns(status1);

        var tourInstance = TourInstanceEntity.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Test Tour", "Test Operator", "TEST-CODE", "Standard",
            TourType.Public, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 20, 1500m, "system"
        );
        tourInstance.Status = TourInstanceStatus.InProgress;
        tourInstance.InstanceDays = new List<TourInstanceDayEntity>
        {
            TourInstanceDayEntity.Create(tourInstanceId, tourDayId1, 1, DateOnly.FromDateTime(DateTime.Today), "Day 1", "system"),
            TourInstanceDayEntity.Create(tourInstanceId, tourDayId2, 2, DateOnly.FromDateTime(DateTime.Today.AddDays(1)), "Day 2", "system")
        };

        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        _bookingRepository.GetByTourInstanceIdAsync(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        // Day 2 is still NotStarted
        var statusList = new List<TourDayActivityStatusEntity>
        {
            new() { BookingId = bookingId, TourDayId = tourDayId1, ActivityStatus = ActivityStatus.Completed },
            new() { BookingId = bookingId, TourDayId = tourDayId2, ActivityStatus = ActivityStatus.NotStarted }
        };
        _tourDayActivityStatusRepository.GetByBookingIdsAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(statusList);

        var command = new CompleteActivityCommand(bookingId, tourDayId1, DateTimeOffset.UtcNow);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        tourInstance.Status.Should().Be(TourInstanceStatus.InProgress);
        await _tourInstanceRepository.DidNotReceive().Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CancelledActivityCountsAsCompleted_TransitionsTourToCompleted()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourDayId1 = Guid.NewGuid();
        var tourDayId2 = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        var booking = BookingEntity.Create(tourInstanceId, "Jane Doe", "+84987654321", 2, 2000000m, PaymentMethod.Momo, true, "TEST");
        booking.Id = bookingId;
        booking.Status = BookingStatus.Paid;

        _bookingRepository.GetByIdAsync(bookingId).Returns(booking);

        var status1 = TourDayActivityStatusEntity.Create(bookingId, tourDayId1, "SYSTEM");
        status1.Start("SYSTEM");
        _tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(bookingId, tourDayId1)
            .Returns(status1);

        var tourInstance = TourInstanceEntity.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Test Tour", "Test Operator", "TEST-CODE", "Standard",
            TourType.Public, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 20, 1500m, "system"
        );
        tourInstance.Status = TourInstanceStatus.InProgress;
        tourInstance.InstanceDays = new List<TourInstanceDayEntity>
        {
            TourInstanceDayEntity.Create(tourInstanceId, tourDayId1, 1, DateOnly.FromDateTime(DateTime.Today), "Day 1", "system"),
            TourInstanceDayEntity.Create(tourInstanceId, tourDayId2, 2, DateOnly.FromDateTime(DateTime.Today.AddDays(1)), "Day 2", "system")
        };

        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        _bookingRepository.GetByTourInstanceIdAsync(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        // Day 2 is Cancelled
        var statusList = new List<TourDayActivityStatusEntity>
        {
            new() { BookingId = bookingId, TourDayId = tourDayId1, ActivityStatus = ActivityStatus.Completed },
            new() { BookingId = bookingId, TourDayId = tourDayId2, ActivityStatus = ActivityStatus.Cancelled }
        };
        _tourDayActivityStatusRepository.GetByBookingIdsAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(statusList);

        var command = new CompleteActivityCommand(bookingId, tourDayId1, DateTimeOffset.UtcNow);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        tourInstance.Status.Should().Be(TourInstanceStatus.Completed);
    }

    [Fact]
    public async Task Handle_OnlyOneOfTwoActivitiesCompleted_DoesNotCompleteDayStatus()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourDayId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();
        var activityId1 = Guid.NewGuid();
        var activityId2 = Guid.NewGuid();

        var booking = BookingEntity.Create(tourInstanceId, "Jane Doe", "+84987654321", 2, 2000000m, PaymentMethod.Momo, true, "TEST");
        booking.Id = bookingId;
        booking.UserId = Guid.NewGuid();

        _bookingRepository.GetByIdAsync(bookingId).Returns(booking);

        _tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(bookingId, tourDayId)
            .Returns((TourDayActivityStatusEntity?)null);

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            Status = TourInstanceStatus.InProgress,
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new()
                {
                    TourDayId = tourDayId,
                    Activities = new List<TourInstanceDayActivityEntity>
                    {
                        new() { Id = activityId1 },
                        new() { Id = activityId2 }
                    }
                }
            }
        };
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        _bookingRepository.GetByTourInstanceIdAsync(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        var command = new CompleteActivityCommand(bookingId, tourDayId, DateTimeOffset.UtcNow, activityId1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        await _tourDayActivityStatusRepository.Received(1).AddAsync(Arg.Is<TourDayActivityStatusEntity>(s =>
            s.BookingId == bookingId &&
            s.TourDayId == tourDayId &&
            s.ActivityStatus == ActivityStatus.InProgress && // remains InProgress
            s.Note != null && s.Note.Contains(activityId1.ToString())));
    }
}
