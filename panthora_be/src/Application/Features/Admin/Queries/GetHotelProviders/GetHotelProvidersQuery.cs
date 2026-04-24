namespace Application.Features.Admin.Queries.GetHotelProviders;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;
using global::Contracts;

public sealed record GetHotelProvidersQuery(
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("search")] string? Search = null,
    [property: JsonPropertyName("status")] string? Status = null,
    [property: JsonPropertyName("continent")] Continent? Continent = null,
    [property: JsonPropertyName("continents")] List<Continent>? Continents = null)
    : IQuery<ErrorOr<PaginatedList<HotelProviderListItemDto>>>;
