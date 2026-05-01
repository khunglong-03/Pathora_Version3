using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.ItineraryFeedback;

public sealed record DeleteTourItineraryFeedbackCommand(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("tourInstanceDayId")] Guid TourInstanceDayId,
    [property: JsonPropertyName("feedbackId")] Guid FeedbackId)
    : IRequest<ErrorOr<Deleted>>;

public sealed class DeleteTourItineraryFeedbackCommandValidator : AbstractValidator<DeleteTourItineraryFeedbackCommand>
{
    public DeleteTourItineraryFeedbackCommandValidator()
    {
        RuleFor(x => x.TourInstanceId).NotEmpty();
        RuleFor(x => x.TourInstanceDayId).NotEmpty();
        RuleFor(x => x.FeedbackId).NotEmpty();
    }
}

public sealed class DeleteTourItineraryFeedbackCommandHandler(
    ITourItineraryFeedbackRepository feedbackRepository,
    ITourInstanceRepository tourInstanceRepository,
    IBookingRepository bookingRepository,
    IOwnershipValidator ownershipValidator,
    Domain.UnitOfWork.IUnitOfWork unitOfWork,
    global::Contracts.Interfaces.IUser user)
    : IRequestHandler<DeleteTourItineraryFeedbackCommand, ErrorOr<Deleted>>
{
    public async Task<ErrorOr<Deleted>> Handle(
        DeleteTourItineraryFeedbackCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(ownershipValidator.GetCurrentUserId(), out var userId))
            return Error.Unauthorized();

        var feedback = await feedbackRepository.GetByIdAsync(request.FeedbackId, cancellationToken);
        if (feedback == null)
            return Error.NotFound(ErrorConstants.ItineraryFeedback.NotFoundCode, ErrorConstants.ItineraryFeedback.NotFoundDescription);

        if (feedback.TourInstanceId != request.TourInstanceId
            || feedback.TourInstanceDayId != request.TourInstanceDayId)
            return Error.Validation(ErrorConstants.ItineraryFeedback.InvalidDayCode, ErrorConstants.ItineraryFeedback.InvalidDayDescription);

        var instance = await tourInstanceRepository.FindById(feedback.TourInstanceId, cancellationToken: cancellationToken);
        if (instance == null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        var isAdmin = await ownershipValidator.IsAdminAsync(cancellationToken);
#pragma warning disable CS0618
        var isAssignedManager = PrivateTourCoDesignAccess.IsInstanceManager(instance, userId);
#pragma warning restore CS0618
        var isGlobalManager = user.Roles.Any(r => 
            string.Equals(r, RoleConstants.TourOperator, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r, RoleConstants.Manager, StringComparison.OrdinalIgnoreCase));

        if (!isAssignedManager && !isAdmin && !isGlobalManager)
        {
            if (!feedback.IsFromCustomer || feedback.BookingId is null)
                return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, ErrorConstants.ItineraryFeedback.ForbiddenDescription);

            var booking = await bookingRepository.GetByIdAsync(feedback.BookingId.Value, cancellationToken);
            if (booking?.UserId != userId)
                return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, ErrorConstants.ItineraryFeedback.ForbiddenDescription);
        }

        await feedbackRepository.DeleteAsync(feedback, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Deleted;
    }
}
