using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Domain.Specs.Domain.Entities;

public class VisaApplicationTests
{
    [Fact]
    public void Create_WithValidData_ReturnsPendingApplication()
    {
        // Arrange
        var participantId = Guid.NewGuid();
        var passportId = Guid.NewGuid();
        
        // Act
        var application = VisaApplicationEntity.Create(
            bookingParticipantId: participantId,
            passportId: passportId,
            destinationCountry: "Japan",
            performedBy: "SYSTEM",
            minReturnDate: DateTimeOffset.UtcNow.AddDays(10),
            visaFileUrl: null,
            isSystemAssisted: false
        );

        // Assert
        application.Status.Should().Be(VisaStatus.Pending);
        application.IsSystemAssisted.Should().BeFalse();
        application.DestinationCountry.Should().Be("Japan");
    }

    [Fact]
    public void QuoteServiceFee_WhenSystemAssisted_SetsFeeAndStatus()
    {
        // Arrange
        var application = VisaApplicationEntity.Create(
            bookingParticipantId: Guid.NewGuid(),
            passportId: Guid.NewGuid(),
            destinationCountry: "Japan",
            performedBy: "SYSTEM",
            minReturnDate: DateTimeOffset.UtcNow.AddDays(10),
            isSystemAssisted: true
        );
        var transactionId = Guid.NewGuid();

        // Act
        application.QuoteServiceFee(50m, transactionId, "Manager");

        // Assert
        application.ServiceFee.Should().Be(50m);
        application.ServiceFeeTransactionId.Should().Be(transactionId);
        application.Status.Should().Be(VisaStatus.Pending); // Status not changed to processing until paid
    }

    [Fact]
    public void MarkServiceFeePaid_WhenQuoted_SetsPaidStatus()
    {
        // Arrange
        var application = VisaApplicationEntity.Create(
            bookingParticipantId: Guid.NewGuid(),
            passportId: Guid.NewGuid(),
            destinationCountry: "Japan",
            performedBy: "SYSTEM",
            minReturnDate: DateTimeOffset.UtcNow.AddDays(10),
            isSystemAssisted: true
        );
        var transactionId = Guid.NewGuid();
        application.QuoteServiceFee(50m, transactionId, "Manager");

        // Act
        application.MarkServiceFeePaid(transactionId, "SYSTEM");

        // Assert
        application.ServiceFeePaidAt.Should().NotBeNull();
        application.Status.Should().Be(VisaStatus.Pending);
    }

    [Fact]
    public void Update_WhenApproved_UpdatesProperties()
    {
        // Arrange
        var application = VisaApplicationEntity.Create(
            bookingParticipantId: Guid.NewGuid(),
            passportId: Guid.NewGuid(),
            destinationCountry: "Japan",
            performedBy: "SYSTEM",
            minReturnDate: DateTimeOffset.UtcNow.AddDays(10),
            isSystemAssisted: false
        );
        
        // Act
        application.Update("Korea", "Manager", VisaStatus.Approved, DateTimeOffset.UtcNow.AddDays(15), null, "url");

        // Assert
        application.Status.Should().Be(VisaStatus.Approved);
        application.VisaFileUrl.Should().Be("url");
    }

    [Fact]
    public void Resubmit_WhenRejected_ReturnsToPendingAndClearsReason()
    {
        // Arrange
        var application = VisaApplicationEntity.Create(
            bookingParticipantId: Guid.NewGuid(),
            passportId: Guid.NewGuid(),
            destinationCountry: "Japan",
            performedBy: "SYSTEM",
            minReturnDate: DateTimeOffset.UtcNow.AddDays(10),
            isSystemAssisted: false
        );
        application.Update("Korea", "Manager", VisaStatus.Rejected, DateTimeOffset.UtcNow.AddDays(15), "Missing info", null);

        // Act
        application.Resubmit("Customer", "new_url");

        // Assert
        application.Status.Should().Be(VisaStatus.Pending);
        application.RefusalReason.Should().BeNull();
        application.VisaFileUrl.Should().Be("new_url");
    }
}
