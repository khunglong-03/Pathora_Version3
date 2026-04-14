namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Đại diện cho một tour du lịch trong hệ thống. Đây là entity cha chứa thông tin cơ bản
/// của tour (mã tour, tên, mô tả, trạng thái, phạm vi trong nước/quốc tế, hình ảnh).
/// Một tour có nhiều Classification (phân loại theo ngày/đêm, mức giá), nhiều Resource (khách sạn, địa điểm,
/// phương tiện), và liên kết đến các policy (visa, đặt cọc, giá, hủy).
/// </summary>
public class TourEntity : Aggregate<Guid>
{
    /// <summary>Mã tour tự động sinh (format: TOUR-YYYYMMDD-NNNNN).</summary>
    public string TourCode { get; set; } = null!;
    /// <summary>Tên tour.</summary>
    public string TourName { get; set; } = null!;
    /// <summary>Mô tả ngắn gọn về tour (dùng cho card hiển thị, SEO).</summary>
    public string ShortDescription { get; set; } = null!;
    /// <summary>Mô tả chi tiết đầy đủ về lịch trình, dịch vụ, v.v.</summary>
    public string LongDescription { get; set; } = null!;
    /// <summary>Cờ xóa mềm. True = đã xóa, không hiển thị trong danh sách.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>SEO title cho trang chi tiết tour.</summary>
    public string? SEOTitle { get; set; }
    /// <summary>SEO description cho trang chi tiết tour.</summary>
    public string? SEODescription { get; set; }
    /// <summary>Trạng thái tour: Pending, Active, Inactive, Archived.</summary>
    public TourStatus Status { get; set; } = TourStatus.Pending;
    /// <summary>Lý do từ chối khi manager reject tour (nullable, only set when Status = Rejected).</summary>
    public string? RejectionReason { get; set; }
    /// <summary>Phạm vi tour: Domestic (trong nước) hoặc International (quốc tế).</summary>
    public TourScope TourScope { get; set; } = TourScope.Domestic;
    /// <summary>Châu lục (cho tour quốc tế): Asia, Europe, v.v.</summary>
    public Continent? Continent { get; set; }
    /// <summary>Phân khúc khách hàng mục tiêu: Group, Family, Couple, Solo, Corporate.</summary>
    public CustomerSegment CustomerSegment { get; set; } = CustomerSegment.Group;
    /// <summary>Ảnh thumbnail của tour.</summary>
    public ImageEntity Thumbnail { get; set; } = null!;
    /// <summary>Danh sách ảnh gallery của tour.</summary>
    public List<ImageEntity> Images { get; set; } = [];
    /// <summary>Từ điển bản dịch đa ngôn ngữ (en/vi): mô tả, tiêu đề, v.v.</summary>
    public Dictionary<string, TourTranslationData> Translations { get; set; } = [];
    /// <summary>Danh sách các phân loại tour (ví dụ: "3N2Đ Tiêu chuẩn", "4N3Đ Cao cấp").</summary>
    public virtual List<TourClassificationEntity> Classifications { get; set; } = [];
    /// <summary>Danh sách các tài nguyên liên quan: khách sạn, địa điểm, phương tiện, dịch vụ.</summary>
    public virtual List<TourResourceEntity> Resources { get; set; } = [];
    /// <summary>Danh sách các địa điểm trong lịch trình tour.</summary>
    public virtual List<TourPlanLocationEntity> PlanLocations { get; set; } = [];
    /// <summary>ID chính sách visa áp dụng cho tour này.</summary>
    public Guid? VisaPolicyId { get; set; }
    /// <summary>Chính sách visa của tour.</summary>
    public virtual VisaPolicyEntity? VisaPolicy { get; set; }
    /// <summary>ID chính sách đặt cọc.</summary>
    public Guid? DepositPolicyId { get; set; }
    /// <summary>Chính sách đặt cọc của tour.</summary>
    public virtual DepositPolicyEntity? DepositPolicy { get; set; }
    /// <summary>ID chính sách giá.</summary>
    public Guid? PricingPolicyId { get; set; }
    /// <summary>Chính sách giá của tour (các bậc giá theo số người).</summary>
    public virtual PricingPolicy? PricingPolicy { get; set; }
    /// <summary>ID chính sách hủy.</summary>
    public Guid? CancellationPolicyId { get; set; }
    /// <summary>Chính sách hủy của tour (các mức phí refund).</summary>
    public virtual CancellationPolicyEntity? CancellationPolicy { get; set; }

