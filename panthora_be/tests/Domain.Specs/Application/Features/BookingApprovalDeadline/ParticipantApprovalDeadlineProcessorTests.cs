using Application.Common.Constant;
using Application.Features.BookingApprovalDeadline;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Mails;
using Domain.UnitOfWork;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.BookingApprovalDeadline;

public class ParticipantApprovalDeadlineProcessorTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly IConfiguration _configuration = Substitute.For<IConfiguration>();
    private readonly ILogger<ParticipantApprovalDeadlineProcessor> _logger = Substitute.For<ILogger<ParticipantApprovalDeadlineProcessor>>();
    private readonly ParticipantApprovalDeadlineProcessor _sut;

    public ParticipantApprovalDeadlineProcessorTests()
    {
        _unitOfWork.ExecuteTransactionAsync(
            Arg.Any<System.Data.IsolationLevel>(),
            Arg.Any<Func<Task>>())
            .Returns(async call =>
            {
                var action = call.Arg<Func<Task>>();
                await action();
            });

        _configuration["App:BaseUrl"].Returns("https://test.com");

        _sut = new ParticipantApprovalDeadlineProcessor(
            _bookingRepository,
            _unitOfWork,
            _mailRepository,
            _configuration,
            _logger);
    }

    private static BookingEntity CreateBooking(BookingStatus status, DateTimeOffset startDate)
    {
        var booking = BookingEntity.Create(
            Guid.NewGuid(), "Test Customer", "+84123456789", 2, 1000000m, PaymentMethod.VnPay, true, "TEST");
        booking.Status = status;

        var tourInstance = new TourInstanceEntity
        {
            Id = booking.TourInstanceId,
            TourName = "Test Tour",
            StartDate = startDate,
            EndDate = startDate.AddDays(5),
            Status = TourInstanceStatus.Available
        };
        booking.TourInstance = tourInstance;

        return booking;
    }

    [Fact]
    public async Task SendWarningsAsync_WhenBookingIsEligible_ShouldMarkWarningAndQueueMail()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var tourStart = now.AddDays(2).AddHours(-2); // T-1.9 days, inside warning window
        var booking = CreateBooking(BookingStatus.Paid, tourStart);
        booking.CustomerEmail = "customer@test.com";

        // Add an unapproved participant
        var participant = BookingParticipantEntity.Create(
            bookingId: booking.Id,
            participantType: "Adult",
            fullName: "John Doe",
            performedBy: "SYSTEM",
            dateOfBirth: DateTimeOffset.UtcNow.AddYears(-30),
            gender: GenderType.Male,
            nationality: "US");
        participant.InfoReviewStatus = ParticipantInfoReviewStatus.NotReviewed;
        booking.BookingParticipants.Add(participant);

        _bookingRepository.ListBookingsForApprovalWarningSweepAsync(Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        _bookingRepository.GetByIdWithDetailsAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(booking);

        // Act
        var result = await _sut.SendWarningsAsync(now, CancellationToken.None);

        // Assert
        Assert.Equal(1, result);
        Assert.NotNull(booking.ApprovalWarningSentAt);
        await _mailRepository.Received(1).AddWithoutSaveAsync(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SendWarningsAsync_WhenAlreadyWarningSent_ShouldSkip()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var tourStart = now.AddDays(2).AddHours(-2);
        var booking = CreateBooking(BookingStatus.Paid, tourStart);
        booking.MarkApprovalWarningSent("system");

        _bookingRepository.ListBookingsForApprovalWarningSweepAsync(Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        // Act
        var result = await _sut.SendWarningsAsync(now, CancellationToken.None);

        // Assert
        Assert.Equal(0, result);
        await _mailRepository.DidNotReceive().AddWithoutSaveAsync(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SendWarningsAsync_WhenNoUnapprovedParticipants_ShouldSkip()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var tourStart = now.AddDays(2).AddHours(-2);
        var booking = CreateBooking(BookingStatus.Paid, tourStart);

        // All approved
        var participant = BookingParticipantEntity.Create(
            bookingId: booking.Id,
            participantType: "Adult",
            fullName: "John Doe",
            performedBy: "SYSTEM",
            dateOfBirth: DateTimeOffset.UtcNow.AddYears(-30),
            gender: GenderType.Male,
            nationality: "US");
        participant.InfoReviewStatus = ParticipantInfoReviewStatus.Approved;
        booking.BookingParticipants.Add(participant);

        _bookingRepository.ListBookingsForApprovalWarningSweepAsync(Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        // Act
        var result = await _sut.SendWarningsAsync(now, CancellationToken.None);

        // Assert
        Assert.Equal(0, result);
    }

    [Fact]
    public async Task AutoCancelExpiredAsync_WhenDeadlinePassed_ShouldCancelBookingAndQueueMail()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var tourStart = now.AddHours(23); // T-0.9 days, past T-1 deadline
        var booking = CreateBooking(BookingStatus.Paid, tourStart);
        booking.CustomerEmail = "customer@test.com";

        var participant = BookingParticipantEntity.Create(
            bookingId: booking.Id,
            participantType: "Adult",
            fullName: "John Doe",
            performedBy: "SYSTEM",
            dateOfBirth: DateTimeOffset.UtcNow.AddYears(-30),
            gender: GenderType.Male,
            nationality: "US");
        participant.InfoReviewStatus = ParticipantInfoReviewStatus.NotReviewed;
        booking.BookingParticipants.Add(participant);

        _bookingRepository.ListBookingsForApprovalAutoCancelSweepAsync(Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        _bookingRepository.GetByIdWithDetailsAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(booking);

        // Act
        var result = await _sut.AutoCancelExpiredAsync(now, CancellationToken.None);

        // Assert
        Assert.Equal(1, result);
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.Equal(RefundStatus.NotApplicable, booking.RefundStatus);
        Assert.Equal(ErrorConstants.BookingApprovalDeadline.AutoCancelReasonCode, booking.CancelReason);
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task AutoCancelExpiredAsync_WhenAlreadyCancelled_ShouldSkip()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var tourStart = now.AddHours(23);
        var booking = CreateBooking(BookingStatus.Cancelled, tourStart);

        _bookingRepository.ListBookingsForApprovalAutoCancelSweepAsync(Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(new List<BookingEntity> { booking });

        // Act
        var result = await _sut.AutoCancelExpiredAsync(now, CancellationToken.None);

        // Assert
        Assert.Equal(0, result);
    }
}
