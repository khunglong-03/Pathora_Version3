using Domain.Entities;
using Domain.Enums;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface IRoleRepository
{
    Task<ErrorOr<Success>> Create(RoleEntity role, CancellationToken cancellationToken = default);
    Task<ErrorOr<Success>> Update(RoleEntity role);

    Task<ErrorOr<Success>> AddUser(Guid userId, List<int> roleIds, CancellationToken cancellationToken = default);
    Task<ErrorOr<Success>> DeleteUser(Guid userId, CancellationToken cancellationToken = default);
    Task<ErrorOr<List<(Guid UserId, int RoleId)>>> FindAllUserRoles(CancellationToken cancellationToken = default);
    Task<ErrorOr<List<RoleEntity>>> GetAll(CancellationToken cancellationToken = default);
    Task<ErrorOr<RoleEntity?>> FindById(int roleId, CancellationToken cancellationToken = default);
    Task<ErrorOr<RoleEntity?>> FindByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<ErrorOr<List<RoleEntity>>> FindByUserId(string userId, CancellationToken cancellationToken = default);
    Task<ErrorOr<Dictionary<Guid, List<RoleEntity>>>> FindByUserIds(List<Guid> userIds, CancellationToken cancellationToken = default);

    Task<ErrorOr<List<RoleEntity>>> FindAll(
        string? roleName = null,
        RoleStatus status = RoleStatus.Active,
        int pageNumber = 0,
        int pageSize = 0,
        CancellationToken cancellationToken = default);

    Task<ErrorOr<int>> CountAll(string? roleName = null, RoleStatus status = RoleStatus.Active, CancellationToken cancellationToken = default);
}
