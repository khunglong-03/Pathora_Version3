using Domain.Abstractions;
using Domain.Constant;

namespace Domain.Entities;

/// <summary>
/// Định nghĩa một vai trò (role) trong hệ thống RBAC.
/// Vai trò gán cho User thông qua bảng trung gian UserRole.
/// Ví dụ: Admin, TourManager, TourGuide, Customer.
/// </summary>
public class RoleEntity : Aggregate<int>
{
    /// <summary>Tên vai trò (unique, ví dụ: "Admin", "TourGuide").</summary>
    public string Name { get; set; } = null!;
    /// <summary>Mô tả vai trò.</summary>
    public string Description { get; set; } = null!;
    /// <summary>Loại vai trò (ví dụ: 1=System, 2=Custom).</summary>
    public int Type { get; set; }
    /// <summary>Trạng thái: Active hoặc Inactive.</summary>
    public RoleStatus Status { get; set; } = RoleStatus.Active;
    /// <summary>Cờ xóa mềm.</summary>
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
