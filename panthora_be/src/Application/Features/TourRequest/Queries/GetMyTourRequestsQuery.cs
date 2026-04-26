using Application.Common.Constant;
using Application.Common;
using Application.Dtos;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Contracts;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourRequest.Queries;

public sealed record GetMyTourRequestsQuery(
    [property: JsonPropertyName("currentUserId")] string CurrentUserId,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10) : IQuery<ErrorOr<PaginatedList<TourRequestVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourRequest}:my:{CurrentUserId}:{PageNumber}:{PageSize}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetMyTourRequestsQueryValidator : AbstractValidator<GetMyTourRequestsQuery>
{
    public GetMyTourRequestsQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage(ValidationMessages.TourRequestPageNumberGreaterThanZero);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage(ValidationMessages.TourRequestPageSizeRange);
    }
}

public sealed class GetMyTourRequestsQueryHandler(
    IUser user,
    ITourRequestRepository tourRequestRepository)
    : IQueryHandler<GetMyTourRequestsQuery, ErrorOr<PaginatedList<TourRequestVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourRequestVm>>> Handle(GetMyTourRequestsQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.Id) || !Guid.TryParse(user.Id, out var currentUserId))
        {
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);
        }

        var entities = await tourRequestRepository.GetByUserIdAsync(currentUserId, request.PageNumber, request.PageSize, asNoTracking: true);
        var total = await tourRequestRepository.CountByUserIdAsync(currentUserId);

        return new PaginatedList<TourRequestVm>(total, entities.Select(x => x.ToVm()).ToList(), request.PageNumber, request.PageSize);
    }
}
