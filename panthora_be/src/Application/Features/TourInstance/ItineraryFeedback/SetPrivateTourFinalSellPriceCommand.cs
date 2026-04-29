using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using MediatR;
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
    ITourInstanceRepository tourInstanceRepository,
    IOwnershipValidator ownershipValidator,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
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
        if (!isAdmin && !PrivateTourCoDesignAccess.IsInstanceManager(instance, userId))
            return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, ErrorConstants.ItineraryFeedback.ForbiddenDescription);

        try
        {
            instance.SetFinalSellPrice(request.FinalSellPrice, userId.ToString());
        }
        catch (InvalidOperationException ex)
        {
            return Error.Validation("PrivateTour.FinalSellPriceInvalid", ex.Message);
        }

        await tourInstanceRepository.Update(instance, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
