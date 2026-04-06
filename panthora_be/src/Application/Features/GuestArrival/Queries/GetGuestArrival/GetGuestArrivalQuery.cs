namespace Application.Features.GuestArrival.Queries.GetGuestArrival;

using Application.Features.GuestArrival.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record GetGuestArrivalQuery(Guid BookingAccommodationDetailId)
    : IQuery<ErrorOr<GuestArrivalDto>>;
