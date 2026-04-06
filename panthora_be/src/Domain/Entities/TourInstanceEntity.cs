namespace Domain.Entities;

using Domain.Entities.Translations;

public class TourInstanceEntity : Aggregate<Guid>
{
    // Foreign keys
    public Guid TourId { get; set; }
    public virtual TourEntity Tour { get; set; } = null!;
    public Guid ClassificationId { get; set; }
    public virtual TourClassificationEntity Classification { get; set; } = null!;

    // Instance identity
    public string TourInstanceCode { get; set; } = null!;
    public string Title { get; set; } = null!;

    // Denormalized from Tour
    public string TourName { get; set; } = null!;
    public string TourCode { get; set; } = null!;
    public string ClassificationName { get; set; } = null!;

    // Status & Type
    public TourType InstanceType { get; set; } = TourType.Public;
    public TourInstanceStatus Status { get; set; } = TourInstanceStatus.Available;
    public string? CancellationReason { get; set; }

    // Schedule
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public int DurationDays { get; set; }
    public DateTimeOffset? ConfirmationDeadline { get; set; }

    // Participants
    public int MaxParticipation { get; set; }
    public int CurrentParticipation { get; set; }

    // BasePrice — snapshot tại thời điểm tạo instance
    public decimal BasePrice { get; set; }

    // Media & Location
    public string? Location { get; set; }
    public ImageEntity Thumbnail { get; set; } = null!;
    public List<ImageEntity> Images { get; set; } = [];

    // Services & Managers
    public List<string> IncludedServices { get; set; } = [];
    public virtual List<TourInstanceManagerEntity> Managers { get; set; } = [];


    // Instance-specific day schedule
    public virtual List<TourInstanceDayEntity> InstanceDays { get; set; } = [];

    // Soft delete
    public bool IsDeleted { get; set; }

    // Translations (vi/en)
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
            TourInstanceCode = GenerateInstanceCode(),
            Title = title,
            TourName = tourName,
            TourCode = tourCode,
            ClassificationName = classificationName,
            InstanceType = instanceType,
            Status = TourInstanceStatus.Available,
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
