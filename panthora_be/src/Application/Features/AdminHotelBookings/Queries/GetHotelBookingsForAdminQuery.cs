namespace Application.Features.AdminHotelBookings.Queries;

using Application.Features.AdminHotelBookings.DTOs;
using BuildingBlocks.CORS;
using Application.Common;
using global::Contracts;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetHotelBookingsForAdminQuery(
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 20,
    [property: JsonPropertyName("status")] BookingStatus? Status = null,
    [property: JsonPropertyName("fromDate")] DateTimeOffset? FromDate = null,
    [property: JsonPropertyName("toDate")] DateTimeOffset? ToDate = null,
    [property: JsonPropertyName("searchText")] string? SearchText = null) : IQuery<ErrorOr<PaginatedList<AdminHotelBookingDto>>>;
