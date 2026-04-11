namespace Domain.Entities;

/// <summary>
/// Token đặt lại mật khẩu. Gửi qua email khi user yêu cầu quên mật khẩu.
/// Token có thời hạn và chỉ được sử dụng một lần.
/// </summary>
public class PasswordResetTokenEntity
{
    public Guid Id { get; set; }
    /// <summary>ID của user (dạng string — không phải Guid).</summary>
    public required string UserId { get; set; }
    /// <summary>Hash của token (không lưu token plain text).</summary>
    public required string TokenHash { get; set; }
    /// <summary>Thời gian hết hạn của token.</summary>
    public DateTimeOffset ExpiresAt { get; set; }
    /// <summary>Thời gian token đã được sử dụng (null = chưa dùng).</summary>
    public DateTimeOffset? UsedAt { get; set; }
    /// <summary>Thời gian tạo token.</summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;

    public static PasswordResetTokenEntity Create(string userId, string tokenHash, DateTimeOffset expiresAt)
    {
        return new PasswordResetTokenEntity
        {
            Id = Guid.CreateVersion7(),
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
