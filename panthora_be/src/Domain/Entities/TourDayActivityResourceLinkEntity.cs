namespace Domain.Entities;

/// <summary>
/// Liên kết URL/tài nguyên (hình ảnh, tài liệu, video) gắn với một
/// ngày hoạt động trong tour. Có thứ tự hiển thị.
/// </summary>
public class TourDayActivityResourceLinkEntity : Aggregate<Guid>
{
    /// <summary>ID của TourDayActivity mà resource link thuộc về.</summary>
    public Guid TourDayActivityId { get; set; }
    /// <summary>TourDayActivity liên quan.</summary>
    public virtual TourDayActivityEntity TourDayActivity { get; set; } = null!;
    /// <summary>URL của tài nguyên (hình ảnh, tài liệu, video).</summary>
    public string Url { get; set; } = null!;
    /// <summary>Thứ tự hiển thị tài nguyên.</summary>
    public int Order { get; set; }
    /// <summary>Đánh dấu đã xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Thời gian xóa mềm.</summary>
    public DateTimeOffset? DeletedOnUtc { get; set; }
    /// <summary>User đã xóa.</summary>
    public string? DeletedBy { get; set; }

    public static TourDayActivityResourceLinkEntity Create(Guid tourDayActivityId, string url, int order, string performedBy)
    {
        EnsureValidOrder(order);

        return new TourDayActivityResourceLinkEntity
        {
            Id = Guid.CreateVersion7(),
            TourDayActivityId = tourDayActivityId,
            Url = url,
            Order = order,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    private static void EnsureValidOrder(int order)
    {
        if (order <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(order), "Order must be greater than zero.");
        }
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        DeletedOnUtc = DateTimeOffset.UtcNow;
        DeletedBy = performedBy;
    }
}
