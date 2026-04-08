using Domain.Abstractions;

namespace Domain.Entities;

/// <summary>
/// Phòng ban trong tổ chức. Hỗ trợ cấu trúc phân cấp (ParentId) cho các phòng ban con.
/// Ví dụ: "Phòng Kinh Doanh" → "Team Du Lịch Trong Nước".
/// </summary>
public class DepartmentEntity : Aggregate<Guid>
{
    public DepartmentEntity()
    {
        Id = Guid.CreateVersion7();
    }

    /// <summary>ID phòng ban cha (null nếu là phòng ban cấp cao nhất).</summary>
    public Guid? ParentId { get; set; }
    /// <summary>Tên phòng ban.</summary>
    public string Name { get; set; } = null!;
    /// <summary>Cấp độ trong hệ thống phân cấp (1 = cấp cao nhất).</summary>
    public int Level { get; set; } = 1;
    /// <summary>Cờ xóa mềm.</summary>
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
