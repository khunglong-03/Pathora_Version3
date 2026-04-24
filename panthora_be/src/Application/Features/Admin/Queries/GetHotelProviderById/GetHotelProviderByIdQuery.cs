namespace Application.Features.Admin.Queries.GetHotelProviderById;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetHotelProviderByIdQuery([property: JsonPropertyName("id")] Guid Id)
    : IQuery<ErrorOr<HotelProviderDetailDto>>;
