namespace Domain.Entities;

public class OtpEntity : Aggregate<Guid>
{
    public required string Email { get; set; }
    public required string Code { get; set; }
    public required DateTimeOffset ExpiryDate { get; set; }
    public bool IsDeleted { get; set; } = false;
    public int FailedAttemptsCount { get; set; } = 0;
    public DateTimeOffset? LockoutExpiration { get; set; }

    public static OtpEntity Create(string email, string code, DateTimeOffset expiryDate)
    {
        return new OtpEntity { Email = email, Code = code, ExpiryDate = expiryDate };
    }
}
