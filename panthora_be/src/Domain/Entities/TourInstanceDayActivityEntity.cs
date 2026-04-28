using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Một hoạt động cụ thể trong một ngày của TourInstance.
/// Bản sao độc lập của TourDayActivityEntity để gán lịch trình thực tế.
/// </summary>
public class TourInstanceDayActivityEntity : Aggregate<Guid>
{
    public Guid TourInstanceDayId { get; set; }
    public virtual TourInstanceDayEntity TourInstanceDay { get; set; } = null!;
    public int Order { get; set; }
    public TourDayActivityType ActivityType { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? Note { get; set; }
    public bool IsOptional { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }

    // Tách nhánh thông tin lịch trình cho Accommodation
    public virtual TourInstancePlanAccommodationEntity? Accommodation { get; set; }

    // Tách nhánh thông tin lịch trình cho Accommodation Room Blocks
    public virtual List<RoomBlockEntity> RoomBlocks { get; set; } = [];

    /// <summary>
    /// Concrete vehicles assigned to this transportation activity (multi-vehicle).
    /// Eager-load this collection in instance-detail queries that need vehicles (avoid N+1).
    /// </summary>
    public virtual List<TourInstanceTransportAssignmentEntity> TransportAssignments { get; set; } = [];

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
    /// <summary>
    /// Số xe Manager yêu cầu cho activity này (scope addendum 2026-04-23). NULL cho legacy rows —
    /// khi NULL, chỉ áp seat-sum rule. Khi set, approve phải có đúng giá trị này số dòng assignment.
    /// </summary>
    public int? RequestedVehicleCount { get; set; }
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

    // External transport confirmation (flights, trains, ferries — no in-app supplier)
    /// <summary>
    /// Manager manually confirms that external transport (flight/train/ferry) has been booked
    /// outside the system. Required for activation gate (BƯỚC 4 in lifecycle doc).
    /// Only meaningful when TransportSupplierId is NULL (External transport).
    /// </summary>
    public bool ExternalTransportConfirmed { get; set; } = false;
    /// <summary>Timestamp when Manager confirmed external transport booking.</summary>
    public DateTimeOffset? ExternalTransportConfirmedAt { get; set; }
    /// <summary>UserId of Manager who confirmed external transport.</summary>
    public string? ExternalTransportConfirmedBy { get; set; }

    /// <summary>
    /// Ảnh vé ngoài (Flight/Train/Boat) do TourOperator upload sau khi customer đã book.
    /// Eager-load khi cần ở các query phục vụ TourOperator; Provider không thấy danh sách này.
    /// </summary>
    public virtual List<TicketImageEntity> TicketImages { get; set; } = [];

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
        bool isOptional = false,
        // Transport plan fields — copied from TourDayActivity template
        Guid? fromLocationId = null,
        Guid? toLocationId = null,
        TransportationType? transportationType = null,
        string? transportationName = null,
        int? durationMinutes = null,
        decimal? distanceKm = null,
        decimal? price = null,
        string? bookingReference = null)
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
            // Transport plan data from template
            FromLocationId = fromLocationId,
            ToLocationId = toLocationId,
            TransportationType = transportationType,
            TransportationName = transportationName,
            DurationMinutes = durationMinutes,
            DistanceKm = distanceKm,
            Price = price,
            BookingReference = bookingReference,
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
    public void AssignTransportSupplier(Guid supplierId, VehicleType vehicleType, int seatCount, int? vehicleCount = null)
    {
        if (ActivityType != TourDayActivityType.Transportation)
            throw new InvalidOperationException("Can only assign transport supplier to Transportation activities.");
        if (IsExternalOnlyTransportationType(TransportationType))
            throw new InvalidOperationException("Cannot assign in-app supplier to Flight/Train/Boat activities — must be handled as external transport.");

        TransportSupplierId = supplierId;
        RequestedVehicleType = vehicleType;
        RequestedSeatCount = seatCount;
        RequestedVehicleCount = vehicleCount;
        TransportationApprovalStatus = ProviderApprovalStatus.Pending;
        TransportationApprovalNote = null;

        // Auto-fix TransportationType if it's null or Walking (0)
        // to ensure it passes repository ground-filters.
        if (!TransportationType.HasValue || TransportationType == Domain.Enums.TransportationType.Walking)
        {
            TransportationType = vehicleType switch
            {
                VehicleType.Car => Domain.Enums.TransportationType.Car,
                VehicleType.Motorbike => Domain.Enums.TransportationType.Motorbike,
                _ => Domain.Enums.TransportationType.Bus
            };
        }

        // Clear previous vehicle/driver assignment — provider must re-approve
        VehicleId = null;
        DriverId = null;
        TransportAssignments.Clear();
    }

