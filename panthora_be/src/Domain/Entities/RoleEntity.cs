using Domain.Abstractions;
using Domain.Constant;

namespace Domain.Entities;

public class RoleEntity : Aggregate<int>
{

    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public int Type { get; set; }
    public RoleStatus Status { get; set; } = RoleStatus.Active;
    public bool IsDeleted { get; set; }

    public static RoleEntity Create(string name, string description, int type, string performedBy)
    {
        return new RoleEntity
        {
            Name = name,
            Description = description,
            Type = type,
            Status = RoleStatus.Active,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(string name, string description, int type, RoleStatus status, string performedBy)
    {
        Name = name;
        Description = description;
        Type = type;
        Status = status;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
