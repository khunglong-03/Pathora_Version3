namespace Domain.Entities;

/// <summary>
/// Bản ghi đăng ký tài khoản mới. Lưu thông tin tạm thời trong quá trình
/// đăng ký (trước khi xác minh email và tạo UserEntity chính thức).
/// Có thể dùng cho flow đăng ký qua email OTP.
/// </summary>
public class RegisterEntity : Aggregate<Guid>
{
    /// <summary>Tên đăng nhập mong muốn.</summary>
    public string Username { get; set; } = null!;
    /// <summary>Email đăng ký.</summary>
    public string Email { get; set; } = null!;
    /// <summary>Mật khẩu đã hash.</summary>
    public string Password { get; set; } = null!;
    /// <summary>Họ và tên.</summary>
    public string FullName { get; set; } = null!;
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; }
}
