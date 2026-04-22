using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Chi tiết gán chỗ ở thực tế cho một hoạt động lưu trú của đợt tour.
/// </summary>
public class TourInstancePlanAccommodationEntity : Entity<Guid>
{
    public Guid TourInstanceDayActivityId { get; set; }
    public virtual TourInstanceDayActivityEntity TourInstanceDayActivity { get; set; } = null!;

    // Supplier (Hotel Provider) assignment — per-accommodation activity
    /// <summary>ID của Hotel Provider (Accommodation Supplier) cho hoạt động lưu trú này.</summary>
    public Guid? SupplierId { get; set; }
    /// <summary>Nhà cung cấp chỗ ở cho hoạt động lưu trú này.</summary>
    public virtual SupplierEntity? Supplier { get; set; }
    /// <summary>Trạng thái duyệt của Supplier cho hoạt động này.</summary>
    public ProviderApprovalStatus SupplierApprovalStatus { get; set; } = ProviderApprovalStatus.NotAssigned;
    /// <summary>
    /// Ghi chú/lý do từ chối của Supplier.
    /// v1 intentionally overwrites the previous note; approval history is tracked in a future change.
    /// </summary>
    public string? SupplierApprovalNote { get; set; }

    public RoomType? RoomType { get; set; }
    public int Quantity { get; set; }

    public DateTimeOffset? CheckInTime { get; set; }
    public DateTimeOffset? CheckOutTime { get; set; }

    public static TourInstancePlanAccommodationEntity Create(
        Guid tourInstanceDayActivityId,
        RoomType? roomType = null,
        int quantity = 1,
        DateTimeOffset? checkInTime = null,
        DateTimeOffset? checkOutTime = null,
        Guid? supplierId = null)
    {
        return new TourInstancePlanAccommodationEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceDayActivityId = tourInstanceDayActivityId,
            RoomType = roomType,
            Quantity = quantity,
            CheckInTime = checkInTime,
            CheckOutTime = checkOutTime,
            SupplierId = supplierId,
            SupplierApprovalStatus = supplierId.HasValue
                ? ProviderApprovalStatus.Pending
                : ProviderApprovalStatus.NotAssigned
        };
    }

    public void Update(
        RoomType? roomType,
        int quantity,
        DateTimeOffset? checkInTime = null,
        DateTimeOffset? checkOutTime = null,
        Guid? supplierId = null)
    {
        RoomType = roomType;
        Quantity = quantity;
        CheckInTime = checkInTime;
        CheckOutTime = checkOutTime;

        // If supplier changed, reset approval
        if (supplierId != SupplierId)
        {
            SupplierId = supplierId;
            SupplierApprovalStatus = supplierId.HasValue
                ? ProviderApprovalStatus.Pending
                : ProviderApprovalStatus.NotAssigned;
            SupplierApprovalNote = null;
        }
    }

    /// <summary>
    /// Assign or change the supplier for this accommodation activity.
    /// Resets approval status to Pending.
    /// </summary>
    public void AssignSupplier(Guid supplierId)
    {
        SupplierId = supplierId;
        SupplierApprovalStatus = ProviderApprovalStatus.Pending;
        SupplierApprovalNote = null;
    }

    /// <summary>
    /// Supplier approves or rejects this accommodation activity.
    /// v1 intentionally overwrites the previous note; approval history is tracked in a future change.
    /// </summary>
    public void ApproveBySupplier(bool isApproved, string? note = null)
    {
        if (SupplierId is null)
            throw new InvalidOperationException("Không thể duyệt khi chưa gán nhà cung cấp.");

        SupplierApprovalStatus = isApproved
            ? ProviderApprovalStatus.Approved
            : ProviderApprovalStatus.Rejected;
        SupplierApprovalNote = note;
    }
}
