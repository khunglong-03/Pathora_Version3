using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Features.Tour.Queries;

public sealed record GetAllToursQuery(string? SearchText, int PageNumber = 1, int PageSize = 10)
    : IQuery<ErrorOr<PaginatedList<TourVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Tour}:all:{PageNumber}:{PageSize}:{SearchText}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed record TourVm(
    Guid Id,
    string TourCode,
    string TourName,
    string ShortDescription,
    string Status,
    ImageDto? Thumbnail,
    DateTimeOffset CreatedOnUtc);

public sealed class GetAllToursQueryHandler(ITourService tourService)
    : IQueryHandler<GetAllToursQuery, ErrorOr<PaginatedList<TourVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourVm>>> Handle(GetAllToursQuery request, CancellationToken cancellationToken)
    {
        return await tourService.GetAll(request);
    }
}
