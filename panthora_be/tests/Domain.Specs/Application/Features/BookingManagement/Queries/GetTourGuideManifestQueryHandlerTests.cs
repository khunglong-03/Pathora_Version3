using Application.Common.Constant;
using Application.Features.BookingManagement.DTOs;
using Application.Features.BookingManagement.Queries.GetTourGuideManifest;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement.Queries;

public sealed class GetTourGuideManifestQueryHandlerTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly IBookingTourGuideRepository _bookingTourGuideRepository = Substitute.For<IBookingTourGuideRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly MediatR.IPublisher _publisher = Substitute.For<MediatR.IPublisher>();
    private readonly GetTourGuideManifestQueryHandler _handler;

    public GetTourGuideManifestQueryHandlerTests()
    {
        _handler = new GetTourGuideManifestQueryHandler(
            _bookingRepository,
            _bookingTourGuideRepository,
            _tourInstanceRepository,
            _user,
            _publisher);
    }

    [Fact]
    public async Task Handle_TourInstanceNotFound_ReturnsNotFound()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var guideUserId = Guid.NewGuid();

        _tourInstanceRepository.FindById(tourInstanceId, asNoTracking: true, Arg.Any<CancellationToken>())
            .Returns((TourInstanceEntity?)null);

        var query = new GetTourGuideManifestQuery(tourInstanceId, guideUserId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal(ErrorConstants.TourInstance.NotFoundCode, result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_TourGuideNotAssignedAndNotAdminManager_ReturnsForbidden()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var guideUserId = Guid.NewGuid();

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourName = "Test Tour",
            StartDate = DateTimeOffset.UtcNow.AddDays(5),
            EndDate = DateTimeOffset.UtcNow.AddDays(10),
            Status = TourInstanceStatus.Available
        };

        _tourInstanceRepository.FindById(tourInstanceId, asNoTracking: true, Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        _user.Roles.Returns(new List<string> { "TourGuide" });

        // Query returns list of guides
        _bookingTourGuideRepository.GetListAsync(
            Arg.Any<System.Linq.Expressions.Expression<Func<BookingTourGuideEntity, bool>>>(),
            Arg.Any<System.Linq.Expressions.Expression<Func<BookingTourGuideEntity, object>>[]>(),
            Arg.Any<CancellationToken>())
            .Returns(new List<BookingTourGuideEntity>());

        var query = new GetTourGuideManifestQuery(tourInstanceId, guideUserId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Forbidden, result.FirstError.Type);
        Assert.Equal(ErrorConstants.TourGuideManifest.NotAuthorizedCode, result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_TourGuideAssigned_ReturnsManifestWithSafeDataOnly()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var guideUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourName = "Test Tour",
            StartDate = DateTimeOffset.UtcNow.AddDays(5),
            EndDate = DateTimeOffset.UtcNow.AddDays(10),
            Status = TourInstanceStatus.Available
        };

        _tourInstanceRepository.FindById(tourInstanceId, asNoTracking: true, Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        _user.Roles.Returns(new List<string> { "TourGuide" });

        // Assign guide
        var guideAssignment = new BookingTourGuideEntity
        {
            UserId = guideUserId,
            BookingId = bookingId,
            Status = AssignmentStatus.Assigned
        };
        var guideList = new List<BookingTourGuideEntity> { guideAssignment };
        _bookingTourGuideRepository.GetListAsync(
            Arg.Any<System.Linq.Expressions.Expression<Func<BookingTourGuideEntity, bool>>>(),
            Arg.Any<System.Linq.Expressions.Expression<Func<BookingTourGuideEntity, object>>[]>(),
            Arg.Any<CancellationToken>())
            .Returns(guideList);

        // Create booking with active status (Confirmed)
        var booking = BookingEntity.Create(tourInstanceId, "Jane Doe", "+84987654321", 2, 2000000m, PaymentMethod.Momo, true, "TEST");
        booking.Id = bookingId;
        booking.Status = BookingStatus.Confirmed;

        // Add participants: one confirmed, one cancelled
        var participant1 = BookingParticipantEntity.Create(bookingId, "Adult", "Alice Smith", "TEST");
        participant1.Status = ReservationStatus.Confirmed;
        participant1.DateOfBirth = new DateTimeOffset(1990, 5, 15, 0, 0, 0, TimeSpan.Zero);
        participant1.Gender = GenderType.Female;
        participant1.Nationality = "Vietnam";

        var participant2 = BookingParticipantEntity.Create(bookingId, "Adult", "Bob Smith", "TEST");
        participant2.Status = ReservationStatus.Cancelled;

        booking.BookingParticipants = new List<BookingParticipantEntity> { participant1, participant2 };

        _bookingRepository.GetByTourInstanceIdAsync(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        var query = new GetTourGuideManifestQuery(tourInstanceId, guideUserId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var manifest = result.Value;
        Assert.Equal(tourInstanceId, manifest.TourInstanceId);
        Assert.Single(manifest.Bookings);

        var manifestBooking = manifest.Bookings[0];
        Assert.Equal(bookingId, manifestBooking.BookingId);
        Assert.Single(manifestBooking.Participants);

        var participantDto = manifestBooking.Participants[0];
        Assert.Equal("Alice Smith", participantDto.FullName);
        Assert.Equal("Adult", participantDto.ParticipantType);
        Assert.Equal("Female", participantDto.Gender);
        Assert.Equal("Vietnam", participantDto.Nationality);
        Assert.Equal(new DateTimeOffset(1990, 5, 15, 0, 0, 0, TimeSpan.Zero), participantDto.DateOfBirth);

        // Verify there is absolutely no passport/visa properties in DTOs (reflection type check)
        var properties = typeof(TourGuideManifestParticipantDto).GetProperties();
        Assert.DoesNotContain(properties, p => p.Name.Contains("passport", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(properties, p => p.Name.Contains("visa", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Handle_AdminOrManagerNotAssigned_ReturnsManifestSuccessfully()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var adminUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourName = "Test Tour",
            StartDate = DateTimeOffset.UtcNow.AddDays(5),
            EndDate = DateTimeOffset.UtcNow.AddDays(10),
            Status = TourInstanceStatus.Available
        };

        _tourInstanceRepository.FindById(tourInstanceId, asNoTracking: true, Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        _user.Roles.Returns(new List<string> { "Admin" });

        // Booking
        var booking = BookingEntity.Create(tourInstanceId, "John Doe", "+84987654321", 1, 1000000m, PaymentMethod.Momo, true, "TEST");
        booking.Id = bookingId;
        booking.Status = BookingStatus.Paid;

        var participant = BookingParticipantEntity.Create(bookingId, "Adult", "John Doe", "TEST");
        participant.Status = ReservationStatus.Confirmed;
        booking.BookingParticipants = new List<BookingParticipantEntity> { participant };

        _bookingRepository.GetByTourInstanceIdAsync(tourInstanceId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        var query = new GetTourGuideManifestQuery(tourInstanceId, adminUserId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(result.Value.Bookings);
    }
}
