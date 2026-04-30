using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.ItineraryFeedback;

public sealed record UpdateTourItineraryFeedbackCommand(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("tourInstanceDayId")] Guid TourInstanceDayId,
    [property: JsonPropertyName("feedbackId")] Guid FeedbackId,
    [property: JsonPropertyName("content")] string Content)
    : IRequest<ErrorOr<TourItineraryFeedbackDto>>;

public sealed class UpdateTourItineraryFeedbackCommandValidator : AbstractValidator<UpdateTourItineraryFeedbackCommand>
{
    public UpdateTourItineraryFeedbackCommandValidator()
    {
        RuleFor(x => x.TourInstanceId).NotEmpty();
        RuleFor(x => x.TourInstanceDayId).NotEmpty();
        RuleFor(x => x.FeedbackId).NotEmpty();
        RuleFor(x => x.Content).NotEmpty().MaximumLength(8000);
    }
}

public sealed class UpdateTourItineraryFeedbackCommandHandler(
    ITourItineraryFeedbackRepository feedbackRepository,
    ITourInstanceRepository tourInstanceRepository,
    IBookingRepository bookingRepository,
    IOwnershipValidator ownershipValidator,
    Domain.UnitOfWork.IUnitOfWork unitOfWork,
    global::Contracts.Interfaces.IUser user)
    : IRequestHandler<UpdateTourItineraryFeedbackCommand, ErrorOr<TourItineraryFeedbackDto>>
{
    public async Task<ErrorOr<TourItineraryFeedbackDto>> Handle(
        UpdateTourItineraryFeedbackCommand request,
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
        var isAssignedManager = PrivateTourCoDesignAccess.IsInstanceManager(instance, userId);
        var isGlobalManager = user.Roles.Any(r => string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase));

        if (!isAssignedManager && !isAdmin && !isGlobalManager)
        {
            if (!feedback.IsFromCustomer || feedback.BookingId is null)
                return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, ErrorConstants.ItineraryFeedback.ForbiddenDescription);

            var booking = await bookingRepository.GetByIdAsync(feedback.BookingId.Value, cancellationToken);
            if (booking?.UserId != userId)
                return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, ErrorConstants.ItineraryFeedback.ForbiddenDescription);
        }

        feedback.UpdateContent(request.Content, userId.ToString());
        await feedbackRepository.UpdateAsync(feedback, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return new TourItineraryFeedbackDto(
            feedback.Id,
            feedback.TourInstanceDayId,
            feedback.BookingId,
            feedback.Content,
            feedback.IsFromCustomer,
            feedback.CreatedOnUtc);
    }
}
