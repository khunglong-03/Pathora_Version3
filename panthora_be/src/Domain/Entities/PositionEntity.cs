using Domain.Abstractions;

namespace Domain.Entities;

/// <summary>
/// Chức danh/vị trí công việc trong tổ chức.
/// Ví dụ: "Tour Guide", "Manager", "Accountant".
/// Có thể dùng để phân quyền hoặc phân công công việc.
/// </summary>
public class PositionEntity : Aggregate<Guid>
{
    public PositionEntity()
    {
        Id = Guid.CreateVersion7();
    }

    /// <summary>Tên chức danh.</summary>
    public string Name { get; set; } = null!;
    /// <summary>Cấp độ (1 = thấp nhất).</summary>
    public int Level { get; set; } = 1;
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; }
    /// <summary>Loại chức danh (ví dụ: 1=Guide, 2=Admin, 3=Operations).</summary>
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
