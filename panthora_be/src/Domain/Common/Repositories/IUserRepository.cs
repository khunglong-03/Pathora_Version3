using Domain.Entities;
using Domain.Enums;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface IUserRepository : IRepository<UserEntity>
{
    Task<UserEntity?> FindByEmail(string email, CancellationToken cancellationToken = default);
    Task<UserEntity?> FindById(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserEntity>> FindByIds(IEnumerable<Guid> ids, CancellationToken cancellationToken = default);
    Task<UserEntity?> FindByGoogleId(string googleId, CancellationToken cancellationToken = default);
    Task Create(UserEntity user, CancellationToken cancellationToken = default);
    Task SoftDelete(Guid id, CancellationToken cancellationToken = default);
    Task<List<UserEntity>> FindAll(string? textSearch, Guid? departmentId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<List<UserEntity>> FindAll(string? textSearch, int? roleId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<List<UserEntity>> FindAll(string? textSearch, Guid? departmentId, int pageNumber, int pageSize, List<Guid>? roleUserIds, CancellationToken cancellationToken = default);
    Task<int> CountAll(string? textSearch, int? roleId, CancellationToken cancellationToken = default);
    Task<int> CountAll(string? textSearch, Guid? departmentId, CancellationToken cancellationToken = default);
    Task<int> CountAll(string? textSearch, Guid? departmentId, List<Guid>? roleUserIds, CancellationToken cancellationToken = default);
    Task<int> CountActiveManagersAsync(CancellationToken cancellationToken);
    Task<Dictionary<string, int>> CountByRolesAsync(string? textSearch, CancellationToken cancellationToken = default);
    Task<bool> IsEmailUnique(string email, CancellationToken cancellationToken = default);
    Task<List<UserEntity>> FindProvidersByRoleAsync(int roleId, string? search, string? status, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountProvidersByRoleAsync(int roleId, string? search, string? status, CancellationToken cancellationToken = default);
    Task<List<ManagerUserSummaryDto>> GetAllManagerUsersAsync(CancellationToken cancellationToken);

    // Filtered by a precomputed set of user IDs (e.g., for continent-filtered provider lists)
    Task<List<UserEntity>> FindProvidersByRoleWithIdsAsync(
        int roleId,
        string? search,
        string? status,
        List<Guid> userIds,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<int> CountProvidersByRoleWithIdsAsync(
        int roleId,
        string? search,
        string? status,
        List<Guid> userIds,
        CancellationToken cancellationToken = default);
    Task<UserEntity?> FindTransportProviderByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
