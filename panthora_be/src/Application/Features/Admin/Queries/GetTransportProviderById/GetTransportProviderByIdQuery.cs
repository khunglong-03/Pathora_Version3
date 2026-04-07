namespace Application.Features.Admin.Queries.GetTransportProviderById;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record GetTransportProviderByIdQuery(Guid Id)
    : IQuery<ErrorOr<TransportProviderDetailDto>>;
