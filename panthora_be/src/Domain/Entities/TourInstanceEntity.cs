namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Một đợt/kỳ chạy cụ thể của một tour. TourInstance đại diện cho một lịch trình tour
/// có ngày khởi hành và kết thúc cụ thể, số chỗ giới hạn, và giá tại thời điểm tạo.
/// Nhiều Booking có thể tham gia cùng một TourInstance (public tour).
/// Có thể là Public (mở bán chung) hoặc Private (chỉ riêng một nhóm).
/// </summary>
public class TourInstanceEntity : Aggregate<Guid>
{
    // Foreign keys
    /// <summary>ID của Tour cha.</summary>
    public Guid TourId { get; set; }
    /// <summary>Tour cha.</summary>
    public virtual TourEntity Tour { get; set; } = null!;
    /// <summary>ID của Classification (phân loại ngày/giá) được sử dụng.</summary>
    public Guid ClassificationId { get; set; }
    /// <summary>Classification được sử dụng cho instance này.</summary>
    public virtual TourClassificationEntity Classification { get; set; } = null!;

    // Provider Assignment & Approval
    // NOTE: Hotel provider assignment has moved to TourInstancePlanAccommodationEntity (per-activity level).
    // NOTE: Transport provider assignment has moved to TourInstanceDayActivityEntity.TransportSupplierId (per-activity level).

    /// <summary>
    /// DEPRECATED: Legacy single transport provider for the entire instance.
    /// Source of truth is now <c>TourInstanceDayActivityEntity.TransportSupplierId</c> (per-activity).
    /// Derived getter returns the first transportation activity's supplier for backward compat.
    /// Will be dropped in a future migration (Release C).
    /// </summary>
    [Obsolete("Use TourInstanceDayActivityEntity.TransportSupplierId per-activity instead.")]
    public Guid? TransportProviderId { get; set; }
    /// <summary>DEPRECATED: Navigation property kept temporarily for backward compat DTO mapping.</summary>
    [Obsolete("Use TourInstanceDayActivityEntity.TransportSupplier per-activity instead.")]
    public virtual SupplierEntity? TransportProvider { get; set; }

    // Instance identity
    /// <summary>Mã đợt tour tự sinh (format: TI-YYYYMMDDHHMMSS-NNNN).</summary>
    public string TourInstanceCode { get; set; } = null!;
    /// <summary>Tiêu đề instance (tên hiển thị).</summary>
    public string Title { get; set; } = null!;

    // Denormalized from Tour
    /// <summary>Tên tour (tảo bằng từ Tour cha — để truy vấn nhanh).</summary>
    public string TourName { get; set; } = null!;
    /// <summary>Mã tour (tạo bằng từ Tour cha).</summary>
    public string TourCode { get; set; } = null!;
    /// <summary>Tên phân loại (tạo bằng từ Classification cha).</summary>
    public string ClassificationName { get; set; } = null!;

    // Status & Type
    /// <summary>Loại tour: Public (mở bán) hoặc Private (riêng).</summary>
    public TourType InstanceType { get; set; } = TourType.Public;
    /// <summary>Trạng thái instance: Available → Confirmed → InProgress → Completed, hoặc SoldOut/Cancelled.</summary>
    public TourInstanceStatus Status { get; set; } = TourInstanceStatus.Available;
    /// <summary>Lý do hủy (nếu bị hủy).</summary>
    public string? CancellationReason { get; set; }

    // Schedule
    /// <summary>Ngày khởi hành.</summary>
    public DateTimeOffset StartDate { get; set; }
    /// <summary>Ngày kết thúc.</summary>
    public DateTimeOffset EndDate { get; set; }
    /// <summary>Số ngày của chuyến đi.</summary>
    public int DurationDays { get; set; }
    /// <summary>Hạn xác nhận booking (trước ngày khởi hành).</summary>
    public DateTimeOffset? ConfirmationDeadline { get; set; }

