using Domain.Abstractions;

namespace Domain.Entities;

/// <summary>
/// Nội dung CMS trên trang web. Lưu trữ cặp key (page + content) và giá trị
/// JSON có thể chứa nội dung đơn ngữ hoặc đa ngữ (en/vi).
/// </summary>
public class SiteContentEntity : Aggregate<Guid>
{
    /// <summary>Mã trang chứa nội dung (VD: home, about, footer).</summary>
    public string PageKey { get; set; } = null!;
    /// <summary>Mã nội dung trong trang (VD: hero_title, meta_description).</summary>
    public string ContentKey { get; set; } = null!;
    /// <summary>Giá trị nội dung, là chuỗi JSON: có thể là chuỗi đơn thuần hoặc object có key "en"/"vi".</summary>
    public string ContentValue { get; set; } = null!;

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
