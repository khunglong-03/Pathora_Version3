namespace Application.Features.Admin.Queries.GetHotelProviders;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using global::Contracts;

public sealed record GetHotelProvidersQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null,
    Continent? Continent = null,
    List<Continent>? Continents = null)
    : IQuery<ErrorOr<PaginatedList<HotelProviderListItemDto>>>;