    /// <summary>ID của nhân viên thiết kế tour.</summary>
    public Guid? TourDesignerId { get; set; }
    /// <summary>Nhân viên thiết kế tour.</summary>
    public virtual UserEntity? TourDesigner { get; set; }

    public static string GenerateTourCode()
    {
        var datePart = DateTimeOffset.UtcNow.ToString("yyyyMMdd");
        var sequence = Random.Shared.Next(0, Domain.Options.TourOptions.CodeSequenceMaxValue);
        return $"TOUR-{datePart}-{sequence:00000}";
    }
    public static TourEntity Create(string tourName, string shortDescription, string longDescription, string performedBy, TourStatus status = TourStatus.Pending, TourScope tourScope = TourScope.Domestic, CustomerSegment customerSegment = CustomerSegment.Group, string? seoTitle = null, string? seoDescription = null, ImageEntity? thumbnail = null, List<ImageEntity>? images = null, Guid? visaPolicyId = null, Guid? depositPolicyId = null, Guid? pricingPolicyId = null, Guid? cancellationPolicyId = null, Guid? tourDesignerId = null, Continent? continent = null)
    {
        return new TourEntity
        {
            Id = Guid.CreateVersion7(),
            TourCode = GenerateTourCode(),
            TourName = tourName,
            ShortDescription = shortDescription,
            LongDescription = longDescription,
            SEOTitle = seoTitle,
            SEODescription = seoDescription,
            Status = status,
            TourScope = tourScope,
            Continent = continent,
            CustomerSegment = customerSegment,
            Thumbnail = thumbnail ?? new ImageEntity(),
            Images = images ?? [],
            VisaPolicyId = visaPolicyId,
            DepositPolicyId = depositPolicyId,
            PricingPolicyId = pricingPolicyId,
            CancellationPolicyId = cancellationPolicyId,
            TourDesignerId = tourDesignerId,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }
    public void Update(string tourName, string shortDescription, string longDescription, TourStatus status, string performedBy, TourScope tourScope = TourScope.Domestic, Continent? continent = null, CustomerSegment customerSegment = CustomerSegment.Group, string? seoTitle = null, string? seoDescription = null, ImageEntity? thumbnail = null, List<ImageEntity>? images = null, Guid? visaPolicyId = null, Guid? depositPolicyId = null, Guid? pricingPolicyId = null, Guid? cancellationPolicyId = null, Guid? tourDesignerId = null)
    {
        TourName = tourName;
        ShortDescription = shortDescription;
        LongDescription = longDescription;
        SEOTitle = seoTitle;
        SEODescription = seoDescription;
        Status = status;
        TourScope = tourScope;
        Continent = continent;
        CustomerSegment = customerSegment;
        if (thumbnail is not null)
        {
            Thumbnail = new ImageEntity
            {
                FileId = thumbnail.FileId,
                OriginalFileName = thumbnail.OriginalFileName,
                FileName = thumbnail.FileName,
                PublicURL = thumbnail.PublicURL,
            };
        }
        if (images is not null)
        {
            Images.Clear();
            foreach (var img in images)
            {
                Images.Add(new ImageEntity
                {
                    FileId = img.FileId,
                    OriginalFileName = img.OriginalFileName,
                    FileName = img.FileName,
                    PublicURL = img.PublicURL,
                });
            }
        }
        VisaPolicyId = visaPolicyId;
        DepositPolicyId = depositPolicyId;
        PricingPolicyId = pricingPolicyId;
        CancellationPolicyId = cancellationPolicyId;
        TourDesignerId = tourDesignerId;
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
