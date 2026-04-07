namespace Application.Features.GuestArrival.Queries.GetGuestArrivalsByHotel;

using Application.Features.GuestArrival.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;

public sealed record GetGuestArrivalsByHotelQuery(
    Guid SupplierId,
    GuestStayStatus? Status = null,
    DateOnly? DateFrom = null,
    DateOnly? DateTo = null)
    : IQuery<ErrorOr<List<GuestArrivalListDto>>>;