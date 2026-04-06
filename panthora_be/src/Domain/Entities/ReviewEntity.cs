namespace Domain.Entities;

public class ReviewEntity : Entity<Guid>
{
    public Guid UserId { get; set; }
    public virtual UserEntity User { get; set; } = null!;
    public Guid TourId { get; set; }
    public virtual TourEntity Tour { get; set; } = null!;
    public int Rating { get; set; }
    public string? Comment { get; set; }
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
