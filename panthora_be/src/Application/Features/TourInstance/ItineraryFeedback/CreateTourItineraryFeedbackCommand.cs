using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.ItineraryFeedback;

public sealed record CreateTourItineraryFeedbackCommand(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("tourInstanceDayId")] Guid TourInstanceDayId,
    [property: JsonPropertyName("bookingId")] Guid? BookingId,
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("isFromCustomer")] bool IsFromCustomer)
    : IRequest<ErrorOr<TourItineraryFeedbackDto>>;

public sealed class CreateTourItineraryFeedbackCommandValidator : AbstractValidator<CreateTourItineraryFeedbackCommand>
{
    public CreateTourItineraryFeedbackCommandValidator()
    {
        RuleFor(x => x.TourInstanceId).NotEmpty();
        RuleFor(x => x.TourInstanceDayId).NotEmpty();
        RuleFor(x => x.Content).NotEmpty().MaximumLength(8000);
    }
}

public sealed class CreateTourItineraryFeedbackCommandHandler(
    ITourInstanceRepository tourInstanceRepository,
    IBookingRepository bookingRepository,
    ITourItineraryFeedbackRepository feedbackRepository,
    IOwnershipValidator ownershipValidator,
    Domain.UnitOfWork.IUnitOfWork unitOfWork,
    global::Contracts.Interfaces.IUser user,
    ILogger<CreateTourItineraryFeedbackCommandHandler> logger,
    ITourInstanceNotificationBroadcaster? notifications = null)
    : IRequestHandler<CreateTourItineraryFeedbackCommand, ErrorOr<TourItineraryFeedbackDto>>
{
    public async Task<ErrorOr<TourItineraryFeedbackDto>> Handle(
        CreateTourItineraryFeedbackCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(ownershipValidator.GetCurrentUserId(), out var userId))
            return Error.Unauthorized();

        var instance = await tourInstanceRepository.FindById(request.TourInstanceId, cancellationToken: cancellationToken);
        if (instance == null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (instance.InstanceType != TourType.Private)
            return Error.Validation(ErrorConstants.ItineraryFeedback.ForbiddenCode, "Chỉ tour riêng mới dùng co-design feedback.");

        if (!PrivateTourCoDesignAccess.DayBelongsToInstance(instance, request.TourInstanceDayId))
            return Error.Validation(ErrorConstants.ItineraryFeedback.InvalidDayCode, ErrorConstants.ItineraryFeedback.InvalidDayDescription);

        var isAdmin = await ownershipValidator.IsAdminAsync(cancellationToken);
#pragma warning disable CS0618
        var isAssignedManager = PrivateTourCoDesignAccess.IsInstanceManager(instance, userId);
#pragma warning restore CS0618
        var isGlobalManager = user.Roles.Any(r => 
            string.Equals(r, RoleConstants.TourOperator, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r, RoleConstants.Manager, StringComparison.OrdinalIgnoreCase));

        if (request.IsFromCustomer)
        {
            if (request.BookingId is null)
                return Error.Validation("ItineraryFeedback.BookingRequired", "Khách cần liên kết booking để gửi phản hồi.");

            var booking = await bookingRepository.GetByIdAsync(request.BookingId.Value, cancellationToken);
            if (booking == null)
                return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
            if (booking.TourInstanceId != instance.Id)
                return Error.Validation(ErrorConstants.ItineraryFeedback.InvalidDayCode, ErrorConstants.ItineraryFeedback.InvalidDayDescription);
            if (booking.UserId != userId && !isAdmin)
                return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, ErrorConstants.ItineraryFeedback.ForbiddenDescription);
            if (booking.UserId is null && !isAdmin)
                return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, "Tài khoản khách cần đăng nhập để bình luận.");
        }
        else
        {
            if (!isAssignedManager && !isAdmin && !isGlobalManager)
                return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, ErrorConstants.ItineraryFeedback.ForbiddenDescription);
        }

        var performedBy = userId.ToString();
        var entity = TourItineraryFeedbackEntity.Create(
            request.TourInstanceId,
            request.TourInstanceDayId,
            request.Content,
            request.IsFromCustomer,
            performedBy,
            request.BookingId);

        await feedbackRepository.AddAsync(entity, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        if (request.IsFromCustomer && notifications != null)
        {
            try
            {
                await notifications.NotifyItineraryFeedbackEventAsync(
                    request.TourInstanceId,
                    entity.Id,
                    "Pending",
                    "admins", // Target admins or managers
                    null,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to broadcast notification for created feedback {FeedbackId}", entity.Id);
            }
        }

        return Map(entity);
    }

    private static TourItineraryFeedbackDto Map(TourItineraryFeedbackEntity f) =>
        new(f.Id, f.TourInstanceDayId, f.BookingId, f.Content, f.IsFromCustomer, f.CreatedOnUtc,
            f.Status, f.ForwardedByManagerId, f.ForwardedAt, f.RespondedByOperatorId, f.RespondedAt, f.ApprovedByManagerId, f.ApprovedAt, f.RejectionReason, f.RowVersion != null ? Convert.ToBase64String(f.RowVersion) : string.Empty);
}
