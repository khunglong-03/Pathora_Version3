namespace Application.Features.GuestArrival.Commands.UpdateGuestArrival;

using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;

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
            return Error.NotFound("GuestArrival.NotFound", "Guest arrival record not found.");
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
