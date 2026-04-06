using Domain.Abstractions;

namespace Domain.Entities;

public class DepartmentEntity : Aggregate<Guid>
{
    public DepartmentEntity()
    {
        Id = Guid.CreateVersion7();
    }

    public Guid? ParentId { get; set; }
    public string Name { get; set; } = null!;
    public int Level { get; set; } = 1;
    public bool IsDeleted { get; set; }

    public static DepartmentEntity Create(string name, int level, string performedBy, Guid? parentId = null)
    {
        return new DepartmentEntity
        {
            Name = name,
            Level = level,
            ParentId = parentId,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(string name, int level, string performedBy, Guid? parentId = null)
    {
        Name = name;
        Level = level;
        ParentId = parentId;
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