    // Participants
    /// <summary>Số chỗ tối đa cho phép tham gia.</summary>
    public int MaxParticipation { get; set; }
    /// <summary>Số chỗ đã được đặt hiện tại.</summary>
    public int CurrentParticipation { get; set; }

    // BasePrice — snapshot tại thời điểm tạo instance
    /// <summary>Giá cơ bản tại thời điểm tạo instance (snapshot từ Classification).</summary>
    public decimal BasePrice { get; set; }

    // Media & Location
    /// <summary>Địa điểm xuất phát/tour.</summary>
    public string? Location { get; set; }
    /// <summary>Ảnh thumbnail của instance.</summary>
    public ImageEntity Thumbnail { get; set; } = null!;
    /// <summary>Danh sách ảnh gallery.</summary>
    public List<ImageEntity> Images { get; set; } = [];

    // Services & Managers
    /// <summary>Danh sách dịch vụ đã bao gồm trong tour.</summary>
    public List<string> IncludedServices { get; set; } = [];
    /// <summary>Danh sách nhân viên quản lý instance này.</summary>
    public virtual List<TourInstanceManagerEntity> Managers { get; set; } = [];


    // Instance-specific day schedule
    /// <summary>Danh sách các ngày cụ thể của instance (TourInstanceDay).</summary>
    public virtual List<TourInstanceDayEntity> InstanceDays { get; set; } = [];

    // Soft delete
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// Concurrency token (ER-2). EF is configured with <c>IsRowVersion()</c> so that
    /// concurrent status transitions throw <c>DbUpdateConcurrencyException</c>, which the
    /// service layer catches and converts into an idempotent success (or a re-read retry).
    /// </summary>
    [System.ComponentModel.DataAnnotations.Timestamp]
    public byte[] RowVersion { get; set; } = [];

    // Translations (vi/en)
    /// <summary>Bản dịch đa ngôn ngữ (en/vi) cho instance.</summary>
    public Dictionary<string, TourInstanceTranslationData> Translations { get; set; } = [];

    public static string GenerateInstanceCode()
    {
        var timestamp = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss");
        var random = Random.Shared.Next(1000, 9999);
        return $"TI-{timestamp}-{random}";
    }

    private static int CalculateDurationDays(DateTimeOffset startDate, DateTimeOffset endDate)
    {
        return (endDate.Date - startDate.Date).Days + 1;
    }

