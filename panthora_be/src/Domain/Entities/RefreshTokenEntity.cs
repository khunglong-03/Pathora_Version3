using Domain.Abstractions;

namespace Domain.Entities;

public class RefreshTokenEntity : Aggregate<Guid>
{

    public Guid UserId { get; set; }
    public string Token { get; set; } = null!;
    public DateTimeOffset ExpiresOnUtc { get; set; }
    public bool IsActive => DateTimeOffset.UtcNow < ExpiresOnUtc;

    public static RefreshTokenEntity Create(Guid userId, string token, DateTimeOffset expiresOnUtc, string performedBy)
    {
        return new RefreshTokenEntity
        {
            UserId = userId,
            Token = token,
            ExpiresOnUtc = expiresOnUtc,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }
}
