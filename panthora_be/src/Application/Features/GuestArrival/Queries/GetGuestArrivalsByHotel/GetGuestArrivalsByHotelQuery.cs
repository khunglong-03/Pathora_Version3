namespace Application.Features.GuestArrival.Queries.GetGuestArrivalsByHotel;

using Application.Features.GuestArrival.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetGuestArrivalsByHotelQuery(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("status")] GuestStayStatus? Status = null,
    [property: JsonPropertyName("dateFrom")] DateOnly? DateFrom = null,
    [property: JsonPropertyName("dateTo")] DateOnly? DateTo = null)
    : IQuery<ErrorOr<List<GuestArrivalListDto>>>;