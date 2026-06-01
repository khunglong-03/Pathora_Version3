using Application.Common;
using Application.Dtos;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Tours.Commands;

public enum TourReviewAction
{
    Approve,
    Reject
}

public sealed record ReviewTourCommand(
    Guid TourId,
    TourReviewAction Action,
    string? Reason = null) : ICommand<ErrorOr<TourDto>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Tour];
}
