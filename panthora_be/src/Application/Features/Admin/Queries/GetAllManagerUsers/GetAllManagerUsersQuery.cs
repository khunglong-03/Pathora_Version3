using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;

namespace Application.Features.Admin.Queries.GetAllManagerUsers;

public sealed record GetAllManagerUsersQuery : IQuery<ErrorOr<List<ManagerUserSummaryDto>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourManagerAssignment}:manager-users";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}
