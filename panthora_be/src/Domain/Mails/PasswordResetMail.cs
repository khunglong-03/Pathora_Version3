namespace Domain.Mails;

[Mail("Đặt Lại Mật Khẩu")]
public record PasswordResetMail(string ResetLink, string UserName, int ExpiryMinutes);
