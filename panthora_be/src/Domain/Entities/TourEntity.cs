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
    public string? RejectionReason { get; set; }
    public TourScope TourScope { get; set; } = TourScope.Domestic;
    public bool IsVisa { get; set; } = false;
    public Continent? Continent { get; set; }
    public CustomerSegment CustomerSegment { get; set; } = CustomerSegment.Group;
    public ImageEntity Thumbnail { get; set; } = null!;
    public List<ImageEntity> Images { get; set; } = [];
    public Dictionary<string, TourTranslationData> Translations { get; set; } = [];
    public virtual List<TourClassificationEntity> Classifications { get; set; } = [];
    public virtual List<TourResourceEntity> Resources { get; set; } = [];
    public virtual List<TourPlanLocationEntity> PlanLocations { get; set; } = [];
    public Guid? TourDesignerId { get; set; }
    public virtual UserEntity? TourDesigner { get; set; }

    public static string GenerateTourCode()
    {
        var datePart = DateTimeOffset.UtcNow.ToString("yyyyMMdd");
        var sequence = Random.Shared.Next(0, Domain.Options.TourOptions.CodeSequenceMaxValue);
        return $"TOUR-{datePart}-{sequence:00000}";
    }
    public static TourEntity Create(string tourName, string shortDescription, string longDescription, string performedBy, TourStatus status = TourStatus.Pending, TourScope tourScope = TourScope.Domestic, CustomerSegment customerSegment = CustomerSegment.Group, string? seoTitle = null, string? seoDescription = null, ImageEntity? thumbnail = null, List<ImageEntity>? images = null, Guid? tourDesignerId = null, Continent? continent = null, bool isVisa = false)
    {
        var isDomestic = tourScope == TourScope.Domestic;
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
            IsVisa = isDomestic ? false : isVisa,
            Continent = isDomestic ? null : continent,
            CustomerSegment = customerSegment,
            Thumbnail = thumbnail ?? new ImageEntity(),
            Images = images ?? [],
            TourDesignerId = tourDesignerId,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }
    public void Update(string tourName, string shortDescription, string longDescription, TourStatus status, string performedBy, TourScope tourScope = TourScope.Domestic, Continent? continent = null, CustomerSegment customerSegment = CustomerSegment.Group, string? seoTitle = null, string? seoDescription = null, ImageEntity? thumbnail = null, List<ImageEntity>? images = null, Guid? tourDesignerId = null, bool isVisa = false)
    {
        var isDomestic = tourScope == TourScope.Domestic;
        TourName = tourName;
        ShortDescription = shortDescription;
        LongDescription = longDescription;
        SEOTitle = seoTitle;
        SEODescription = seoDescription;
        Status = status;
        TourScope = tourScope;
        IsVisa = isDomestic ? false : isVisa;
        Continent = isDomestic ? null : continent;
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
