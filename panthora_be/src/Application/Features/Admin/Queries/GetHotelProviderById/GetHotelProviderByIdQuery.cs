namespace Application.Features.Admin.Queries.GetHotelProviderById;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record GetHotelProviderByIdQuery(Guid Id)
    : IQuery<ErrorOr<HotelProviderDetailDto>>;
