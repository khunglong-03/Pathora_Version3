using Application.Common.Constant;
using Application.Features.BookingManagement.Participant;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Events;
using Domain.UnitOfWork;
using ErrorOr;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using System.Data;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement;

public class ParticipantReviewCommandsTests
{
    private readonly IBookingRepository _bookingRepoMock = Substitute.For<IBookingRepository>();
    private readonly IBookingParticipantRepository _participantRepoMock = Substitute.For<IBookingParticipantRepository>();
    private readonly IBookingTourGuideRepository _tourGuideRepoMock = Substitute.For<IBookingTourGuideRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepoMock = Substitute.For<ITourInstanceRepository>();
    private readonly ITourRepository _tourRepoMock = Substitute.For<ITourRepository>();
    private readonly IUnitOfWork _uowMock = Substitute.For<IUnitOfWork>();
    private readonly IUser _currentUserMock = Substitute.For<IUser>();

    private readonly Guid _bookingId = Guid.NewGuid();
    private readonly Guid _participantId = Guid.NewGuid();
    private readonly Guid _operatorId = Guid.NewGuid();

    public ParticipantReviewCommandsTests()
    {
        _currentUserMock.Id.Returns(_operatorId.ToString());
        
        // Setup mock transactions to run synchronous callback immediately
        _uowMock.ExecuteTransactionAsync(Arg.Any<IsolationLevel>(), Arg.Any<Func<Task>>())
            .Returns(async callInfo =>
            {
                var func = callInfo.Arg<Func<Task>>();
                await func();
            });
    }

    private (BookingEntity Booking, BookingParticipantEntity Participant) SetupHappyPathEntities(
        BookingStatus bookingStatus = BookingStatus.Confirmed,
        ReservationStatus participantStatus = ReservationStatus.Pending)
    {
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

        var booking = BookingEntity.Create(
            tourInstance.Id, 
            "Customer Name", 
            "0901234567", 
            2, 
            3000m, 
            PaymentMethod.BankTransfer, 
            false, 
            "system", 
            Guid.NewGuid()
        );
        booking.Status = bookingStatus;
        booking.CustomerEmail = "customer@example.com";

        var participant = BookingParticipantEntity.Create(booking.Id, "Adult", "John Doe", "system");
        // Reflection or setter to set specific Guid ID if needed, but entity has Id parameterless setter or generated
        // Since we are mocking repository lookup, we can control the IDs returned.
        participant.Status = participantStatus;

        return (booking, participant);
    }

    [Fact]
    public async Task ReviewParticipantInfo_Approve_HappyPath_ReturnsSuccess()
    {
        // Arrange
        var (booking, participant) = SetupHappyPathEntities();
        _bookingRepoMock.GetByIdAsync(_bookingId).Returns(booking);
        _participantRepoMock.GetByIdAsync(_participantId).Returns(participant);
        
        // Set participant.BookingId to request.BookingId to pass oracle check
        participant.BookingId = _bookingId;

        // Mock TourOperator team membership
        var tourGuideAssignment = new BookingTourGuideEntity
        {
            BookingId = _bookingId,
            UserId = _operatorId,
            AssignedRole = AssignedRole.TourOperator,
            Status = AssignmentStatus.Confirmed
        };
        _tourGuideRepoMock.GetByBookingIdAsync(_bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingTourGuideEntity> { tourGuideAssignment });

        var handler = new ReviewParticipantInfoCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _tourGuideRepoMock,
            _tourInstanceRepoMock,
            _tourRepoMock,
            _uowMock,
            _currentUserMock
        );