    /// <summary>
    /// Transport provider approves this activity: assigns a specific vehicle and driver.
    /// Caller is responsible for creating the corresponding <c>VehicleBlock</c> Hard hold.
    /// </summary>
    /// <returns>The VehicleId and blocked date info for the caller to create a VehicleBlock.</returns>
    /// <summary>
    /// True when the activity has at least one transport assignment row with vehicle+driver,
    /// or legacy single <see cref="VehicleId"/> + <see cref="DriverId"/> on this entity (dual-read rollout).
    /// </summary>
    public bool HasCompleteVehicleAndDriverAssignment()
    {
        if (TransportAssignments.Count > 0)
            return TransportAssignments.All(t => t.VehicleId != Guid.Empty && t.DriverId.HasValue);

        return VehicleId.HasValue && DriverId.HasValue;
    }

    public void ApproveTransportation(Guid vehicleId, Guid? driverId, string? note)
    {
        if (ActivityType != TourDayActivityType.Transportation)
            throw new InvalidOperationException("Can only approve transportation on Transportation activities.");
        if (IsExternalOnlyTransportationType(TransportationType))
            throw new InvalidOperationException("Cannot approve Flight/Train/Boat activities via supplier flow — must be confirmed as external transport.");
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
        TransportAssignments.Clear();
        TransportationApprovalStatus = ProviderApprovalStatus.Rejected;
        TransportationApprovalNote = note;
    }

    /// <summary>
    /// Manager confirms that external transport (flight/train/ferry) has been booked outside the system.
    /// Requires BookingReference and DepartureTime/ArrivalTime to be set.
    /// After confirmation, caller should invoke <see cref="TourInstanceEntity.CheckAndActivateTourInstance"/>.
    /// </summary>
    public void ConfirmExternalTransport(string performedBy)
    {
        if (ActivityType != TourDayActivityType.Transportation)
            throw new InvalidOperationException("Can only confirm external transport on Transportation activities.");
        if (TransportSupplierId.HasValue)
            throw new InvalidOperationException("Cannot confirm as external — this activity has an in-app transport supplier (Ground). Use ApproveTransportation instead.");
        if (string.IsNullOrWhiteSpace(BookingReference))
            throw new InvalidOperationException("BookingReference is required before confirming external transport.");
        if (!DepartureTime.HasValue || !ArrivalTime.HasValue)
            throw new InvalidOperationException("DepartureTime and ArrivalTime are required before confirming external transport.");

        ExternalTransportConfirmed = true;
        ExternalTransportConfirmedAt = DateTimeOffset.UtcNow;
        ExternalTransportConfirmedBy = performedBy;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Undo external transport confirmation (e.g., booking was cancelled externally).
    /// </summary>
    public void UnconfirmExternalTransport(string performedBy)
    {
        if (ActivityType != TourDayActivityType.Transportation)
            throw new InvalidOperationException("Can only unconfirm external transport on Transportation activities.");

        ExternalTransportConfirmed = false;
        ExternalTransportConfirmedAt = null;
        ExternalTransportConfirmedBy = null;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Vé máy bay / tàu / du thuyền không có nhà cung cấp in-app — phải do Manager
    /// đặt vé bên ngoài và confirm sau khi khách thanh toán. Dùng để guard cả khi
    /// Manager gán supplier (<see cref="AssignTransportSupplier"/>) lẫn khi Provider
    /// duyệt (<see cref="ApproveTransportation"/>).
    /// </summary>
    public static bool IsExternalOnlyTransportationType(Domain.Enums.TransportationType? type) =>
        type is Domain.Enums.TransportationType.Flight
             or Domain.Enums.TransportationType.Train
             or Domain.Enums.TransportationType.Boat;
}
