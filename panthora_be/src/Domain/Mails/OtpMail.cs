namespace Domain.Mails;

[Mail("Mã OTP xác thực")]
public record OtpMail(string Code, int ExpiryMinutes);

