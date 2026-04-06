using Domain.Abstractions;

namespace Domain.Entities;

public class SiteContentEntity : Aggregate<Guid>
{

    public string PageKey { get; set; } = null!;
    public string ContentKey { get; set; } = null!;
    public string ContentValue { get; set; } = null!; // JSON string

    public static SiteContentEntity Create(string pageKey, string contentKey, string contentValue, string createdBy)
    {
        return new SiteContentEntity
        {
            Id = Guid.CreateVersion7(),
            PageKey = pageKey,
            ContentKey = contentKey,
            ContentValue = contentValue,
            CreatedBy = createdBy,
            LastModifiedBy = createdBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(string contentValue, string modifiedBy)
    {
        ContentValue = contentValue;
        LastModifiedBy = modifiedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