        var command = new ReviewParticipantInfoCommand(_bookingId, _participantId, true, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        participant.InfoReviewStatus.Should().Be(ParticipantInfoReviewStatus.Approved);
        participant.InfoRejectionReason.Should().BeNull();
        participant.InfoReviewedBy.Should().Be(_operatorId);
        
        _participantRepoMock.Received(1).Update(participant);
        await _uowMock.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ReviewParticipantInfo_Reject_HappyPath_RaisesDomainEvent()
    {
        // Arrange
        var (booking, participant) = SetupHappyPathEntities();
        _bookingRepoMock.GetByIdAsync(_bookingId).Returns(booking);
        _participantRepoMock.GetByIdAsync(_participantId).Returns(participant);
        participant.BookingId = _bookingId;

        var tourGuideAssignment = new BookingTourGuideEntity
        {
            BookingId = _bookingId,
            UserId = _operatorId,
            AssignedRole = AssignedRole.TourOperator,
            Status = AssignmentStatus.Confirmed
        };
        _tourGuideRepoMock.GetByBookingIdAsync(_bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingTourGuideEntity> { tourGuideAssignment });

        var handler = new ReviewParticipantInfoCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _tourGuideRepoMock,
            _tourInstanceRepoMock,
            _tourRepoMock,
            _uowMock,
            _currentUserMock
        );

        var command = new ReviewParticipantInfoCommand(_bookingId, _participantId, false, "Passport photo blurry");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        participant.InfoReviewStatus.Should().Be(ParticipantInfoReviewStatus.Rejected);
        participant.InfoRejectionReason.Should().Be("Passport photo blurry");
        participant.DomainEvents.Should().ContainSingle(e => e is ParticipantInfoRejectedEvent);
    }

    [Fact]
    public async Task ReviewParticipantInfo_ParticipantIdMismatchBookingId_ReturnsNotFound()
    {
        // Arrange
        var (booking, participant) = SetupHappyPathEntities();
        _bookingRepoMock.GetByIdAsync(_bookingId).Returns(booking);
        _participantRepoMock.GetByIdAsync(_participantId).Returns(participant);
        
        // Introduce mismatch
        participant.BookingId = Guid.NewGuid(); 

        var handler = new ReviewParticipantInfoCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _tourGuideRepoMock,
            _tourInstanceRepoMock,
            _tourRepoMock,
            _uowMock,
            _currentUserMock
        );

        var command = new ReviewParticipantInfoCommand(_bookingId, _participantId, true, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be(ErrorConstants.BookingParticipant.NotFoundCode);
    }

    [Fact]
    public async Task ReviewParticipantInfo_ParticipantCancelled_ReturnsConflict()
    {
        // Arrange
        var (booking, participant) = SetupHappyPathEntities(participantStatus: ReservationStatus.Cancelled);
        _bookingRepoMock.GetByIdAsync(_bookingId).Returns(booking);
        _participantRepoMock.GetByIdAsync(_participantId).Returns(participant);
        participant.BookingId = _bookingId;

        var handler = new ReviewParticipantInfoCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _tourGuideRepoMock,
            _tourInstanceRepoMock,
            _tourRepoMock,
            _uowMock,
            _currentUserMock
        );

        var command = new ReviewParticipantInfoCommand(_bookingId, _participantId, true, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be(ErrorConstants.ParticipantInfoReview.ParticipantCancelledCode);
    }

    [Fact]
    public async Task ReviewParticipantInfo_BookingCancelledOrCompleted_ReturnsConflict()
    {
        // Arrange
        var (booking, participant) = SetupHappyPathEntities(bookingStatus: BookingStatus.Cancelled);
        _bookingRepoMock.GetByIdAsync(_bookingId).Returns(booking);
        _participantRepoMock.GetByIdAsync(_participantId).Returns(participant);
        participant.BookingId = _bookingId;

        var handler = new ReviewParticipantInfoCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _tourGuideRepoMock,
            _tourInstanceRepoMock,
            _tourRepoMock,
            _uowMock,
            _currentUserMock
        );

        var command = new ReviewParticipantInfoCommand(_bookingId, _participantId, true, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be(ErrorConstants.ParticipantInfoReview.BookingNotReviewableCode);
    }

