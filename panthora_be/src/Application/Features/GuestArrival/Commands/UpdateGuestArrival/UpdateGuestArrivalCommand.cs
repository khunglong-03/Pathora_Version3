using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.GuestArrival.Commands.UpdateGuestArrival;

public sealed record UpdateGuestArrivalCommand(
    [property: JsonPropertyName("guestArrivalId")] Guid GuestArrivalId,
    [property: JsonPropertyName("checkedInByUserId")] Guid? CheckedInByUserId,
    [property: JsonPropertyName("checkedOutByUserId")] Guid? CheckedOutByUserId,
    [property: JsonPropertyName("markNoShow")] GuestStayStatus? MarkNoShow,
    [property: JsonPropertyName("submissionStatus")] GuestArrivalSubmissionStatus? SubmissionStatus,
    [property: JsonPropertyName("note")] string? Note) : ICommand<ErrorOr<Success>>;


public sealed class UpdateGuestArrivalCommandHandler(
    IGuestArrivalRepository guestArrivalRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<UpdateGuestArrivalCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateGuestArrivalCommand request, CancellationToken cancellationToken)
    {
        var arrival = await guestArrivalRepository.FindByIdAsync(request.GuestArrivalId);
        if (arrival is null)
        {
            return Error.NotFound(ErrorConstants.GuestArrival.NotFoundCode, ErrorConstants.GuestArrival.NotFoundDescription.En);
        }

        if (request.CheckedInByUserId.HasValue)
        {
            arrival.CheckIn(request.CheckedInByUserId.Value, "system");
        }

        if (request.CheckedOutByUserId.HasValue)
        {
            arrival.CheckOut(request.CheckedOutByUserId.Value, "system");
        }

        if (request.MarkNoShow.HasValue && request.MarkNoShow.Value == Domain.Enums.GuestStayStatus.NoShow)
        {
            arrival.MarkNoShow("system");
        }

        if (request.SubmissionStatus.HasValue)
        {
            arrival.UpdateSubmissionStatus(request.SubmissionStatus.Value, "system");
        }

        if (request.Note is not null)
        {
            arrival.UpdateNote(request.Note, "system");
        }

        guestArrivalRepository.Update(arrival);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}


public sealed class UpdateGuestArrivalCommandValidator : AbstractValidator<UpdateGuestArrivalCommand>
{
    public UpdateGuestArrivalCommandValidator()
    {
        RuleFor(x => x.GuestArrivalId).NotEmpty();
        RuleFor(x => x.Note).MaximumLength(1000);
    }
}
