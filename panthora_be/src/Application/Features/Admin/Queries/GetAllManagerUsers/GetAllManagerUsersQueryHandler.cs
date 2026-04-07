using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;

namespace Application.Features.Admin.Queries.GetAllManagerUsers;

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
