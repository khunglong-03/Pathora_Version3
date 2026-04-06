namespace Domain.Entities;

public class UserRoleEntity
{
    public Guid UserId { get; set; }
    public int RoleId { get; set; }

    public static UserRoleEntity Create(Guid userId, int roleId)
    {
        return new UserRoleEntity { UserId = userId, RoleId = roleId };
    }
}
