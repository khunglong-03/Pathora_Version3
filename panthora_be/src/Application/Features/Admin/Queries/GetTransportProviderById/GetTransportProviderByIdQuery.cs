namespace Application.Features.Admin.Queries.GetTransportProviderById;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetTransportProviderByIdQuery([property: JsonPropertyName("id")] Guid Id)
    : IQuery<ErrorOr<TransportProviderDetailDto>>;
