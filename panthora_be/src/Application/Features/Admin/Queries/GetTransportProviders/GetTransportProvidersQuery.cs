namespace Application.Features.Admin.Queries.GetTransportProviders;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using global::Contracts;
using ErrorOr;

public sealed record GetTransportProvidersQuery(
    int PageNumber = 1,
    int PageSize = 10)
    : IQuery<ErrorOr<PaginatedList<TransportProviderListItemDto>>>;
