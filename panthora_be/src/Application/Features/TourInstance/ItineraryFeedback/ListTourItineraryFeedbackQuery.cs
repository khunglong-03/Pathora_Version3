using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.ItineraryFeedback;

public sealed record ListTourItineraryFeedbackQuery(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("tourInstanceDayId")] Guid TourInstanceDayId)
    : IRequest<ErrorOr<List<TourItineraryFeedbackDto>>>;

public sealed class ListTourItineraryFeedbackQueryHandler(
    ITourInstanceRepository tourInstanceRepository,
    IBookingRepository bookingRepository,
    ITourItineraryFeedbackRepository feedbackRepository,
    IOwnershipValidator ownershipValidator,
    global::Contracts.Interfaces.IUser user)
    : IRequestHandler<ListTourItineraryFeedbackQuery, ErrorOr<List<TourItineraryFeedbackDto>>>
{
    public async Task<ErrorOr<List<TourItineraryFeedbackDto>>> Handle(
        ListTourItineraryFeedbackQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(ownershipValidator.GetCurrentUserId(), out var userId))
            return Error.Unauthorized();

        var instance = await tourInstanceRepository.FindById(request.TourInstanceId, cancellationToken: cancellationToken);
        if (instance == null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (!PrivateTourCoDesignAccess.DayBelongsToInstance(instance, request.TourInstanceDayId))
            return Error.Validation(ErrorConstants.ItineraryFeedback.InvalidDayCode, ErrorConstants.ItineraryFeedback.InvalidDayDescription);

        var isAdmin = await ownershipValidator.IsAdminAsync(cancellationToken);
        var isAssignedManager = PrivateTourCoDesignAccess.IsInstanceManager(instance, userId);
        var isGlobalManager = user.Roles.Any(r => string.Equals(r, "TourOperator", StringComparison.OrdinalIgnoreCase));

        if (!isAssignedManager && !isAdmin && !isGlobalManager)
        {
            var onInstance = await bookingRepository.GetByTourInstanceIdAsync(request.TourInstanceId, cancellationToken);
            var ownsBooking = onInstance.Exists(b => b.UserId == userId);
            if (!ownsBooking)
                return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, ErrorConstants.ItineraryFeedback.ForbiddenDescription);
        }

        var items = await feedbackRepository.ListByInstanceAndDayAsync(
            request.TourInstanceId,
            request.TourInstanceDayId,
            cancellationToken);

        return items
            .Select(f => new TourItineraryFeedbackDto(f.Id, f.TourInstanceDayId, f.BookingId, f.Content, f.IsFromCustomer, f.CreatedOnUtc))
            .ToList();
    }
}
