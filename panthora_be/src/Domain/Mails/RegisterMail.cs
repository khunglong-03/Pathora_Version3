namespace Domain.Mails;

[Mail("Đăng Kí Tài Khoản")]
public record RegisterMail(string Link, string Name, string Expiryminutes);

