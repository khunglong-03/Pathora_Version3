using Application.Common.Constant;
using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.BookingManagement;

public sealed record UpdateBookingRefundStatusCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("newStatus")] RefundStatus NewStatus)
    : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class UpdateBookingRefundStatusCommandValidator : AbstractValidator<UpdateBookingRefundStatusCommand>
{
    public UpdateBookingRefundStatusCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty().WithMessage("BookingId is required.");
        RuleFor(x => x.NewStatus)
            .Must(s => s is RefundStatus.Contacted or RefundStatus.Refunded)
            .WithMessage("Only Contacted or Refunded status can be set via this endpoint.");
    }
}

public sealed class UpdateBookingRefundStatusCommandHandler(
    IBookingRepository bookingRepository,
    IUser user,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateBookingRefundStatusCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateBookingRefundStatusCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = user.Id ?? "system";

        var booking = await bookingRepository.GetByIdAsync(request.BookingId, cancellationToken);
        if (booking is null)
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        if (booking.Status != BookingStatus.Cancelled)
        {
            return Error.Validation(
                ErrorConstants.Booking.RefundStatusOnlyForCancelledCode,
                ErrorConstants.Booking.RefundStatusOnlyForCancelledDescription.Resolve(lang));
        }

        try
        {
            switch (request.NewStatus)
            {
                case RefundStatus.Contacted:
                    booking.MarkRefundContacted(performedBy);
                    break;
                case RefundStatus.Refunded:
                    booking.MarkRefundCompleted(performedBy);
                    break;
                default:
                    return Error.Validation(
                        ErrorConstants.Booking.InvalidRefundStatusTransitionCode,
                        ErrorConstants.Booking.InvalidRefundStatusTransitionDescription.Resolve(lang));
            }
        }
        catch (InvalidOperationException ex)
        {
            return Error.Validation(
                ErrorConstants.Booking.InvalidRefundStatusTransitionCode,
                ex.Message);
        }

        await bookingRepository.UpdateAsync(booking, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
