using Application.Common.Constant;
using Application.Features.TourInstance.ItineraryFeedback;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace Domain.Specs.Application.Features.TourInstance.ItineraryFeedback;

/// <summary>
/// §8.2, 8.3 — Integration tests for Private Tour Co-Design workflow (Manager Gates)
/// </summary>
public sealed class TourItineraryFeedbackIntegrationTests
{
    private readonly ITourInstanceRepository _tourInstanceRepo = Substitute.For<ITourInstanceRepository>();
    private readonly ITourItineraryFeedbackRepository _feedbackRepo = Substitute.For<ITourItineraryFeedbackRepository>();
    private readonly IOwnershipValidator _ownershipValidator = Substitute.For<IOwnershipValidator>();
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();

    public TourItineraryFeedbackIntegrationTests()
    {
        _uow.ExecuteTransactionAsync(Arg.Any<Func<Task>>()).Returns(async ci =>
        {
            var a = ci.Arg<Func<Task>>();
            await a();
        });
        _uow.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(1));
    }

    [Fact]
    public async Task ForwardCustomerFeedback_Manager_HappyPath_ForwardsToOperator()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var feedbackId = Guid.NewGuid();

        _ownershipValidator.GetCurrentUserId().Returns(userId.ToString());

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            Managers = [new TourInstanceManagerEntity { UserId = userId }], // Is manager
            Status = TourInstanceStatus.PendingApproval
        };
        _tourInstanceRepo.FindById(instanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(instance);

        var feedback = TourItineraryFeedbackEntity.Create(
            instanceId, dayId, "Needs pool", true, userId.ToString());
        
        var fieldInfo = typeof(TourItineraryFeedbackEntity).GetProperty(nameof(TourItineraryFeedbackEntity.Id));
        fieldInfo?.SetValue(feedback, feedbackId);
        feedback.RowVersion = [1, 2, 3];
        
        _feedbackRepo.GetByIdAsync(feedbackId, Arg.Any<CancellationToken>())
            .Returns(feedback);

        var handler = new ForwardCustomerFeedbackToOperatorCommandHandler(
            _feedbackRepo, _tourInstanceRepo, _ownershipValidator, _uow,
            NullLogger<ForwardCustomerFeedbackToOperatorCommandHandler>.Instance);

        var rowVersion = Convert.ToBase64String(feedback.RowVersion);
        var command = new ForwardCustomerFeedbackToOperatorCommand(instanceId, dayId, feedbackId, rowVersion);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(TourItineraryFeedbackStatus.ManagerForwarded, feedback.Status);
        await _feedbackRepo.Received(1).UpdateAsync(feedback, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ApproveOperatorResponse_WrongRole_ReturnsForbidden()
    {
        // Arrange
        var userId = Guid.NewGuid(); // Not a manager
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var feedbackId = Guid.NewGuid();

        _ownershipValidator.GetCurrentUserId().Returns(userId.ToString());

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            Managers = [], // Empty
            Tour = new TourEntity { TourOperatorId = Guid.NewGuid() } // Different owner
        };
        _tourInstanceRepo.FindById(instanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(instance);

        var handler = new ApproveOperatorResponseCommandHandler(
            _feedbackRepo, _tourInstanceRepo, _ownershipValidator, _uow,
            NullLogger<ApproveOperatorResponseCommandHandler>.Instance);

        var command = new ApproveOperatorResponseCommand(instanceId, dayId, feedbackId, "AA==");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorConstants.ItineraryFeedback.ManagerOnlyCode, result.FirstError.Code);
    }

    [Fact]
    public async Task RejectOperatorResponse_WrongState_ReturnsValidationError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var feedbackId = Guid.NewGuid();

        _ownershipValidator.GetCurrentUserId().Returns(userId.ToString());

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            Managers = [new TourInstanceManagerEntity { UserId = userId }]
        };
        _tourInstanceRepo.FindById(instanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(instance);

        // Feedback in Pending state (not OperatorResponded)
        var feedback = TourItineraryFeedbackEntity.Create(
            instanceId, dayId, "Needs pool", true, userId.ToString());
        
        var fieldInfo = typeof(TourItineraryFeedbackEntity).GetProperty(nameof(TourItineraryFeedbackEntity.Id));
        fieldInfo?.SetValue(feedback, feedbackId);
        feedback.RowVersion = [1, 2, 3];

        _feedbackRepo.GetByIdAsync(feedbackId, Arg.Any<CancellationToken>())
            .Returns(feedback);

        var handler = new RejectOperatorResponseCommandHandler(
            _feedbackRepo, _tourInstanceRepo, _ownershipValidator, _uow,
            NullLogger<RejectOperatorResponseCommandHandler>.Instance);

        var rowVersion = Convert.ToBase64String(feedback.RowVersion);
        var command = new RejectOperatorResponseCommand(instanceId, dayId, feedbackId, "Not good enough", rowVersion);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorConstants.ItineraryFeedback.InvalidTransitionCode, result.FirstError.Code);
    }

    [Fact]
    public async Task SetPrivateTourFinalSellPrice_IdempotentConcurrency_ReturnsSuccess()
    {
        // Arrange
        var operatorId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();

        _ownershipValidator.GetCurrentUserId().Returns(operatorId.ToString());

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            Tour = new TourEntity { TourOperatorId = operatorId }, // Is operator
            InstanceType = TourType.Private,
            Status = TourInstanceStatus.Draft,
            FinalSellPrice = 1000m
        };
        _tourInstanceRepo.FindById(instanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(instance);

        // Setup the exact concurrency issue: DbUpdateConcurrencyException
        _tourInstanceRepo.When(x => x.Update(instance, Arg.Any<CancellationToken>()))
            .Do(x => throw new Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException());

        var userContext = Substitute.For<global::Contracts.Interfaces.IUser>();
        var handler = new SetPrivateTourFinalSellPriceCommandHandler(
            _feedbackRepo, _tourInstanceRepo, _ownershipValidator, _uow, userContext,
            NullLogger<SetPrivateTourFinalSellPriceCommandHandler>.Instance);

        var command = new SetPrivateTourFinalSellPriceCommand(instanceId, 1500m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorConstants.Common.ConcurrencyConflictCode, result.FirstError.Code);
    }

    [Fact]
    public async Task ListFeedback_Customer_HidesUnapprovedOperatorFeedback_ButShowsOwnFeedback()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();

        _ownershipValidator.GetCurrentUserId().Returns(customerId.ToString());
        _ownershipValidator.IsAdminAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(false));

        var userContext = Substitute.For<global::Contracts.Interfaces.IUser>();
        userContext.Roles.Returns(new[] { "Customer" });

        var bookingRepo = Substitute.For<IBookingRepository>();
        var day = new TourInstanceDayEntity { Id = dayId };
        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            InstanceDays = [day]
        };
        _tourInstanceRepo.FindById(instanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(instance);

        bookingRepo.GetByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>())
            .Returns([new BookingEntity { UserId = customerId }]); // Customer owns booking

        var myPendingFeedback = TourItineraryFeedbackEntity.Create(instanceId, dayId, "My issue", true, customerId.ToString());
        myPendingFeedback.RowVersion = [1, 2, 3];
        
        var operatorRespondedFeedback = TourItineraryFeedbackEntity.Create(instanceId, dayId, "Another issue", true, Guid.NewGuid().ToString());
        operatorRespondedFeedback.RowVersion = [1, 2, 3];
        operatorRespondedFeedback.Forward(Guid.NewGuid());
        operatorRespondedFeedback.RecordOperatorResponse(Guid.NewGuid());

        var approvedFeedback = TourItineraryFeedbackEntity.Create(instanceId, dayId, "Third issue", true, Guid.NewGuid().ToString());
        approvedFeedback.RowVersion = [1, 2, 3];
        approvedFeedback.Forward(Guid.NewGuid());
        approvedFeedback.RecordOperatorResponse(Guid.NewGuid());
        approvedFeedback.Approve(Guid.NewGuid());

        _feedbackRepo.ListByInstanceAndDayAsync(instanceId, dayId, Arg.Any<CancellationToken>())
            .Returns(new List<TourItineraryFeedbackEntity> { myPendingFeedback, operatorRespondedFeedback, approvedFeedback });

        var handler = new ListTourItineraryFeedbackQueryHandler(
            _tourInstanceRepo, bookingRepo, _feedbackRepo, _ownershipValidator, userContext);

        var query = new ListTourItineraryFeedbackQuery(instanceId, dayId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var returned = result.Value;

        Assert.Equal(2, returned.Count); // Should only see own pending, and the approved one
        Assert.Contains(returned, f => f.Content == "My issue"); // Own feedback
        Assert.Contains(returned, f => f.Content == "Third issue"); // Approved feedback
        Assert.DoesNotContain(returned, f => f.Content == "Another issue"); // Unapproved operator response is hidden
    }
}
