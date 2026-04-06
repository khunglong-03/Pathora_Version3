namespace Application.Features.Admin.Queries.GetTransportProviders;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using global::Contracts;

public sealed record GetTransportProvidersQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null)
    : IQuery<ErrorOr<PaginatedList<TransportProviderListItemDto>>>;
