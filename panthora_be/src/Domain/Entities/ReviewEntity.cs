namespace Domain.Entities;

/// <summary>
/// Đánh giá/review từ người dùng sau khi hoàn thành tour. Lưu điểm
/// (1–5 sao), bình luận, và trạng thái duyệt. Chỉ hiển thị công khai
/// khi IsApproved = true.
/// </summary>
public class ReviewEntity : Entity<Guid>
{
    /// <summary>ID của User viết review.</summary>
    public Guid UserId { get; set; }
    /// <summary>User liên quan.</summary>
    public virtual UserEntity User { get; set; } = null!;
    /// <summary>ID của Tour được đánh giá.</summary>
    public Guid TourId { get; set; }
    /// <summary>Tour liên quan.</summary>
    public virtual TourEntity Tour { get; set; } = null!;
    /// <summary>Điểm đánh giá (1–5 sao).</summary>
    public int Rating { get; set; }
    /// <summary>Nội dung bình luận của khách.</summary>
    public string? Comment { get; set; }
    /// <summary>Trạng thái duyệt: true = đã duyệt (hiển thị), false = chưa duyệt.</summary>
    public bool IsApproved { get; set; } = false;

    public static ReviewEntity Create(Guid userId, Guid tourId, int rating, string? comment, string performedBy)
    {
        EnsureValidRating(rating);

        return new ReviewEntity
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            TourId = tourId,
            Rating = rating,
            Comment = comment,
            IsApproved = false,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Approve(string performedBy)
    {
        IsApproved = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Update(int rating, string? comment, string performedBy)
    {
        EnsureValidRating(rating);

        Rating = rating;
        Comment = comment;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidRating(int rating)
    {
        if (rating is < 1 or > 5)
        {
            throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 1 and 5.");
        }
    }
}
