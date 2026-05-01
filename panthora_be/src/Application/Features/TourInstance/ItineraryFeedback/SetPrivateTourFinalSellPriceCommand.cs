using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.ItineraryFeedback;

public sealed record SetPrivateTourFinalSellPriceCommand(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("finalSellPrice")] decimal FinalSellPrice)
    : IRequest<ErrorOr<Success>>;

public sealed class SetPrivateTourFinalSellPriceCommandValidator : AbstractValidator<SetPrivateTourFinalSellPriceCommand>
{
    public SetPrivateTourFinalSellPriceCommandValidator()
    {
        RuleFor(x => x.TourInstanceId).NotEmpty();
        RuleFor(x => x.FinalSellPrice).GreaterThanOrEqualTo(0);
    }
}

public sealed class SetPrivateTourFinalSellPriceCommandHandler(
    ITourItineraryFeedbackRepository feedbackRepository,
    ITourInstanceRepository tourInstanceRepository,
    IOwnershipValidator ownershipValidator,
    Domain.UnitOfWork.IUnitOfWork unitOfWork,
    global::Contracts.Interfaces.IUser user,
    Microsoft.Extensions.Logging.ILogger<SetPrivateTourFinalSellPriceCommandHandler> logger,
    ITourInstanceNotificationBroadcaster? notifications = null)
    : IRequestHandler<SetPrivateTourFinalSellPriceCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        SetPrivateTourFinalSellPriceCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(ownershipValidator.GetCurrentUserId(), out var userId))
            return Error.Unauthorized();

        var instance = await tourInstanceRepository.FindById(request.TourInstanceId, cancellationToken: cancellationToken);
        if (instance == null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        var isAdmin = await ownershipValidator.IsAdminAsync(cancellationToken);
        var isGlobalManager = user.Roles.Any(r => string.Equals(r, "TourOperator", StringComparison.OrdinalIgnoreCase));
        var isOperator = PrivateTourCoDesignAccess.EnsureInstanceOperatorOnly(instance, userId);
        
        if (!isAdmin && !isGlobalManager && !isOperator && !PrivateTourCoDesignAccess.EnsureInstanceManagerOnly(instance, userId))
            return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, ErrorConstants.ItineraryFeedback.ForbiddenDescription);

        try
        {
            instance.SetFinalSellPrice(request.FinalSellPrice, userId.ToString());
            
            if (isOperator)
            {
                var feedbacks = await feedbackRepository.ListByInstanceAsync(request.TourInstanceId, cancellationToken);
                foreach (var feedback in feedbacks)
                {
                    if (feedback.Status == TourItineraryFeedbackStatus.ManagerForwarded || 
                        feedback.Status == TourItineraryFeedbackStatus.ManagerRejected)
                    {
                        feedback.RecordOperatorResponse(userId);
                        await feedbackRepository.UpdateAsync(feedback, cancellationToken);

                        if (notifications != null)
                        {
                            try
                            {
                                await notifications.NotifyItineraryFeedbackEventAsync(
                                    request.TourInstanceId, feedback.Id, "Responded", "admins", null, cancellationToken);
                            }
                            catch (Exception ex)
                            {
                                logger.LogWarning(ex, "Failed to broadcast Responded event for feedback {FeedbackId}", feedback.Id);
                            }
                        }
                    }
                }
            }
        }
        catch (InvalidOperationException ex)
        {
            return Error.Validation("PrivateTour.FinalSellPriceInvalid", ex.Message);
        }

        try
        {
            await tourInstanceRepository.Update(instance, cancellationToken);
            await unitOfWork.SaveChangeAsync(cancellationToken);
            return Result.Success;
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            return Error.Conflict(ErrorConstants.Common.ConcurrencyConflictCode, ErrorConstants.Common.ConcurrencyConflictDescription.Vi);
        }
    }
}
