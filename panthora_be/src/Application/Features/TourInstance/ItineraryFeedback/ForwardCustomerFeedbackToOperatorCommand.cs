using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.ItineraryFeedback;

public sealed record ForwardCustomerFeedbackToOperatorCommand(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("tourInstanceDayId")] Guid TourInstanceDayId,
    [property: JsonPropertyName("feedbackId")] Guid FeedbackId,
    [property: JsonPropertyName("rowVersion")] string RowVersion)
    : IRequest<ErrorOr<Success>>;

public sealed class ForwardCustomerFeedbackToOperatorCommandHandler(
    ITourItineraryFeedbackRepository feedbackRepository,
    ITourInstanceRepository tourInstanceRepository,
    IOwnershipValidator ownershipValidator,
    Domain.UnitOfWork.IUnitOfWork unitOfWork,
    Microsoft.Extensions.Logging.ILogger<ForwardCustomerFeedbackToOperatorCommandHandler> logger,
    ITourInstanceNotificationBroadcaster? notifications = null)
    : IRequestHandler<ForwardCustomerFeedbackToOperatorCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        ForwardCustomerFeedbackToOperatorCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(ownershipValidator.GetCurrentUserId(), out var userId))
            return Error.Unauthorized();

        var instance = await tourInstanceRepository.FindById(request.TourInstanceId, cancellationToken: cancellationToken);
        if (instance == null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (!PrivateTourCoDesignAccess.EnsureInstanceManagerOnly(instance, userId))
            return Error.Forbidden(ErrorConstants.ItineraryFeedback.ManagerOnlyCode, ErrorConstants.ItineraryFeedback.ManagerOnlyDescription);

        var feedback = await feedbackRepository.GetByIdAsync(request.FeedbackId, cancellationToken);
        if (feedback == null)
            return Error.NotFound(ErrorConstants.ItineraryFeedback.NotFoundCode, ErrorConstants.ItineraryFeedback.NotFoundDescription);

        if (feedback.TourInstanceId != request.TourInstanceId
            || feedback.TourInstanceDayId != request.TourInstanceDayId)
            return Error.Validation(ErrorConstants.ItineraryFeedback.InvalidDayCode, ErrorConstants.ItineraryFeedback.InvalidDayDescription);

        try
        {
            feedback.RowVersion = Convert.FromBase64String(request.RowVersion);
            feedback.Forward(userId);
            await feedbackRepository.UpdateAsync(feedback, cancellationToken);
            await unitOfWork.SaveChangeAsync(cancellationToken);
            
            if (notifications != null)
            {
                try
                {
                    await notifications.NotifyItineraryFeedbackEventAsync(
                        request.TourInstanceId, feedback.Id, "Forwarded", "operators", null, cancellationToken);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to broadcast Forwarded event for feedback {FeedbackId}", feedback.Id);
                }
            }
            
            return Result.Success;
        }
        catch (InvalidOperationException)
        {
            return Error.Validation(ErrorConstants.ItineraryFeedback.InvalidTransitionCode, ErrorConstants.ItineraryFeedback.InvalidTransitionDescription.Vi);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            return Error.Conflict(ErrorConstants.Common.ConcurrencyConflictCode, ErrorConstants.Common.ConcurrencyConflictDescription.Vi);
        }
    }
}
