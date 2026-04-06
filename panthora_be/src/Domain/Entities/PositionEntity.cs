using Domain.Abstractions;

namespace Domain.Entities;

public class PositionEntity : Aggregate<Guid>
{
    public PositionEntity()
    {
        Id = Guid.CreateVersion7();
    }

    public string Name { get; set; } = null!;
    public int Level { get; set; } = 1;
    public string? Note { get; set; }
    public bool IsDeleted { get; set; }
    public int? Type { get; set; }

    public static PositionEntity Create(string name, int level, string performedBy, string? note = null, int? type = null)
    {
        return new PositionEntity
        {
            Name = name,
            Level = level,
            Note = note,
            Type = type,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(string name, int level, string performedBy, string? note = null, int? type = null)
    {
        Name = name;
        Level = level;
        Note = note;
        Type = type;
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
