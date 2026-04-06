namespace Domain.Entities;

public class SupplierEntity : Aggregate<Guid>
{
    public SupplierEntity()
    {
        Id = Guid.CreateVersion7();
        IsActive = true;
    }

    public string SupplierCode { get; set; } = null!;
    public SupplierType SupplierType { get; set; }
    public string Name { get; set; } = null!;
    public string? TaxCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Note { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }

    public static SupplierEntity Create(
        string supplierCode,
        SupplierType supplierType,
        string name,
        string performedBy,
        string? taxCode = null,
        string? phone = null,
        string? email = null,
        string? address = null,
        string? note = null)
    {
        return new SupplierEntity
        {
            SupplierCode = supplierCode,
            SupplierType = supplierType,
            Name = name,
            TaxCode = taxCode,
            Phone = phone,
            Email = email,
            Address = address,
            Note = note,
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
        string? taxCode = null,
        string? phone = null,
        string? email = null,
        string? address = null,
        string? note = null,
        bool? isActive = null)
    {
        SupplierCode = supplierCode;
        SupplierType = supplierType;
        Name = name;
        TaxCode = taxCode;
        Phone = phone;
        Email = email;
        Address = address;
        Note = note;
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
}
