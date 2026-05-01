using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Domain.Specs;

public class TourItineraryFeedbackStateMachineTests
{
    [Fact]
    public void Forward_FromPending_ShouldSucceed()
    {
        // Arrange
        var feedback = TourItineraryFeedbackEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Content", true, "User");
        var managerId = Guid.NewGuid();

        // Act
        feedback.Forward(managerId);

        // Assert
        feedback.Status.Should().Be(TourItineraryFeedbackStatus.ManagerForwarded);
        feedback.ForwardedByManagerId.Should().Be(managerId);
        feedback.ForwardedAt.Should().NotBeNull();
    }

    [Theory]
    [InlineData(TourItineraryFeedbackStatus.ManagerForwarded)]
    [InlineData(TourItineraryFeedbackStatus.OperatorResponded)]
    [InlineData(TourItineraryFeedbackStatus.ManagerApproved)]
    [InlineData(TourItineraryFeedbackStatus.ManagerRejected)]
    public void Forward_FromInvalidState_ShouldThrow(TourItineraryFeedbackStatus invalidStatus)
    {
        // Arrange
        var feedback = TourItineraryFeedbackEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Content", true, "User");
        // Use reflection to force state for testing
        typeof(TourItineraryFeedbackEntity).GetProperty(nameof(TourItineraryFeedbackEntity.Status))!
            .SetValue(feedback, invalidStatus);

        // Act & Assert
        var act = () => feedback.Forward(Guid.NewGuid());
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("TourItineraryFeedback.InvalidTransition");
    }

    [Theory]
    [InlineData(TourItineraryFeedbackStatus.ManagerForwarded)]
    [InlineData(TourItineraryFeedbackStatus.ManagerRejected)]
    public void RecordOperatorResponse_FromValidState_ShouldSucceed(TourItineraryFeedbackStatus validStatus)
    {
        // Arrange
        var feedback = TourItineraryFeedbackEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Content", true, "User");
        typeof(TourItineraryFeedbackEntity).GetProperty(nameof(TourItineraryFeedbackEntity.Status))!
            .SetValue(feedback, validStatus);
        var operatorId = Guid.NewGuid();

        // Act
        feedback.RecordOperatorResponse(operatorId);

        // Assert
        feedback.Status.Should().Be(TourItineraryFeedbackStatus.OperatorResponded);
        feedback.RespondedByOperatorId.Should().Be(operatorId);
        feedback.RespondedAt.Should().NotBeNull();
    }

    [Theory]
    [InlineData(TourItineraryFeedbackStatus.Pending)]
    [InlineData(TourItineraryFeedbackStatus.OperatorResponded)]
    [InlineData(TourItineraryFeedbackStatus.ManagerApproved)]
    public void RecordOperatorResponse_FromInvalidState_ShouldThrow(TourItineraryFeedbackStatus invalidStatus)
    {
        // Arrange
        var feedback = TourItineraryFeedbackEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Content", true, "User");
        typeof(TourItineraryFeedbackEntity).GetProperty(nameof(TourItineraryFeedbackEntity.Status))!
            .SetValue(feedback, invalidStatus);

        // Act & Assert
        var act = () => feedback.RecordOperatorResponse(Guid.NewGuid());
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("TourItineraryFeedback.InvalidTransition");
    }

    [Fact]
    public void Approve_FromOperatorResponded_ShouldSucceed()
    {
        // Arrange
        var feedback = TourItineraryFeedbackEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Content", true, "User");
        typeof(TourItineraryFeedbackEntity).GetProperty(nameof(TourItineraryFeedbackEntity.Status))!
            .SetValue(feedback, TourItineraryFeedbackStatus.OperatorResponded);
        var managerId = Guid.NewGuid();

        // Act
        feedback.Approve(managerId);

        // Assert
        feedback.Status.Should().Be(TourItineraryFeedbackStatus.ManagerApproved);
        feedback.ApprovedByManagerId.Should().Be(managerId);
        feedback.ApprovedAt.Should().NotBeNull();
    }

    [Theory]
    [InlineData(TourItineraryFeedbackStatus.Pending)]
    [InlineData(TourItineraryFeedbackStatus.ManagerForwarded)]
    [InlineData(TourItineraryFeedbackStatus.ManagerApproved)]
    [InlineData(TourItineraryFeedbackStatus.ManagerRejected)]
    public void Approve_FromInvalidState_ShouldThrow(TourItineraryFeedbackStatus invalidStatus)
    {
        // Arrange
        var feedback = TourItineraryFeedbackEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Content", true, "User");
        typeof(TourItineraryFeedbackEntity).GetProperty(nameof(TourItineraryFeedbackEntity.Status))!
            .SetValue(feedback, invalidStatus);

        // Act & Assert
        var act = () => feedback.Approve(Guid.NewGuid());
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("TourItineraryFeedback.InvalidTransition");
    }

    [Fact]
    public void Reject_FromOperatorResponded_ShouldSucceed()
    {
        // Arrange
        var feedback = TourItineraryFeedbackEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Content", true, "User");
        typeof(TourItineraryFeedbackEntity).GetProperty(nameof(TourItineraryFeedbackEntity.Status))!
            .SetValue(feedback, TourItineraryFeedbackStatus.OperatorResponded);
        var managerId = Guid.NewGuid();
        var reason = "Invalid changes";

        // Act
        feedback.Reject(managerId, reason);

        // Assert
        feedback.Status.Should().Be(TourItineraryFeedbackStatus.ManagerRejected);
        feedback.RejectionReason.Should().Be(reason);
    }

    [Theory]
    [InlineData(TourItineraryFeedbackStatus.Pending)]
    [InlineData(TourItineraryFeedbackStatus.ManagerForwarded)]
    [InlineData(TourItineraryFeedbackStatus.ManagerApproved)]
    [InlineData(TourItineraryFeedbackStatus.ManagerRejected)]
    public void Reject_FromInvalidState_ShouldThrow(TourItineraryFeedbackStatus invalidStatus)
    {
        // Arrange
        var feedback = TourItineraryFeedbackEntity.Create(Guid.NewGuid(), Guid.NewGuid(), "Content", true, "User");
        typeof(TourItineraryFeedbackEntity).GetProperty(nameof(TourItineraryFeedbackEntity.Status))!
            .SetValue(feedback, invalidStatus);

        // Act & Assert
        var act = () => feedback.Reject(Guid.NewGuid(), "reason");
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("TourItineraryFeedback.InvalidTransition");
    }
}
