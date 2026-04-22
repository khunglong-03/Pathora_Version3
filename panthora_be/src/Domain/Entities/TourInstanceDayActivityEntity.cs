using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Một hoạt động cụ thể trong một ngày của TourInstance.
/// Bản sao độc lập của TourDayActivityEntity để gán lịch trình thực tế.
/// </summary>
public class TourInstanceDayActivityEntity : Aggregate<Guid>
{
    /// <summary>ID của TourInstanceDay cha mà activity này thuộc về.</summary>
    public Guid TourInstanceDayId { get; set; }
    /// <summary>TourInstanceDay cha.</summary>
    public virtual TourInstanceDayEntity TourInstanceDay { get; set; } = null!;

    /// <summary>Thứ tự sắp xếp hoạt động trong ngày.</summary>
    public int Order { get; set; }
    /// <summary>Loại hoạt động: Sightseeing, Meal, Transport, Accommodation, FreeTime, v.v.</summary>
    public TourDayActivityType ActivityType { get; set; }
    /// <summary>Tiêu đề hoạt động.</summary>
    public string Title { get; set; } = null!;
    /// <summary>Mô tả chi tiết hoạt động.</summary>
    public string? Description { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }
    /// <summary>True nếu hoạt động này là tùy chọn (không bắt buộc).</summary>
    public bool IsOptional { get; set; }

    // Time
    /// <summary>Thời gian bắt đầu hoạt động trong ngày.</summary>
    public TimeOnly? StartTime { get; set; }
    /// <summary>Thời gian kết thúc hoạt động.</summary>
    public TimeOnly? EndTime { get; set; }

    // Tách nhánh thông tin lịch trình cho Accommodation
    public virtual TourInstancePlanAccommodationEntity? Accommodation { get; set; }

    // Tách nhánh thông tin lịch trình cho Accommodation Room Blocks
    public virtual List<RoomBlockEntity> RoomBlocks { get; set; } = [];

    // Transportation Plan info
    public Guid? FromLocationId { get; set; }
    public virtual TourPlanLocationEntity? FromLocation { get; set; }
    public Guid? ToLocationId { get; set; }
    public virtual TourPlanLocationEntity? ToLocation { get; set; }
    public TransportationType? TransportationType { get; set; }
    public string? TransportationName { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? DistanceKm { get; set; }
    public decimal? Price { get; set; }
    public string? BookingReference { get; set; }

    // Transport Plan fields (per-activity, analogous to PlanAccommodation for Hotel)
    /// <summary>Loại xe yêu cầu cho activity vận chuyển này (do Manager chỉ định).</summary>
    public VehicleType? RequestedVehicleType { get; set; }
    /// <summary>Số ghế yêu cầu (thường ≥ MaxParticipation). Provider phải chọn xe có SeatCapacity ≥ giá trị này.</summary>
    public int? RequestedSeatCount { get; set; }
    /// <summary>ID của Transport Supplier được gán cho activity này (thay thế TourInstance.TransportProviderId).</summary>
    public Guid? TransportSupplierId { get; set; }
    /// <summary>Transport Supplier navigation property.</summary>
    public virtual SupplierEntity? TransportSupplier { get; set; }

    // Instance-specific Vehicle Assignment info
    public Guid? VehicleId { get; set; }
    public virtual VehicleEntity? Vehicle { get; set; }
    public Guid? DriverId { get; set; }
    public virtual DriverEntity? Driver { get; set; }
    public string? PickupLocation { get; set; }
    public string? DropoffLocation { get; set; }
    public DateTimeOffset? DepartureTime { get; set; }
    public DateTimeOffset? ArrivalTime { get; set; }

    /// <summary>Trạng thái phê duyệt của nhà cung cấp vận chuyển cho riêng activity này.</summary>
    public ProviderApprovalStatus TransportationApprovalStatus { get; set; } = ProviderApprovalStatus.Pending;
    /// <summary>
    /// Ghi chú từ nhà cung cấp vận chuyển khi phê duyệt/từ chối.
    /// v1 intentionally overwrites the previous note; approval history is tracked in a future change.
    /// </summary>
    public string? TransportationApprovalNote { get; set; }

    public static TourInstanceDayActivityEntity Create(
        Guid tourInstanceDayId,
        int order,
        TourDayActivityType activityType,
        string title,
        string performedBy,
        string? description = null,
        string? note = null,
        TimeOnly? startTime = null,
        TimeOnly? endTime = null,
        bool isOptional = false)
    {
        var entity = new TourInstanceDayActivityEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceDayId = tourInstanceDayId,
            Order = order,
            ActivityType = activityType,
            Title = title,
            Description = description,
            Note = note,
            IsOptional = isOptional,
            StartTime = startTime,
            EndTime = endTime,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };

        return entity;
    }

    public void Update(int order, TourDayActivityType activityType, string title, string performedBy, string? description = null, string? note = null, TimeOnly? startTime = null, TimeOnly? endTime = null, bool isOptional = false)
    {
        Order = order;
        ActivityType = activityType;
        Title = title;
        Description = description;
        Note = note;
        IsOptional = isOptional;
        StartTime = startTime;
        EndTime = endTime;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Manager assigns (or changes) the transport supplier for this transportation activity.
    /// Resets approval status to Pending and clears any previously assigned vehicle/driver.
    /// Mirrors <see cref="TourInstancePlanAccommodationEntity.AssignSupplier"/>.
    /// </summary>
    public void AssignTransportSupplier(Guid supplierId, VehicleType vehicleType, int seatCount)
    {
        if (ActivityType != TourDayActivityType.Transportation)
            throw new InvalidOperationException("Can only assign transport supplier to Transportation activities.");

        TransportSupplierId = supplierId;
        RequestedVehicleType = vehicleType;
        RequestedSeatCount = seatCount;
        TransportationApprovalStatus = ProviderApprovalStatus.Pending;
        TransportationApprovalNote = null;
        // Clear previous vehicle/driver assignment — provider must re-approve
        VehicleId = null;
        DriverId = null;
    }

    /// <summary>
    /// Transport provider approves this activity: assigns a specific vehicle and driver.
    /// Caller is responsible for creating the corresponding <c>VehicleBlock</c> Hard hold.
    /// </summary>
    /// <returns>The VehicleId and blocked date info for the caller to create a VehicleBlock.</returns>
    public void ApproveTransportation(Guid vehicleId, Guid driverId, string? note)
    {
        if (ActivityType != TourDayActivityType.Transportation)
            throw new InvalidOperationException("Can only approve transportation on Transportation activities.");
        if (!TransportSupplierId.HasValue)
            throw new InvalidOperationException("Cannot approve transportation without an assigned supplier.");

        VehicleId = vehicleId;
        DriverId = driverId;
        TransportationApprovalStatus = ProviderApprovalStatus.Approved;
        TransportationApprovalNote = note;
    }

    /// <summary>
    /// Transport provider rejects this activity. Clears vehicle/driver assignment.
    /// Caller is responsible for deleting any existing <c>VehicleBlock</c>.
    /// </summary>
    public void RejectTransportation(string? note)
    {
        if (ActivityType != TourDayActivityType.Transportation)
            throw new InvalidOperationException("Can only reject transportation on Transportation activities.");

        VehicleId = null;
        DriverId = null;
        TransportationApprovalStatus = ProviderApprovalStatus.Rejected;
        TransportationApprovalNote = note;
    }
}
