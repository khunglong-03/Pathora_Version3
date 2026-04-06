namespace Domain.Mails;

[Mail("Đặt lại mật khẩu")]
public record ResetPasswordMail(string? Username, string NewPassword);

