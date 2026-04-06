namespace Domain.Entities;

using Domain.Entities.Translations;

public class TourEntity : Aggregate<Guid>
{
    public string TourCode { get; set; } = null!;
    public string TourName { get; set; } = null!;
    public string ShortDescription { get; set; } = null!;
    public string LongDescription { get; set; } = null!;
    public bool IsDeleted { get; set; } = false;
    public string? SEOTitle { get; set; }
    public string? SEODescription { get; set; }
    public TourStatus Status { get; set; } = TourStatus.Pending;
    public TourScope TourScope { get; set; } = TourScope.Domestic;
    public Continent? Continent { get; set; }
    public CustomerSegment CustomerSegment { get; set; } = CustomerSegment.Group;
    public ImageEntity Thumbnail { get; set; } = null!;
    public List<ImageEntity> Images { get; set; } = [];
    public Dictionary<string, TourTranslationData> Translations { get; set; } = [];
    public virtual List<TourClassificationEntity> Classifications { get; set; } = [];
    public virtual List<TourResourceEntity> Resources { get; set; } = [];
    public virtual List<TourPlanLocationEntity> PlanLocations { get; set; } = [];
    public Guid? VisaPolicyId { get; set; }
    public virtual VisaPolicyEntity? VisaPolicy { get; set; }
    public Guid? DepositPolicyId { get; set; }
    public virtual DepositPolicyEntity? DepositPolicy { get; set; }
    public Guid? PricingPolicyId { get; set; }
    public virtual PricingPolicy? PricingPolicy { get; set; }
    public Guid? CancellationPolicyId { get; set; }
    public virtual CancellationPolicyEntity? CancellationPolicy { get; set; }

    public Guid? TourDesignerId { get; set; }
    public virtual UserEntity? TourDesigner { get; set; }

    public static string GenerateTourCode()
    {
        var datePart = DateTimeOffset.UtcNow.ToString("yyyyMMdd");
        var sequence = Random.Shared.Next(0, Domain.Options.TourOptions.CodeSequenceMaxValue);
        return $"TOUR-{datePart}-{sequence:00000}";
    }
    public static TourEntity Create(string tourName, string shortDescription, string longDescription, string performedBy, TourStatus status = TourStatus.Pending, TourScope tourScope = TourScope.Domestic, CustomerSegment customerSegment = CustomerSegment.Group, string? seoTitle = null, string? seoDescription = null, ImageEntity? thumbnail = null, List<ImageEntity>? images = null, Guid? visaPolicyId = null, Guid? depositPolicyId = null, Guid? pricingPolicyId = null, Guid? cancellationPolicyId = null, Guid? tourDesignerId = null)
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
            Continent = null,
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
