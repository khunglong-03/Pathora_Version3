using Application.Common.Interfaces;
using Application.Features.VisaApplication.Queries;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.VisaApplication.Queries;

public class GetCustomerVisaRequirementsQueryHandlerTests
{
    private readonly IBookingRepository _bookingRepoMock = Substitute.For<IBookingRepository>();
    private readonly IPassportRepository _passportRepoMock = Substitute.For<IPassportRepository>();
    private readonly IVisaApplicationRepository _visaAppRepoMock = Substitute.For<IVisaApplicationRepository>();
    private readonly ICurrentUser _currentUserMock = Substitute.For<ICurrentUser>();
    private readonly GetCustomerVisaRequirementsQueryHandler _handler;

    public GetCustomerVisaRequirementsQueryHandlerTests()
    {
        _handler = new GetCustomerVisaRequirementsQueryHandler(
            _bookingRepoMock, _passportRepoMock, _visaAppRepoMock, _currentUserMock);
    }

    [Fact]
    public async Task Handle_WhenAllParticipants_ShouldRequireVisa()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserMock.Id.Returns(userId);

        var tour = new TourEntity { Id = Guid.NewGuid(), TourName = "Tour", IsVisa = true };
        var tourInstance = TourInstanceEntity.Create(tour.Id, Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "TEST");
        tourInstance.Tour = tour;

        var booking = BookingEntity.Create(tourInstance.Id, "Customer", "123", 1, 1000m, PaymentMethod.VnPay, true, "TEST", userId);
        booking.TourInstance = tourInstance;

        // One adult, one child, one missing DOB
        var adult = BookingParticipantEntity.Create(booking.Id, "Adult", "Adult Name", "TEST", DateTimeOffset.UtcNow.AddYears(-30));
        var child = BookingParticipantEntity.Create(booking.Id, "Child", "Child Name", "TEST", DateTimeOffset.UtcNow.AddYears(-5));
        var missingDob = BookingParticipantEntity.Create(booking.Id, "Infant", "No DOB", "TEST", null);

        // Reflection set ids
        typeof(BookingParticipantEntity).GetProperty("Id")!.SetValue(adult, Guid.NewGuid());
        typeof(BookingParticipantEntity).GetProperty("Id")!.SetValue(child, Guid.NewGuid());
        typeof(BookingParticipantEntity).GetProperty("Id")!.SetValue(missingDob, Guid.NewGuid());

        booking.BookingParticipants.Add(adult);
        booking.BookingParticipants.Add(child);
        booking.BookingParticipants.Add(missingDob);

        _bookingRepoMock.GetByIdWithDetailsAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(booking);

        _passportRepoMock.GetByBookingParticipantIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((PassportEntity?)null);

        _visaAppRepoMock.GetByBookingParticipantIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new List<VisaApplicationEntity>());

        var query = new GetCustomerVisaRequirementsQuery(booking.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        result.Value.Participants.Should().HaveCount(3);
        result.Value.Participants.Should().AllSatisfy(p => p.RequiresVisa.Should().BeTrue());
        
        var missingDobDto = result.Value.Participants.First(p => p.FullName == "No DOB");
        missingDobDto.MissingDateOfBirth.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenNotOwner_ShouldReturnForbidden()
    {
        // Arrange
        _currentUserMock.Id.Returns(Guid.NewGuid()); // Not owner

        var tourInstance = TourInstanceEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Title", "Name", "Code", "Class", TourType.Private, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5), 10, 1000m, "TEST");
        var booking = BookingEntity.Create(tourInstance.Id, "Customer", "123", 1, 1000m, PaymentMethod.VnPay, true, "TEST", Guid.NewGuid());
        
        _bookingRepoMock.GetByIdWithDetailsAsync(booking.Id, Arg.Any<CancellationToken>())
            .Returns(booking);

        var query = new GetCustomerVisaRequirementsQuery(booking.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Booking.Forbidden");
    }
}