    [Fact]
    public async Task ReviewParticipantInfo_OperatorNotOnTeam_ReturnsForbidden()
    {
        // Arrange
        var (booking, participant) = SetupHappyPathEntities();
        _bookingRepoMock.GetByIdAsync(_bookingId).Returns(booking);
        _participantRepoMock.GetByIdAsync(_participantId).Returns(participant);
        participant.BookingId = _bookingId;

        // No tour guide assignments
        _tourGuideRepoMock.GetByBookingIdAsync(_bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingTourGuideEntity>());

        var handler = new ReviewParticipantInfoCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _tourGuideRepoMock,
            _tourInstanceRepoMock,
            _tourRepoMock,
            _uowMock,
            _currentUserMock
        );

        var command = new ReviewParticipantInfoCommand(_bookingId, _participantId, true, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be(ErrorConstants.ParticipantInfoReview.NotAssignedTourOperatorCode);
    }

    [Fact]
    public async Task ReviewParticipantInfo_BenignConcurrencyConflict_RetriesAndSucceeds()
    {
        // Arrange
        var (booking, participant) = SetupHappyPathEntities();
        _bookingRepoMock.GetByIdAsync(_bookingId).Returns(booking);
        _participantRepoMock.GetByIdAsync(_participantId).Returns(participant);
        participant.BookingId = _bookingId;

        var tourGuideAssignment = new BookingTourGuideEntity
        {
            BookingId = _bookingId,
            UserId = _operatorId,
            AssignedRole = AssignedRole.TourOperator,
            Status = AssignmentStatus.Confirmed
        };
        _tourGuideRepoMock.GetByBookingIdAsync(_bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingTourGuideEntity> { tourGuideAssignment });

        var handler = new ReviewParticipantInfoCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _tourGuideRepoMock,
            _tourInstanceRepoMock,
            _tourRepoMock,
            _uowMock,
            _currentUserMock
        );

        var command = new ReviewParticipantInfoCommand(_bookingId, _participantId, true, null);

