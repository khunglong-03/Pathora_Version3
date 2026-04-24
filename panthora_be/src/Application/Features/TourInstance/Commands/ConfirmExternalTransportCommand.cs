using Application.Common.Constant;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

/// <summary>
/// Manager manually confirms that external transport (flight/train/ferry) has been booked
/// outside the system. This is required for activation — see BƯỚC 4 in lifecycle doc.
/// </summary>
public sealed record ConfirmExternalTransportCommand(
    [property: JsonPropertyName("instanceId")] Guid InstanceId,
    [property: JsonPropertyName("activityId")] Guid ActivityId,
    [property: JsonPropertyName("confirm")] bool Confirm = true) : ICommand<ErrorOr<Success>>;

public sealed class ConfirmExternalTransportCommandValidator : AbstractValidator<ConfirmExternalTransportCommand>
{
    public ConfirmExternalTransportCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.ActivityId).NotEmpty();
    }
}

public sealed class ConfirmExternalTransportCommandHandler(
    ITourInstanceRepository tourInstanceRepository,
    IUnitOfWork unitOfWork,
    IUser user,
    ILanguageContext? languageContext = null)
    : ICommandHandler<ConfirmExternalTransportCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ConfirmExternalTransportCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = user.Id ?? "system";

        var instance = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId);
        if (instance is null)
            return Error.NotFound(
                ErrorConstants.TourInstance.NotFoundCode,
                ErrorConstants.TourInstance.NotFoundDescription.Resolve(lang));

        var activity = instance.InstanceDays
            .Where(d => !d.IsDeleted)
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.ActivityId);

        if (activity is null)
            return Error.NotFound(
                ErrorConstants.TourInstanceActivity.NotFoundCode,
                ErrorConstants.TourInstanceActivity.NotFoundDescription.Resolve(lang));

        if (activity.ActivityType != TourDayActivityType.Transportation)
            return Error.Validation(
                ErrorConstants.TourInstanceActivity.NotTransportationCode,
                ErrorConstants.TourInstanceActivity.NotTransportationDescription.Resolve(lang));

        // External transport = Transportation activity WITHOUT a TransportSupplierId
        if (activity.TransportSupplierId.HasValue)
            return Error.Validation(
                ErrorConstants.TourInstanceActivity.NotExternalTransportCode,
                ErrorConstants.TourInstanceActivity.NotExternalTransportDescription.Resolve(lang));

        if (request.Confirm)
        {
            activity.ConfirmExternalTransport(performedBy);
        }
        else
        {
            activity.UnconfirmExternalTransport(performedBy);
        }

        // After confirming, attempt auto-activation
        instance.CheckAndActivateTourInstance();

        await tourInstanceRepository.Update(instance);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
