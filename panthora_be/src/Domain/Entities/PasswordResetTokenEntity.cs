namespace Domain.Entities;

public class PasswordResetTokenEntity
{
    public Guid Id { get; set; }
    public required string UserId { get; set; }
    public required string TokenHash { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; } = false;

    public static PasswordResetTokenEntity Create(string userId, string tokenHash, DateTimeOffset expiresAt)
    {
        return new PasswordResetTokenEntity
        {
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt
        };
    }

    public bool IsValid()
    {
        return !IsDeleted && UsedAt == null && ExpiresAt > DateTimeOffset.UtcNow;
    }

    public void MarkAsUsed()
    {
        UsedAt = DateTimeOffset.UtcNow;
    }
}