        // Simulate DbUpdateConcurrencyException on first call, but allow reload & save on second call.
        int callCount = 0;
        _uowMock.ExecuteTransactionAsync(Arg.Any<IsolationLevel>(), Arg.Any<Func<Task>>())
            .Returns(async callInfo =>
            {
                callCount++;
                if (callCount == 1)
                {
                    throw new DbUpdateConcurrencyException("Concurrency conflict");
                }
                var func = callInfo.Arg<Func<Task>>();
                await func();
            });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        callCount.Should().Be(2); // Retried once
        participant.InfoReviewStatus.Should().Be(ParticipantInfoReviewStatus.Approved);
    }

    [Fact]
    public async Task BulkApproveParticipantInfo_HappyPath_ApprovesAll()
    {
        // Arrange
        var tourInstance = TourInstanceEntity.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Test Tour", "Test Operator", "TEST-CODE", "Standard", 
            TourType.Public, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 20, 1500m, "system"
        );
        var booking = BookingEntity.Create(tourInstance.Id, "Customer Name", "0901234567", 2, 3000m, PaymentMethod.BankTransfer, false, "system", Guid.NewGuid());
        booking.Status = BookingStatus.Confirmed;

        var p1 = BookingParticipantEntity.Create(booking.Id, "Adult", "P1", "system");
        var p2 = BookingParticipantEntity.Create(booking.Id, "Adult", "P2", "system");
        p1.BookingId = _bookingId;
        p2.BookingId = _bookingId;

        _bookingRepoMock.GetByIdAsync(_bookingId).Returns(booking);
        _participantRepoMock.GetByIdAsync(p1.Id).Returns(p1);
        _participantRepoMock.GetByIdAsync(p2.Id).Returns(p2);

        var tourGuideAssignment = new BookingTourGuideEntity
        {
            BookingId = _bookingId,
            UserId = _operatorId,
            AssignedRole = AssignedRole.TourOperator,
            Status = AssignmentStatus.Confirmed
        };
        _tourGuideRepoMock.GetByBookingIdAsync(_bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingTourGuideEntity> { tourGuideAssignment });

        var handler = new BulkApproveParticipantInfoCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _tourGuideRepoMock,
            _tourInstanceRepoMock,
            _tourRepoMock,
            _uowMock,
            _currentUserMock
        );

        var command = new BulkApproveParticipantInfoCommand(_bookingId, new[] { p1.Id, p2.Id });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().HaveCount(2);
        result.Value.All(r => r.Success).Should().BeTrue();
        p1.InfoReviewStatus.Should().Be(ParticipantInfoReviewStatus.Approved);
        p2.InfoReviewStatus.Should().Be(ParticipantInfoReviewStatus.Approved);
    }

    [Fact]
    public async Task ReviewParticipantInfo_OperatorAssignedToTourInstance_Succeeds()
    {
        // Arrange
        var (booking, participant) = SetupHappyPathEntities();
        _bookingRepoMock.GetByIdAsync(_bookingId).Returns(booking);
        _participantRepoMock.GetByIdAsync(_participantId).Returns(participant);
        participant.BookingId = _bookingId;

        // No direct booking assignments
        _tourGuideRepoMock.GetByBookingIdAsync(_bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingTourGuideEntity>());

        // Mock TourInstance and operator assigned as manager of TourInstance
        var tourInstance = TourInstanceEntity.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Test Tour", "Test Operator", "TEST-CODE", "Standard", 
            TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 20, 1500m, "system"
        );
        var managerAssignment = TourInstanceManagerEntity.Create(tourInstance.Id, _operatorId, TourInstanceManagerRole.Manager, "system");
        tourInstance.Managers.Add(managerAssignment);

        booking.TourInstanceId = tourInstance.Id;
        _tourInstanceRepoMock.FindById(tourInstance.Id, true, Arg.Any<CancellationToken>()).Returns(tourInstance);

        var handler = new ReviewParticipantInfoCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _tourGuideRepoMock,
            _tourInstanceRepoMock,
            _tourRepoMock,
            _uowMock,
            _currentUserMock
        );

        var command = new ReviewParticipantInfoCommand(_bookingId, _participantId, true, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        participant.InfoReviewStatus.Should().Be(ParticipantInfoReviewStatus.Approved);
    }

    [Fact]
    public async Task ReviewParticipantInfo_OperatorAssignedToTour_Succeeds()
    {
        // Arrange
        var (booking, participant) = SetupHappyPathEntities();
        _bookingRepoMock.GetByIdAsync(_bookingId).Returns(booking);
        _participantRepoMock.GetByIdAsync(_participantId).Returns(participant);
        participant.BookingId = _bookingId;

        // No direct booking assignments
        _tourGuideRepoMock.GetByBookingIdAsync(_bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<BookingTourGuideEntity>());

        // Mock TourInstance and operator assigned as manager of Parent Tour
        var tourInstance = TourInstanceEntity.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Test Tour", "Test Operator", "TEST-CODE", "Standard", 
            TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 20, 1500m, "system"
        );
        var tour = TourEntity.Create("Test Tour", "Short", "Long", "system", TourStatus.Pending, TourScope.Domestic, CustomerSegment.Group, tourOperatorId: _operatorId);

        tourInstance.TourId = tour.Id;
        booking.TourInstanceId = tourInstance.Id;
        _tourInstanceRepoMock.FindById(tourInstance.Id, true, Arg.Any<CancellationToken>()).Returns(tourInstance);
        _tourRepoMock.FindById(tour.Id, true, Arg.Any<CancellationToken>()).Returns(tour);

        var handler = new ReviewParticipantInfoCommandHandler(
            _bookingRepoMock,
            _participantRepoMock,
            _tourGuideRepoMock,
            _tourInstanceRepoMock,
            _tourRepoMock,
            _uowMock,
            _currentUserMock
        );

        var command = new ReviewParticipantInfoCommand(_bookingId, _participantId, true, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        participant.InfoReviewStatus.Should().Be(ParticipantInfoReviewStatus.Approved);
    }
}
