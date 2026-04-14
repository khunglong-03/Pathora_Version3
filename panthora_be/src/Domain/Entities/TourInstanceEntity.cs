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
    /// <summary>ID của Hotel Provider (Accommodation Supplier).</summary>
    public Guid? HotelProviderId { get; set; }
    /// <summary>Khách sạn/nhà cung cấp chỗ ở cho đợt tour này.</summary>
    public virtual SupplierEntity? HotelProvider { get; set; }
    /// <summary>Trạng thái duyệt của Hotel Provider.</summary>
    public ProviderApprovalStatus HotelApprovalStatus { get; set; } = ProviderApprovalStatus.Pending;
    /// <summary>Ghi chú/lý do từ chối của Hotel Provider.</summary>
    public string? HotelApprovalNote { get; set; }

    /// <summary>ID của Transport Provider.</summary>
    public Guid? TransportProviderId { get; set; }
    /// <summary>Đơn vị vận chuyển cho đợt tour này.</summary>
    public virtual SupplierEntity? TransportProvider { get; set; }
    /// <summary>Trạng thái duyệt của Transport Provider.</summary>
    public ProviderApprovalStatus TransportApprovalStatus { get; set; } = ProviderApprovalStatus.Pending;
    /// <summary>Ghi chú/lý do từ chối của Transport Provider.</summary>
    public string? TransportApprovalNote { get; set; }

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
        Guid? hotelProviderId = null,
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
            HotelProviderId = hotelProviderId,
            TransportProviderId = transportProviderId,
            HotelApprovalStatus = hotelProviderId.HasValue ? ProviderApprovalStatus.Pending : ProviderApprovalStatus.Approved,
            TransportApprovalStatus = transportProviderId.HasValue ? ProviderApprovalStatus.Pending : ProviderApprovalStatus.Approved,
            TourInstanceCode = GenerateInstanceCode(),
            Title = title,
            TourName = tourName,
            TourCode = tourCode,
            ClassificationName = classificationName,
            InstanceType = instanceType,
            Status = (hotelProviderId.HasValue || transportProviderId.HasValue) ? TourInstanceStatus.PendingApproval : TourInstanceStatus.Available,
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

    public void ApproveByProvider(Guid providerId, bool isApproved, string? reason)
    {
        if (HotelProviderId == providerId)
        {
            HotelApprovalStatus = isApproved ? ProviderApprovalStatus.Approved : ProviderApprovalStatus.Rejected;
            HotelApprovalNote = reason;
        }
        else if (TransportProviderId == providerId)
        {
            TransportApprovalStatus = isApproved ? ProviderApprovalStatus.Approved : ProviderApprovalStatus.Rejected;
            TransportApprovalNote = reason;
        }

        CheckAndActivateTourInstance();
    }

    private void CheckAndActivateTourInstance()
    {
        if (Status != TourInstanceStatus.PendingApproval) return;

        bool hotelOk = !HotelProviderId.HasValue || HotelApprovalStatus == ProviderApprovalStatus.Approved;
        bool transportOk = !TransportProviderId.HasValue || TransportApprovalStatus == ProviderApprovalStatus.Approved;

        if (hotelOk && transportOk)
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
        if (startDate >= endDate)
            throw new ArgumentException("Ngày bắt đầu phải trước ngày kết thúc.");
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
