namespace Application.Features.GuestArrival.Queries.GetGuestArrivalsByHotel;

using Application.Features.GuestArrival.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record GetGuestArrivalsByHotelQuery(Guid SupplierId)
    : IQuery<ErrorOr<List<GuestArrivalListDto>>>;
