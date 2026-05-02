using Application.Common.Constant;
using Application.Features.GuestArrival.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.GuestArrival.Queries.GetGuestArrival;

public sealed record GetGuestArrivalQuery([property: JsonPropertyName("bookingAccommodationDetailId")] Guid BookingAccommodationDetailId)
    : IQuery<ErrorOr<GuestArrivalDto>>;


public sealed class GetGuestArrivalQueryHandler(
    IGuestArrivalRepository guestArrivalRepository,
    IBookingAccommodationDetailRepository bookingAccommodationDetailRepository)
    : IQueryHandler<GetGuestArrivalQuery, ErrorOr<GuestArrivalDto>>
{
    public async Task<ErrorOr<GuestArrivalDto>> Handle(GetGuestArrivalQuery request, CancellationToken cancellationToken)
    {
        var detail = await bookingAccommodationDetailRepository.GetByIdAsync(request.BookingAccommodationDetailId);
        if (detail is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingAccommodationDetail.NotFoundCode,
                ErrorConstants.BookingAccommodationDetail.NotFoundDescription);
        }

        var arrival = await guestArrivalRepository.FindByAccommodationDetailIdAsync(request.BookingAccommodationDetailId);
        if (arrival is null)
        {
            return Error.NotFound(ErrorConstants.GuestArrival.NotFoundCode, ErrorConstants.GuestArrival.NotFoundDescription.En);
        }

        var participants = arrival.Participants.Select(p => new GuestArrivalParticipantDto(
            p.Id,
            p.BookingParticipantId,
            p.BookingParticipant?.FullName,
            p.BookingParticipant?.Passport?.PassportNumber)).ToList();

        return new GuestArrivalDto(
            arrival.Id,
            arrival.BookingAccommodationDetailId,
            arrival.SubmittedByUserId,
            arrival.SubmittedAt,
            arrival.SubmissionStatus,
            arrival.CheckedInByUserId,
            arrival.ActualCheckInAt,
            arrival.CheckedOutByUserId,
            arrival.ActualCheckOutAt,
            arrival.Status,
            arrival.Note,
            participants);
    }
}
