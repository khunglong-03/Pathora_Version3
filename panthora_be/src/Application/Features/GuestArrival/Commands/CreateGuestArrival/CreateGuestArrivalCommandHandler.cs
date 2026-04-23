namespace Application.Features.GuestArrival.Commands.CreateGuestArrival;

using Application.Common.Constant;
using Application.Features.GuestArrival.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;

public sealed class CreateGuestArrivalCommandHandler(
    IBookingAccommodationDetailRepository bookingAccommodationDetailRepository,
    IGuestArrivalRepository guestArrivalRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<CreateGuestArrivalCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateGuestArrivalCommand request, CancellationToken cancellationToken)
    {
        var detail = await bookingAccommodationDetailRepository.GetByIdAsync(request.BookingAccommodationDetailId);
        if (detail is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingAccommodationDetail.NotFoundCode,
                ErrorConstants.BookingAccommodationDetail.NotFoundDescription);
        }

        // Check for existing arrival record
        var existing = await guestArrivalRepository.FindByAccommodationDetailIdAsync(request.BookingAccommodationDetailId);
        if (existing is not null)
        {
            return Error.Conflict(ErrorConstants.GuestArrival.ExistsCode, ErrorConstants.GuestArrival.ExistsDescription.En);
        }

        var arrival = GuestArrivalEntity.Create(
            request.BookingAccommodationDetailId,
            request.SubmittedByUserId,
            "system");

        await guestArrivalRepository.AddAsync(arrival);

        foreach (var participantId in request.ParticipantIds)
        {
            var participantLink = GuestArrivalParticipantEntity.Create(
                arrival.Id,
                participantId,
                "system");

            await guestArrivalRepository.AddParticipantAsync(participantLink);
        }

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return arrival.Id;
    }
}