    public static TourInstanceEntity Create(
        Guid tourId,
        Guid classificationId,
        string title,
        string tourName,
        string tourCode,
        string classificationName,
        TourType instanceType,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        int maxParticipation,
        decimal basePrice,
        string performedBy,
        Guid? transportProviderId = null,
        string? location = null,
        ImageEntity? thumbnail = null,
        List<ImageEntity>? images = null,
        DateTimeOffset? confirmationDeadline = null,
        List<string>? includedServices = null)
    {
        EnsureValidDateRange(startDate, endDate);
        EnsureValidMaxParticipation(maxParticipation);

        return new TourInstanceEntity
        {
            Id = Guid.CreateVersion7(),
            TourId = tourId,
            ClassificationId = classificationId,
#pragma warning disable CS0618 // Self-reference to deprecated field during factory construction
            TransportProviderId = transportProviderId,
#pragma warning restore CS0618
            TourInstanceCode = GenerateInstanceCode(),
            Title = title,
            TourName = tourName,
            TourCode = tourCode,
            ClassificationName = classificationName,
            InstanceType = instanceType,
            Status = transportProviderId.HasValue ? TourInstanceStatus.PendingApproval : TourInstanceStatus.Available,
            StartDate = startDate,
            EndDate = endDate,
            DurationDays = CalculateDurationDays(startDate, endDate),
            MaxParticipation = maxParticipation,
            CurrentParticipation = 0,
            BasePrice = basePrice,
            Location = location,
            Thumbnail = thumbnail ?? new ImageEntity(),
            Images = images ?? [],
            ConfirmationDeadline = confirmationDeadline,
            IncludedServices = includedServices ?? [],
            IsDeleted = false,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string title,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        int maxParticipation,
        decimal basePrice,
        string performedBy,
        string? location = null,
        ImageEntity? thumbnail = null,
        List<ImageEntity>? images = null,
        DateTimeOffset? confirmationDeadline = null,
        List<string>? includedServices = null)
    {
        EnsureValidDateRange(startDate, endDate);
        EnsureValidMaxParticipation(maxParticipation);

        Title = title;
        StartDate = startDate;
        EndDate = endDate;
        DurationDays = CalculateDurationDays(startDate, endDate);
        MaxParticipation = maxParticipation;
        BasePrice = basePrice;
        Location = location;
        ConfirmationDeadline = confirmationDeadline;
        if (thumbnail is not null)
        {
            Thumbnail ??= new ImageEntity();
            Thumbnail.FileId = thumbnail.FileId;
            Thumbnail.OriginalFileName = thumbnail.OriginalFileName;
            Thumbnail.FileName = thumbnail.FileName;
            Thumbnail.PublicURL = thumbnail.PublicURL;
        }
        if (images is not null)
        {
            Images.Clear();
            Images.AddRange(images);
        }
        if (includedServices is not null)
            IncludedServices = includedServices;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void AddParticipant(int count = 1)
    {
        if (count <= 0)
            throw new ArgumentOutOfRangeException(nameof(count), "Số người thêm phải lớn hơn 0.");
        if (CurrentParticipation + count > MaxParticipation)
            throw new InvalidOperationException($"Không thể thêm {count} người. Đã đạt giới hạn tối đa {MaxParticipation} người.");
        CurrentParticipation += count;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    // ApproveByTransportProvider has been removed — transport approval is now per-activity.
    // Use TourInstanceDayActivityEntity.ApproveTransportation() / RejectTransportation() instead.

    /// <summary>
    /// Check if all accommodations with assigned suppliers are approved.
    /// Filters out soft-deleted days (ER-16).
    /// </summary>
    public bool AreAllAccommodationsApproved()
    {
        var accommodations = InstanceDays
            .Where(d => !d.IsDeleted)
            .SelectMany(d => d.Activities)
            .Where(a => a.Accommodation is not null && a.Accommodation.SupplierId.HasValue)
            .Select(a => a.Accommodation!)
            .ToList();

        return accommodations.Count == 0 || accommodations.All(a => a.SupplierApprovalStatus == ProviderApprovalStatus.Approved);
    }

    /// <summary>
    /// Check if all transportation activities with assigned suppliers are approved.
    /// Mirrors <see cref="AreAllAccommodationsApproved"/>.
    /// Filters out soft-deleted days (ER-16).
    /// </summary>
    public bool AreAllTransportationApproved()
    {
        var transportActivities = InstanceDays
            .Where(d => !d.IsDeleted)
            .SelectMany(d => d.Activities)
            .Where(a => a.ActivityType == TourDayActivityType.Transportation && a.TransportSupplierId.HasValue)
            .ToList();

        return transportActivities.Count == 0 || transportActivities.All(a => a.TransportationApprovalStatus == ProviderApprovalStatus.Approved);
    }

    /// <summary>
    /// Guards <see cref="MaxParticipation"/> increases: for every transportation activity that has
    /// already been Approved with a concrete vehicle, the resolved vehicle seat capacity must
    /// be at least <paramref name="newMaxParticipation"/> (ER-7).
    /// </summary>
    /// <param name="newMaxParticipation">The proposed new MaxParticipation.</param>
    /// <param name="resolveVehicleCapacity">Function (typically wired to a repo lookup) returning SeatCapacity for a VehicleId.</param>
    /// <exception cref="InvalidOperationException">
    /// Thrown if any approved activity's assigned vehicle cannot accommodate the new size.
    /// The caller should translate to <c>TourInstance.CapacityExceeded</c>.
    /// </exception>
    public void EnsureCapacityCoversAllApprovedTransports(
        int newMaxParticipation,
        Func<Guid, int> resolveVehicleCapacity)
    {
        if (resolveVehicleCapacity is null) throw new ArgumentNullException(nameof(resolveVehicleCapacity));
        if (newMaxParticipation <= MaxParticipation) return;

        var approvedActivitiesWithVehicle = InstanceDays
            .Where(d => !d.IsDeleted)
            .SelectMany(d => d.Activities)
            .Where(a => a.ActivityType == TourDayActivityType.Transportation
                        && a.TransportationApprovalStatus == ProviderApprovalStatus.Approved
                        && a.VehicleId.HasValue)
            .ToList();

        foreach (var activity in approvedActivitiesWithVehicle)
        {
            var capacity = resolveVehicleCapacity(activity.VehicleId!.Value);
            if (capacity < newMaxParticipation)
            {
                throw new InvalidOperationException(
                    $"Xe đã duyệt cho hoạt động '{activity.Title}' chỉ có {capacity} ghế, không đủ cho MaxParticipation mới ({newMaxParticipation}).");
            }
        }
    }

    /// <summary>
    /// Check readiness: ALL transportation + ALL accommodation activities approved → Available.
    /// Uses per-activity checks (no rollup). Replaces the old TransportProviderId-based check.
    /// </summary>
    public void CheckAndActivateTourInstance()
    {
        if (Status != TourInstanceStatus.PendingApproval) return;

        bool transportOk = AreAllTransportationApproved();
        bool accommodationsOk = AreAllAccommodationsApproved();

        if (transportOk && accommodationsOk)
        {
            Status = TourInstanceStatus.Available;
            LastModifiedOnUtc = DateTimeOffset.UtcNow;
        }
    }

    public void RemoveParticipant(int count = 1)
    {
        if (count <= 0)
            throw new ArgumentOutOfRangeException(nameof(count), "Số người giảm phải lớn hơn 0.");
        if (CurrentParticipation - count < 0)
            throw new InvalidOperationException("Số người tham gia không thể âm.");
        CurrentParticipation -= count;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Cancel(string reason, string performedBy)
    {
        EnsureValidTransition(Status, TourInstanceStatus.Cancelled);
        Status = TourInstanceStatus.Cancelled;
        CancellationReason = reason;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void ChangeStatus(TourInstanceStatus newStatus, string performedBy)
    {
        EnsureValidTransition(Status, newStatus);
        Status = newStatus;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidDateRange(DateTimeOffset startDate, DateTimeOffset endDate)
    {
        if (startDate > endDate)
            throw new ArgumentException("Ngày bắt đầu phải trước hoặc cùng ngày với ngày kết thúc.");
    }

    private static void EnsureValidMaxParticipation(int maxParticipation)
    {
        if (maxParticipation <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxParticipation), "Số người tối đa phải lớn hơn 0.");
    }

    private static void EnsureValidTransition(TourInstanceStatus current, TourInstanceStatus next)
    {
        var valid = current switch
        {
            TourInstanceStatus.PendingApproval => next is TourInstanceStatus.Available or TourInstanceStatus.Cancelled,
            TourInstanceStatus.Available => next is TourInstanceStatus.Confirmed or TourInstanceStatus.SoldOut or TourInstanceStatus.Cancelled,
            TourInstanceStatus.Confirmed => next is TourInstanceStatus.InProgress or TourInstanceStatus.Cancelled,
            TourInstanceStatus.SoldOut => next is TourInstanceStatus.Confirmed or TourInstanceStatus.Cancelled,
            TourInstanceStatus.InProgress => next is TourInstanceStatus.Completed,
            _ => false
        };

        if (!valid)
            throw new InvalidOperationException($"Không thể chuyển trạng thái từ {current} sang {next}.");
    }
}
