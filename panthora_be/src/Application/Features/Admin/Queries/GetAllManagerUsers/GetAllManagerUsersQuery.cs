namespace Application.Features.Admin.Queries.GetAllManagerUsers;

using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;
using System.Text.Json.Serialization;


public sealed record GetAllManagerUsersQuery : IQuery<ErrorOr<List<ManagerUserSummaryDto>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourManagerAssignment}:manager-users";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}


public sealed class GetAllManagerUsersQueryHandler(
        IUserRepository userRepository)
    : IQueryHandler<GetAllManagerUsersQuery, ErrorOr<List<ManagerUserSummaryDto>>>
{
    public async Task<ErrorOr<List<ManagerUserSummaryDto>>> Handle(
        GetAllManagerUsersQuery request,
        CancellationToken cancellationToken)
    {
        var managers = await userRepository.GetAllManagerUsersAsync(cancellationToken);
        return managers;
    }
}
