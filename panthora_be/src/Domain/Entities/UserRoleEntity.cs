namespace Domain.Entities;

/// <summary>
/// Bảng trung gian (join table) giữa User và Role.
/// Mỗi bản ghi = một user có một vai trò cụ thể.
/// User có thể có nhiều vai trò (nhiều bản ghi).
/// </summary>
public class UserRoleEntity
{
    /// <summary>ID của user được gán vai trò.</summary>
    public Guid UserId { get; set; }
    /// <summary>ID của vai trò được gán.</summary>
    public int RoleId { get; set; }

    public static UserRoleEntity Create(Guid userId, int roleId)
    {
        return new UserRoleEntity { UserId = userId, RoleId = roleId };
    }
}
