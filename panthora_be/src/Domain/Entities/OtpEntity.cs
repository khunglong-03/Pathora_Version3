namespace Domain.Entities;

/// <summary>
/// One-Time Password (OTP) dùng cho xác minh email hoặc đăng nhập.
/// Lưu trữ email, mã OTP, thời gian hết hạn, và trạng thái khóa tài khoản tạm thời.
/// </summary>
public class OtpEntity : Aggregate<Guid>
{
    /// <summary>Email nhận OTP.</summary>
    public required string Email { get; set; }
    /// <summary>Mã OTP (plain text).</summary>
    public required string Code { get; set; }
    /// <summary>Thời gian OTP hết hạn.</summary>
    public required DateTimeOffset ExpiryDate { get; set; }
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Số lần nhập sai liên tiếp.</summary>
    public int FailedAttemptsCount { get; set; } = 0;
    /// <summary>Thời gian khóa tạm thời (sau khi nhập sai nhiều lần).</summary>
    public DateTimeOffset? LockoutExpiration { get; set; }

    public static OtpEntity Create(string email, string code, DateTimeOffset expiryDate)
    {
        return new OtpEntity { Email = email, Code = code, ExpiryDate = expiryDate };
    }
}
