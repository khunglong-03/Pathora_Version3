using Domain.Abstractions;

namespace Domain.Entities;

/// <summary>
/// Refresh token cho JWT authentication. Mỗi token thuộc về một user,
/// có thời hạn (ExpiresOnUtc), và thuộc tính IsActive để kiểm tra hết hạn.
/// </summary>
public class RefreshTokenEntity : Aggregate<Guid>
{
    /// <summary>ID của user sở hữu token.</summary>
    public Guid UserId { get; set; }
    /// <summary>Giá trị token.</summary>
    public string Token { get; set; } = null!;
    /// <summary>Thời gian hết hạn (UTC).</summary>
    public DateTimeOffset ExpiresOnUtc { get; set; }
    /// <summary>True nếu token còn hiệu lực (chưa hết hạn).</summary>
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
