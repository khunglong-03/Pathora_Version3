using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts;
using Contracts.Interfaces;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.Tour.Queries;

public sealed record GetMyToursQuery(string? SearchText, TourStatus? Status = null, int PageNumber = 1, int PageSize = 10)
    : IQuery<ErrorOr<PaginatedList<TourVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Tour}:my:{PageNumber}:{PageSize}:{SearchText}:{Status}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetMyToursQueryHandler(ITourService tourService)
    : IQueryHandler<GetMyToursQuery, ErrorOr<PaginatedList<TourVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourVm>>> Handle(GetMyToursQuery request, CancellationToken cancellationToken)
    {
        return await tourService.GetMyTours(request);
    }
}
