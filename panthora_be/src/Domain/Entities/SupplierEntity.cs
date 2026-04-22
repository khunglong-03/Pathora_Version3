namespace Domain.Entities;

/// <summary>
/// Nhà cung cấp dịch vụ du lịch: vận chuyển, lưu trú, hoạt động/điểm tham quan.
/// Mỗi Supplier cung cấp một hoặc nhiều loại dịch vụ và được sử dụng khi đặt trước
/// dịch vụ cho booking. Ví dụ: "Vietnam Airlines", "InterContinental Hotel", "Saigontourist".
/// </summary>
public class SupplierEntity : Aggregate<Guid>
{
    public SupplierEntity()
    {
        Id = Guid.CreateVersion7();
        IsActive = true;
    }

    /// <summary>Mã nhà cung cấp (unique).</summary>
    public string SupplierCode { get; set; } = null!;
    /// <summary>Loại: Transport, Accommodation, Activity, v.v.</summary>
    public SupplierType SupplierType { get; set; }
    /// <summary>Tên nhà cung cấp.</summary>
    public string Name { get; set; } = null!;
    /// <summary>Số điện thoại liên hệ.</summary>
    public string? Phone { get; set; }
    /// <summary>Email liên hệ.</summary>
    public string? Email { get; set; }
    /// <summary>Địa chỉ.</summary>
    public string? Address { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }
    /// <summary>ID người phụ trách (owner/user).</summary>
    public Guid? OwnerUserId { get; set; }
    /// <summary>Người phụ trách (owner/user).</summary>
    public virtual UserEntity? Owner { get; set; }
    /// <summary>True nếu nhà cung cấp đang hoạt động.</summary>
    public bool IsActive { get; set; }
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; }

    /// <summary>Châu lục mà nhà cung cấp này hoạt động (phục vụ filter theo tour).</summary>
    public Continent? Continent { get; set; }

    public static SupplierEntity Create(
        string supplierCode,
        SupplierType supplierType,
        string name,
        string performedBy,
        string? phone = null,
        string? email = null,
        string? address = null,
        string? note = null,
        Continent? continent = null,
        Guid? ownerUserId = null)
    {
        return new SupplierEntity
        {
            SupplierCode = supplierCode,
            SupplierType = supplierType,
            Name = name,
            Phone = phone,
            Email = email,
            Address = address,
            Note = note,
            Continent = continent,
            OwnerUserId = ownerUserId,
            IsActive = true,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string supplierCode,
        SupplierType supplierType,
        string name,
        string performedBy,
        string? phone = null,
        string? email = null,
        string? address = null,
        string? note = null,
        Continent? continent = null,
        bool? isActive = null)
    {
        SupplierCode = supplierCode;
        SupplierType = supplierType;
        Name = name;
        Phone = phone;
        Email = email;
        Address = address;
        Note = note;
        Continent = continent;
        IsActive = isActive ?? IsActive;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        IsActive = false;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Deactivate(string performedBy)
    {
        IsActive = false;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Activate(string performedBy)
    {
        IsActive = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
